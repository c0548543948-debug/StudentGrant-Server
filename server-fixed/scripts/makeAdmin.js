// סקריפט עזר חד-פעמי: הופך משתמש קיים (לפי מ.ז) למנהל מערכת.
// שימוש: node scripts/makeAdmin.js 123456789
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/userModel');

const idToPromote = process.argv[2];

if (!idToPromote) {
    console.log('שימוש: node scripts/makeAdmin.js <מספר תעודת זהות>');
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/studentGrants')
    .then(async () => {
        const user = await User.findOneAndUpdate({ id: idToPromote }, { isAdmin: true }, { new: true });
        if (!user) {
            console.log('משתמש עם מ.ז זה לא נמצא. יש להירשם רגיל במערכת לפני הרצת הסקריפט.');
        } else {
            console.log(`המשתמש ${user.firstName} ${user.lastName} (${user.id}) הוגדר כמנהל מערכת.`);
        }
        await mongoose.disconnect();
    })
    .catch((err) => {
        console.error('שגיאת חיבור ל-DB:', err.message);
        process.exit(1);
    });
