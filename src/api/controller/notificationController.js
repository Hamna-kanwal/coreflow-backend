const Notification = require("../model/notification");

// 1️⃣ Internal Trigger Function (Ye Admin Controllers use karenge)
const triggerNotification = async (data) => {
  try {
    const { userId, title, message, type, referenceId, image } = data;

    await Notification.create({
      userId,
      title,
      message,
      type,
      referenceId,
      image
    });
    console.log("Notification saved successfully!");
  } catch (error) {
    console.error("TRIGGER NOTIFICATION ERROR:", error.message);
  }
};

// 2️⃣ Get User Notifications (Mobile Screen ke liye)
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// 3️⃣ Mark Notification as Seen (Orange dot hatane ke liye)
const markNotificationAsSeen = async (req, res) => {
  console.log("------- HIT REACHED CONTROLLER -------");
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    notification.isRead = true;// Orange dot remove karne ke liye
    await notification.save();

    return res.status(200).json({ 
      success: true, 
      message: "Notification marked as seen", 
      notification 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error marking as seen" });
  }
};

module.exports = { triggerNotification, getMyNotifications, markNotificationAsSeen };