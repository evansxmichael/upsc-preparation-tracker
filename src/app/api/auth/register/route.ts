import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if account already exists
    const existing = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user directly with PENDING status (requires Admin approval)
    await db.user.create({
      data: {
        name: name?.trim() || cleanEmail.split("@")[0],
        email: cleanEmail,
        password: hashedPassword,
        role: "ASPIRANT",
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Registration submitted successfully! Your account is pending Admin approval.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}