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
    console.error("Unable to load upcoming movies:", error);
    return NextResponse.json({ error: "Unable to load upcoming movies." }, { status: 500 });
  }
}
