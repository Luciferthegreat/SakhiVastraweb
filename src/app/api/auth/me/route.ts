import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyAuthToken } from "@/lib/auth";


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