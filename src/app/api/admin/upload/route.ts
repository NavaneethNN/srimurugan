import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminSession } from "@/lib/adminSession";
import { uploadImage } from "@/lib/r2";
import { randomBytes } from "node:crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin-session");

    if (!ADMIN_PASSWORD || !SESSION_SECRET || !verifyAdminSession(adminSession?.value, ADMIN_PASSWORD, SESSION_SECRET)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const rawFolder = formData.get("folder")?.toString() || "posters";
    const folder = rawFolder === "menu" ? "menu" : "posters";

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported image format. Allowed formats: JPEG, PNG, WebP, AVIF, GIF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Image file is too large. Maximum allowed size is 10 MB." },
        { status: 400 }
      );
    }

    // Determine safe extension
    let extension = "jpg";
    if (file.type === "image/png") extension = "png";
    else if (file.type === "image/webp") extension = "webp";
    else if (file.type === "image/avif") extension = "avif";
    else if (file.type === "image/gif") extension = "gif";
    else if (file.type === "image/jpeg") extension = "jpg";

    const timestamp = Date.now();
    const randomHex = randomBytes(4).toString("hex");
    const prefix = folder === "menu" ? "menu" : "poster";
    const filename = `${prefix}_${timestamp}_${randomHex}.${extension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await uploadImage({
      buffer,
      filename,
      mimeType: file.type,
      folder,
    });

    return NextResponse.json({
      url: uploadResult.url,
      filename,
      size: file.size,
      mimeType: file.type,
      storage: uploadResult.storage,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    const message = error instanceof Error ? error.message : "Failed to upload image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
