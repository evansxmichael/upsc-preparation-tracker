import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Fetch study plan phases strictly for the logged-in user
export async function GET() {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const phases = await db.planPhase.findMany({
      where: { userId },
      orderBy: { orderIndex: "asc" },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(phases);
  } catch (error) {
    console.error("Failed to fetch plan phases:", error);
    return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 });
  }
}

// POST: Batch update study plan phases scoped exclusively to this user
export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { phases } = body;

    if (!Array.isArray(phases)) {
      return NextResponse.json({ error: "Phases must be an array" }, { status: 400 });
    }

    // Execute within a transaction: delete only THIS user's previous phases and recreate
    await db.$transaction(async (tx) => {
      await tx.planPhase.deleteMany({
        where: { userId },
      });

      if (phases.length > 0) {
        await tx.planPhase.createMany({
          data: phases.map((p: any, i: number) => ({
            userId,
            name: p.name?.trim() || `Phase ${i + 1}`,
            weeks: Math.max(1, parseInt(p.weeks, 10) || 2),
            startDate: p.startDate && !isNaN(Date.parse(p.startDate)) ? new Date(p.startDate) : null,
            endDate: p.endDate && !isNaN(Date.parse(p.endDate)) ? new Date(p.endDate) : null,
            status: ["UPCOMING", "IN_PROGRESS", "COMPLETED"].includes(p.status)
              ? p.status
              : "UPCOMING",
            allocatedHoursPerDay: Math.max(0.5, parseFloat(p.allocatedHoursPerDay) || 4.0),
            // Prevents foreign key constraint crashes on empty string dropdown selections
            subjectId: p.subjectId && p.subjectId.trim() !== "" ? p.subjectId : null,
            orderIndex: i,
          })),
        });
      }
    });

    const updatedPhases = await db.planPhase.findMany({
      where: { userId },
      orderBy: { orderIndex: "asc" },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedPhases);
  } catch (error) {
    console.error("Failed to save plan phases:", error);
    return NextResponse.json({ error: "Failed to save plan" }, { status: 500 });
  }
}