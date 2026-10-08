const productService = require("../services/product.service");

async function listProducts(req, res, next) {
  try {
    const result = await productService.listProducts(req.validatedQuery);
    res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

async function getProduct(req, res, next) {
  try {
    const { identifier } = req.validatedParams;
    const product = await productService.getProductBySlugOrId(identifier);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
        code: "NOT_FOUND",
      });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const product = await productService.createProductWithVariants(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}
async function updateProduct(req, res, next) {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

async function updateVariant(req, res, next) {
  try {
    const variant = await productService.updateVariant(
      req.params.variantId,
      req.body,
    );
    res.status(200).json({ success: true, data: variant });
  } catch (error) {
    next(error);
  }
}
async function getAdminProduct(req, res, next) {
  try {
    const product = await productService.getAdminProduct(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  updateVariant,
  getAdminProduct,
};
