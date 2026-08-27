import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Fetch system default syllabus + logged-in user's custom topics & progress
export async function GET() {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [categories, userProgress] = await Promise.all([
      db.syllabusCategory.findMany({
        orderBy: { orderIndex: "asc" },
        include: {
          subjects: {
            where: {
              OR: [{ userId: null }, { userId }],
            },
            orderBy: { orderIndex: "asc" },
            include: {
              topics: {
                where: {
                  OR: [{ userId: null }, { userId }],
                },
                orderBy: { orderIndex: "asc" },
              },
            },
          },
        },
      }),
      db.userTopicProgress.findMany({
        where: { userId, completed: true },
        select: { topicId: true },
      }),
    ]);

    const completedTopicIds = new Set(userProgress.map((p) => p.topicId));

    // Attach per-user completed status dynamically to each topic
    const userSyllabus = categories.map((cat) => ({
      ...cat,
      subjects: cat.subjects.map((sub) => ({
        ...sub,
        topics: sub.topics.map((top) => ({
          ...top,
          completed: completedTopicIds.has(top.id),
        })),
      })),
    }));

    return NextResponse.json(userSyllabus);
  } catch (error) {
    console.error("Failed to fetch syllabus:", error);
    return NextResponse.json({ error: "Failed to fetch syllabus" }, { status: 500 });
  }
}

// PATCH: Toggle topic completion status isolated strictly to the logged-in user
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topicId, completed } = await req.json();

    if (!topicId) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 });
    }

    const isCompleted = Boolean(completed);

    const progress = await db.userTopicProgress.upsert({
      where: {
        userId_topicId: {
          userId,
          topicId,
        },
      },
      update: {
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
      create: {
        userId,
        topicId,
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      topicId,
      completed: progress.completed,
    });
  } catch (error) {
    console.error("Failed to update topic status:", error);
    return NextResponse.json({ error: "Failed to update topic" }, { status: 500 });
  }
}

// POST: Add custom topic under a subject (Allowed for both Aspirants and Admins, scoped to their account)
export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subjectId, title } = await req.json();

    if (!subjectId || !title?.trim()) {
      return NextResponse.json({ error: "Subject ID and title are required" }, { status: 400 });
    }

    const count = await db.topic.count({
      where: {
        subjectId,
        OR: [{ userId: null }, { userId }],
      },
    });

    const newTopic = await db.topic.create({
      data: {
        subjectId,
        userId, // Scopes this topic exclusively to the creator
        title: title.trim(),
        orderIndex: count,
      },
    });

    return NextResponse.json(newTopic);
  } catch (error) {
    console.error("Failed to create topic:", error);
    return NextResponse.json({ error: "Failed to create topic" }, { status: 500 });
  }
}

// DELETE: Delete a custom topic (only if owned by the logged-in user)
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get("id");

    if (!topicId) {
      return NextResponse.json({ error: "Topic ID required" }, { status: 400 });
    }

    await db.topic.deleteMany({
      where: {
        id: topicId,
        userId, // Ensures a user can only delete their own custom topics
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete topic:", error);
    return NextResponse.json({ error: "Failed to delete topic" }, { status: 500 });
  }
}