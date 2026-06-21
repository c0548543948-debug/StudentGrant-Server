const mongoose = require('mongoose');
const GrantRequest = require('../models/grantRequestModel');
const User = require('../models/userModel');

const ALLOWED_MAJORS = ['ComputerScience', 'Engineering', 'Medicine', 'Other'];

// שדות שמותר למשתמש לעדכן בטיוטה/בהגשה (חוסם דריסה של status/student/_id וכו')
const pickEditableFields = (body) => {
    const { personalInfo, familyInfo, studyInfo, bankDetails, documents } = body;
    return { personalInfo, familyInfo, studyInfo, bankDetails, documents };
};

// 0. שליפת הטיוטה הנוכחית של המשתמש המחובר (להצגה בכניסה לטופס)
const getMyDraft = async (req, res) => {
    try {
        const draft = await GrantRequest.findOne({ student: req.userId, status: 'draft' });
        res.status(200).json(draft || null);
    } catch (error) {
        res.status(500).json({ error: 'שגיאה בשליפת הטיוטה' });
    }
};

// 1. שמירת טיוטה (Upsert) - מיזוג חכם של הנתונים, לפי המשתמש המחובר
const upsertDraft = async (req, res) => {
    const data = pickEditableFields(req.body);

    try {
        let request = await GrantRequest.findOne({ student: req.userId, status: 'draft' });

        if (request) {
            // מיזוג לכל חלק בנפרד כדי לא לדרוס שדות שלא הגיעו בבקשה הנוכחית
            if (data.personalInfo) request.personalInfo = { ...request.personalInfo, ...data.personalInfo };
            if (data.familyInfo) request.familyInfo = { ...request.familyInfo, ...data.familyInfo };
            if (data.studyInfo) request.studyInfo = { ...request.studyInfo, ...data.studyInfo };
            if (data.bankDetails) request.bankDetails = { ...request.bankDetails, ...data.bankDetails };
            if (data.documents) request.documents = { ...request.documents, ...data.documents };

            await request.save();
            return res.status(200).json({ message: 'הטיוטה עודכנה', request });
        } else {
            const newDraft = new GrantRequest({
                student: req.userId,
                status: 'draft',
                ...data
            });
            await newDraft.save();

            // שמירת מפתח זר לטיוטה במודל המשתמש (אתגר)
            await User.findByIdAndUpdate(req.userId, { lastDraftId: newDraft._id });

            return res.status(201).json({ message: 'טיוטה חדשה נשמרה', request: newDraft });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. הגשת בקשה רשמית (הופך טיוטה ל-pending, או יוצר בקשה ישירה אם אין טיוטה)
const submitApplication = async (req, res) => {
    const data = pickEditableFields(req.body);

    try {
        let request = await GrantRequest.findOne({ student: req.userId, status: 'draft' });

        // בדיקת שדות חובה בסיסית לפני הגשה (ולא רק שמירת טיוטה)
        const merged = request ? {
            personalInfo: { ...request.personalInfo, ...data.personalInfo },
            familyInfo: { ...request.familyInfo, ...data.familyInfo },
            studyInfo: { ...request.studyInfo, ...data.studyInfo },
            bankDetails: { ...request.bankDetails, ...data.bankDetails }
        } : data;

        const missing = [];
        if (!merged.personalInfo?.city) missing.push('עיר מגורים');
        if (!merged.personalInfo?.address) missing.push('כתובת');
        if (!merged.personalInfo?.mobilePhone) missing.push('טלפון נייד');
        if (!merged.studyInfo?.major) missing.push('מגמה');
        if (!merged.studyInfo?.institutionName) missing.push('שם מוסד');
        if (!merged.bankDetails?.accountNumber) missing.push('מספר חשבון בנק');
        if (missing.length > 0) {
            return res.status(400).json({ message: 'חלק מהשדות החובה חסרים', missingFields: missing });
        }

        let savedRequest;
        if (request) {
            request.status = 'pending';
            request.submittedAt = new Date();
            request.personalInfo = merged.personalInfo;
            request.familyInfo = merged.familyInfo;
            request.studyInfo = merged.studyInfo;
            request.bankDetails = merged.bankDetails;
            if (data.documents) request.documents = { ...request.documents, ...data.documents };
            savedRequest = await request.save();
        } else {
            const newRequest = new GrantRequest({
                student: req.userId,
                status: 'pending',
                submittedAt: new Date(),
                ...data
            });
            savedRequest = await newRequest.save();
        }

        // עדכון מפתחות זרים במודל המשתמש: בקשה אחרונה שהוגשה, וניקוי הטיוטה (היא לא טיוטה יותר)
        await User.findByIdAndUpdate(req.userId, {
            lastRequestId: savedRequest._id,
            lastDraftId: null
        });

        return res.status(200).json({ message: 'הבקשה הוגשה בהצלחה', request: savedRequest });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. צפיה בסטטוס - שליפת הבקשה האחרונה שהגיש המשתמש המחובר
const getMyStatus = async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        let request = null;
        if (user?.lastRequestId) {
            request = await GrantRequest.findById(user.lastRequestId);
        }
        // נפילה לאחור: אם אין מפתח זר שמור (לדוגמה נתונים ישנים), נשלוף לפי תאריך הגשה
        if (!request) {
            request = await GrantRequest.findOne({ student: req.userId, status: { $ne: 'draft' } })
                .sort({ submittedAt: -1, createdAt: -1 });
        }

        res.status(200).json(request || null);
    } catch (error) {
        res.status(500).json({ error: 'שגיאה בשליפת סטטוס הבקשה' });
    }
};

// 3.1 היסטוריית בקשות של סטודנט מסוים (לשימוש המשתמש עצמו או מנהל - הרשאה נבדקת ב-router)
const getUserApplicationsHistory = async (req, res) => {
    const userId = req.params.userId;

    try {
        const history = await GrantRequest.find({
            student: userId,
            status: { $ne: 'draft' }
        })
            .select('status submittedAt createdAt studyInfo.major studyInfo.institutionName')
            .sort({ submittedAt: -1, createdAt: -1 });

        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ error: 'שגיאה בשליפת ההיסטוריה' });
    }
};

// 4. שליפה למנהל (עם סינון ומיון דינמיים) - מחזיר רק את השדות הרלוונטיים לטבלה
const getAdminRequests = async (req, res) => {
    try {
        const {
            studentId,      // חיפוש לפי מ.ז
            city,           // עיר מגורים
            minSalary, maxSalary,      // שכר שנתי
            siblingsMin, siblingsMax,  // מספר אחים מתחת לגיל 18
            fromDate, toDate,          // טווח תאריך הגשה
            sortBy = 'submittedAt',    // submittedAt | siblingsUnder18 | annualTuition
            sortOrder = 'desc'         // asc | desc
        } = req.query;

        let query = { status: { $ne: 'draft' } }; // לא להציג טיוטות

        if (city) query['personalInfo.city'] = city;

        if (minSalary || maxSalary) {
            query['studyInfo.annualTuition'] = {};
            if (minSalary) query['studyInfo.annualTuition'].$gte = Number(minSalary);
            if (maxSalary) query['studyInfo.annualTuition'].$lte = Number(maxSalary);
        }

        if (siblingsMin || siblingsMax) {
            query['familyInfo.siblingsUnder18'] = {};
            if (siblingsMin) query['familyInfo.siblingsUnder18'].$gte = Number(siblingsMin);
            if (siblingsMax) query['familyInfo.siblingsUnder18'].$lte = Number(siblingsMax);
        }

        if (fromDate || toDate) {
            query.submittedAt = {};
            if (fromDate) query.submittedAt.$gte = new Date(fromDate);
            if (toDate) query.submittedAt.$lte = new Date(toDate);
        }

        // חיפוש לפי מ.ז של הסטודנט - דורש שלב ביניים, כי זה שדה בטבלת User ולא ב-GrantRequest
        if (studentId) {
            const matchingUsers = await User.find({ id: new RegExp(studentId, 'i') }).select('_id');
            query.student = { $in: matchingUsers.map((u) => u._id) };
        }

        const sortField =
            sortBy === 'siblingsUnder18' ? 'familyInfo.siblingsUnder18' :
            sortBy === 'annualTuition' ? 'studyInfo.annualTuition' :
            'submittedAt';
        const sortDirection = sortOrder === 'asc' ? 1 : -1;

        const requests = await GrantRequest.find(query)
            .select('status submittedAt createdAt studyInfo.major familyInfo.siblingsUnder18 personalInfo.city')
            .populate('student', 'id firstName lastName')
            .sort({ [sortField]: sortDirection });

        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. עדכון סטטוס ע"י מנהל - מאשר רק approved/rejected
const updateRequestStatus = async (req, res) => {
    const { requestId, status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "סטטוס חייב להיות 'approved' או 'rejected'" });
    }

    try {
        const request = await GrantRequest.findByIdAndUpdate(
            requestId,
            { status },
            { new: true }
        );
        if (!request) {
            return res.status(404).json({ message: 'הבקשה לא נמצאה' });
        }
        res.status(200).json({ message: 'הסטטוס עודכן', request });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 6. פרטי בקשה מלאים - רק הסטודנט עצמו (בעל הבקשה) או מנהל
const getRequestDetails = async (req, res) => {
    const { requestId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({ message: 'מזהה בקשה לא תקין' });
        }

        const request = await GrantRequest.findById(requestId)
            .populate('student', 'id firstName lastName email');

        if (!request) {
            return res.status(404).json({ message: 'הבקשה לא נמצאה' });
        }

        const isOwner = request.student._id.toString() === req.userId;
        if (!req.isAdmin && !isOwner) {
            return res.status(403).json({ message: 'אין לך הרשאה לצפות בבקשה זו' });
        }

        res.status(200).json(request);
    } catch (error) {
        res.status(500).json({ error: 'שגיאה בשליפת פרטי הבקשה' });
    }
};

module.exports = {
    getMyDraft,
    upsertDraft,
    submitApplication,
    getMyStatus,
    getUserApplicationsHistory,
    getAdminRequests,
    updateRequestStatus,
    getRequestDetails,
    ALLOWED_MAJORS
};
