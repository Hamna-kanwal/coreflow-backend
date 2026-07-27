const Training = require("../model/admintraining");
const Exercise = require("../model/mainexercise");
const SubExercise = require("../model/subexercises");
const UserTraining = require("../model/usertraining");
const User = require("../model/user"); // add this

const getUserTrainingSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch fresh user data to get updated level
    const user = await User.findById(userId).select("level");
    const userLevel = user?.level || "Not set";

    // Fetch all user trainings with populated training title
    const userTrainings = await UserTraining.find({ userId }).populate("trainingId", "title");

    const result = await Promise.all(
      userTrainings.map(async (ut) => {
        const training = ut.trainingId;
        if (!training) return null;

        // Fetch exercises for this training
        const exercises = await Exercise.find({ trainingId: training._id }).select("title");

        const exerciseData = await Promise.all(
          exercises.map(async (exercise) => {
            const subExerciseCount = await SubExercise.countDocuments({
              mainExerciseId: exercise._id,
            });

            return {
              exerciseName: exercise.title,
              subExerciseCount,
            };
          })
        );

        return {
          trainingName: training.title,
          exercises: exerciseData,
        };
      })
    );

    const filteredResult = result.filter((r) => r !== null);

    return res.status(200).json({
      success: true,
      userLevel, // ✅ now always shows updated level
      data: filteredResult,
    });
  } catch (error) {
    console.error("DASHBOARD API ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = { getUserTrainingSummary };
