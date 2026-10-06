const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");
const validate = require("../middleware/validate");
const { createCategorySchema } = require("../validators/category.validator");

router.get("/", categoryController.getCategories);
router.post(
  "/",
  validate({ body: createCategorySchema }),
  categoryController.createCategory,
);

module.exports = router;
