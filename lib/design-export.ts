import type { DesignLayer } from "@/lib/designer-types";

async function loadImage(src: string) {
  return await new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function renderLayersToDataUrl(
  layers: DesignLayer[],
  {
    width = 1800,
    height = 2100,
    background = "transparent",
  }: { width?: number; height?: number; background?: string } = {}
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  if (background !== "transparent") {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }

  for (const layer of layers) {
    ctx.save();
    ctx.translate((layer.x / 100) * width, (layer.y / 100) * height);
    ctx.rotate((layer.rotation * Math.PI) / 180);

    if (layer.type === "text") {
      try {
        await document.fonts.load(`${layer.bold ? 800 : 500} ${Math.max(18, layer.fontSize)}px "${layer.fontFamily}"`);
      } catch {}
      const px = Math.max(36, layer.fontSize * 3.2);
      ctx.font = `${layer.italic ? "italic " : ""}${layer.bold ? 800 : 500} ${px}px "${layer.fontFamily}", sans-serif`;
      ctx.fillStyle = layer.color;
      ctx.textAlign = layer.align;
      ctx.textBaseline = "middle";
      const maxWidth = ((layer.widthPct ?? 44) / 100) * width;
      const lines: string[] = [];
      const paragraphs = layer.content.split(/\n/);
      for (const paragraph of paragraphs) {
        const words = paragraph.split(/\s+/).filter(Boolean);
        let line = "";
        for (const word of words) {
          const chunks: string[] = [];
          if (ctx.measureText(word).width > maxWidth) {
            let chunk = "";
            for (const char of word) {
              const testChunk = chunk + char;
              if (ctx.measureText(testChunk).width > maxWidth && chunk) {
                chunks.push(chunk);
                chunk = char;
              } else chunk = testChunk;
            }
            if (chunk) chunks.push(chunk);
          } else chunks.push(word);
          for (const chunk of chunks) {
            const test = line ? line + " " + chunk : chunk;
            if (ctx.measureText(test).width > maxWidth && line) {
              lines.push(line);
              line = chunk;
            } else line = test;
          }
        }
        if (line) {
          lines.push(line);
          line = "";
        }
        if (!words.length) lines.push("");
      }
      const lineHeight = px * 1.08;
      const startY = -((lines.length - 1) * lineHeight) / 2;
      lines.forEach((value, index) => ctx.fillText(value, 0, startY + index * lineHeight, maxWidth));
    } else {
      const img = await loadImage(layer.src);
      if (img) {
        const targetWidth = (layer.widthPct / 100) * width;
        const ratio = img.naturalWidth ? img.naturalHeight / img.naturalWidth : 1;
        const targetHeight = targetWidth * ratio;
        ctx.drawImage(img, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
      }
    }
    ctx.restore();
  }

  return canvas.toDataURL("image/png");
}

export async function renderFlatMockup({
  baseImage,
  layers,
  aspectRatio = 1.5,
  background = "#f5f5f3",
}: {
  baseImage?: string;
  layers: DesignLayer[];
  aspectRatio?: number;
  background?: string;
}) {
  const width = 1800;
  const height = Math.round(width / Math.max(0.35, Math.min(3.5, aspectRatio)));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  if (baseImage) {
    const img = await loadImage(baseImage);
    if (img) {
      const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
    }
  }

  const layerUrl = await renderLayersToDataUrl(layers, { width, height });
  const overlay = await loadImage(layerUrl);
  if (overlay) ctx.drawImage(overlay, 0, 0, width, height);
  return canvas.toDataURL("image/png");
}

export function dimensionsFromLabel(label: string) {
  const match = label.match(/(\d+)\s*[x×]\s*(\d+)/i);
  if (!match) return null;
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!width || !height) return null;
  return { width, height, aspectRatio: width / height };
}
