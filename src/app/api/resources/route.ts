import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Fetch system resources + logged-in user's personal resources
export async function GET() {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resources = await db.resource.findMany({
      where: {
        OR: [{ userId: null }, { userId }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        topic: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(resources);
  } catch (error) {
    console.error("Failed to fetch resources:", error);
    return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 });
  }
}

// POST: Add a new resource scoped strictly to the logged-in user
export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, type, url, sourceName, notes, subjectId, topicId } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const newResource = await db.resource.create({
      data: {
        userId, // Scopes resource strictly to the user
        title: title.trim(),
        type: type || "WEBSITE",
        url: url?.trim() || null,
        sourceName: sourceName?.trim() || null,
        notes: notes?.trim() || null,
        subjectId: subjectId && subjectId.trim() !== "" ? subjectId : null,
        topicId: topicId && topicId.trim() !== "" ? topicId : null,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        topic: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(newResource);
  } catch (error) {
    console.error("Failed to create resource:", error);
    return NextResponse.json({ error: "Failed to create resource" }, { status: 500 });
  }
}

// DELETE: Delete a resource (User can delete their own; Admin can delete any)
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // Users can only delete their own resources; Admins can delete any
    const deleteFilter = userRole === "ADMIN" ? { id } : { id, userId };

    const deleteResult = await db.resource.deleteMany({
      where: deleteFilter,
    });

    if (deleteResult.count === 0) {
      return NextResponse.json(
        { error: "Resource not found or unauthorized to delete." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete resource:", error);
    return NextResponse.json({ error: "Failed to delete resource" }, { status: 500 });
  }
}