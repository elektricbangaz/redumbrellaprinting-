import { NextResponse } from "next/server";

export const revalidate = 86400;

type GoogleFont = {
  family: string;
  category?: string;
  popularity?: number;
  variants?: string[];
};

export async function GET() {
  try {
    const res = await fetch("https://fonts.google.com/metadata/fonts", {
      next: { revalidate: 86400 },
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) throw new Error("Google Fonts metadata unavailable");

    let raw = await res.text();
    const prefix = ")]}'";
    if (raw.startsWith(prefix)) {
      raw = raw.slice(prefix.length);
      if (raw.startsWith("\n")) raw = raw.slice(1);
    }

    const json = JSON.parse(raw);
    const list: GoogleFont[] = (json.familyMetadataList || []).map((font: any) => ({
      family: font.family,
      category: font.category,
      popularity: Number(font.popularity || 9999),
      variants: Object.keys(font.fonts || {}),
    }));
    list.sort((a, b) => (a.popularity ?? 9999) - (b.popularity ?? 9999));
    return NextResponse.json({ fonts: list });
  } catch {
    return NextResponse.json({
      fonts: [
        { family: "Montserrat", category: "Sans Serif" },
        { family: "Oswald", category: "Sans Serif" },
        { family: "Roboto", category: "Sans Serif" },
        { family: "Poppins", category: "Sans Serif" },
        { family: "Bebas Neue", category: "Display" },
        { family: "Archivo Black", category: "Display" },
        { family: "Playfair Display", category: "Serif" },
        { family: "Lobster", category: "Handwriting" },
      ],
    });
  }
}
