const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_SECRET;

// יוצר טוקן עם userId (חשוב: המפתח חייב להיות זהה למה שמצופה ב-authMiddleware)
const generateToken = (user) => {
    return jwt.sign(
        { userId: user._id, isAdmin: user.isAdmin },
        secretKey,
        { expiresIn: '1d' }
    );
};

exports.register = async (req, res) => {
    try {
        const { id, firstName, lastName, password, email } = req.body;

        // בדיקת שדות חובה
        if (!id || !firstName || !lastName || !password) {
            return res.status(400).json({ message: 'יש למלא מ.ז, שם פרטי, שם משפחה וסיסמה' });
        }

        // בדיקה אם המשתמש קיים
        const existingUser = await User.findOne({ id });
        if (existingUser) {
            return res.status(400).json({ message: 'משתמש עם מספר זהות זה כבר רשום במערכת' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ id, firstName, lastName, email, password: hashedPassword });
        await newUser.save();

        // מחברים אותו אוטומטית לאחר הרשמה כדי לחסוך login נוסף בצד הלקוח
        const token = generateToken(newUser);

        res.status(201).json({
            message: 'ההרשמה בוצעה בהצלחה',
            token,
            user: { id: newUser.id, firstName: newUser.firstName, lastName: newUser.lastName, isAdmin: newUser.isAdmin }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'שגיאה בהרשמה', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { id, password } = req.body;

        if (!id || !password) {
            return res.status(400).json({ message: 'יש למלא מ.ז וסיסמה' });
        }

        const user = await User.findOne({ id });
        if (!user) {
            return res.status(400).json({ message: 'מספר זהות או סיסמה שגויים' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'מספר זהות או סיסמה שגויים' });
        }

        const token = generateToken(user);
        res.status(200).json({
            token,
            user: { id: user.id, firstName: user.firstName, lastName: user.lastName, isAdmin: user.isAdmin },
            message: 'התחברות בוצעה בהצלחה'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'שגיאת שרת בהתחברות' });
    }
};

exports.logout = async (req, res) => {
    // ההתנתקות בפועל מתבצעת בצד הלקוח (מחיקת הטוקן). נתיב זה קיים לשם שלמות ה-API.
    res.status(200).json({ message: 'התנתקות בוצעה בהצלחה' });
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'משתמש לא נמצא' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בשליפת פרטי משתמש' });
    }
};
