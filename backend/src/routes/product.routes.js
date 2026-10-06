const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const validate = require("../middleware/validate");
const {
  listProductsQuerySchema,
  createProductSchema,
  productIdentifierSchema,
} = require("../validators/product.validator");

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
router.post(
  "/",
  validate({ body: createProductSchema }),
  productController.createProduct,
);

module.exports = router;
