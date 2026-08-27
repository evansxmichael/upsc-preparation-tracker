import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const REQUIRED_PASSKEY = "RESET-UPSC-2027";

// GET: Fetch personal user settings or export user snapshot
export async function GET(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    // Snapshot Export
    if (action === "EXPORT_ALL") {
      const isUserAdmin = userRole === "ADMIN";

      const [
        categories,
        subjects,
        topics,
        planPhases,
        studySessions,
        mockTests,
        mistakes,
        revisionTasks,
        journalEntries,
        resources,
        settings,
      ] = await Promise.all([
        db.syllabusCategory.findMany({ orderBy: { orderIndex: "asc" } }),
        db.subject.findMany({
          where: isUserAdmin ? {} : { OR: [{ userId: null }, { userId }] },
          orderBy: { orderIndex: "asc" },
        }),
        db.topic.findMany({
          where: isUserAdmin ? {} : { OR: [{ userId: null }, { userId }] },
          orderBy: { orderIndex: "asc" },
        }),
        db.planPhase.findMany({
          where: isUserAdmin ? {} : { userId },
          orderBy: { orderIndex: "asc" },
        }),
        db.studySession.findMany({
          where: isUserAdmin ? {} : { userId },
          orderBy: { date: "desc" },
        }),
        db.mockTest.findMany({
          where: isUserAdmin ? {} : { userId },
          include: { mistakes: true },
          orderBy: { date: "desc" },
        }),
        db.mistake.findMany({
          where: isUserAdmin ? {} : { mockTest: { userId } },
        }),
        db.revisionTask.findMany({
          where: isUserAdmin ? {} : { userId },
        }),
        db.journalEntry.findMany({
          where: isUserAdmin ? {} : { userId },
          orderBy: { date: "desc" },
        }),
        db.resource.findMany({
          where: isUserAdmin ? {} : { OR: [{ userId: null }, { userId }] },
        }),
        db.systemSettings.findUnique({
          where: { userId },
        }),
      ]);

      const snapshot = {
        exportedAt: new Date().toISOString(),
        version: "2.0",
        userScope: isUserAdmin ? "GLOBAL_ADMIN" : userId,
        data: {
          categories,
          subjects,
          topics,
          planPhases,
          studySessions,
          mockTests,
          mistakes,
          revisionTasks,
          journalEntries,
          resources,
          settings,
        },
      };

      return NextResponse.json(snapshot);
    }

    // Retrieve or create individual user settings
    let settings = await db.systemSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await db.systemSettings.create({
        data: {
          userId,
          prelimsTargetDate: new Date("2027-05-23"),
          mainsTargetDate: new Date("2027-09-17"),
          interviewDate: new Date("2028-02-15"),
          dailyTargetHours: 6.0,
          targetYear: 2027,
          optionalSubject: "Sociology",
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to load settings:", error);
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 }
    );
  }
}

// POST: Save individual settings or reset personal data
export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      action,
      passkey,
      prelimsTargetDate,
      mainsTargetDate,
      interviewDate,
      dailyTargetHours,
      targetYear,
      optionalSubject,
    } = body;

    // Reset User Activity
    if (action === "RESET_SYSTEM") {
      if (passkey !== REQUIRED_PASSKEY) {
        return NextResponse.json(
          { error: `Invalid security passkey. Please enter "${REQUIRED_PASSKEY}".` },
          { status: 403 }
        );
      }

      const userFilter = { userId };

      await Promise.all([
        db.studySession.deleteMany({ where: userFilter }),
        db.mockTest.deleteMany({ where: userFilter }),
        db.revisionTask.deleteMany({ where: userFilter }),
        db.journalEntry.deleteMany({ where: userFilter }),
        db.dailyTask.deleteMany({ where: userFilter }),
        db.pyqAttempt.deleteMany({ where: userFilter }),
        db.answerPractice.deleteMany({ where: userFilter }),
        db.userTopicProgress.deleteMany({ where: userFilter }),
        db.planPhase.deleteMany({ where: userFilter }),
        db.resource.deleteMany({ where: userFilter }),
        db.topic.deleteMany({ where: { userId } }),
        db.subject.deleteMany({ where: { userId } }),
      ]);

      return NextResponse.json({
        success: true,
        message: "Your personal activity logs, resources, and custom syllabus items have been reset.",
      });
    }

    // Upsert target dates specifically for the logged-in user
    const updated = await db.systemSettings.upsert({
      where: { userId },
      update: {
        prelimsTargetDate: new Date(prelimsTargetDate),
        mainsTargetDate: new Date(mainsTargetDate),
        interviewDate: interviewDate ? new Date(interviewDate) : null,
        dailyTargetHours: Number(dailyTargetHours) || 6.0,
        targetYear: Number(targetYear) || 2027,
        optionalSubject: optionalSubject ? optionalSubject.trim() : null,
      },
      create: {
        userId,
        prelimsTargetDate: new Date(prelimsTargetDate),
        mainsTargetDate: new Date(mainsTargetDate),
        interviewDate: interviewDate ? new Date(interviewDate) : null,
        dailyTargetHours: Number(dailyTargetHours) || 6.0,
        targetYear: Number(targetYear) || 2027,
        optionalSubject: optionalSubject ? optionalSubject.trim() : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to save settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}