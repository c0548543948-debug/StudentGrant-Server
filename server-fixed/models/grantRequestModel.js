const mongoose = require('mongoose');

const grantRequestSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // סטטוס הבקשה לניהול זרימת העבודה
    status: { type: String, enum: ['draft', 'pending', 'approved', 'rejected'], default: 'draft' },

    // נשמר בנפרד מ-createdAt, כי createdAt נוצר כשהטיוטה נוצרה ולא בהכרח כשהבקשה הוגשה בפועל
    submittedAt: { type: Date, default: null },

    // 1. פרטים אישיים (חלקם יישלפו מה-User ולא ייערכו כאן)
    personalInfo: {
        dateOfBirth: Date,
        city: String,
        address: String,
        zipCode: String, // אתגר: שדה מיקוד
        mobilePhone: String,
        homePhone: String
    },

    // 2. פרטי משפחה
    familyInfo: {
        father: { id: String, firstName: String, lastName: String },
        mother: { id: String, firstName: String, lastName: String },
        siblingsUnder18: Number,
        siblingsOver21WithChildren: Number
    },

    // 3. פרטי לימודים
    studyInfo: {
        major: { type: String, enum: ['ComputerScience', 'Engineering', 'Medicine', 'Other'] }, // יש להתאים לרשימה האמיתית
        institutionName: String,
        yearsOfStudy: Number,
        annualTuition: Number
    },

    // 4. פרטי חשבון בנק
    bankDetails: {
        accountOwnerId: String,
        bankName: String,
        bankNumber: String, // מספר הבנק (בנפרד משם הבנק)
        branchNumber: String,
        accountNumber: String
    },

    // 5. העלאת טפסים (שמירת נתיבים לקבצים בשרת)
    documents: {
        studentIdCopy: String,
        fatherIdCopy: String,
        motherIdCopy: String,
        studyCertificate: String,
        bankAccountCertificate: String
    }
}, { timestamps: true });

module.exports = mongoose.model('GrantRequest', grantRequestSchema);
