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
    const body = await request.json();
    const { title, language, certification, dimension, posterUrl, isNowShowing, showtimes: times } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const [updated] = await db
      .update(movies)
      .set({
        title,
        language,
        certification,
        dimension,
        posterUrl,
        isNowShowing: isNowShowing ?? true,
        updatedAt: new Date(),
      })
      .where(eq(movies.id, movieId))
      .returning();

    await db.delete(showtimes).where(eq(showtimes.movieId, movieId));

    if (Array.isArray(times) && times.length > 0) {
      await db.insert(showtimes).values(
        times.map((t: { time: string; format?: string }) => ({
          movieId,
          time: t.time,
          format: t.format || "DOLBY ATMOS",
        }))
      );
    }

    return NextResponse.json({ movie: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const db = getDb();
    const { id } = await params;
    const movieId = Number(id);

    await db.delete(movies).where(eq(movies.id, movieId));

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
