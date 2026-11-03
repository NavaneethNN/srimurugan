import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { cafeUsers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { verifyCafeSession } from "@/lib/cafeSession";
import { hashPin, verifyPin } from "@/lib/cafeAuth";
import { readJsonBody, RequestTooLargeError } from "@/lib/requestBody";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("cafe-session")?.value;
    const userId = verifyCafeSession(token, process.env.SESSION_SECRET);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign into the terminal again." }, { status: 401 });
    }

    const body = await readJsonBody(request, 1_024) as { currentPin?: unknown; newPin?: unknown } | null;
    const currentPin = body?.currentPin;
    const newPin = body?.newPin;

    if (typeof currentPin !== "string" || !/^\d{4,6}$/.test(currentPin)) {
      return NextResponse.json({ error: "Current PIN must be 4 to 6 numeric digits" }, { status: 400 });
    }
    if (typeof newPin !== "string" || !/^\d{4,6}$/.test(newPin)) {
      return NextResponse.json({ error: "New PIN must be 4 to 6 numeric digits" }, { status: 400 });
    }
    if (currentPin === newPin) {
      return NextResponse.json({ error: "New PIN must be different from your current PIN" }, { status: 400 });
    }

    const db = getDb();
    const [user] = await db.select().from(cafeUsers).where(eq(cafeUsers.id, userId)).limit(1);

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Staff account not found or deactivated." }, { status: 403 });
    }

    if (!verifyPin(currentPin, user.pin)) {
      return NextResponse.json({ error: "Current PIN is incorrect." }, { status: 401 });
    }

    // Check if another active staff member has this PIN
    const otherUsers = await db.select({ id: cafeUsers.id, name: cafeUsers.name, pin: cafeUsers.pin })
      .from(cafeUsers)
      .where(eq(cafeUsers.isActive, true));

    const duplicate = otherUsers.find((u) => u.id !== userId && verifyPin(newPin, u.pin));
    if (duplicate) {
      return NextResponse.json({ error: "This PIN is already assigned to another staff member. Please select a different PIN." }, { status: 409 });
    }

    await db.update(cafeUsers)
      .set({ pin: hashPin(newPin), updatedAt: new Date() })
      .where(eq(cafeUsers.id, userId));

    return NextResponse.json({ success: true, message: "PIN changed successfully. Use your new PIN for future sign-ins." });
  } catch (error) {
    if (error instanceof RequestTooLargeError) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }
    console.error("Change PIN error:", error);
    return NextResponse.json({ error: "Failed to change PIN. Please try again." }, { status: 500 });
  }
}
