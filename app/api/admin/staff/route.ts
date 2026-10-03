import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailNotification } from "@/lib/notifications";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  jobTitle: z.string().trim().max(120).optional(),
  hourlyRateJmd: z.number().min(0).max(1000000).default(0),
  role: z.enum(["ADMIN", "STAFF"]).default("STAFF"),
});

function adminBase() {
  return process.env.ADMIN_APP_URL || process.env.AUTH_URL || process.env.NEXTAUTH_URL || "https://admin.redumbrellaprinting.com";
}

export async function POST(req: Request) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Complete the staff profile." }, { status: 400 });
  const input = parsed.data;
  const existing = await prisma.adminUser.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) return NextResponse.json({ error: "A staff account already exists for this email." }, { status: 409 });

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const placeholderPassword = randomBytes(32).toString("hex");
  const passwordHash = await bcrypt.hash(placeholderPassword, 12);
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

  const person = await prisma.adminUser.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role,
      jobTitle: input.jobTitle || null,
      hourlyRate: Math.round(input.hourlyRateJmd * 100),
      active: true,
      invitedAt: new Date(),
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: expiresAt,
      passwordResetRequestedAt: new Date(),
    },
  });

  const resetUrl = `${adminBase().replace(/\/$/, "")}/reset-password?token=${rawToken}`;
  await sendEmailNotification({
    event: "STAFF_INVITED",
    entityType: "AdminUser",
    entityId: person.id,
    to: person.email,
    subject: "Your Red Umbrella Printing staff account",
    message: `Hello ${person.name},\n\nYou have been added to Red Umbrella Printing's production portal as ${person.jobTitle || person.role.toLowerCase()}. Set your password using this secure link: ${resetUrl}\n\nThe link expires in 72 hours.`,
  });

  return NextResponse.json({ ok: true, id: person.id });
}
