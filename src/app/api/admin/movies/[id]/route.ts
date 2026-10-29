import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { movies, showtimes } from "@/lib/schema";
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
    const { title, language, certification, dimension, posterUrl, mobileBgUrl, desktopBgUrl, isNowShowing, showtimes: times } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const [updated] = await db
      .update(movies)
      .set({
        title: title.trim(),
        language,
        certification,
        dimension,
        posterUrl,
        mobileBgUrl,
        desktopBgUrl,
        isNowShowing: isNowShowing ?? true,
        updatedAt: new Date(),
      })
      .where(eq(movies.id, movieId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    await db.delete(showtimes).where(eq(showtimes.movieId, movieId));

    if (Array.isArray(times) && times.length > 0) {
      await db.insert(showtimes).values(
        times.map((t: { time: string; format?: string }) => ({
          movieId,
          time: t.time,
          format: t.format || "4K DOLBY ATMOS",
        }))
      );
    }

    return NextResponse.json({ movie: updated });
  } catch (error) {
    console.error("Admin movie update failed:", error);
    return NextResponse.json({ error: "Failed to update movie" }, { status: 500 });
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

    const [deleted] = await db.delete(movies).where(eq(movies.id, movieId)).returning({ id: movies.id });
    if (!deleted) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin movie delete failed:", error);
    return NextResponse.json({ error: "Failed to delete movie" }, { status: 500 });
  }
}
