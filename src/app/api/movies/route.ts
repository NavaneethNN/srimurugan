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
    console.error("Unable to load movies:", error);
    return NextResponse.json({ error: "Unable to load movies." }, { status: 500 });
  }
}
