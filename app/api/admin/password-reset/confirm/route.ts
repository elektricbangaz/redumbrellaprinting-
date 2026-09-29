import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { token?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "This reset link is invalid or expired. Request a new one." }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[a-f0-9]{64}$/.test(token)) {
    return NextResponse.json({ message: "This reset link is invalid or expired. Request a new one." }, { status: 400 });
  }
  if (password.length < 16 || Buffer.byteLength(password, "utf8") > 72) {
    return NextResponse.json({ message: "Use a password of at least 16 characters and no more than 72 UTF-8 bytes." }, { status: 400 });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const passwordHash = await bcrypt.hash(password, 12);
  const result = await prisma.adminUser.updateMany({
    where: { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: { gt: new Date() } },
    data: {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      passwordResetRequestedAt: null,
    },
  });
  if (result.count !== 1) {
    return NextResponse.json({ message: "This reset link is invalid or expired. Request a new one." }, { status: 400 });
  }
  return NextResponse.json({ message: "Your password has been reset. You can now sign in." });
}