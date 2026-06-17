const mongoose = require('mongoose');

const grantRequestSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // סטטוס הבקשה לניהול זרימת העבודה
    status: { type: String, enum: ['draft', 'pending', 'approved', 'rejected'], default: 'draft' },

    // 1. פרטים אישיים (חלקם יישלפו מה-User)
    personalInfo: {
        dateOfBirth: Date,
        city: String,
        address: String,
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
        major: { type: String, enum: ['ComputerScience', 'Engineering', 'Medicine', 'Other'] }, // דוגמאות
        institutionName: String,
        yearsOfStudy: Number,
        annualTuition: Number
    },

    // 4. פרטי חשבון בנק
    bankDetails: {
        accountOwnerId: String,
        bankName: String, // ניתן גם להגדיר כ-Enum אם יש רשימה קבועה
        branchNumber: String,
        accountNumber: String
    },

    // 5. העלאת טפסים (שמירת נתיבים לקבצים בשרת או ב-Cloud)
    documents: {
        studentIdCopy: String,
        fatherIdCopy: String,
        motherIdCopy: String,
        studyCertificate: String,
        bankAccountCertificate: String
    }
}, { timestamps: true });

module.exports = mongoose.model('GrantRequest', grantRequestSchema);