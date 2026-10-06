const prisma = require("../config/prisma");
const { slugify } = require("../utils/slugify");

async function getAllCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          products: {
            where: { isActive: true },
          },
        },
      },
    },
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    productCount: cat._count.products,
  }));
}

async function createCategory(data) {
  let baseSlug = slugify(data.name);
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return prisma.category.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
    },
  });
}

module.exports = {
  getAllCategories,
  createCategory,
};
