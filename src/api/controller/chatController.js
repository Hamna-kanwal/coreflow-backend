const Chat = require("../model/chat");
const User = require("../model/user"); 
const Pusher = require("pusher");
const Report = require("../model/report");

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});
const sendMessage = async (req, res) => {
    try {
        const senderId = req.user?.id;
        const { receiverId, message } = req.body;

        if (!message || !message.trim() || !receiverId) {
            return res.status(400).json({ success: false, message: "Missing fields" });
        }

        const newChat = await Chat.create({
            senderId,
            receiverId,
            message: message.trim()
        });

        // Safe String conversion for Pusher channels
        const rID = receiverId.toString();
        const sID = senderId.toString();

        // Pusher triggers with error handling
        try {
            await pusher.trigger(`chat-${rID}`, "receive_message", newChat);
            await pusher.trigger(`chat-${sID}`, "receive_message", newChat);
        } catch (pError) {
            console.error("Pusher Error:", pError.message);
            // Message save ho chuka hai, isliye hum response bhej sakte hain
        }

        res.status(200).json({ success: true, data: newChat });
    } catch (error) {
        console.error("SEND ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 🔵 2. Get Chat History (Admin via Body, User via Auto)
const getChatHistory = async (req, res) => {
    try {
        const myId = req.user?.id;
        const isAdmin = req.user?.isAdmin;
        let targetId;

        if (isAdmin) {
            targetId = req.body.receiverId; // Admin body mein bhejega
        } else {
            const admin = await User.findOne({ isAdmin: true });
            targetId = admin ? admin._id : null;
        }

        if (!targetId) {
            return res.status(400).json({ success: false, message: "Target user not found" });
        }

        const history = await Chat.find({
            $or: [
                { senderId: myId, receiverId: targetId },
                { senderId: targetId, receiverId: myId }
            ]
        }).sort({ createdAt: 1 });

        res.status(200).json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// 🔄 Toggle Block/Unblock
const toggleBlockUser = async (req, res) => {
    try {
        const { userId, targetId } = req.body; // userId: Action lene wala, targetId: Jisay block/unblock karna hai

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // Check karein ke targetId pehle se blocked list mein hai ya nahi
        const isBlocked = user.blockedUsers.includes(targetId);

        if (isBlocked) {
            // Agar pehle se block hai to Unblock kar dein
            await User.findByIdAndUpdate(userId, {
                $pull: { blockedUsers: targetId }
            });
            return res.status(200).json({ success: true, message: "User unblocked successfully.", isBlocked: false });
        } else {
            // Agar block nahi hai to Block kar dein
            await User.findByIdAndUpdate(userId, {
                $addToSet: { blockedUsers: targetId }
            });
            return res.status(200).json({ success: true, message: "User blocked successfully.", isBlocked: true });
        }

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
const reportUser = async (req, res) => {
    try {
        const { reporterId, targetId, reason } = req.body;

        if (!reporterId || !targetId || !reason) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const newReport = await Report.create({
            reporterId,
            targetId,
            reason
        });

        res.status(201).json({ 
            success: true, 
            message: "User reported successfully. Our team will review it.", 
            data: newReport 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



module.exports = { sendMessage, getChatHistory,toggleBlockUser,reportUser };