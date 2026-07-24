import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { upcomingMovies } from "@/lib/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    const upcoming = await db.query.upcomingMovies.findMany({
      orderBy: asc(upcomingMovies.releaseDate),
    });

    return NextResponse.json({ upcoming });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, language, releaseDate, posterUrl } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const db = getDb();
    const [movie] = await db
      .insert(upcomingMovies)
      .values({
        title,
        language,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        posterUrl,
      })
      .returning();

    return NextResponse.json({ movie }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
