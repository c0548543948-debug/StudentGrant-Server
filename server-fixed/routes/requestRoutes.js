const express = require('express');
const router = express.Router();

const controller = require('../controllers/grantRequestController');
const fileController = require('../controllers/fileController');
const upload = require('../middleware/uploadConfig');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// --- כל הנתיבים מתחת כאן דורשים התחברות ---
router.use(authMiddleware);

// --- נתיבים עבור הסטודנט ---

// שליפת הטיוטה הנוכחית (להצגה בכניסה לטופס ההגשה)
router.get('/draft/me', controller.getMyDraft);

// שמירת טיוטה (יצירה/עדכון) - מבוסס על המשתמש המחובר (req.userId), לא על נתון מה-body
router.post('/draft', controller.upsertDraft);

// הגשת בקשה רשמית
router.post('/submit', controller.submitApplication);

// סטטוס הבקשה האחרונה של המשתמש המחובר
router.get('/status/me', controller.getMyStatus);

// היסטוריית בקשות של סטודנט - רק הסטודנט עצמו או מנהל
router.get('/history/:userId', (req, res, next) => {
    if (!req.isAdmin && req.params.userId !== req.userId) {
        return res.status(403).json({ message: 'אין לך הרשאה לצפות בהיסטוריה זו' });
    }
    next();
}, controller.getUserApplicationsHistory);

// פרטי בקשה ספציפית - הרשאת בעלות/אדמין נבדקת בתוך הקונטרולר
router.get('/details/:requestId', controller.getRequestDetails);

// העלאת קובץ (דינמי לפי שם השדה) - 'file' הוא שם השדה ב-FormData מה-Frontend
router.post('/upload/:fieldName', upload.single('file'), fileController.uploadDocument);

// --- נתיבים עבור המנהל בלבד ---

router.get('/admin/requests', adminMiddleware, controller.getAdminRequests);
router.patch('/admin/status', adminMiddleware, controller.updateRequestStatus);

module.exports = router;
