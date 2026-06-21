// Middleware זה חייב לרוץ אחרי authMiddleware (כי הוא מסתמך על req.isAdmin שנקבע שם)
module.exports = (req, res, next) => {
    if (!req.isAdmin) {
        return res.status(403).json({ message: 'הפעולה מותרת למנהל מערכת בלבד' });
    }
    next();
};
