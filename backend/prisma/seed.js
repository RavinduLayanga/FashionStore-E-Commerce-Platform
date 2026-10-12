const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
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
  console.log("Clearing existing records...");
  await prisma.payment.deleteMany();
  await prisma.inventoryReservation.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL;
  const adminName = process.env.ADMIN_DEFAULT_NAME;
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD;

  if (!adminEmail || !adminName || !adminPassword) {
    throw new Error(
      "ADMIN_DEFAULT_EMAIL, ADMIN_DEFAULT_NAME and ADMIN_DEFAULT_PASSWORD are required in the .env file",
    );
  }

  console.log(`Seeding Admin user (${adminEmail})...`);
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);

  await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      name: adminName,
      role: "ADMIN",
    },
  });

  console.log("Seeding initial categories...");
  const menCategory = await prisma.category.create({
    data: {
      name: "Men",
      slug: "men",
      description: "Men clothing and urban streetwear",
    },
  });

  const womenCategory = await prisma.category.create({
    data: {
      name: "Women",
      slug: "women",
      description: "Women everyday wear and essentials",
    },
  });

  console.log("Seeding sample products with variants...");
  await prisma.product.create({
    data: {
      name: "Oversized Heavyweight T-Shirt",
      slug: "oversized-heavyweight-t-shirt",
      description:
        "Premium 240GSM cotton oversized streetwear drop-shoulder tee.",
      categoryId: menCategory.id,
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80",
            altText: "Black Oversized T-Shirt Front View",
            isPrimary: true,
            displayOrder: 1,
          },
          {
            url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
            altText: "Black Oversized T-Shirt Detail",
            isPrimary: false,
            displayOrder: 2,
          },
        ],
      },
      variants: {
        create: [
          {
            sku: "TSH-BLK-S",
            color: "Black",
            size: "S",
            price: 3500.0,
            stock: 15,
          },
          {
            sku: "TSH-BLK-M",
            color: "Black",
            size: "M",
            price: 3500.0,
            stock: 25,
          },
          {
            sku: "TSH-BLK-L",
            color: "Black",
            size: "L",
            price: 3500.0,
            stock: 10,
          },
          {
            sku: "TSH-WHT-S",
            color: "White",
            size: "S",
            price: 3500.0,
            stock: 12,
          },
          {
            sku: "TSH-WHT-M",
            color: "White",
            size: "M",
            price: 3500.0,
            stock: 20,
          },
          {
            sku: "TSH-WHT-L",
            color: "White",
            size: "L",
            price: 3500.0,
            stock: 8,
          },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "Relaxed Fit Linen Shirt",
      slug: "relaxed-fit-linen-shirt",
      description:
        "Breathable pure linen button-down shirt designed for warm climates.",
      categoryId: menCategory.id,
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80",
            altText: "Relaxed Fit Linen Shirt Sand",
            isPrimary: true,
            displayOrder: 1,
          },
        ],
      },
      variants: {
        create: [
          {
            sku: "LNN-SND-M",
            color: "Sand",
            size: "M",
            price: 5800.0,
            stock: 10,
          },
          {
            sku: "LNN-SND-L",
            color: "Sand",
            size: "L",
            price: 5800.0,
            stock: 14,
          },
          {
            sku: "LNN-NAV-M",
            color: "Navy",
            size: "M",
            price: 5800.0,
            stock: 8,
          },
          {
            sku: "LNN-NAV-L",
            color: "Navy",
            size: "L",
            price: 5800.0,
            stock: 12,
          },
        ],
      },
    },
  });

  console.log("Seed executed successfully.");
}

main()
  .catch((e) => {
    console.error("Seed execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
