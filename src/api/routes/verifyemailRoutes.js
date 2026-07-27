const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params; // ✅ yahan change

    const user = await User.findOne({ verifyToken: token });
    if (!user) {
      return res.status(400).json({ message: "Invalid token", success: false });
    }

    user.isVerified = true;
    user.verifyToken = null;
    await user.save();

    return res.status(200).json({
      message: "Email verified successfully",
      success: true
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", success: false });
  }
};