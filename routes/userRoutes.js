const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller.js');
const authMiddleware = require('../middlewares/authMiddleware.js'); // ייבוא ה-Middleware

// נתיבים פתוחים (אין צורך בשומר)
router.post('/register', userController.register);
router.post('/login', userController.login);

// נתיב מאובטח (השומר רץ לפני שה-Controller מופעל)
router.get('/me', authMiddleware, userController.getMe);

module.exports = router;