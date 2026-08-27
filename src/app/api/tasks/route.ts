import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const DEFAULT_TEMPLATES = [
  { text: "Core GS Slot 1: Static Syllabus & Standard Notes", hours: "2.5h" },
  { text: "Daily Editorial Analysis & The Hindu/Indian Express Notes", hours: "1.0h" },
  { text: "CSAT / PYQ Practice Session (25 Questions)", hours: "1.0h" },
  { text: "Mains 2 Question Answer Writing & Structure Review", hours: "0.5h" },
  { text: "Spaced Revision Passes & Daily Journal Entry", hours: "1.0h" },
];

// GET: Fetch tasks strictly for the logged-in user by date or date range
export async function GET(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date"); // YYYY-MM-DD
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Range Query (For History Tab)
    if (startDateParam || endDateParam) {
      const gte = startDateParam ? new Date(startDateParam) : undefined;
      const lte = endDateParam
        ? new Date(new Date(endDateParam).setHours(23, 59, 59, 999))
        : undefined;

      const tasks = await db.dailyTask.findMany({
        where: {
          userId,
          date: {
            ...(gte && { gte }),
            ...(lte && { lte }),
          },
        },
        orderBy: { date: "desc" },
      });
      return NextResponse.json(tasks);
    }

    // Single Day Query (For Today's Execution)
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    let tasks = await db.dailyTask.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Auto-seed default task blueprint if this user has no tasks for the date
    if (tasks.length === 0) {
      await db.dailyTask.createMany({
        data: DEFAULT_TEMPLATES.map((t) => ({
          userId,
          text: t.text,
          hours: t.hours,
          date: startOfDay,
          completed: false,
        })),
      });

      tasks = await db.dailyTask.findMany({
        where: {
          userId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        orderBy: { createdAt: "asc" },
      });
    }

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Failed to fetch daily tasks:", error);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

// POST: Add a new custom task or toggle completion with user isolation
export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, id, text, hours, completed, date } = body;

    // Toggle Task Status with ownership validation
    if (action === "TOGGLE" && id) {
      const existing = await db.dailyTask.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        return NextResponse.json({ error: "Task not found or unauthorized" }, { status: 404 });
      }

      const updated = await db.dailyTask.update({
        where: { id },
        data: { completed: Boolean(completed) },
      });
      return NextResponse.json(updated);
    }

    // Add New Task for logged-in user
    if (!text?.trim()) {
      return NextResponse.json({ error: "Text required" }, { status: 400 });
    }

    const taskDate = date ? new Date(date) : new Date();
    const newTask = await db.dailyTask.create({
      data: {
        userId,
        text: text.trim(),
        hours: hours?.trim() || "1.0h",
        date: taskDate,
        completed: false,
      },
    });

    return NextResponse.json(newTask);
  } catch (error) {
    console.error("Failed to update daily task:", error);
    return NextResponse.json({ error: "Failed to save task" }, { status: 500 });
  }
}

// DELETE: Delete a task with ownership validation
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

    const existing = await db.dailyTask.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found or unauthorized" }, { status: 404 });
    }

    await db.dailyTask.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}