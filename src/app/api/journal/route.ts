import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Fetch journal entries strictly for the logged-in user
export async function GET() {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entries = await db.journalEntry.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Failed to fetch journal entries:", error);
    return NextResponse.json({ error: "Failed to fetch journal" }, { status: 500 });
  }
}

// POST: Create or update a distinct journal entry for the current user
export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      date,
      studiedSummary,
      accomplishments,
      obstacles,
      keyLearnings,
      tomorrowPlan,
      confidenceRating,
      energyRating,
      disciplineRating,
    } = body;

    const entryDate = date ? new Date(date) : new Date();

    // If updating an existing entry, ensure ownership before updating
    if (id) {
      const existing = await db.journalEntry.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        return NextResponse.json({ error: "Journal entry not found or unauthorized" }, { status: 404 });
      }

      const updated = await db.journalEntry.update({
        where: { id },
        data: {
          date: entryDate,
          studiedSummary: studiedSummary || "",
          accomplishments: accomplishments || null,
          obstacles: obstacles || null,
          keyLearnings: keyLearnings || null,
          tomorrowPlan: tomorrowPlan || null,
          confidenceRating: parseInt(confidenceRating || 4),
          energyRating: parseInt(energyRating || 4),
          disciplineRating: parseInt(disciplineRating || 5),
        },
      });
      return NextResponse.json(updated);
    }

    // Create a new entry tied to the logged-in user
    const newEntry = await db.journalEntry.create({
      data: {
        userId,
        date: entryDate,
        studiedSummary: studiedSummary || "",
        accomplishments: accomplishments || null,
        obstacles: obstacles || null,
        keyLearnings: keyLearnings || null,
        tomorrowPlan: tomorrowPlan || null,
        confidenceRating: parseInt(confidenceRating || 4),
        energyRating: parseInt(energyRating || 4),
        disciplineRating: parseInt(disciplineRating || 5),
      },
    });

    return NextResponse.json(newEntry);
  } catch (error) {
    console.error("Failed to save journal entry:", error);
    return NextResponse.json({ error: "Failed to save entry" }, { status: 500 });
  }
}

// DELETE: Remove journal entry by id with ownership verification
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const existing = await db.journalEntry.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Journal entry not found or unauthorized" }, { status: 404 });
    }

    await db.journalEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete journal entry:", error);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}