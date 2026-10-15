// backend/prisma/seed-bulk.js
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const prisma = new PrismaClient();

async function main() {
  if (
    process.env.NODE_ENV === "production" &&
    !process.argv.includes("--force")
  ) {
    console.error(
      "Refusing to drop production data. Run with --force to override.",
    );
    process.exit(1);
  }

  console.log("Reading CSV data...");
  const csvFilePath = path.join(__dirname, "demo-invntory-Sheet1.csv");
  const csvData = fs.readFileSync(csvFilePath, "utf-8");

  // Basic CSV parsing
  const rows = csvData.split("\n").filter((row) => row.trim().length > 0);
  const headers = rows.shift().split(",");

  const items = rows.map((row) => {
    // Split by comma, handling potential quotes if necessary
    const cols = row.split(",");
    return {
      category: cols[0]?.trim() || "men",
      type: cols[1]?.trim() || "tshirt",
      mainLink: cols[2]?.trim(),
      variant1: cols[3]?.trim(),
      variant2: cols[4]?.trim(),
    };
  });

  console.log("Clearing existing products...");
  await prisma.inventoryReservation.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();

  // Fetch categories to link products to
  let menCategory = await prisma.category.findUnique({
    where: { slug: "men" },
  });
  let womenCategory = await prisma.category.findUnique({
    where: { slug: "women" },
  });

  if (!menCategory) {
    menCategory = await prisma.category.create({
      data: { name: "Men", slug: "men" },
    });
  }
  if (!womenCategory) {
    womenCategory = await prisma.category.create({
      data: { name: "Women", slug: "women" },
    });
  }

  console.log(`Found ${items.length} base items in CSV. Multiplying by 5...`);

  let totalCreated = 0;

  for (let batch = 1; batch <= 5; batch++) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.mainLink) continue;

      const catId = item.category.toLowerCase().includes("women")
        ? womenCategory.id
        : menCategory.id;
      const typeName = item.type.charAt(0).toUpperCase() + item.type.slice(1);
      const baseName = `Classic ${typeName} Model ${i + 1}`;
      const productName =
        batch === 1 ? baseName : `${baseName} (Batch ${batch})`;

      // Create safe unique slug
      const slug = `${baseName.toLowerCase().replace(/\s+/g, "-")}-b${batch}-id${Date.now() + i}`;

      const images = [
        {
          url: item.mainLink,
          altText: `${productName} Front`,
          isPrimary: true,
          displayOrder: 1,
        },
      ];
      if (item.variant1)
        images.push({
          url: item.variant1,
          altText: `${productName} Side`,
          isPrimary: false,
          displayOrder: 2,
        });
      if (item.variant2)
        images.push({
          url: item.variant2,
          altText: `${productName} Detail`,
          isPrimary: false,
          displayOrder: 3,
        });

      await prisma.product.create({
        data: {
          name: productName,
          slug: slug,
          description: `Premium quality ${item.type} from our latest collection.`,
          categoryId: catId,
          images: { create: images },
          variants: {
            create: [
              {
                sku: `SKU-B${batch}-${i}-S`,
                color: "Standard",
                size: "S",
                price: 3500.0,
                stock: 15,
              },
              {
                sku: `SKU-B${batch}-${i}-M`,
                color: "Standard",
                size: "M",
                price: 3500.0,
                stock: 20,
              },
              {
                sku: `SKU-B${batch}-${i}-L`,
                color: "Standard",
                size: "L",
                price: 3500.0,
                stock: 10,
              },
            ],
          },
        },
      });
      totalCreated++;
    }
  }

  console.log(
    `\nSuccess! Generated ${totalCreated} products with multiple variants and images.`,
  );
}

main()
  .catch((e) => {
    console.error("Bulk seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
