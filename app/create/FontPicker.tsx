"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

type FontItem = { family: string; category?: string };

function ensureFontLoaded(family: string) {
  const id = `rup-font-${family.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
}

export function FontPicker({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (font: string) => void;
}) {
  const [fonts, setFonts] = useState<FontItem[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/fonts")
      .then((r) => r.json())
      .then((data) => setFonts(data.fonts || []))
      .catch(() => setFonts([]));
  }, []);

  useEffect(() => {
    if (value) ensureFontLoaded(value);
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? fonts.filter((f) => f.family.toLowerCase().includes(q)) : fonts;
    return list.slice(0, 120);
  }, [fonts, query]);

  function pick(font: string) {
    ensureFontLoaded(font);
    onChange(font);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="font-picker">
      <button
        type="button"
        className="font-picker-trigger"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        style={{ fontFamily: value ? `"${value}", sans-serif` : undefined }}
      >
        {value || "Choose Google Font"}
      </button>
      {open && !disabled && (
        <div className="font-picker-popover">
          <label>
            <Search size={14} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Google Fonts…"
            />
          </label>
          <div className="font-picker-list">
            {filtered.map((font) => (
              <button
                type="button"
                key={font.family}
                onMouseEnter={() => ensureFontLoaded(font.family)}
                onClick={() => pick(font.family)}
              >
                <span style={{ fontFamily: `"${font.family}", sans-serif` }}>{font.family}</span>
                <small>{font.category || ""}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
