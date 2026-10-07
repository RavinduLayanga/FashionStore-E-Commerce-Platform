const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const categoryRoutes = require("./category.routes");
const productRoutes = require("./product.routes");
const orderRoutes = require("./order.routes");

// Plug in all the routes
router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);

module.exports = router;
