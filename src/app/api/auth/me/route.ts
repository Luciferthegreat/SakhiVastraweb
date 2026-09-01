import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function verifyAuthToken(token: string) {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  const [userId, signature] = token.split(".");

  if (!userId || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(userId)
    .digest("hex");

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!isValid) {
    return null;
  }

  return userId;
}

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("sakhi_auth")?.value;

    if (!token) {
      return NextResponse.json(
        {
          user: null,
        },
        { status: 401 }
      );
    }

    const userId = verifyAuthToken(token);

    if (!userId) {
      return NextResponse.json(
        {
          user: null,
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          user: null,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user,
    });
  } catch (error) {
    console.error("AUTH ME ERROR:", error);

    return NextResponse.json(
      {
        error: "Something went wrong",
      },
      { status: 500 }
    );
  }
}