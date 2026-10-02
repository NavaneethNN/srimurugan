export class RequestTooLargeError extends Error {}

export async function readTextBody(request: Request, maxBytes: number) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(declared) && declared > maxBytes) throw new RequestTooLargeError("Request body is too large");
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new RequestTooLargeError("Request body is too large");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function readJsonBody(request: Request, maxBytes = 16_384): Promise<unknown> {
  const raw = await readTextBody(request, maxBytes);
  try { return JSON.parse(raw); } catch { return null; }
}
