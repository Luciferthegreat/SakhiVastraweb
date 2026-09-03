import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/db";

export function createAuthToken(userId: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  const signature = crypto
    .createHmac("sha256", secret)
    .update(userId)
    .digest("hex");

  return `${userId}.${signature}`;
}

export function verifyAuthToken(token: string): string | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  const [userId, signature] = token.split(".");
  if (!userId || !signature) return null;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(userId)
    .digest("hex");

  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
    return isValid ? userId : null;
  } catch {
    return null;
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sakhi_auth")?.value;
    if (!token) return null;
    return verifyAuthToken(token);
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  });
}
