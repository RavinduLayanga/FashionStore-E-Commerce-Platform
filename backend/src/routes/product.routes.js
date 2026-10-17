const express = require("express");
const router = express.Router();

const productController = require("../controllers/product.controller");
const validate = require("../middleware/validate");
const { authenticate, requireAdmin } = require("../middleware/auth");
const verifyFrontendOrigin = require("../middleware/verifyOrigin");

const {
  listProductsQuerySchema,
  createProductSchema,
  productIdentifierSchema,
  updateProductSchema,
  updateVariantSchema,
} = require("../validators/product.validator");

// Public routes.
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

// Admin route: Create product.
router.post(
  "/",
  verifyFrontendOrigin,
  authenticate,
  requireAdmin,
  validate({ body: createProductSchema }),
  productController.createProduct,
);

// Admin route: Update variant stock, price, or status.
router.patch(
  "/variants/:variantId",
  verifyFrontendOrigin,
  authenticate,
  requireAdmin,
  validate({ body: updateVariantSchema }),
  productController.updateVariant,
);

// Admin route: Get full product including sold-out variants.
router.get(
  "/admin/:id",
  authenticate,
  requireAdmin,
  productController.getAdminProduct,
);

// Admin route: Update base product details or status.
router.patch(
  "/:id",
  verifyFrontendOrigin,
  authenticate,
  requireAdmin,
  validate({ body: updateProductSchema }),
  productController.updateProduct,
);

module.exports = router;
