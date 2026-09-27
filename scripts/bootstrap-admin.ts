import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existingAdmins = await prisma.adminUser.count({ where: { role: "ADMIN" } });
  if (existingAdmins > 0) {
    console.log("An admin account already exists; bootstrap skipped.");
    return;
  }

  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!email || !/^\S+@\S+\.\S+$/.test(email) || !password || password.length < 16) {
    throw new Error(
      "First admin not configured. Set ADMIN_BOOTSTRAP_EMAIL and a unique ADMIN_BOOTSTRAP_PASSWORD of at least 16 characters in the Production environment."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.adminUser.upsert({
    where: { email },
    create: { email, name: "Admin", passwordHash, role: "ADMIN" },
    update: { passwordHash, role: "ADMIN" },
  });
  console.log(`First admin account created for ${email}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
