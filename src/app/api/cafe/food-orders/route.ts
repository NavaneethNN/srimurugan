import { NextRequest, NextResponse } from "next/server";
import { authenticatedCafeUser } from "@/lib/cafeSession";
import { GET as getOrders } from "@/app/api/admin/food-orders/route";

export async function GET(request: NextRequest) {
  const user = await authenticatedCafeUser(request.cookies.get("cafe-session")?.value);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return getOrders(request);
}
