# Auth App

تطبيق مصادقة مع Express.js و Next.js

## تشغيل المشروع

### 1. تشغيل الخادم (Express.js)
\`\`\`bash
npm run server
# أو للتطوير مع إعادة التشغيل التلقائي
npm run dev:server
\`\`\`

### 2. تشغيل التطبيق (Next.js)
\`\`\`bash
npm run dev
\`\`\`

## متغيرات البيئة

تأكد من وجود ملف `.env.local` مع:
\`\`\`
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random-123456789
PORT=3001
\`\`\`

## API Endpoints

- `POST /signin` - تسجيل الدخول
- `POST /signup` - إنشاء حساب جديد
- `POST /checkEmail` - فحص البريد الإلكتروني
- `GET /getAllUsers` - جلب جميع المستخدمين
- `POST /addToFavorites` - إضافة إلى المفضلة (يتطلب مصادقة)
- `GET /getFavorites` - جلب المفضلة (يتطلب مصادقة)
- `POST /addNote` - إضافة ملاحظة (يتطلب مصادقة)
- `GET /getUserNotes` - جلب الملاحظات (يتطلب مصادقة)

الخادم يعمل على المنفذ 3001 والتطبيق على المنفذ 3000.
