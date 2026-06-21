const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// נתיבים פתוחים (אין צורך בהתחברות)
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', userController.logout);

// נתיב מאובטח - שולף את פרטי המשתמש המחובר (לפי הטוקן)
router.get('/me', authMiddleware, userController.getMe);

module.exports = router;
