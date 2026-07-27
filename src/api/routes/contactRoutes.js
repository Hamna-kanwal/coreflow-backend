const express = require("express");
const router = express.Router();
const { submitContactForm,getAllContactQueries } = require("../controller/contactController");

router.post("/contact", submitContactForm);
router.get("/contact/queries", getAllContactQueries);

module.exports = router;
