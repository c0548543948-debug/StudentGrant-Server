# שרת ניהול בקשות מענקים לסטודנטים

גרסה מתוקנת ומלאה של הקוד שהועלה - מבנה תיקיות אחיד, חיבור ל-DB, אימות הרשאות, ותיקון כל הבאגים שמנעו מהשרת לרוץ.

## הרצה

```bash
npm install
cp .env.example .env   # ואז למלא MONGO_URI ו-JWT_SECRET אמיתיים
npm run dev            # או npm start
```

כדי להפוך משתמש קיים למנהל מערכת (אין נתיב API ליצירת אדמין, בכוונה - מטעמי אבטחה):
```bash
node scripts/makeAdmin.js 123456789
```

## מה תוקן לעומת הקוד המקורי

1. **מבנה תיקיות אחיד** - כל ה-`require` עכשיו תואמים בפועל לשמות ולמיקומי הקבצים (`models/`, `controllers/`, `middleware/`, `routes/`).
2. **חיבור ל-MongoDB** - היה חסר לחלוטין ב-`server.js`.
3. **CORS** - נוסף, כדי שהקליינט הריאקט (פורט אחר) יוכל לקרוא ל-API.
4. **`uploadDocument`** - היה לא מיובא, לא מיוצא, וחסר לו import של המודל. תוקן ועבר לקובץ `fileController.js` עם חיווט נכון ב-router.
5. **`getRequestDetails`** - היה מוגדר אך לא מיוצא מהקונטרולר.
6. **התאמת JWT** - ב-login נחתם `{ id: ... }`, ב-middleware נקרא `decoded.userId` - לא תאמו. אוחד לכל המערכת ל-`userId`, ונוסף `isAdmin` לתוך הטוקן.
7. **הרשאות** - כל נתיבי הבקשות מוגנות כעת ב-`authMiddleware`, ונתיבי המנהל מוגנים גם ב-`adminMiddleware`. הזהות של המשתמש (`student`) נגזרת מהטוקן (`req.userId`) ולא מגוף הבקשה - כך אי אפשר לשלוח/לצפות בבקשות בשם מישהו אחר.
8. **מפתחות זרים במודל המשתמש** - `lastDraftId` ו-`lastRequestId` מעודכנים בפועל בכל שמירת טיוטה / הגשה (באפיון המקורי השדה היה קיים אך לא היה בשימוש).
9. **`submittedAt`** - שדה נפרד מ-`createdAt`, כדי שסינון/מיון לפי תאריך הגשה יהיה מדויק גם אם הבקשה נוצרה כטיוטה הרבה לפני שהוגשה.
10. **סינון מנהל מורחב** - נוספו `maxSalary`, `siblingsMax`, חיפוש לפי מ.ז (`studentId`), ומיון (`sortBy` / `sortOrder`). הוגבלו השדות שמוחזרים לטבלה (`select`) כדי לא לשלוף נתונים רגישים שלא נדרשים בתצוגת הרשימה.
11. **בדיקת שדות חובה** לפני הגשה סופית (לא לפני שמירת טיוטה - טיוטה יכולה להיות חלקית).
12. **multer** - הוגבל לסוגי קבצים (תמונה/PDF) וגודל מקסימלי, ונבדקת בעלות על הבקשה לפני עדכון מסמך.
13. נוספו `package.json`, `.env.example`, `.gitignore`.

## מבנה ה-API

### אימות - `/api/users`
| Method | נתיב | הרשאה | תיאור |
|---|---|---|---|
| POST | `/register` | פתוח | `{ id, firstName, lastName, password, email? }` - מחזיר טוקן (מחבר אוטומטית) |
| POST | `/login` | פתוח | `{ id, password }` |
| POST | `/logout` | פתוח | מוחק טוקן בצד הלקוח |
| GET | `/me` | מחובר | פרטי המשתמש המחובר (לפי הטוקן) |

### בקשות מענק - `/api/requests` (כל הנתיבים דורשים `Authorization: Bearer <token>`)
| Method | נתיב | הרשאה | תיאור |
|---|---|---|---|
| GET | `/draft/me` | סטודנט | הטיוטה הנוכחית של המשתמש, או `null` |
| POST | `/draft` | סטודנט | שמירת/עדכון טיוטה (אפשר לשלוח רק חלק מהשדות) |
| POST | `/submit` | סטודנט | הגשה סופית - בודק שדות חובה ומשנה סטטוס ל-`pending` |
| GET | `/status/me` | סטודנט | הבקשה האחרונה שהוגשה (לתצוגת סטטוס) |
| GET | `/history/:userId` | סטודנט (עצמו) / מנהל | רשימת בקשות שהוגשו (לא טיוטות) |
| GET | `/details/:requestId` | בעל הבקשה / מנהל | פרטי בקשה מלאים |
| POST | `/upload/:fieldName` | בעל הבקשה | multipart/form-data, שדה `file` + `requestId` ב-body. `fieldName` ∈ `studentIdCopy, fatherIdCopy, motherIdCopy, studyCertificate, bankAccountCertificate` |
| GET | `/admin/requests` | מנהל | תומך ב-query params: `studentId, city, minSalary, maxSalary, siblingsMin, siblingsMax, fromDate, toDate, sortBy, sortOrder` |
| PATCH | `/admin/status` | מנהל | `{ requestId, status: 'approved' \| 'rejected' }` |

קבצים מועלים נגישים תחת `GET /uploads/<filename>`.

## מה לא יושם (אתגרים אופציונליים מהאפיון)

לא מומשו (כיון שהם מסומנים "אתגר"/תוסף ולא דרישת בסיס): תצוגה מקדימה של הטופס, מחיקת נתונים בהתנתקות, שליחת אימייל בשינוי סטטוס, אינטגרציית גוגל מפות. אפשר להוסיף בהמשך אם תרצי.
