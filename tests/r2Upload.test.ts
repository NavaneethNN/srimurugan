import assert from "node:assert/strict";
import { test } from "node:test";
import { isR2Configured, uploadImage } from "../src/lib/r2";
import { readFile, unlink } from "node:fs/promises";
import path from "node:path";

test("isR2Configured returns false when env variables are not present", () => {
  const originalEnv = { ...process.env };
  delete process.env.R2_ACCOUNT_ID;
  delete process.env.R2_ACCESS_KEY_ID;
  delete process.env.R2_SECRET_ACCESS_KEY;
  delete process.env.R2_BUCKET_NAME;

  try {
    assert.equal(isR2Configured(), false);
  } finally {
    process.env = originalEnv;
  }
});

test("isR2Configured returns true when all 4 required credentials are set", () => {
  const originalEnv = { ...process.env };
  process.env.R2_ACCOUNT_ID = "mock_acc_id";
  process.env.R2_ACCESS_KEY_ID = "mock_key";
  process.env.R2_SECRET_ACCESS_KEY = "mock_secret";
  process.env.R2_BUCKET_NAME = "mock_bucket";

  try {
    assert.equal(isR2Configured(), true);
  } finally {
    process.env = originalEnv;
  }
});

test("uploadImage gracefully falls back to local disk storage when R2 is unconfigured", async () => {
  const originalEnv = { ...process.env };
  delete process.env.R2_ACCOUNT_ID;
  delete process.env.R2_ACCESS_KEY_ID;
  delete process.env.R2_SECRET_ACCESS_KEY;
  delete process.env.R2_BUCKET_NAME;

  const testContent = Buffer.from("fake-image-bytes-menu-test");
  const testFilename = `test_menu_${Date.now()}.png`;

  try {
    const result = await uploadImage({
      buffer: testContent,
      filename: testFilename,
      mimeType: "image/png",
      folder: "menu",
    });

    assert.equal(result.storage, "local");
    assert.equal(result.key, `menu/${testFilename}`);
    assert.equal(result.url, `/uploads/menu/${testFilename}`);

    // Verify file actually exists on local filesystem
    const diskPath = path.join(process.cwd(), "public", "uploads", "menu", testFilename);
    const readBytes = await readFile(diskPath);
    assert.deepEqual(readBytes, testContent);

    // Clean up temporary test file
    await unlink(diskPath);
  } finally {
    process.env = originalEnv;
  }
});

test("uploadImage sanitizes folder name to prevent path traversal", async () => {
  const originalEnv = { ...process.env };
  delete process.env.R2_ACCOUNT_ID;
  delete process.env.R2_ACCESS_KEY_ID;
  delete process.env.R2_SECRET_ACCESS_KEY;
  delete process.env.R2_BUCKET_NAME;

  const testContent = Buffer.from("traversal-safe");
  const testFilename = `test_sanitized_${Date.now()}.jpg`;

  try {
    const result = await uploadImage({
      buffer: testContent,
      filename: testFilename,
      mimeType: "image/jpeg",
      folder: "../../../dangerous/path!#",
    });

    // Sanitized folder keeps only alphanumeric, underscores, hyphens
    assert.ok(!result.key.includes(".."));
    assert.ok(!result.url.includes(".."));

    // Clean up
    const diskPath = path.join(process.cwd(), "public", "uploads", result.key);
    try {
      await unlink(diskPath);
    } catch {
      // Ignore if not found
    }
  } finally {
    process.env = originalEnv;
  }
});
