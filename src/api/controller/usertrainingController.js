const UserTraining = require("../model/usertraining");
const Training = require("../model/admintraining");
const SubExercise = require("../model/subexercises");
const Exercise = require("../model/mainexercise"); // Path check kar lein
const mongoose = require("mongoose");
const User = require("../model/user");
const jwt = require("jsonwebtoken");
const selectTraining = async (req, res) => {
  try {
    const userId = req.user.id;
    // Yahan hum trainingId ki bajaye trainingIds (array) expect kar rahe hain
    const { trainingIds, level, mainExerciseId, isContentOnly } = req.body;

    // Check karein ke trainingIds array maujood hai aur khali nahi hai
    if (!trainingIds || !Array.isArray(trainingIds) || trainingIds.length === 0) {
      return res.status(400).json({ message: "Training IDs array required", success: false });
    }

    let updatedUserToken = null;
    const savedSelections = [];

    // Har training ID ke liye loop chalayein
    for (const trainingId of trainingIds) {
      // 1. Admin Training ka base record fetch karein
      const adminTraining = await Training.findById(trainingId);
      if (!adminTraining) {
        continue; // Agar koi training na mile toh skip kardein ya error de dein
      }

      let selection = await UserTraining.findOne({ userId, trainingId });

      if (selection) {
        selection.level = level || selection.level;
        if (mainExerciseId) selection.mainExerciseId = mainExerciseId;
        selection.isContentOnly = (isContentOnly !== undefined) ? isContentOnly : adminTraining.isContentOnly;

        await selection.save();
      } else {
        selection = await UserTraining.create({
          userId,
          trainingId,
          level: level || "Beginner",
          mainExerciseId,
          isContentOnly: (isContentOnly !== undefined) ? isContentOnly : adminTraining.isContentOnly
        });
      }
      savedSelections.push(selection);
    }

    // Update main User.level from the saved selections
    try {
      const newLevel = level || null;
      if (newLevel) {
        await User.findByIdAndUpdate(userId, { level: newLevel });

        const userDoc = await User.findById(userId).select("is_admin level");
        const secretKey = process.env.SECRET_KEY?.trim();
        if (secretKey && userDoc) {
          updatedUserToken = jwt.sign(
            { userId: userDoc._id, is_admin: userDoc.is_admin, level: userDoc.level },
            secretKey,
            { expiresIn: "1d" }
          );
        }
      }
    } catch (err) {
      console.error("Warning: could not update User.level after selectTraining:", err.message);
    }

    const responsePayload = {
      message: "Trainings selected successfully ✅",
      success: true,
      selections: savedSelections
    };

    if (updatedUserToken) responsePayload.token = updatedUserToken;

    return res.status(200).json(responsePayload);

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};
const getMyTraining = async (req, res) => {
  try {
    const userId = req.user.id;
    const userTrainings = await UserTraining.find({ userId });

    if (!userTrainings || userTrainings.length === 0) {
      return res.status(404).json({ success: false, message: "No training found for this user" });
    }

    const data = await Promise.all(
      userTrainings.map(async (userTraining) => {
        const trainingDetails = await Training.findById(userTraining.trainingId);
        if (!trainingDetails) return null;

        const exerciseCount = await Exercise.countDocuments({ trainingId: userTraining.trainingId });
        const hasMainExercises = exerciseCount > 0;

        const subExerciseCount = userTraining.mainExerciseId 
            ? await SubExercise.countDocuments({ mainExerciseId: userTraining.mainExerciseId })
            : 0;

        // Yahan logic change kiya hai: 
        // Agar userTraining mein value nahi hai, toh AdminTraining wali value uthao
        const isContentOnlyValue = (userTraining.isContentOnly !== undefined && userTraining.isContentOnly !== null) 
                                   ? userTraining.isContentOnly 
                                   : trainingDetails.isContentOnly;

        return {
          selectedLevel: userTraining.level,
          hasMainExercises,
          isContentOnly: isContentOnlyValue, 
          trainingDetails: {
            id: trainingDetails._id,
            title: trainingDetails.title,
            image: trainingDetails.trainingImage,
            totalSubExercises: subExerciseCount 
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      data: data.filter(item => item !== null)
    });

  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
};

// 3. UPDATE USER SELECTION (Level change karne ke liye)
const updateSelection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { level } = req.body;

    const selection = await UserTraining.findOneAndUpdate(
      { userId },
      { level },
      { new: true }
    );

    if (!selection) return res.status(404).json({ message: "Selection not found", success: false });

    res.status(200).json({ message: "Level updated successfully", success: true, selection });
  } catch (err) {
    res.status(500).json({ message: "Server error", success: false });
  }
};

// 4. DELETE USER SELECTION (Training remove karne ke liye)
const deleteSelection = async (req, res) => {
  try {
    const userId = req.user.id;
    const deleted = await UserTraining.findOneAndDelete({ userId });

    if (!deleted) return res.status(404).json({ message: "No selection to delete", success: false });

    res.status(200).json({ message: "Training removed successfully", success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error", success: false });
  }
};

// 5. GET ALL SELECTIONS (Admin Only)
const getAllSelections = async (req, res) => {
  try {
    const selections = await UserTraining.find()
      .populate("userId", "fullname email")
      .populate("trainingId", "title");
    res.status(200).json({ success: true, selections });
  } catch (err) {
    res.status(500).json({ message: "Server error", success: false });
  }
};

// 6. GET SPECIFIC USER SELECTIONS
const getUserSelections = async (req, res) => {
  try {
    const userId = req.query.userId || req.user.id;
    const selections = await UserTraining.find({ userId })
      .populate("trainingId", "title");
    res.status(200).json({ success: true, selections });
  } catch (err) {
    res.status(500).json({ message: "Server error", success: false });
  }
};

// IMPORTANT: Exports lazmi check karein
module.exports = {
  selectTraining,
  getMyTraining,
  updateSelection,
  deleteSelection,
  getAllSelections,
  getUserSelections
};