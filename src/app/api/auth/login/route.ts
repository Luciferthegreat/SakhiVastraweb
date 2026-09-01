import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function createAuthToken(userId: string) {
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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { email, password } = body;

    // Validate
    if (!email || !password) {
      return NextResponse.json(
        {
          error: "Email and password are required",
        },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase().trim(),
      },
    });

    // User not found
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        {
          error: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // Check password
    const passwordMatch = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatch) {
      return NextResponse.json(
        {
          error: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // Create secure authentication token
    const authToken = createAuthToken(user.id);

    // Save login session in cookie
    const cookieStore = await cookies();

    cookieStore.set("sakhi_auth", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      {
        error: "Something went wrong",
      },
      { status: 500 }
    );
  }
}