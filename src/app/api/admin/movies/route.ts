import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { movies, showtimes } from "@/lib/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    const allMovies = await db.query.movies.findMany({
      orderBy: asc(movies.createdAt),
      with: {
        showtimes: {
          orderBy: asc(showtimes.time),
        },
      },
    });

    return NextResponse.json({ movies: allMovies });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, language, certification, dimension, posterUrl, isNowShowing, showtimes: times } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const db = getDb();
    const [newMovie] = await db
      .insert(movies)
      .values({
        title,
        language,
        certification,
        dimension,
        posterUrl,
        isNowShowing: isNowShowing ?? true,
      })
      .returning();

    if (Array.isArray(times) && times.length > 0) {
      await db.insert(showtimes).values(
        times.map((t: { time: string; format?: string }) => ({
          movieId: newMovie.id,
          time: t.time,
          format: t.format || "4K DOLBY ATMOS",
        }))
      );
    }

    return NextResponse.json({ movie: newMovie }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
