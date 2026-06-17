const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const secretKey = process.env.JWT_SECRET;
require('dotenv').config(); // מאפשר להשתמש בקובץ .env
const userRoutes = require('./routes/userRoutes');

app.use(express.json()); // מאפשר לשרת לקרוא נתוני JSON

// app.get('/', (req, res) => {
//   res.send('השרת של StudeGrant עובד!');
// });
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});