import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Fetch PYQ attempts scoped strictly to the current user
export async function GET(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");
    const paperParam = searchParams.get("paper");
    const subjectIdParam = searchParams.get("subjectId");

    const where: any = { userId };
    if (yearParam && yearParam !== "ALL") where.year = parseInt(yearParam);
    if (paperParam && paperParam !== "ALL") where.paper = paperParam;
    if (subjectIdParam && subjectIdParam !== "ALL") where.subjectId = subjectIdParam;

    const [categories, allSubjects, attempts] = await Promise.all([
      db.syllabusCategory.findMany({
        include: {
          subjects: {
            include: { topics: true },
            orderBy: { orderIndex: "asc" },
          },
        },
        orderBy: { orderIndex: "asc" },
      }),
      db.subject.findMany({
        include: {
          category: true,
          topics: { orderBy: { orderIndex: "asc" } },
        },
        orderBy: { name: "asc" },
      }),
      db.pyqAttempt.findMany({
        where,
        orderBy: { attemptDate: "desc" },
        include: {
          subject: { include: { category: true } },
          topic: true,
        },
      }),
    ]);

    const totalAttempted = attempts.reduce((acc, a) => acc + a.totalQuestions, 0);
    const totalCorrect = attempts.reduce((acc, a) => acc + a.correctCount, 0);
    const totalWrong = attempts.reduce((acc, a) => acc + a.wrongCount, 0);
    const overallAccuracy =
      totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

    const subjectStatsMap: Record<string, { name: string; total: number; correct: number }> = {};
    attempts.forEach((a) => {
      const subName = a.subject?.name || "General / Full Paper";
      if (!subjectStatsMap[subName]) {
        subjectStatsMap[subName] = { name: subName, total: 0, correct: 0 };
      }
      subjectStatsMap[subName].total += a.totalQuestions;
      subjectStatsMap[subName].correct += a.correctCount;
    });

    const subjectBreakdown = Object.values(subjectStatsMap).map((s) => ({
      name: s.name,
      total: s.total,
      correct: s.correct,
      accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
    }));

    return NextResponse.json({
      attempts,
      categories,
      subjects: allSubjects,
      stats: {
        totalAttempted,
        totalCorrect,
        totalWrong,
        overallAccuracy,
        attemptsCount: attempts.length,
      },
      subjectBreakdown,
    });
  } catch (error) {
    console.error("Failed to fetch PYQ attempts:", error);
    return NextResponse.json({ error: "Failed to load PYQ data" }, { status: 500 });
  }
}

// POST: Log a PYQ attempt tied to the logged-in user
export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      year,
      paper,
      totalQuestions,
      correctCount,
      wrongCount,
      notes,
      subjectId,
      topicId,
    } = body;

    const total = parseInt(totalQuestions) || 0;
    const correct = parseInt(correctCount) || 0;
    const wrong = parseInt(wrongCount) || 0;
    const unattempted = Math.max(0, total - (correct + wrong));

    let score = 0;
    if (paper === "PRELIMS_CSAT") {
      score = correct * 2.5 - wrong * (2.5 / 3);
    } else {
      score = correct * 2.0 - wrong * (2.0 / 3);
    }

    const accuracyPct = total > 0 ? (correct / total) * 100 : 0;

    const newAttempt = await db.pyqAttempt.create({
      data: {
        userId,
        year: parseInt(year) || 2026,
        paper: paper || "PRELIMS_GS1",
        totalQuestions: total,
        correctCount: correct,
        wrongCount: wrong,
        unattempted,
        scoreCalculated: Number(score.toFixed(2)),
        accuracyPct: Number(accuracyPct.toFixed(1)),
        notes: notes?.trim() || null,
        subjectId: subjectId && subjectId.trim() !== "" ? subjectId : null,
        topicId: topicId && topicId.trim() !== "" ? topicId : null,
      },
      include: {
        subject: { include: { category: true } },
        topic: true,
      },
    });

    return NextResponse.json(newAttempt);
  } catch (error) {
    console.error("Failed to log PYQ attempt:", error);
    return NextResponse.json({ error: "Failed to record PYQ attempt" }, { status: 500 });
  }
}

// DELETE: Remove PYQ attempt with ownership validation
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

    const existing = await db.pyqAttempt.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Record not found or unauthorized" }, { status: 404 });
    }

    await db.pyqAttempt.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete PYQ attempt:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}