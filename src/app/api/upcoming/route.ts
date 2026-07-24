import { NextResponse } from "next/server";
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
