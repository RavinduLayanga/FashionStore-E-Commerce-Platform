const categoryService = require("../services/category.service");

async function getCategories(req, res, next) {
  try {
    const data = await categoryService.getAllCategories();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function createCategory(req, res, next) {
  try {
    const data = await categoryService.createCategory(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCategories,
  createCategory,
};
