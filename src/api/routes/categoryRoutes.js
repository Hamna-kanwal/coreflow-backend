const express = require("express");
const router = express.Router();


const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = require("../controller/categoryController");

router.get("/categories",getCategories);
router.post("/categories/create",  createCategory);
router.put("/categories/update/:id", updateCategory);
router.delete("/categories/delete/:id", deleteCategory);

module.exports = router;