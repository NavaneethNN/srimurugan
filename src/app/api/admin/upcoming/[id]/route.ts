import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { upcomingMovies } from "@/lib/schema";
import { eq } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const db = getDb();
    const { id } = await params;
    const movieId = Number(id);

    if (!Number.isSafeInteger(movieId) || movieId < 1) {
      return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 });
    }

    const body = await request.json();
    const { title, language, releaseDate, posterUrl } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const [updated] = await db
      .update(upcomingMovies)
      .set({
        title: title.trim(),
        language,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        posterUrl,
      })
      .where(eq(upcomingMovies.id, movieId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    return NextResponse.json({ movie: updated });
  } catch (error) {
    console.error("Admin upcoming update failed:", error);
    return NextResponse.json({ error: "Failed to update upcoming movie" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const db = getDb();
    const { id } = await params;
    const movieId = Number(id);

    if (!Number.isSafeInteger(movieId) || movieId < 1) {
      return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 });
    }

    const [deleted] = await db.delete(upcomingMovies).where(eq(upcomingMovies.id, movieId)).returning({ id: upcomingMovies.id });
    if (!deleted) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin upcoming delete failed:", error);
    return NextResponse.json({ error: "Failed to delete upcoming movie" }, { status: 500 });
  }
}
