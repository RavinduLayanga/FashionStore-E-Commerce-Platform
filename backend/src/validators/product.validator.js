const { z } = require("zod");

const productIdentifierSchema = z.object({
  identifier: z.string().trim().min(1, "Identifier is required"),
});

const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
  category: z.string().trim().optional(),
  search: z.string().trim().optional(),
  color: z.string().trim().optional(),
  size: z.string().trim().optional(),
  sort: z
    .enum(["newest", "price_asc", "price_desc", "name_asc"])
    .default("newest"),
});

const variantInputSchema = z.object({
  sku: z.string().trim().min(3).max(50),
  color: z.string().trim().min(1).max(50),
  size: z.string().trim().min(1).max(20),
  price: z.coerce.number().positive("Price must be greater than zero"),
  stock: z.coerce.number().int().min(0, "Physical stock cannot be negative"),
});

const imageInputSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  altText: z.string().trim().optional(),
  isPrimary: z.boolean().default(false),
  displayOrder: z.coerce.number().int().default(0),
});

const createProductSchema = z
  .object({
    categoryId: z.string().uuid("Invalid category ID"),
    name: z.string().trim().min(2).max(150),
    description: z.string().trim().optional(),
    images: z
      .array(imageInputSchema)
      .min(1, "At least one product image is required"),
    variants: z
      .array(variantInputSchema)
      .min(1, "At least one variant is required"),
  })
  .refine(
    (data) => {
      if (!data || !Array.isArray(data.variants)) return true;
      const keys = data.variants.map(
        (v) => `${v?.color?.toLowerCase()}-${v?.size?.toLowerCase()}`,
      );
      return new Set(keys).size === keys.length;
    },
    {
      message: "Duplicate color and size combinations are not allowed",
      path: ["variants"],
    },
  )
  .refine(
    (data) => {
      if (!data || !Array.isArray(data.variants)) return true;
      const skus = data.variants.map((v) => v?.sku?.toLowerCase());
      return new Set(skus).size === skus.length;
    },
    { message: "Variant SKUs must be unique", path: ["variants"] },
  );

module.exports = {
  listProductsQuerySchema,
  createProductSchema,
  productIdentifierSchema,
};
