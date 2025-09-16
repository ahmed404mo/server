import express from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import mongoose from 'mongoose';

dotenv.config();

// Validate JWT_SECRET at startup
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not defined in .env');
  process.exit(1);
}

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));

// ================== MongoDB Connection ==================
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ================== Schemas ==================
const userSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  first_name: String,
  last_name: String,
  email: { type: String, unique: true },
  password: String,
  age: Number
});

const favoriteSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  movieName: String,
  imgUrl: String,
  userID: String,
  movieID: String
});

const noteSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  title: String,
  desc: String,
  userID: String
});

const User = mongoose.model('User', userSchema);
const Favorite = mongoose.model('Favorite', favoriteSchema);
const Note = mongoose.model('Note', noteSchema);

// ================== Middleware ==================
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : req.body.token;

  if (!token) return res.status(401).json({ message: 'Token required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// ================== Routes ==================

// Signup
app.post('/signup', async (req, res) => {
  try {
    const { first_name, last_name, email, password, age } = req.body;
    if (!first_name || !last_name || !email || !password)
      return res.status(400).json({ message: 'Missing fields' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ first_name, last_name, email, password: hashed, age });
    await user.save();

    res.json({ message: 'success', user: { ...user._doc, password: undefined } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// Signin
app.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User doesn't exist" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: 'success', token });
  } catch (err) {
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// Get All Users
app.get('/getAllUsers', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 10;
    const users = await User.find().select('-password');
    const start = (page - 1) * limit;
    const paginated = users.slice(start, start + limit);

    res.json({
      message: 'success',
      Total: users.length,
      Page: page,
      TotalPages: Math.ceil(users.length / limit),
      Users: paginated
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// Add Favorite
app.post('/addToFavorites', authMiddleware, async (req, res) => {
  try {
    const { movieName, imgUrl, userID, movieID } = req.body;
    const fav = new Favorite({ movieName, imgUrl, userID, movieID });
    await fav.save();
    res.json({ message: 'success', favorite: fav });
  } catch (err) {
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// Get Favorites
app.get('/getFavorites', authMiddleware, async (req, res) => {
  try {
    const favs = await Favorite.find({ userID: req.user.id });
    res.json({ message: 'success', Favorites: favs });
  } catch (err) {
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// Add Note
app.post('/addNote', authMiddleware, async (req, res) => {
  try {
    const { title, desc, userID } = req.body;
    const note = new Note({ title, desc, userID });
    await note.save();
    res.json({ message: 'success', note });
  } catch (err) {
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// Get User Notes
app.get('/getUserNotes', authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find({ userID: req.user.id });
    res.json({ message: 'success', Notes: notes });
  } catch (err) {
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// Delete Note
app.delete('/deleteNote', authMiddleware, async (req, res) => {
  try {
    const { NoteID } = req.body;
    await Note.deleteOne({ _id: NoteID, userID: req.user.id });
    res.json({ message: 'success' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// Update Note
app.put('/updateNote', authMiddleware, async (req, res) => {
  try {
    const { title, desc, NoteID } = req.body;
    await Note.updateOne({ _id: NoteID, userID: req.user.id }, { title, desc });
    res.json({ message: 'success' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// ================== Start Server ==================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
