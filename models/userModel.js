const mongoose=require('mongoose');

const userSchema=new mongoose.Schema({
    id: { 
        type: String, 
        required: true, 
        unique: true, // מונע הרשמה פעמיים עם אותה מ.ז
        trim: true 
    },
    firstName: { 
        type: String, 
        required: true 
    },
    lastName: { 
        type: String, 
        required: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    // שדה אופציונלי למנהל מערכת
    isAdmin: { 
        type: Boolean, 
        default: false 
    },
    // שדות מקשרים לבקשות (מפתחות זרים)
    lastDraftId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'GrantRequest' 
    }
}, { timestamps: true });


module.exports=mongoose.model('User',userSchema);