const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../model/user");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const Training = require("../model/admintraining");
const UserTraining = require("../model/usertraining");

const crypto = require("crypto");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const Payment = require("../model/payment");
const cloudinary = require("../utils/cloudinary");
const SubExercise = require("../model/subexercises");
const specialEmails = ["atillar8@gmail.com", "billysamjay@gmail.com", "htmlaw.uk@gmail.com"];

// ---- SUBSCRIPTION PLANS (config file ki bajaye yahin) ----
const SUBSCRIPTION_PLANS = {
  monthly: {
    label: "Monthly",
    basePrice: 197,
    discountPercent: 0,
    durationDays: 30,
  },
  six_months: {
    label: "6 Months",
    basePrice: 197 * 6,
    discountPercent: 10,
    durationDays: 182,
  },
  twelve_months: {
    label: "12 Months",
    basePrice: 197 * 12,
    discountPercent: 20,
    durationDays: 365,
  },
};

function getPlanAmountInCents(planKey) {
  const plan = SUBSCRIPTION_PLANS[planKey];
  if (!plan) return null;
  const finalPrice = plan.basePrice * (1 - plan.discountPercent / 100);
  return Math.round(finalPrice * 100);
}

const register = async (req, res) => {
  try {
    let { fullname, email, password, phonenumber } = req.body;
    if (!fullname || !email || !password) {
      return res.status(400).json({ message: "All fields are required", success: false });
    }

    fullname = fullname.trim().replace(/\s+/g, " ");
    const nameRegex = /^[A-Za-z]+( [A-Za-z]+)*$/;
    if (!nameRegex.test(fullname)) {
      return res.status(400).json({ message: "Full name must contain only letters and spaces", success: false });
    }

    email = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format.", success: false });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email", success: false });
    }

    if (password.length < 10) {
      return res.status(400).json({ message: "Password must be at least 10 characters long", success: false });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyExpires = Date.now() + 15 * 60 * 1000;

    const user = await User.create({
      fullname,
      email,
      password: hashedPassword,
      phonenumber: phonenumber || null,
      is_admin: req.body.is_admin || false,
      isVerified: false,
      emailVerifyToken: verifyToken,
      emailVerifyExpires: verifyExpires,
    });

    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.hostinger.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const verifyUrl = `${req.protocol}://${req.get('host')}/api/v1/users/verify-email/${verifyToken}`;

      await transporter.sendMail({
        from: `"CoreFlowFit" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Verify your email",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
            <h2 style="color: #333;">Email Verification</h2>
            <p>Thanks for registering, ${user.fullname}. Please click below to verify your account:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" 
                 style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                 Verify Email Now
              </a>
            </div>
            <p style="color: #999; font-size: 12px;">This link will expire in 15 minutes. If you did not request this, please ignore this email.</p>
          </div>
        `
      });
    } catch (mailErr) {
      console.error("REGISTER EMAIL SEND ERROR 👉", mailErr);
    }

    return res.status(201).json({
      message: "Registered successfully, check your email to verify",
      success: true,
      user: { isVerified: user.isVerified }
    });
  } catch (error) {
    console.error("REGISTER ERROR 👉", error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      emailVerifyToken: token,
      emailVerifyExpires: { $gt: Date.now() }
    });

    if (!user) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(400).send(`
        <html>
          <head>
            <title>Link Expired</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: 'Segoe UI', sans-serif; background-color: #f0f2f5; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              .card { background: white; padding: 50px 40px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; max-width: 450px; width: 90%; }
              .icon { font-size: 70px; background: #ffebee; color: #e74c3c; width: 100px; height: 100px; line-height: 100px; border-radius: 50%; margin: 0 auto 25px; }
              h1 { color: #2d3436; margin: 0; font-size: 26px; }
              p { color: #636e72; margin: 15px 0 30px; line-height: 1.6; }
              .btn { display: inline-block; padding: 14px 30px; background: #e74c3c; color: white; text-decoration: none; border-radius: 30px; font-weight: 600; transition: 0.2s; }
              .btn:hover { background: #c0392b; transform: translateY(-2px); }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon">×</div>
              <h1>Link Expired!</h1>
              <p>This verification link is no longer valid or has already been used. Please try registering again to receive a new link.</p>
             
            </div>
          </body>
        </html>
      `);
    }

    user.isVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <html>
        <head>
          <title>Verification Successful</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: 'Segoe UI', sans-serif; background-color: #f0f2f5; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: white; padding: 50px 40px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; max-width: 450px; width: 90%; animation: slideUp 0.5s ease-out; }
            .icon { font-size: 70px; background: #e8f5e9; color: #4CAF50; width: 100px; height: 100px; line-height: 100px; border-radius: 50%; margin: 0 auto 25px; }
            h1 { color: #2d3436; margin: 0; font-size: 28px; }
            p { color: #636e72; margin: 15px 0 30px; line-height: 1.6; }
           
            @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h1>Verified!</h1>
            <p>Congratulations! Your email has been successfully verified. You can now log in to your account and start your fitness journey.</p>

          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).send("Server Error");
  }
};

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required", success: false });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).populate("selectTraining");

    if (!user) {
      return res.status(400).json({ message: "Invalid email", success: false });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password", success: false });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: "Please verify your email first", success: false });
    }

    const secretKey = process.env.SECRET_KEY?.trim();
    if (!secretKey) {
      return res.status(500).json({ message: "Server configuration error", success: false });
    }

    const token = jwt.sign(
      { userId: user._id, is_admin: user.is_admin, level: user.level || "Not set" },
      secretKey,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, { 
      httpOnly: true, 
      maxAge: 24 * 60 * 60 * 1000, 
      sameSite: "lax", 
      secure: false 
    });
    
    const userSelections = await UserTraining.find({ userId: user._id }).populate("trainingId");

    const isSpecialUser = specialEmails.includes(normalizedEmail);

    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        is_admin: user.is_admin,
        isNewUser: user.isNewUser,
        isVerified: user.isVerified,
        gender: user.gender || "Not set",
        age: user.age || "Not set",
        weight: user.weight || "Not set",
        address: user.address || "Not set",
        profileImage: user.profileImage || "",
        level: user.level || "Not set",
        isSubscriptionActive: isSpecialUser ? true : (user.isSubscriptionActive || false),
        subscriptionEndDate: user.subscriptionEndDate || null,
        subscriptionPlan: user.subscriptionPlan || null,
        selectedTrainings: userSelections.map(selection => selection.trainingId)
      }
    });

  } catch (error) {
    console.error("LOGIN ERROR 👉", error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

const logout = async (req, res) => {
  try {
    return res.status(200)
      .cookie("token", "", { maxAge: 0, httpOnly: true, sameSite: "lax" })
      .json({ message: "Logout successfully", success: true });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

const updatePersonalInfo = async (req, res) => {
  try {
    const { gender, age, weight, address } = req.body;
    const userId = req.user.id;
    let user = await User.findById(userId);
    if (!user) return res.status(400).json({ message: "User not found", success: false });
    if (gender) user.gender = gender;
    if (age) user.age = age;
    if (weight) user.weight = weight;
    if (address) user.address = address;
    user.isNewUser = false;
    await user.save();
    return res.status(200).json({
      message: "Profile updated successfully",
      success: true,
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        gender: user.gender || null,
        age: user.age || null,
        weight: user.weight || null,
        address: user.address || "",
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

const UpdateProfile = async (req, res) => {
  try {
    const { userId, fullname, email, gender, age, weight, address, phonenumber } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found", success: false });

    if (fullname) {
      const nameRegex = /^[A-Za-z]+( [A-Za-z]+)*$/;
      if (!nameRegex.test(fullname.trim())) {
        return res.status(400).json({ message: "Full name must contain only letters and spaces", success: false });
      }
      user.fullname = fullname.trim().replace(/\s+/g, " ");
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim().toLowerCase())) {
        return res.status(400).json({ message: "Invalid email format.", success: false });
      }
      user.email = email.trim().toLowerCase();
    }

    if (phonenumber) {
      const phoneRegex = /^(\+?\d{1,4})?0?\d{10,12}$/;
      if (!phoneRegex.test(phonenumber)) {
        return res.status(400).json({ message: "Invalid phone number format", success: false });
      }
      user.phonenumber = phonenumber;
    }

    if (gender) user.gender = gender;
    if (age) user.age = Number(age);
    if (weight) user.weight = Number(weight);
    if (address) user.address = address.trim();

    await user.save();
    res.status(200).json({ message: "Profile updated successfully", success: true, user });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

const deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted successfully" });
};

const deleteUserAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Account not found or already deleted." 
      });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({ 
      success: true, 
      message: "Your account has been deleted successfully." 
    });

  } catch (error) {
    console.error("DELETE_USER_ERROR:", error.message);

    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
};

const getExercisesWithSubCount = async (req, res) => {
  try {
    const { trainingId } = req.body;
    const result = await Training.aggregate([
      { $match: { _id: { $in: trainingId.map(id => new mongoose.Types.ObjectId(id)) } } },
      { $unwind: "$exercises" },
      {
        $lookup: {
          from: "mainexercises",
          localField: "exercises",
          foreignField: "_id",
          as: "mainExercise"
        }
      },
      { $unwind: "$mainExercise" },
      {
        $lookup: {
          from: "subexercises",
          localField: "mainExercise._id",
          foreignField: "mainExerciseId",
          as: "subExercises"
        }
      },
      {
        $project: {
          _id: 0,
          training: "$title",
          mainExercise: "$mainExercise.title",
          subExerciseCount: { $size: "$subExercises" }
        }
      }
    ]);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const getTotalUsers = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    res.status(200).json({ success: true, totalUsers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const selectUserLevel = async (req, res) => {
  try {
    const userId = req.user.id;
    const { level } = req.body;
    if (!["Beginner", "Intermediate", "Advanced"].includes(level)) {
      return res.status(400).json({ success: false, message: "Invalid level" });
    }
    await User.findByIdAndUpdate(userId, { level });
    const user = await User.findById(userId);
    const token = jwt.sign({ userId: user._id, is_admin: user.is_admin, level: user.level }, process.env.SECRET_KEY, { expiresIn: "1d" });
    res.status(200).json({ success: true, message: "User level updated successfully", token, level: user.level });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const checkUserPaymentStatus = async (req, res) => {
  try {
    const userId = req.user.id; 
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isSpecialUser = specialEmails.includes(user.email.toLowerCase());

    if (isSpecialUser) {
      return res.status(200).json({ success: true, canWatch: true, status: "paid" });
    }

    const now = new Date();
    if (user.isSubscriptionActive && user.subscriptionEndDate && user.subscriptionEndDate < now) {
      user.isSubscriptionActive = false;
      user.subscriptionEndDate = null;
      user.subscriptionPlan = null;
      await user.save();
    }

    if (user.isSubscriptionActive) {
      return res.status(200).json({ success: true, canWatch: true, status: "paid" });
    }

    if (user.freeVideosCount < 1) {
      return res.status(200).json({ 
        success: true, 
        canWatch: true, 
        status: "free", 
        remaining: 1 - user.freeVideosCount 
      });
    }

    return res.status(403).json({ 
      success: false, 
      canWatch: false, 
      message: "Free limit reached. Please subscribe to continue." 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const incrementVideoCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isSpecialUser = specialEmails.includes(user.email.toLowerCase());

    if (isSpecialUser || user.isSubscriptionActive) {
      return res.status(200).json({ success: true, message: "Premium user: No limit applied." });
    }

    if (user.freeVideosCount < 1) {
      user.freeVideosCount += 1;
      await user.save();
      return res.status(200).json({ success: true, message: "Free video watched", count: user.freeVideosCount });
    }

    return res.status(403).json({ success: false, message: "Free limit reached. Please subscribe." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- UPDATED ----
const createPaymentIntent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan } = req.body; // "monthly" | "six_months" | "twelve_months"

    if (!plan || !SUBSCRIPTION_PLANS[plan]) {
      return res.status(400).json({ success: false, message: "Invalid or missing plan" });
    }

    const amountInCents = getPlanAmountInCents(plan);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      payment_method_types: ["card"],
      metadata: { userId, plan }
    });
    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      plan,
      amount: amountInCents / 100
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to create PaymentIntent" });
  }
};

// ---- UPDATED ----
const verifyMobilePayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) {
      return res.status(400).json({ success: false, message: "PaymentIntentId is required" });
    }
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      const plan = paymentIntent.metadata.plan;
      const planConfig = SUBSCRIPTION_PLANS[plan];

      if (!planConfig) {
        return res.status(400).json({ paymentStatus: false, message: "Unknown plan on payment" });
      }

      const now = new Date();
      const endDate = new Date(now.getTime() + planConfig.durationDays * 24 * 60 * 60 * 1000);

      await User.findByIdAndUpdate(req.user.id, {
        isSubscriptionActive: true,
        subscriptionPlan: plan,
        subscriptionStartDate: now,
        subscriptionEndDate: endDate
      });

      const user = await User.findById(req.user.id);

      await Payment.create({
        userId: user._id,
        sessionId: paymentIntent.id,
        amount: paymentIntent.amount,
        status: "succeeded",
        plan,
        discountPercent: planConfig.discountPercent,
        durationDays: planConfig.durationDays
      });

      const transporter = nodemailer.createTransport({
        host: "smtp.hostinger.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      await transporter.sendMail({
        from: `"CoreFlowFit" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Payment Successful ✅",
        html: `
          <h2>Payment Confirmation</h2>
          <p>Dear ${user.fullname},</p>
          <p>Your payment of $${(paymentIntent.amount / 100).toFixed(2)} has been successfully received.</p>
          <p>Plan: <b>${planConfig.label}</b>${planConfig.discountPercent ? ` (${planConfig.discountPercent}% discount applied)` : ""}</p>
          <p>Your subscription is now active until <b>${endDate.toDateString()}</b>.</p>
          <p>Thank you for your purchase ❤️</p>
        `
      });

      return res.status(200).json({ paymentStatus: true, plan, subscriptionEndDate: endDate });
    }
    res.status(200).json({ paymentStatus: false });
  } catch (error) {
    console.error("VERIFY PAYMENT ERROR 👉", error);
    res.status(500).json({ paymentStatus: false });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find().populate('userId', 'fullname email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to fetch payment data." });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Both old and new passwords are required", success: false });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found", success: false });
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect", success: false });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.status(200).json({ message: "Password changed successfully", success: true });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

const uploadProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { image } = req.body;
    if (!image) return res.status(400).json({ message: "Image is required" });
    const result = await cloudinary.uploader.upload(image, { folder: "profile_images" });
    await User.findByIdAndUpdate(userId, { profileImage: result.secure_url });
    res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      profileImage: result.secure_url,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error uploading image" });
  }
};

const getSecureDownloadLink = async (req, res) => {
  try {
    const userId = req.user.id;
    const subExerciseId = req.params.id;
    const currentUser = await User.findById(userId);
    if (!currentUser) return res.status(404).json({ message: "User not found", success: false });

    if (!currentUser.freeDownloadsCount) currentUser.freeDownloadsCount = 0;

    let accessGranted = false;
    if (currentUser.isSubscriptionActive) {
      accessGranted = true;
    } else if (currentUser.freeDownloadsCount < 1) {
      accessGranted = true;
    }

    if (!accessGranted) {
      return res.status(403).json({ success: false, message: "Download limit reached." });
    }

    const subExercise = await SubExercise.findById(subExerciseId);
    if (!subExercise || !subExercise.videoPlaybackId) return res.status(404).json({ message: "Video not found", success: false });

    const muxPlaybackId = subExercise.videoPlaybackId;
    const videoFileName = subExercise.title.replace(/\s+/g, "_");
    
    const signedToken = jwt.sign(
      {
        sub: muxPlaybackId,
        aud: "v",
        exp: Math.floor(Date.now() / 1000) + 30,
        kid: process.env.MUX_SIGNING_KEY_ID,
      },
      Buffer.from(process.env.MUX_PRIVATE_KEY, "base64"),
      { algorithm: "RS256" }
    );

    const signedVideoUrl = `https://stream.mux.com/${muxPlaybackId}.mp4?token=${signedToken}&download=${videoFileName}.mp4`;

    if (!currentUser.isSubscriptionActive) {
      currentUser.freeDownloadsCount += 1;
      await currentUser.save();
    }

    return res.status(200).json({ success: true, signedVideoUrl });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required", success: false });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "This account is already verified. Please login.", success: false });
    }

    const newVerifyToken = crypto.randomBytes(32).toString("hex");
    const newVerifyExpires = new Date(Date.now() + 15 * 60 * 1000); 

    user.emailVerifyToken = newVerifyToken;
    user.emailVerifyExpires = newVerifyExpires;
    await user.save();

    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const verifyUrl = `${req.protocol}://${req.get('host')}/api/v1/users/verify-email/${newVerifyToken}`;

    await transporter.sendMail({
      from: `"CoreFlowFit Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Verify your email (New Link)",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>You requested a new verification link. Please click the button below to verify your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" 
               style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
               Verify Email Now
            </a>
          </div>
          <p style="color: #999; font-size: 12px;">This link will expire in 15 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `
    });

    return res.status(200).json({
      message: "Verification email sent successfully! Please check your inbox.",
      success: true
    });

  } catch (error) {
    console.error("RESEND ERROR 👉", error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

// ------------------ EXPORTS ------------------
module.exports = {
  register,
  userLogin,
  logout,
  UpdateProfile,
  updatePersonalInfo,
  deleteUser,
  getAllUsers,
  getExercisesWithSubCount,
  getTotalUsers,
  selectUserLevel,
  verifyEmail,
  checkUserPaymentStatus,
  incrementVideoCount,
  getPaymentHistory,
  changePassword,
  createPaymentIntent,
  verifyMobilePayment,
  uploadProfileImage,
  getSecureDownloadLink,
  resendVerificationEmail,
  deleteUserAccount,
};