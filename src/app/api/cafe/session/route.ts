import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { cafeUsers } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("cafe-session");

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const [userId, pin] = session.value.split(":");

    if (!userId || !pin) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const [user] = await db.select()
      .from(cafeUsers)
      .where(eq(cafeUsers.id, parseInt(userId, 10)))
      .limit(1);

    if (!user || user.pin !== pin || !user.isActive) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    return NextResponse.json({ 
      user: { id: user.id, name: user.name } 
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json({ error: "Session check failed" }, { status: 500 });
  }
}
