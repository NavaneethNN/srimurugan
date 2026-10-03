import { NextRequest, NextResponse } from "next/server";
import { authenticatedCafeUser } from "@/lib/cafeSession";
import { PATCH as updateOrder } from "@/app/api/admin/food-orders/[id]/route";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await authenticatedCafeUser(request.cookies.get("cafe-session")?.value);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return updateOrder(request, context);
}
