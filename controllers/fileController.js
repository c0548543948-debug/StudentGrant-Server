const uploadDocument = async (req, res) => {
    // 1. ה-Middleware כבר עשה את עבודתו!
    // ה-req.file מכיל את המידע על הקובץ שנשמר הרגע בתיקייה.
    const file = req.file; 
    
    // 2. קבלת ה-ID של הבקשה מהגוף של הבקשה
    const { requestId } = req.body; 
    
    // 3. קבלת שם השדה מה-URL (למשל: studentIdCopy)
    const fieldName = req.params.fieldName; 

    // 4. בדיקה בטיחותית: האם באמת הגיע קובץ?
    if (!file) return res.status(400).json({ error: 'לא הועלה קובץ' });

    try {
        // 5. הכנת אובייקט העדכון
        // אנחנו רוצים לעדכן שדה ספציפי בתוך documents, למשל: documents.studentIdCopy
        const update = {};
        update[`documents.${fieldName}`] = file.path; // file.path הוא הנתיב (למשל uploads/123.jpg)

        // 6. עדכון מסד הנתונים (MongoDB)
        // מצא את הבקשה לפי ה-ID שלה, ועדכן רק את שדה הקבצים.
        await GrantRequest.findByIdAndUpdate(
            requestId,
            { $set: update },
            { new: true }
        );

        // 7. תגובה ללקוח: "הצלחנו!"
        res.status(200).json({ message: 'הקובץ הועלה בהצלחה', path: file.path });
    } catch (error) {
        res.status(500).json({ error: 'שגיאה בשמירת נתיב הקובץ' });
    }
};