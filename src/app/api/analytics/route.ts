import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Scoped date filters with strict userId enforcement
    const sessionDateFilter: any = { userId };
    const mockDateFilter: any = { userId };
    const revisionDateFilter: any = { userId };
    const journalDateFilter: any = { userId };

    if (startDateParam || endDateParam) {
      const gte = startDateParam ? new Date(startDateParam) : undefined;
      const lte = endDateParam
        ? new Date(new Date(endDateParam).setHours(23, 59, 59, 999))
        : undefined;

      if (gte || lte) {
        sessionDateFilter.date = { ...(gte && { gte }), ...(lte && { lte }) };
        mockDateFilter.date = { ...(gte && { gte }), ...(lte && { lte }) };
        revisionDateFilter.lastStudiedDate = {
          ...(gte && { gte }),
          ...(lte && { lte }),
        };
        journalDateFilter.date = { ...(gte && { gte }), ...(lte && { lte }) };
      }
    }

    const [
      subjects,
      topics,
      userProgress,
      sessions,
      mockTests,
      revisions,
      journals,
    ] = await Promise.all([
      db.subject.findMany({
        include: { category: true, topics: true },
        orderBy: { orderIndex: "asc" },
      }),
      db.topic.findMany(),
      db.userTopicProgress.findMany({
        where: { userId, completed: true },
        select: { topicId: true },
      }),
      db.studySession.findMany({
        where: sessionDateFilter,
        orderBy: { date: "asc" },
        include: { subject: true, topic: true },
      }),
      db.mockTest.findMany({
        where: mockDateFilter,
        orderBy: { date: "asc" },
        include: { mistakes: { include: { subject: true, topic: true } } },
      }),
      db.revisionTask.findMany({
        where: revisionDateFilter,
        include: { subject: true, topic: true },
      }),
      db.journalEntry.findMany({
        where: journalDateFilter,
        orderBy: { date: "desc" },
      }),
    ]);

    // Set of completed topic IDs for this specific user
    const completedTopicIds = new Set(userProgress.map((p) => p.topicId));

    // 1. Syllabus Coverage Math (Per-User)
    const totalTopicsCount = topics.length;
    const completedTopicsCount = userProgress.length;
    const syllabusCoveragePct =
      totalTopicsCount > 0
        ? Math.round((completedTopicsCount / totalTopicsCount) * 100)
        : 0;

    // 2. Study Session Metrics
    const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const totalStudyHours = (totalMinutes / 60).toFixed(1);

    // Subject Time Distribution
    const subjectTimeMap: Record<
      string,
      {
        id: string;
        name: string;
        categoryName: string;
        minutes: number;
        topicCount: number;
        completedCount: number;
      }
    > = {};

    subjects.forEach((sub) => {
      subjectTimeMap[sub.id] = {
        id: sub.id,
        name: sub.name,
        categoryName: sub.category.title,
        minutes: 0,
        topicCount: sub.topics.length,
        completedCount: sub.topics.filter((t) => completedTopicIds.has(t.id)).length,
      };
    });

    sessions.forEach((s) => {
      if (s.subjectId && subjectTimeMap[s.subjectId]) {
        subjectTimeMap[s.subjectId].minutes += s.durationMinutes;
      }
    });

    const subjectBreakdown = Object.values(subjectTimeMap).map((item) => ({
      id: item.id,
      name: item.name,
      categoryName: item.categoryName,
      hours: (item.minutes / 60).toFixed(1),
      percentOfTotal:
        totalMinutes > 0 ? Math.round((item.minutes / totalMinutes) * 100) : 0,
      topicCoverage:
        item.topicCount > 0
          ? Math.round((item.completedCount / item.topicCount) * 100)
          : 0,
    }));

    // 3. Mock Test Analytics
    const mockCount = mockTests.length;
    const avgMockPct =
      mockCount > 0
        ? Math.round(
            mockTests.reduce((acc, m) => acc + (m.score / m.maxScore) * 100, 0) /
              mockCount
          )
        : 0;

    const mockTrend = mockTests.slice(-8).map((m) => ({
      id: m.id,
      title: m.title.length > 22 ? m.title.slice(0, 22) + "..." : m.title,
      category: m.category,
      score: m.score,
      maxScore: m.maxScore,
      percentage: Math.round((m.score / m.maxScore) * 100),
      date: new Date(m.date).toISOString().slice(0, 10),
    }));

    // 4. Revision Adherence
    const totalRevisions = revisions.length;
    const completedRevisions = revisions.filter((r) => r.isCompleted).length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueRevisions = revisions.filter((r) => {
      if (r.isCompleted) return false;
      const target = new Date(r.nextDueDate);
      target.setHours(0, 0, 0, 0);
      return target < today;
    }).length;

    const revisionAdherencePct =
      totalRevisions > 0
        ? Math.round(
            ((totalRevisions - overdueRevisions) / totalRevisions) * 100
          )
        : 100;

    // 5. Journal Discipline Index
    const avgDiscipline =
      journals.length > 0
        ? Number(
            (
              journals.reduce((acc, j) => acc + j.disciplineRating, 0) /
              journals.length
            ).toFixed(1)
          )
        : 4.0;

    // 6. Weakness Detection Engine (From this user's mock test mistakes)
    const mistakes = mockTests.flatMap((m) => m.mistakes);
    const subjectMistakeCount: Record<string, { id: string; name: string; count: number }> = {};
    mistakes.forEach((m) => {
      const key = m.subject?.id || "general";
      const name = m.subject?.name || "General Study";
      if (!subjectMistakeCount[key]) {
        subjectMistakeCount[key] = { id: key, name, count: 0 };
      }
      subjectMistakeCount[key].count += 1;
    });

    const rootCauseCount: Record<string, number> = {};
    mistakes.forEach((m) => {
      rootCauseCount[m.reason] = (rootCauseCount[m.reason] || 0) + 1;
    });

    const weakAreas = Object.values(subjectMistakeCount)
      .map((item) => ({
        id: item.id,
        subject: item.name,
        errorCount: item.count,
        severity:
          item.count >= 5
            ? ("CRITICAL" as const)
            : item.count >= 2
            ? ("MODERATE" as const)
            : ("LOW" as const),
      }))
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 4);

    // 7. Composite Preparation Health Score (0-100)
    const healthScore = Math.min(
      100,
      Math.round(
        syllabusCoveragePct * 0.3 +
          avgMockPct * 0.25 +
          revisionAdherencePct * 0.2 +
          (avgDiscipline / 5) * 100 * 0.15 +
          10
      )
    );

    return NextResponse.json({
      healthScore,
      syllabusCoveragePct,
      totalTopicsCount,
      completedTopicsCount,
      totalStudyHours,
      totalSessionsCount: sessions.length,
      mockCount,
      avgMockPct,
      mockTrend,
      revisionAdherencePct,
      overdueRevisions,
      totalRevisions,
      completedRevisions,
      avgDiscipline,
      subjectBreakdown,
      rootCauseCount,
      weakAreas,
    });
  } catch (error) {
    console.error("Failed to compile performance analytics:", error);
    return NextResponse.json(
      { error: "Failed to generate analytics" },
      { status: 500 }
    );
  }
}