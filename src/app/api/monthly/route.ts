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
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month"); // 1-based (1 = Jan, 8 = Aug)

    const now = new Date();
    const year = yearParam ? parseInt(yearParam) : now.getFullYear();
    const month = monthParam ? parseInt(monthParam) - 1 : now.getMonth();

    // Start & End of month range (UTC-bounded)
    const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

    // Parallel queries scoped strictly to the current user and month
    const [sessions, mockTests, journals, revisions] = await Promise.all([
      db.studySession.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: "asc" },
        include: {
          subject: true,
          topic: true,
        },
      }),

      db.mockTest.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: "asc" },
      }),

      db.journalEntry.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: "asc" },
      }),

      db.revisionTask.findMany({
        where: {
          userId,
          lastStudiedDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { lastStudiedDate: "asc" },
        include: {
          subject: true,
          topic: true,
        },
      }),
    ]);

    return NextResponse.json({
      year,
      month: month + 1,
      sessions,
      mockTests,
      journals,
      revisions,
    });
  } catch (error) {
    console.error("Failed to fetch monthly aggregated metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch monthly data" },
      { status: 500 }
    );
  }
}