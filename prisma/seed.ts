import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PRODUCTS = [
  {
    name: "Standard T-Shirt",
    slug: "standard-t-shirt",
    category: "Apparel",
    description: "100% cotton, classic fit crew neck tee.",
    basePrice: 180000, // JMD $1,800.00 stored in cents
    colors: ["White", "Black", "Grey", "Navy", "Red", "Sand"],
    sizes: ["S", "M", "L", "XL", "2XL"],
    images: ["/hero-shirt.svg"],
  },
  {
    name: "Pullover Hoodie",
    slug: "pullover-hoodie",
    category: "Apparel",
    description: "Heavyweight fleece hoodie with front pocket.",
    basePrice: 350000,
    colors: ["White", "Black", "Grey", "Navy"],
    sizes: ["S", "M", "L", "XL", "2XL"],
    images: ["/designer-shirt.svg"],
  },
  {
    name: "Trucker Cap",
    slug: "trucker-cap",
    category: "Apparel",
    description: "Structured 5-panel cap with mesh back.",
    basePrice: 160000,
    colors: ["White", "Black", "Red"],
    sizes: ["One Size"],
    images: ["/apparel.svg"],
  },
];

async function main() {
  for (const p of PRODUCTS) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }

  const adminEmail = "admin@redumbrellaprinting.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 16) {
    throw new Error("Set SEED_ADMIN_PASSWORD to a unique password of at least 16 characters before seeding.");
  }
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      email: adminEmail,
      name: "Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Seeded products and admin user.");
  console.log(`Admin login: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
