const prisma = require("../config/prisma");
const { slugify } = require("../utils/slugify");

/**
 * Calculates available stock for an array of variants according to the invariant:
 * Available Stock = Physical Stock - SUM(Active Non-Expired Reservations)
 */
function attachAvailableStock(variants) {
  const now = new Date();

  return variants.map((variant) => {
    const activeReserved = (variant.reservations || [])
      .filter((res) => res.status === "ACTIVE" && new Date(res.expiresAt) > now)
      .reduce((sum, res) => sum + res.quantity, 0);

    const availableStock = Math.max(0, variant.stock - activeReserved);

    // Omit both physical stock and raw internal reservation records from the public variant output
    const { stock, reservations, ...rest } = variant;

    return {
      ...rest,
      price: Number(rest.price),
      availableStock,
      isAvailable: availableStock > 0 && rest.isActive,
    };
  });
}

async function listProducts(query) {
  const pageNum = parseInt(query.page, 10) || 1;
  const limitNum = parseInt(query.limit, 10) || 12;
  const skip = (pageNum - 1) * limitNum;

  const { category, search, color, size, sort } = query;

  const where = {
    isActive: true,
  };

  if (category) {
    where.category = {
      OR: [{ slug: category }, { id: category }],
    };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (color || size) {
    where.variants = {
      some: {
        isActive: true,
        ...(color && { color: { equals: color, mode: "insensitive" } }),
        ...(size && { size: { equals: size, mode: "insensitive" } }),
      },
    };
  }

  let orderBy = { createdAt: "desc" };
  if (sort === "name_asc") {
    orderBy = { name: "asc" };
  }

  // Fetch ALL matching products to allow accurate in-memory price sorting
  const rawProducts = await prisma.product.findMany({
    where,
    orderBy,
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      images: {
        orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }],
      },
      variants: {
        where: { isActive: true },
        include: {
          reservations: {
            where: {
              status: "ACTIVE",
              expiresAt: { gt: new Date() },
            },
            select: { quantity: true, status: true, expiresAt: true },
          },
        },
      },
    },
  });

  let products = rawProducts.map((p) => {
    const variantsWithStock = attachAvailableStock(p.variants);
    const prices = variantsWithStock.map((v) => v.price);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    const totalAvailableStock = variantsWithStock.reduce(
      (sum, v) => sum + v.availableStock,
      0,
    );

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      category: p.category,
      primaryImage: p.images[0] || null,
      images: p.images,
      minPrice,
      maxPrice,
      totalAvailableStock,
      hasStock: totalAvailableStock > 0,
      variants: variantsWithStock,
    };
  });

  // Sort the full dataset first
  if (sort === "price_asc") {
    products.sort((a, b) => a.minPrice - b.minPrice);
  } else if (sort === "price_desc") {
    products.sort((a, b) => b.minPrice - a.minPrice);
  }

  const totalCount = products.length;

  // Paginate AFTER sorting
  const paginatedProducts = products.slice(skip, skip + limitNum);

  return {
    products: paginatedProducts,
    pagination: {
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
    },
  };
}

async function getProductBySlugOrId(identifier) {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier,
    );

  const product = await prisma.product.findFirst({
    where: {
      OR: isUuid
        ? [{ id: identifier }, { slug: identifier }]
        : [{ slug: identifier }],
      isActive: true,
    },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      images: {
        orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }],
      },
      variants: {
        where: { isActive: true },
        include: {
          reservations: {
            where: {
              status: "ACTIVE",
              expiresAt: { gt: new Date() },
            },
            select: { quantity: true, status: true, expiresAt: true },
          },
        },
      },
    },
  });

  if (!product) return null;

  const variantsWithStock = attachAvailableStock(product.variants);

  const prices = variantsWithStock.map((v) => v.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    category: product.category,
    images: product.images,
    variants: variantsWithStock,
    minPrice,
    maxPrice,
  };
}

async function createProductWithVariants(data) {
  let baseSlug = slugify(data.name);
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return prisma.$transaction(async (tx) => {
    return tx.product.create({
      data: {
        categoryId: data.categoryId,
        name: data.name,
        slug,
        description: data.description,
        images: {
          create: data.images.map((img) => ({
            url: img.url,
            altText: img.altText,
            isPrimary: img.isPrimary,
            displayOrder: img.displayOrder,
          })),
        },
        variants: {
          create: data.variants.map((v) => ({
            sku: v.sku,
            color: v.color,
            size: v.size,
            price: v.price,
            stock: v.stock,
          })),
        },
      },
      include: {
        images: true,
        variants: true,
      },
    });
  });
}

async function updateProduct(id, data) {
  return await prisma.$transaction(async (tx) => {
    const product = await tx.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        categoryId: data.categoryId,
      },
    });

    // If a new array of images is provided, replace the old ones entirely
    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      await tx.productImage.deleteMany({ where: { productId: id } });

      const imageRecords = data.images.map((img) => ({
        productId: id,
        url: img.url,
        isPrimary: img.isPrimary,
        displayOrder: img.displayOrder,
      }));

      await tx.productImage.createMany({ data: imageRecords });
    }
    return product;
  });
}

async function updateVariant(id, data) {
  return await prisma.productVariant.update({
    where: { id },
    data: {
      stock: data.stock,
      price: data.price,
      isActive: data.isActive,
    },
  });
}

async function getAdminProduct(id) {
  return await prisma.product.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }],
      },
      category: true,
      variants: true,
    },
  });
}

module.exports = {
  listProducts,
  getProductBySlugOrId,
  createProductWithVariants,
  updateProduct,
  updateVariant,
  getAdminProduct,
};
