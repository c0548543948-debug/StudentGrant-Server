require('dotenv').config(); // טוען משתני סביבה מקובץ .env - חשוב שזה יקרה לפני כל השאר

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const userRoutes = require('./routes/userRoutes');
const requestRoutes = require('./routes/requestRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/studentGrants';

// מאפשר לקליינט הריאקט (שרץ על פורט/כתובת אחרת) לקרוא ל-API
app.use(cors());

app.use(express.json()); // מאפשר לשרת לקרוא נתוני JSON

// חיבור ל-MongoDB - בלי זה השרת קם אבל אף קריאה ל-DB לא תעבוד
mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);

// גישה לתיקיית הקבצים שהועלו, כדי שהמנהל (וה-FE) יוכלו להציג/להוריד מסמכים
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// טיפול גלובלי בשגיאות (כולל שגיאות multer כמו "קובץ גדול מדי" / "סוג קובץ לא נתמך")
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || 'שגיאת שרת' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
