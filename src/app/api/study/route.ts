import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Fetch recent study sessions strictly for the logged-in user
export async function GET() {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await db.studySession.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 100,
      include: {
        subject: true,
        topic: true,
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Failed to fetch study sessions:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

// POST: Record a completed focus session attached to logged-in user
export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { durationMinutes, sessionType, notes, subjectId, topicId, date } = body;

    const sessionDate = date ? new Date(date) : new Date();

    const newSession = await db.studySession.create({
      data: {
        userId,
        durationMinutes: parseInt(durationMinutes) || 0,
        sessionType: sessionType || "NEW_LEARNING",
        notes: notes?.trim() || null,
        subjectId: subjectId || null,
        topicId: topicId || null,
        date: sessionDate,
      },
    });

    // Auto-create a revision task for this user if a topic is provided
    if (topicId) {
      const nextDue = new Date(sessionDate);
      nextDue.setDate(nextDue.getDate() + 3);

      await db.revisionTask.create({
        data: {
          userId,
          topicId,
          subjectId: subjectId || null,
          lastStudiedDate: sessionDate,
          nextDueDate: nextDue,
          intervalDays: 3,
          passCount: 1,
          source: "STUDY_LOG",
          notes: notes?.trim()
            ? `Auto-created from session: ${notes.trim()}`
            : "Auto-created from focus timer",
        },
      });
    }

    return NextResponse.json(newSession);
  } catch (error) {
    console.error("Failed to log study session:", error);
    return NextResponse.json({ error: "Failed to log session" }, { status: 500 });
  }
}

// DELETE: Delete a study session with ownership verification
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Session ID required" }, { status: 400 });

    const existing = await db.studySession.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Session not found or unauthorized" }, { status: 404 });
    }

    await db.studySession.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete study session:", error);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}