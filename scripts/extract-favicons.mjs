import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const zipPath = path.resolve("favicon_io.zip");
const outDir = path.resolve("public");

if (!fs.existsSync(zipPath)) {
  console.warn("[favicons] favicon_io.zip not found; skipping extraction.");
  process.exit(0);
}

fs.mkdirSync(outDir, { recursive: true });
const buf = fs.readFileSync(zipPath);

function findEOCD(buffer) {
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) return i;
  }
  throw new Error("End of central directory not found");
}

const eocd = findEOCD(buf);
const totalEntries = buf.readUInt16LE(eocd + 10);
let cursor = buf.readUInt32LE(eocd + 16);

for (let i = 0; i < totalEntries; i++) {
  if (buf.readUInt32LE(cursor) !== 0x02014b50) throw new Error("Invalid central directory entry");

  const method = buf.readUInt16LE(cursor + 10);
  const compressedSize = buf.readUInt32LE(cursor + 20);
  const fileNameLength = buf.readUInt16LE(cursor + 28);
  const extraLength = buf.readUInt16LE(cursor + 30);
  const commentLength = buf.readUInt16LE(cursor + 32);
  const localHeaderOffset = buf.readUInt32LE(cursor + 42);
  const fileName = buf.subarray(cursor + 46, cursor + 46 + fileNameLength).toString("utf8");

  cursor += 46 + fileNameLength + extraLength + commentLength;
  if (!fileName || fileName.endsWith("/")) continue;

  if (buf.readUInt32LE(localHeaderOffset) !== 0x04034b50) throw new Error("Invalid local file header");
  const localNameLength = buf.readUInt16LE(localHeaderOffset + 26);
  const localExtraLength = buf.readUInt16LE(localHeaderOffset + 28);
  const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
  const compressed = buf.subarray(dataStart, dataStart + compressedSize);

  let output;
  if (method === 0) output = compressed;
  else if (method === 8) output = zlib.inflateRawSync(compressed);
  else {
    console.warn(`[favicons] Unsupported compression method ${method} for ${fileName}; skipping.`);
    continue;
  }

  const safeName = path.basename(fileName);
  const allowed = new Set([
    "favicon.ico",
    "favicon-16x16.png",
    "favicon-32x32.png",
    "apple-touch-icon.png",
    "android-chrome-192x192.png",
    "android-chrome-512x512.png",
    "site.webmanifest"
  ]);

  if (!allowed.has(safeName)) continue;
  fs.writeFileSync(path.join(outDir, safeName), output);
  console.log(`[favicons] extracted ${safeName}`);
}
