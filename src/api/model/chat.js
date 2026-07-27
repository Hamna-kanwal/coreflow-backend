const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
    // Humne String ko ObjectId mein convert kiya hai taake models link ho saken
   
    receiverId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    message: { type: String, required: true },
    role: { type: String },
    isSeen: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.models.Chat || mongoose.model("Chat", chatSchema);