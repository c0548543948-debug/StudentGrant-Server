const express = require('express');

// ייבוא הקונטרולר והמידלוור
const controller = require('../controllers/grantRequestController');
const upload = require('../middleware/uploadConfig'); 
const router = express.Router();


// --- נתיבים עבור הסטודנט ---

// 1. שמירת טיוטה (או עדכון טיוטה קיימת)
router.post('/draft', controller.upsertDraft);

// 2. הגשת בקשה רשמית
router.post('/submit', controller.submitApplication);

// 3. שליפת היסטוריית בקשות של סטודנט
router.get('/history/:userId', controller.getUserApplicationsHistory);

// 4. שליפת פרטי בקשה ספציפית (לצפייה בפירוט)
router.get('/details/:requestId', controller.getRequestDetails);

// 5. העלאת קובץ (דינמי לפי שם השדה)
// הערה: 'file' הוא השם שה-Frontend צריך לתת ל-Key ב-FormData
router.post('/upload/:fieldName', upload.single('file'), controller.uploadDocument);


// --- נתיבים עבור המנהל ---

// 6. שליפת רשימת כל הבקשות (עם סינון דינמי)
router.get('/admin/requests', controller.getAdminRequests);

// 7. עדכון סטטוס בקשה ע"י מנהל
router.patch('/admin/status', controller.updateRequestStatus);


module.exports = router;