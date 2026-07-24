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
    const body = await request.json();
    const { title, language, releaseDate, posterUrl } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const [updated] = await db
      .update(upcomingMovies)
      .set({
        title,
        language,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        posterUrl,
      })
      .where(eq(upcomingMovies.id, movieId))
      .returning();

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

    await db.delete(upcomingMovies).where(eq(upcomingMovies.id, movieId));

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
