const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
    reporterId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    targetUserId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    targetPostId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'CommunityPost' 
    },
    // 🔥 YEH FIELD ADD KAREIN (ZAROORI)
    targetCommentId: { 
        type: mongoose.Schema.Types.ObjectId 
    },
    // 🔥 YEH FIELD BHI ADD KAREIN (Classification ke liye)
    reportType: { 
        type: String, 
        enum: ['post', 'comment', 'user'],
        default: 'post'
    },
    reason: { type: String, required: false },
    status: { 
        type: String, 
        enum: ['pending', 'resolved'], 
        default: 'pending' 
    }
}, { timestamps: true });

module.exports = mongoose.models.Report || mongoose.model("Report", reportSchema);