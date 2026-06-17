const GrantRequest = require('../models/GrantRequest');

// 1. שמירת טיוטה (Upsert) - מיזוג חכם של הנתונים
const upsertDraft = async (req, res) => {
    const { student, ...data } = req.body; // student זה ה-ID של המשתמש

    try {
        let request = await GrantRequest.findOne({ student: student, status: 'draft' });

        if (request) {
            // אם הטיוטה קיימת - נבצע מיזוג לכל חלק בנפרד כדי לא לדרוס שדות שלא הגיעו
            request.personalInfo = { ...request.personalInfo, ...data.personalInfo };
            request.familyInfo = { ...request.familyInfo, ...data.familyInfo };
            request.studyInfo = { ...request.studyInfo, ...data.studyInfo };
            request.bankDetails = { ...request.bankDetails, ...data.bankDetails };
            request.documents = { ...request.documents, ...data.documents };
            
            await request.save();
            return res.status(200).json({ message: 'הטיוטה עודכנה', request });
        } else {
            // יצירת טיוטה חדשה
            const newDraft = new GrantRequest({
                student,
                status: 'draft',
                ...data
            });
            await newDraft.save();
            return res.status(201).json({ message: 'טיוטה חדשה נשמרה', newDraft });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. הגשת בקשה
const submitApplication = async (req, res) => {
    const { student, ...data } = req.body;

    try {
        let request = await GrantRequest.findOne({ student: student, status: 'draft' });

        if (request) {
            // עדכון טיוטה קיימת להגשה
            request.status = 'pending';
            // עדכון כל השדות במקרה שהיו שינויים אחרונים
            Object.assign(request, data);
            await request.save();
            return res.status(200).json({ message: 'הבקשה הוגשה בהצלחה', request });
        } else {
            // הגשה ישירה (ללא טיוטה)
            const newRequest = new GrantRequest({
                student,
                status: 'pending',
                ...data
            });
            await newRequest.save();
            return res.status(201).json({ message: 'הבקשה הוגשה בהצלחה', newRequest });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. שליפה למנהל (עם סינון דינמי)
const getAdminRequests = async (req, res) => {
    try {
        const { minSalary, city, siblingsMin, minDate, maxDate } = req.query;
        
        // בניית שאילתה דינמית
        let query = { status: { $ne: 'draft' } }; // לא להציג טיוטות

        if (city) query['personalInfo.city'] = city;
        if (minSalary) query['studyInfo.annualTuition'] = { $gte: Number(minSalary) };
        if (siblingsMin) query['familyInfo.siblingsUnder18'] = { $gte: Number(siblingsMin) };
        
        // סינון לפי תאריך יצירה (שמטופל אוטומטית ע"י timestamps)
        if (minDate || maxDate) {
            query.createdAt = {};
            if (minDate) query.createdAt.$gte = new Date(minDate);
            if (maxDate) query.createdAt.$lte = new Date(maxDate);
        }

        const requests = await GrantRequest.find(query).populate('student', 'firstName lastName'); // שליפת שם הסטודנט מה-User
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. עדכון סטטוס ע"י מנהל
const updateRequestStatus = async (req, res) => {
    const { requestId, status } = req.body; // status יכול להיות 'approved' או 'rejected'
    
    try {
        const request = await GrantRequest.findByIdAndUpdate(
            requestId, 
            { status }, 
            { new: true }
        );
        res.status(200).json({ message: 'הסטטוס עודכן', request });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ב-GrantRequestController.js

const getUserApplicationsHistory = async (req, res) => {
    const userId = req.params.userId; 

    try {
        const history = await GrantRequest.find({
            student: userId,
            status: { $ne: 'draft' } 
        })
        // כאן אנחנו בוחרים רק את השדות שיוצגו בטבלה
        .select('status createdAt studyInfo.major studyInfo.institutionName')
        .sort({ createdAt: -1 });

        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ error: 'שגיאה בשליפת ההיסטוריה' });
    }
};
// ב-GrantRequestController.js

const getRequestDetails = async (req, res) => {
    const { requestId } = req.params;

    try {
        // שליפה של כל השדות (בלי .select)
        const request = await GrantRequest.findById(requestId)
            .populate('student', 'firstName lastName email'); // אפשר להוסיף שליפת שם הסטודנט מה-User

        if (!request) {
            return res.status(404).json({ message: 'הבקשה לא נמצאה' });
        }

        // חשוב מאוד: אבטחה! 
        // וודאי שרק הסטודנט עצמו או מנהל יכולים לראות את הפרטים.
        // הקוד כאן מניח שיש לך middleware שבודק הרשאות (כמו req.user)
        /* if (req.user.role !== 'admin' && request.student.toString() !== req.user.id) {
             return res.status(403).json({ message: 'אין לך הרשאה לצפות בבקשה זו' });
        }
        */

        res.status(200).json(request);
    } catch (error) {
        res.status(500).json({ error: 'שגיאה בשליפת פרטי הבקשה' });
    }
};

module.exports = { upsertDraft, submitApplication, getAdminRequests, updateRequestStatus, getUserApplicationsHistory };