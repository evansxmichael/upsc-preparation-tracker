import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Fetch all revision tasks strictly for the logged-in user
export async function GET() {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tasks = await db.revisionTask.findMany({
      where: { userId },
      orderBy: { nextDueDate: "asc" },
      include: {
        subject: true,
        topic: true,
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Failed to fetch revision tasks:", error);
    return NextResponse.json({ error: "Failed to fetch revisions" }, { status: 500 });
  }
}

// POST: Add new manual revision task tied to the logged-in user
export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subjectId, topicId, intervalDays, lastStudiedDate, nextDueDate, notes } = body;

    const task = await db.revisionTask.create({
      data: {
        userId,
        subjectId: subjectId || null,
        topicId: topicId || null,
        intervalDays: parseInt(intervalDays) || 3,
        lastStudiedDate: lastStudiedDate ? new Date(lastStudiedDate) : new Date(),
        nextDueDate: nextDueDate ? new Date(nextDueDate) : new Date(),
        passCount: 1,
        isCompleted: false,
        notes: notes?.trim() || null,
        source: "MANUAL",
      },
      include: { subject: true, topic: true },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Failed to create revision task:", error);
    return NextResponse.json({ error: "Failed to create revision" }, { status: 500 });
  }
}

// PATCH: Handle Mark Revised, Complete, or Direct Date Edits with ownership check
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, action, lastStudiedDate, nextDueDate, intervalDays } = body;

    const current = await db.revisionTask.findFirst({
      where: { id, userId },
    });

    if (!current) {
      return NextResponse.json({ error: "Revision task not found or unauthorized" }, { status: 404 });
    }

    if (action === "COMPLETE") {
      const updated = await db.revisionTask.update({
        where: { id },
        data: {
          isCompleted: true,
          completedAt: new Date(),
        },
        include: { subject: true, topic: true },
      });
      return NextResponse.json(updated);
    }

    if (action === "REOPEN") {
      const updated = await db.revisionTask.update({
        where: { id },
        data: {
          isCompleted: false,
          completedAt: null,
        },
        include: { subject: true, topic: true },
      });
      return NextResponse.json(updated);
    }

    if (action === "MARK_REVISED") {
      const currentInterval = current.intervalDays || 3;
      const today = new Date();
      const newNextDue = new Date();
      newNextDue.setDate(today.getDate() + currentInterval);

      const updated = await db.revisionTask.update({
        where: { id },
        data: {
          lastStudiedDate: today,
          nextDueDate: newNextDue,
          passCount: { increment: 1 },
        },
        include: { subject: true, topic: true },
      });
      return NextResponse.json(updated);
    }

    if (action === "UPDATE_DATES") {
      const updated = await db.revisionTask.update({
        where: { id },
        data: {
          lastStudiedDate: new Date(lastStudiedDate),
          nextDueDate: new Date(nextDueDate),
          intervalDays: parseInt(intervalDays) || 1,
        },
        include: { subject: true, topic: true },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Failed to update revision task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE: Delete a revision task with ownership verification
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const existing = await db.revisionTask.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Revision task not found or unauthorized" }, { status: 404 });
    }

    await db.revisionTask.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}