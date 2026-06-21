const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true, // מונע הרשמה פעמיים עם אותה מ.ז
        trim: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    // לא חובה לפי האפיון הבסיסי - הוסר required (היה גורם להרשמה להיכשל בלי אימייל)
    email: {
        type: String,
        trim: true
    },
    // שדה למנהל מערכת - מוגדר ידנית במסד הנתונים, אין נתיב API שמאפשר ליצור אדמין
    isAdmin: {
        type: Boolean,
        default: false
    },
    // מפתח זר לטיוטה הפעילה (אתגר: שמירת טיוטה)
    lastDraftId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GrantRequest',
        default: null
    },
    // מפתח זר לבקשה האחרונה שהוגשה בפועל (לדרישת "צפיה בסטטוס")
    lastRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GrantRequest',
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
