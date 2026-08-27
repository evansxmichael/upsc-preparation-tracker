import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Fetch answer writing sessions scoped strictly to the current user
export async function GET(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const paperParam = searchParams.get("paper");
    const subjectIdParam = searchParams.get("subjectId");

    const where: any = { userId };
    if (paperParam && paperParam !== "ALL") where.paper = paperParam;
    if (subjectIdParam && subjectIdParam !== "ALL") where.subjectId = subjectIdParam;

    const [answers, allSubjects] = await Promise.all([
      db.answerPractice.findMany({
        where,
        orderBy: { date: "desc" },
        include: {
          subject: { include: { category: true } },
          topic: true,
        },
      }),
      db.subject.findMany({
        include: {
          category: true,
          topics: { orderBy: { orderIndex: "asc" } },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    // Aggregate Analytics for this user
    const totalAnswers = answers.length;
    const scoredAnswers = answers.filter((a) => a.selfScore !== null);

    const avgScorePct =
      scoredAnswers.length > 0
        ? Math.round(
            scoredAnswers.reduce(
              (acc, a) => acc + ((a.selfScore || 0) / a.targetMarks) * 100,
              0
            ) / scoredAnswers.length
          )
        : 0;

    const avgTimeMinutes =
      totalAnswers > 0
        ? (
            answers.reduce((acc, a) => acc + a.timeTakenSecs, 0) /
            totalAnswers /
            60
          ).toFixed(1)
        : "0.0";

    const withDiagramsCount = answers.filter((a) => a.hasDiagram).length;
    const diagramRatePct =
      totalAnswers > 0 ? Math.round((withDiagramsCount / totalAnswers) * 100) : 0;

    return NextResponse.json({
      answers,
      subjects: allSubjects,
      stats: {
        totalAnswers,
        avgScorePct,
        avgTimeMinutes,
        diagramRatePct,
      },
    });
  } catch (error) {
    console.error("Failed to fetch answers:", error);
    return NextResponse.json({ error: "Failed to load answers" }, { status: 500 });
  }
}

// POST: Record a new answer writing session attached to current user
export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      paper,
      questionPrompt,
      targetMarks,
      targetWords,
      timeTakenSecs,
      selfScore,
      hasIntro,
      hasDiagram,
      hasWayForward,
      strengths,
      improvements,
      docUrl,
      subjectId,
      topicId,
      date,
    } = body;

    if (!questionPrompt?.trim()) {
      return NextResponse.json(
        { error: "Question prompt is required" },
        { status: 400 }
      );
    }

    let formattedUrl = docUrl?.trim() || null;
    if (formattedUrl && !formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const newAnswer = await db.answerPractice.create({
      data: {
        userId, // <-- User isolation
        paper: paper || "GS1",
        questionPrompt: questionPrompt.trim(),
        targetMarks: parseInt(targetMarks) || 10,
        targetWords: parseInt(targetWords) || 150,
        timeTakenSecs: parseInt(timeTakenSecs) || 420,
        selfScore: selfScore !== undefined && selfScore !== "" ? parseFloat(selfScore) : null,
        hasIntro: hasIntro ?? true,
        hasDiagram: hasDiagram ?? false,
        hasWayForward: hasWayForward ?? true,
        strengths: strengths?.trim() || null,
        improvements: improvements?.trim() || null,
        docUrl: formattedUrl,
        subjectId: subjectId && subjectId.trim() !== "" ? subjectId : null,
        topicId: topicId && topicId.trim() !== "" ? topicId : null,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        subject: { include: { category: true } },
        topic: true,
      },
    });

    return NextResponse.json(newAnswer);
  } catch (error) {
    console.error("Failed to save answer practice:", error);
    return NextResponse.json(
      { error: "Failed to save answer practice" },
      { status: 500 }
    );
  }
}

// DELETE: Remove an answer practice entry securely
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

    const existing = await db.answerPractice.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Record not found or unauthorized" }, { status: 404 });
    }

    await db.answerPractice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete answer record:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}