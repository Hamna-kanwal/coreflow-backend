const Contact = require("../model/contact");
const axios = require("axios");

const submitContactForm = async (req, res) => {
  try {
    const { name, email, message, captchaToken } = req.body;

    // Required fields
    if (!name || !email || !message || !captchaToken) {
      return res.status(400).json({
        success: false,
        message: "All fields and captcha are required",
      });
    }

    // Name validation
    const nameRegex = /^[A-Za-z]+( [A-Za-z]+)*$/;
    if (!nameRegex.test(name.trim())) {
      return res.status(400).json({
        success: false,
        message: "Invalid name format",
      });
    }

    // Email validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Message length
    if (message.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Message too short",
      });
    }

    // CAPTCHA verification (Google reCAPTCHA v2)
    const captchaVerify = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: captchaToken,
        },
      }
    );

    if (!captchaVerify.data.success) {
      return res.status(400).json({
        success: false,
        message: "Captcha verification failed",
      });
    }

    // Save message
    await Contact.create({
      name: name.trim(),
      email: email.toLowerCase(),
      message: message.trim(),
    });

    res.status(201).json({
      success: true,
      message: "Contact form submitted successfully",
    });
  } catch (error) {
    console.error("CONTACT ERROR 👉", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// GET - Fetch All Contact Queries
const getAllContactQueries = async (req, res) => {
  try {
    const queries = await Contact.find({}, { name: 1, email: 1, message: 1, createdAt: 1, _id: 1 })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      totalQueries: queries.length,
      queries: queries,
    });

  } catch (error) {
    console.error("GET ALL QUERIES ERROR ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { submitContactForm, getAllContactQueries };



