import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { movies, showtimes } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    const nowShowing = await db.query.movies.findMany({
      where: eq(movies.isNowShowing, true),
      orderBy: asc(movies.createdAt),
      with: {
        showtimes: {
          orderBy: asc(showtimes.time),
        },
      },
    });

    return NextResponse.json({ movies: nowShowing });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
