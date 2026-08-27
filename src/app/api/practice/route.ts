import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Fetch mock tests and mistakes strictly for the authenticated user
export async function GET() {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [tests, mistakes] = await Promise.all([
      db.mockTest.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        include: {
          mistakes: {
            include: { subject: true, topic: true },
          },
        },
      }),
      // Pulls ALL mistakes created by this user, whether linked to a test or standalone
      db.mistake.findMany({
        where: {
          OR: [
            { userId },
            { mockTest: { userId } },
          ],
        },
        orderBy: { createdAt: "desc" },
        include: {
          subject: true,
          topic: true,
          mockTest: true,
        },
      }),
    ]);

    return NextResponse.json({ tests, mistakes });
  } catch (error) {
    console.error("Failed to fetch practice data:", error);
    return NextResponse.json({ error: "Failed to fetch practice data" }, { status: 500 });
  }
}

// POST: Save a new Mock Test or Mistake Notebook entry attached to logged-in user
export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "ADD_MISTAKE") {
      const {
        mockTestId,
        subjectId,
        topicId,
        questionSummary,
        reason,
        correctConcept,
      } = body;

      // Verify associated mock test if provided
      if (mockTestId) {
        const testBelongsToUser = await db.mockTest.findFirst({
          where: { id: mockTestId, userId },
        });
        if (!testBelongsToUser) {
          return NextResponse.json({ error: "Mock test not found or unauthorized" }, { status: 404 });
        }
      }

      const newMistake = await db.mistake.create({
        data: {
          userId, // Explicitly saved to this user
          mockTestId: mockTestId || null,
          subjectId: subjectId && subjectId.trim() !== "" ? subjectId : null,
          topicId: topicId && topicId.trim() !== "" ? topicId : null,
          questionSummary: questionSummary.trim(),
          reason: reason || "CONCEPTUAL_CONFUSION",
          correctConcept: correctConcept.trim(),
          revisionStage: 0,
          isArchived: false,
        },
        include: { subject: true, topic: true, mockTest: true },
      });

      // UNTOUCHED REVISION ENGINE HOOK: Auto-schedule a revision pass in Spaced Repetition
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + 1);

      await db.revisionTask.create({
        data: {
          userId,
          subjectId: subjectId && subjectId.trim() !== "" ? subjectId : null,
          topicId: topicId && topicId.trim() !== "" ? topicId : null,
          lastStudiedDate: new Date(),
          nextDueDate: nextDue,
          intervalDays: 1,
          passCount: 1,
          source: "MISTAKE_BOOK",
          notes: `Mistake Remediation: ${questionSummary.slice(0, 50)}...`,
        },
      });

      return NextResponse.json(newMistake);
    }

    // Default: Add Mock Test
    const {
      title,
      category,
      score,
      maxScore,
      correctCount,
      wrongCount,
      unattempted,
      notes,
      date,
      durationMinutes,
      subjectId,
    } = body;

    const newTest = await db.mockTest.create({
      data: {
        userId,
        title: title.trim(),
        category: category || "PRELIMS_GS1",
        score: parseFloat(score),
        maxScore: parseFloat(maxScore || 200),
        correctCount: correctCount ? parseInt(correctCount) : null,
        wrongCount: wrongCount ? parseInt(wrongCount) : null,
        unattempted: unattempted ? parseInt(unattempted) : null,
        notes: notes?.trim() || null,
        date: date ? new Date(date) : new Date(),
      },
    });

    // Cross-Module Hook: Auto-log study session for this user
    const studyDuration = parseInt(durationMinutes) || 120;
    await db.studySession.create({
      data: {
        userId,
        durationMinutes: studyDuration,
        sessionType: "MOCK_TEST",
        notes: `Mock Test: ${title} (${score}/${maxScore})`,
        subjectId: subjectId && subjectId.trim() !== "" ? subjectId : null,
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json(newTest);
  } catch (error) {
    console.error("Failed to save practice record:", error);
    return NextResponse.json({ error: "Failed to save practice record" }, { status: 500 });
  }
}

// PATCH: Toggle archive status or cycle revision stage
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, isArchived, revisionStage } = await req.json();

    const existing = await db.mistake.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { mockTest: { userId } },
        ],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Mistake entry not found or unauthorized" }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (typeof isArchived === "boolean") {
      dataToUpdate.isArchived = isArchived;
      dataToUpdate.archivedAt = isArchived ? new Date() : null;
    }
    if (typeof revisionStage === "number") {
      dataToUpdate.revisionStage = revisionStage;
    }

    const updated = await db.mistake.update({
      where: { id },
      data: dataToUpdate,
      include: { subject: true, topic: true, mockTest: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update mistake:", error);
    return NextResponse.json({ error: "Failed to update mistake" }, { status: 500 });
  }
}

// DELETE: Delete test or mistake with user validation
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    if (type === "mistake") {
      const existingMistake = await db.mistake.findFirst({
        where: {
          id,
          OR: [
            { userId },
            { mockTest: { userId } },
          ],
        },
      });

      if (!existingMistake) {
        return NextResponse.json({ error: "Mistake record not found or unauthorized" }, { status: 404 });
      }

      await db.mistake.delete({ where: { id } });
    } else {
      const existingTest = await db.mockTest.findFirst({
        where: { id, userId },
      });

      if (!existingTest) {
        return NextResponse.json({ error: "Mock test not found or unauthorized" }, { status: 404 });
      }

      await db.mockTest.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete record:", error);
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
  }
}