import { connectDB } from "../../lib/mongodb";
import User from "../../models/User";

export default async function handler(req, res) {
  await connectDB();

  if (req.method === "POST") {
    const user = await User.create(req.body);
    return res.status(201).json(user);
  }

  if (req.method === "GET") {
    const users = await User.find();
    return res.status(200).json(users);
  }
}
