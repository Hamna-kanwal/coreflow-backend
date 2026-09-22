require("dotenv").config();
const mongoose = require("mongoose");
const SubExercise = require("./src/api/model/subexercises"); // Agar model 'src/api/model' folder mein hai

const migrateAudioField = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    // 2. Sirf un documents ko update karo jahan isMuted field abhi missing hai
    const result = await SubExercise.updateMany(
      { isMuted: { $exists: false } },
      { $set: { isMuted: false } }
    );

    console.log(`✔ Updated ${result.modifiedCount} document(s) — isMuted field added with default false`);

    if (result.modifiedCount === 0) {
      console.log("Koi bhi document update nahi hua — ho sakta hai sab mein pehle se field maujood ho.");
    }

    console.log("🎉 Migration complete!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

// Run the migration script
migrateAudioField();