const jwt = require('jsonwebtoken');

// מאמת שיש טוקן תקין, ומוסיף req.userId כדי שה-Controller ידע מי המשתמש המחובר
module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'לא מורשה - נדרשת התחברות' });
        }

        const token = authHeader.split(' ')[1];

        // חשוב: המפתח כאן (userId) חייב להיות זהה למה שנחתם ב-jwt.sign בזמן ה-login
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.userId = decoded.userId;
        req.isAdmin = decoded.isAdmin || false;

        next(); // ממשיך הלאה ל-Controller
    } catch (error) {
        res.status(401).json({ message: 'לא מורשה - הטוקן לא תקין או שפג תוקפו' });
    }
};
