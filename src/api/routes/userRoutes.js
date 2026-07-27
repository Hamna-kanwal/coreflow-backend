const express = require("express");
const {
  register,
  userLogin,
  logout,
  updatePersonalInfo,
  UpdateProfile,
  getAllUsers,
  deleteUser,
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
} = require("../controller/userController");

const { isAuthenticated, verifyAdmin } = require("../middleware/isAuthenticated");

const router = express.Router();

/* ================= AUTH ROUTES ================= */
router.post("/register", register);
router.get("/verify-email/:token", verifyEmail);
router.post("/login", userLogin);
router.get("/logout", logout);

/* ================= PROFILE ROUTES ================= */
router.post("/profile/updatePersonalInfo", isAuthenticated, updatePersonalInfo);
router.get("/profile/updatePersonalInfo", isAuthenticated, updatePersonalInfo);
router.post("/profile/update", isAuthenticated, UpdateProfile);

/* ================= USER MANAGEMENT ================= */
router.get("/getUsers", isAuthenticated, getAllUsers); // any authenticated user
router.get("/getAllUsers", isAuthenticated, verifyAdmin, getAllUsers); // only admin
router.delete("/delete/:id", isAuthenticated, verifyAdmin, deleteUser);
router.delete("/delete-users", isAuthenticated, deleteUserAccount);
router.get("/trainings/exercises/count", isAuthenticated, verifyAdmin, getExercisesWithSubCount);
router.post("/select-user-level", isAuthenticated, selectUserLevel);


router.get("/total", isAuthenticated, verifyAdmin, getTotalUsers);
router.get("/payment-status", isAuthenticated, checkUserPaymentStatus);
router.post("/update-video-count", isAuthenticated, incrementVideoCount);
// Payment intent create karne ke liye
router.post("/create-payment-intent", isAuthenticated, createPaymentIntent);

// Payment verify karne ke liye
router.post("/verify-mobile-payment", isAuthenticated, verifyMobilePayment);
router.get("/admin/all-payments", isAuthenticated, verifyAdmin, getPaymentHistory);
router.put("/user/change-password", isAuthenticated, changePassword); 
router.post("/profile/updatePersonalInfo", isAuthenticated, updatePersonalInfo);
router.put("/upload-profile-image", isAuthenticated, uploadProfileImage);
router.get("/download/:id", isAuthenticated, getSecureDownloadLink);
router.post("/resend-verification", resendVerificationEmail);
module.exports = router;
