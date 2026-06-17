const multer = require('multer');
const path = require('path');
const fs = require('fs');

// יצירת תיקיית uploads אם היא לא קיימת
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        // שם קובץ ייחודי: ID של הסטודנט + זמן נוכחי כדי למנוע דריסות
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

module.exports = upload;