import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FROM_EMAIL, getResendClient } from "@/lib/resend";

export const runtime = "nodejs";

const genericMessage = "If an admin account exists for that email, a password reset link will be sent shortly.";

export async function POST(request: Request) {
  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
  }

  const resend = getResendClient();
  if (!resend) {
    return NextResponse.json({ message: "Password reset email is temporarily unavailable. Please contact the site administrator." }, { status: 503 });
  }

  const response = NextResponse.json({ message: genericMessage });
  const user = await prisma.adminUser.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (!user) return response;

  const now = new Date();
  if (user.passwordResetRequestedAt && now.getTime() - user.passwordResetRequestedAt.getTime() < 60_000) {
    return response;
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: expiresAt, passwordResetRequestedAt: now },
  });

  const appUrl = process.env.ADMIN_APP_URL || process.env.AUTH_URL || process.env.NEXTAUTH_URL || new URL(request.url).origin;
  const resetUrl = new URL(`/reset-password?token=${rawToken}`, appUrl).toString();
  const safeName = user.name.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: user.email,
    subject: "Reset your Red Umbrella Printing admin password",
    text: `Hello ${user.name},\n\nUse this link to set a new admin password. It expires in 30 minutes and can only be used once:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>Hello ${safeName},</p><p>Use the link below to set a new admin password. It expires in 30 minutes and can only be used once.</p><p><a href="${resetUrl}">Reset admin password</a></p><p>If you did not request this, you can ignore this email.</p>`,
  });
  if (error) {
    console.error("Admin password reset email failed:", error.message);
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { passwordResetTokenHash: null, passwordResetExpiresAt: null, passwordResetRequestedAt: null },
    });
    return NextResponse.json({ message: "Password reset email could not be sent. Please try again later." }, { status: 502 });
  }
  return response;
}