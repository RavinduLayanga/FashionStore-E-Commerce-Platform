const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const validate = require("../middleware/validate");
const { authenticate, requireAdmin } = require("../middleware/auth");
const {
  listProductsQuerySchema,
  createProductSchema,
  productIdentifierSchema,
  updateProductSchema,
  updateVariantSchema,
} = require("../validators/product.validator");

// Public routes
router.get(
  "/",
  validate({ query: listProductsQuerySchema }),
  productController.listProducts,
);

router.get(
  "/:identifier",
  validate({ params: productIdentifierSchema }),
  productController.getProduct,
);

// Admin route: Create product
router.post(
  "/",
  authenticate,
  requireAdmin,
  validate({ body: createProductSchema }),
  productController.createProduct,
);

// Admin route: Update variant stock/price/status
router.patch(
  "/variants/:variantId",
  authenticate,
  requireAdmin,
  validate({ body: updateVariantSchema }),
  productController.updateVariant,
);

// Admin route: Update base product details/status
router.patch(
  "/:id",
  authenticate,
  requireAdmin,
  validate({ body: updateProductSchema }),
  productController.updateProduct,
);

module.exports = router;
