import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export interface UploadOptions {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  folder?: string;
}

export interface UploadResult {
  url: string;
  key: string;
  storage: "r2" | "local";
}

/**
 * Checks whether Cloudflare R2 credentials are fully configured.
 */
export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}

let cachedS3Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (cachedS3Client) return cachedS3Client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Cloudflare R2 credentials not configured.");
  }

  cachedS3Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return cachedS3Client;
}

/**
 * Uploads an image file to Cloudflare R2 (when credentials exist),
 * falling back gracefully to local disk storage (public/uploads/...)
 * during development or when R2 is not configured.
 */
export async function uploadImage({
  buffer,
  filename,
  mimeType,
  folder = "uploads",
}: UploadOptions): Promise<UploadResult> {
  const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "");
  const key = sanitizedFolder ? `${sanitizedFolder}/${filename}` : filename;

  if (isR2Configured()) {
    const s3 = getR2Client();
    const bucket = process.env.R2_BUCKET_NAME!;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    const publicDomain = (process.env.R2_PUBLIC_DOMAIN || "").trim().replace(/\/+$/, "");
    const url = publicDomain ? `${publicDomain}/${key}` : `https://${bucket}.r2.cloudflarestorage.com/${key}`;

    return {
      url,
      key,
      storage: "r2",
    };
  }

  // Local filesystem fallback
  const targetDir = path.join(process.cwd(), "public", "uploads", sanitizedFolder);
  await mkdir(targetDir, { recursive: true });

  const destinationPath = path.join(targetDir, filename);
  await writeFile(destinationPath, buffer);

  const localUrl = `/uploads/${sanitizedFolder}/${filename}`;

  return {
    url: localUrl,
    key,
    storage: "local",
  };
}

