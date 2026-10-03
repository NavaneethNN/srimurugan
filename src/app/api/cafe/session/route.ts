import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticatedCafeUser } from "@/lib/cafeSession";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const user = await authenticatedCafeUser(cookieStore.get("cafe-session")?.value);
    if (!user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    return NextResponse.json({ 
      user: { id: user.id, name: user.name } 
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json({ error: "Session check failed" }, { status: 500 });
  }
}
