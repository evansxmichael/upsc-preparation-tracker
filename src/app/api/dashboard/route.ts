import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [
      settings,
      totalTopicsCount,
      completedTopicsCount,
      todaySessions,
      allSessions,
      revisions,
      mockTests,
      mistakes,
      latestJournal,
    ] = await Promise.all([
      db.systemSettings.findFirst(),
      // 1. Total shared syllabus topics
      db.topic.count(),
      // 2. Completed topics strictly for this user
      db.userTopicProgress.count({
        where: { userId, completed: true },
      }),
      // 3. User's sessions today
      db.studySession.findMany({
        where: {
          userId,
          date: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      }),
      // 4. All study dates for user streak calculation
      db.studySession.findMany({
        where: { userId },
        select: { date: true },
        orderBy: { date: "desc" },
      }),
      // 5. User's pending revisions due today or overdue
      db.revisionTask.findMany({
        where: {
          userId,
          isCompleted: false,
          nextDueDate: { lte: endOfToday },
        },
        orderBy: { nextDueDate: "asc" },
        take: 4,
        include: { subject: true, topic: true },
      }),
      // 6. User's mock tests
      db.mockTest.findMany({
        where: { userId },
        select: { score: true, maxScore: true },
      }),
      // 7. User's mistakes
      db.mistake.findMany({
        where: {
          mockTest: {
            userId,
          },
        },
        include: { subject: true },
      }),
      // 8. User's latest journal entry
      db.journalEntry.findFirst({
        where: { userId },
        orderBy: { date: "desc" },
      }),
    ]);

    // 1. Overall Syllabus Completion Math (Per-User)
    const overallProgress =
      totalTopicsCount > 0
        ? Math.round((completedTopicsCount / totalTopicsCount) * 100)
        : 0;

    // 2. Today's Studied Hours
    const todayMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const todayHours = (todayMinutes / 60).toFixed(1);

    // 3. Dynamic Streak Calculation (Consecutive Days for Logged-In User)
    const activeDates = Array.from(
      new Set(allSessions.map((s) => new Date(s.date).toISOString().slice(0, 10)))
    ).sort().reverse();

    let streak = 0;
    const checkDate = new Date();
    const todayKey = checkDate.toISOString().slice(0, 10);

    if (activeDates.includes(todayKey)) {
      streak++;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yestKey = yesterday.toISOString().slice(0, 10);

    if (streak > 0 || activeDates.includes(yestKey)) {
      if (streak === 0) streak = 1;
      let runner = new Date(yesterday);
      while (true) {
        runner.setDate(runner.getDate() - 1);
        const k = runner.toISOString().slice(0, 10);
        if (activeDates.includes(k)) {
          streak++;
        } else {
          break;
        }
      }
    }

    // 4. Mock Statistics
    const mockCount = mockTests.length;
    const avgMockScore =
      mockCount > 0
        ? Math.round(
            mockTests.reduce((acc, m) => acc + (m.score / m.maxScore) * 100, 0) /
              mockCount
          )
        : 0;

    // 5. Weak Areas Detection
    const subjectMistakes: Record<string, number> = {};
    mistakes.forEach((m) => {
      const name = m.subject?.name || "General";
      subjectMistakes[name] = (subjectMistakes[name] || 0) + 1;
    });

    const weakAreas = Object.entries(subjectMistakes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ subject: name, count }));

    return NextResponse.json({
      settings: settings || {
        targetYear: 2027,
        prelimsTargetDate: "2027-05-23",
        mainsTargetDate: "2027-09-17",
        interviewDate: "2028-02-15",
        dailyTargetHours: 6.0,
      },
      overallProgress,
      totalTopics: totalTopicsCount,
      completedTopics: completedTopicsCount,
      todayHours,
      dailyTargetHours: settings?.dailyTargetHours || 6.0,
      streak,
      mockCount,
      avgMockScore,
      urgentRevisions: revisions,
      weakAreas,
      latestJournal,
    });
  } catch (error) {
    console.error("Failed to compile dashboard metrics:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}