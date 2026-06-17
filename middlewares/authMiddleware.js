const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        // שליפת הטוקן מה-Header של הבקשה
        const token = req.headers.authorization.split(' ')[1]; 
        
        // בדיקת תקינות הטוקן
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // הוספת ה-userId לבקשה כדי שה-Controller יוכל להשתמש בו
        req.userId = decoded.userId; 
        
        next(); // ממשיך הלאה ל-Controller
    } catch (error) {
        res.status(401).json({ message: "לא מורשה - נדרשת התחברות" });
    }
};