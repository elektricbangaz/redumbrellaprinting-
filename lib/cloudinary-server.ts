import crypto from "node:crypto";

type UploadResult = {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format?: string;
};

function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "crtuavbs";
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured. Add CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.");
  }
  return { cloudName, apiKey, apiSecret };
}

function signature(params: Record<string, string | number>, secret: string) {
  const base = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(base + secret).digest("hex");
}

export async function uploadDataUrl({
  dataUrl,
  folder,
  publicId,
  resourceType = "image",
}: {
  dataUrl: string;
  folder: string;
  publicId: string;
  resourceType?: "image" | "raw";
}) {
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const signed = { folder, public_id: publicId, timestamp };
  const form = new FormData();
  form.set("file", dataUrl);
  form.set("api_key", apiKey);
  form.set("timestamp", String(timestamp));
  form.set("folder", folder);
  form.set("public_id", publicId);
  form.set("signature", signature(signed, apiSecret));

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: "POST", body: form }
  );
  const payload = await res.json();
  if (!res.ok) throw new Error(payload?.error?.message || "Cloudinary upload failed");
  return payload as UploadResult;
}
