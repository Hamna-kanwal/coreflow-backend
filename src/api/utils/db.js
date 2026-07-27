const mongoose = require("mongoose");
const connectDB = async() =>{
try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Mongo Connected Successfully")
} catch (error) {
  console.log(error);
    const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // fail fast agar connect na ho
    });
    console.log("✅ Mongo Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1); // process ko crash karein taake hosting platform restart kare
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("⚠️ MongoDB connection error:", err.message);
});

module.exports = connectDB;
} 
}
module.exports = connectDB;