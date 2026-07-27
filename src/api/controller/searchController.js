const Training = require("../model/admintraining");
const Exercise = require("../model/mainexercise");
const SubExercise = require("../model/subexercises");

const searchExercises = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ message: "Query is required" });

    const mainMatches = await Exercise.find({
      title: { $regex: query, $options: "i" }
    });

    const subMatches = await SubExercise.find({
      title: { $regex: query, $options: "i" }
    });

    const trainingMatches = await Training.find({
      title: { $regex: query, $options: "i" }
    });

    // Prepare dynamic response
    const response = {};
    if (mainMatches.length > 0) response.mainExercises = mainMatches;
    if (subMatches.length > 0) response.subExercises = subMatches;
    if (trainingMatches.length > 0) response.trainings = trainingMatches;

    // Agar koi bhi match nahi mila
    if (Object.keys(response).length === 0) {
      return res.status(404).json({ message: "No results found" });
    }

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { searchExercises };
