import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: List all registered aspirants for Admin review
export async function GET() {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (!session || userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            studySessions: true,
            mockTests: true,
            dailyTasks: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// PATCH: Approve or Reject an Aspirant
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (!session || userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId, status, role } = await req.json();

    const updated = await db.user.update({
      where: { id: userId },
      data: {
        ...(status && { status }),
        ...(role && { role }),
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user status" }, { status: 500 });
  }
}

// DELETE: Remove an aspirant account & all their data
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (!session || userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    await db.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}