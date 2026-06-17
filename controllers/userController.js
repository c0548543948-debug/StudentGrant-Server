const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_SECRET;

exports.register = async (req, res) => {
  // Registration logic
  const { id, firstName, lastName, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ id });
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const newUser = new User({ id, firstName, lastName, email, password: hashedPassword });
  await newUser.save();

  res.status(201).json({ message: 'User registered successfully' });
};

exports.login = async (req, res) => {
  // Login logic
  try{
    const { id, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ id });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, secretKey, { expiresIn: '1d' });
    res.status(200).json({ token, user: { id: user._id, firstName: user.firstName }, message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
exports.logout = async (req, res) => {
  // Logout logic
  res.status(200).json({ message: 'Logout successful' });
};
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password'); // מחזיר הכל חוץ מסיסמה
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "שגיאה בשליפת פרטי משתמש" });
    }
};