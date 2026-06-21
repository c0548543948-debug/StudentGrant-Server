const GrantRequest = require('../models/grantRequestModel');

// שדות מסמכים מותרים - חוסם עדכון שדה שרירותי בתוך documents
const ALLOWED_DOCUMENT_FIELDS = [
    'studentIdCopy',
    'fatherIdCopy',
    'motherIdCopy',
    'studyCertificate',
    'bankAccountCertificate'
];

const uploadDocument = async (req, res) => {
    const file = req.file;
    const { requestId } = req.body;
    const fieldName = req.params.fieldName;

    if (!file) {
        return res.status(400).json({ error: 'לא הועלה קובץ' });
    }

    if (!ALLOWED_DOCUMENT_FIELDS.includes(fieldName)) {
        return res.status(400).json({ error: 'שם שדה מסמך לא חוקי' });
    }

    try {
        const request = await GrantRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ error: 'הבקשה לא נמצאה' });
        }

        // מאפשרים העלאה רק לבעל הבקשה (טיוטה/בקשה שלו)
        if (request.student.toString() !== req.userId) {
            return res.status(403).json({ error: 'אין לך הרשאה לעדכן בקשה זו' });
        }

        // שומרים רק את שם הקובץ (לא את הנתיב המלא בדיסק) - הקליינט בונה את ה-URL
        // הציבורי לפי /uploads/<filename>, שמוגש דרך express.static ב-server.js
        const update = {};
        update[`documents.${fieldName}`] = file.filename;

        const updated = await GrantRequest.findByIdAndUpdate(
            requestId,
            { $set: update },
            { new: true }
        );

        res.status(200).json({ message: 'הקובץ הועלה בהצלחה', filename: file.filename, request: updated });
    } catch (error) {
        res.status(500).json({ error: 'שגיאה בשמירת נתיב הקובץ' });
    }
};

module.exports = { uploadDocument };
