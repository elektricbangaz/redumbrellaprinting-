"use client";

import { useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Copy,
  Crosshair,
  Italic,
  Layers,
  Palette,
  RotateCw,
  Trash2,
  Type,
  Upload,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { PremiumGarmentViewer } from "./PremiumGarmentViewer";
import { formatJMD } from "@/lib/money";
import {
  DesignLayer,
  DesignSides,
  FONT_OPTIONS,
  ImageLayer,
  TextLayer,
} from "@/lib/designer-types";

type ProductOption = {
  id: string;
  name: string;
  slug: string;
  category?: string;
  basePrice: number;
  colors: string[];
  sizes: string[];
  images: string[];
  quoteOnly?: boolean;
};

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function newId() {
  return crypto.randomUUID();
}

export function DesignerApp({
  products,
  initialProductId,
}: {
  products: ProductOption[];
  initialProductId: string;
}) {
  const cart = useCart();
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [productId, setProductId] = useState(initialProductId);
  const product = products.find((p) => p.id === productId) || products[0];

  const [color, setColor] = useState(product.colors[0]);
  const [size, setSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [side, setSide] = useState<"front" | "back">("front");
  const [design, setDesign] = useState<DesignSides>({ front: [], back: [] });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [textDraft, setTextDraft] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [added, setAdded] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [toolsOpen, setToolsOpen] = useState(false);

  const layers = design[side];
  const selected = layers.find((l) => l.id === selectedId) ?? null;
  const isApparel3D = ["standard-t-shirt", "polo-shirt", "pullover-hoodie"].includes(product.slug);
  const smartTextColor = contrastTextColor(color);

  function updateLayers(updater: (layers: DesignLayer[]) => DesignLayer[]) {
    setDesign((prev) => ({ ...prev, [side]: updater(prev[side]) }));
  }

  function selectProduct(id: string) {
    const next = products.find((p) => p.id === id)!;
    setProductId(id);
    const nextColor = next.colors[0];
    setColor(nextColor);
    setSize(next.sizes[0]);
    setDesign((prev) => ({
      front: prev.front.map((l) => l.type === "text" ? { ...l, color: contrastTextColor(nextColor) } : l),
      back: prev.back.map((l) => l.type === "text" ? { ...l, color: contrastTextColor(nextColor) } : l),
    }));
    setImageIndex(0);
    setSelectedId(null);
  }

  function addText() {
    if (!textDraft.trim()) return;
    const layer: TextLayer = {
      id: newId(),
      type: "text",
      x: 50,
      y: 50,
      rotation: 0,
      content: textDraft,
      fontFamily: "Montserrat",
      bold: false,
      italic: false,
      align: "center",
      color: smartTextColor,
      fontSize: 28,
    };
    updateLayers((ls) => [...ls, layer]);
    setSelectedId(layer.id);
    setTextDraft("");
  }

  function updateSelectedText(patch: Partial<TextLayer>) {
    if (!selected || selected.type !== "text") return;
    updateLayers((ls) =>
      ls.map((l) =>
        l.id === selected.id && l.type === "text" ? { ...l, ...patch } : l
      )
    );
  }

  function updateSelectedImage(patch: Partial<ImageLayer>) {
    if (!selected || selected.type !== "image") return;
    updateLayers((ls) =>
      ls.map((l) =>
        l.id === selected.id && l.type === "image" ? { ...l, ...patch } : l
      )
    );
  }

  function selectColor(nextColor: string) {
    setColor(nextColor);
    const nextText = contrastTextColor(nextColor);
    setDesign((prev) => ({
      front: prev.front.map((l) => l.type === "text" ? { ...l, color: nextText } : l),
      back: prev.back.map((l) => l.type === "text" ? { ...l, color: nextText } : l),
    }));
  }

  function handleUpload(file: File) {
    setUploadError("");
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError("File too large — please upload artwork under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const layer: ImageLayer = {
        id: newId(),
        type: "image",
        x: 50,
        y: 50,
        rotation: 0,
        src: reader.result as string,
        widthPct: 52,
      };
      updateLayers((ls) => [...ls, layer]);
      setSelectedId(layer.id);
    };
    reader.readAsDataURL(file);
  }

  function duplicateSelected() {
    if (!selected) return;
    const copy: DesignLayer = {
      ...selected,
      id: newId(),
      x: Math.min(96, selected.x + 4),
      y: Math.min(96, selected.y + 4),
    };
    updateLayers((ls) => [...ls, copy]);
    setSelectedId(copy.id);
  }

  function deleteSelected() {
    if (!selected) return;
    updateLayers((ls) => ls.filter((l) => l.id !== selected.id));
    setSelectedId(null);
  }

  function rotateSelected() {
    if (!selected) return;
    updateLayers((ls) =>
      ls.map((l) =>
        l.id === selected.id ? { ...l, rotation: (l.rotation + 15) % 360 } : l
      )
    );
  }

  function centerSelected() {
    if (!selected) return;
    updateLayers((ls) =>
      ls.map((l) => (l.id === selected.id ? { ...l, x: 50, y: 50 } : l))
    );
  }

  function startDrag(e: React.PointerEvent, layerId: string) {
    e.stopPropagation();
    setSelectedId(layerId);
    const container = printAreaRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    function onMove(moveEvent: PointerEvent) {
      const x = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const y = ((moveEvent.clientY - rect.top) / rect.height) * 100;
      updateLayers((ls) =>
        ls.map((l) =>
          l.id === layerId
            ? {
                ...l,
                x: Math.min(100, Math.max(0, x)),
                y: Math.min(100, Math.max(0, y)),
              }
            : l
        )
      );
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  const hasDesign = design.front.length > 0 || design.back.length > 0;
  const price = product.basePrice * quantity;
  const quoteOnly = Boolean(product.quoteOnly || product.basePrice <= 0);

  function handlePrimaryAction() {
    if (quoteOnly) {
      window.sessionStorage.setItem(
        "rup_quote_design",
        JSON.stringify({
          product: product.slug,
          productName: product.name,
          color,
          size,
          quantity,
          design,
        })
      );
      window.location.href = `/quote?product=${encodeURIComponent(product.slug)}`;
      return;
    }

    cart.addItem({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      productImage: product.images[imageIndex] || product.images[0],
      color,
      size,
      quantity,
      unitPrice: product.basePrice,
      design: hasDesign
        ? { canvasData: design, previewImage: null }
        : undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="designer-page designer-v3">
      <div className={`designer-panel ${toolsOpen ? "mobile-open" : ""}`}>
        <button type="button" className="designer-mobile-close" onClick={() => setToolsOpen(false)} aria-label="Close design tools">×</button>
        <div className="designer-field product-picker">
          <h4>
            <Layers size={14} /> Choose Product
          </h4>
          <div className="product-visual-grid">
            {products.map((p) => (
              <button
                type="button"
                key={p.id}
                className={p.id === productId ? "selected" : ""}
                onClick={() => selectProduct(p.id)}
                title={p.name}
              >
                <img src={p.images[0]} alt="" />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
          <select value={productId} onChange={(e) => selectProduct(e.target.value)}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="designer-field">
          <h4>
            <Palette size={14} /> Color
          </h4>
          <div className="color-swatches">
            {product.colors.map((c) => (
              <button
                type="button"
                key={c}
                className={`color-swatch ${color === c ? "selected" : ""}`}
                style={{ background: swatchColor(c) }}
                title={c}
                onClick={() => selectColor(c)}
                aria-label={`Select ${c}`}
              />
            ))}
          </div>
          <div className="smart-color-note">
            <span className="smart-color-chip" style={{ background: smartTextColor }} />
            Smart text colour: <strong>{smartTextColor.toUpperCase()}</strong>
          </div>
        </div>

        <div className="designer-field">
          <h4>
            <Upload size={14} /> Upload Artwork
          </h4>
          <label className="upload-box">
            Click to upload or drag and drop
            <br />
            PNG, JPG, WEBP, SVG (max 5MB)
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = "";
              }}
            />
          </label>
          {uploadError && <p className="designer-error">{uploadError}</p>}
        </div>

        <div className="designer-field">
          <h4>
            <Type size={14} /> Add Text
          </h4>
          <input
            type="text"
            placeholder="Your text here..."
            value={selected?.type === "text" ? selected.content : textDraft}
            onChange={(e) =>
              selected?.type === "text"
                ? updateSelectedText({ content: e.target.value })
                : setTextDraft(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && selected?.type !== "text") addText();
            }}
          />
          {selected?.type !== "text" && (
            <button className="button button-outline" onClick={addText} type="button">
              Add Text Layer
            </button>
          )}
          <select
            value={selected?.type === "text" ? selected.fontFamily : "Montserrat"}
            onChange={(e) => updateSelectedText({ fontFamily: e.target.value })}
            disabled={selected?.type !== "text"}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          {selected?.type === "text" && (
            <label className="designer-range">
              <span>Text size</span>
              <input
                type="range"
                min="12"
                max="72"
                value={selected.fontSize}
                onChange={(e) => updateSelectedText({ fontSize: Number(e.target.value) })}
              />
            </label>
          )}

          {selected?.type === "image" && (
            <label className="designer-range">
              <span>Artwork size</span>
              <input
                type="range"
                min="15"
                max="95"
                value={selected.widthPct}
                onChange={(e) => updateSelectedImage({ widthPct: Number(e.target.value) })}
              />
            </label>
          )}

          {selected && (
            <div className="designer-position-grid">
              <label className="designer-range">
                <span>Left / right</span>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={selected.x}
                  onChange={(e) => updateLayers((ls) => ls.map((l) => l.id === selected.id ? { ...l, x: Number(e.target.value) } : l))}
                />
              </label>
              <label className="designer-range">
                <span>Up / down</span>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={selected.y}
                  onChange={(e) => updateLayers((ls) => ls.map((l) => l.id === selected.id ? { ...l, y: Number(e.target.value) } : l))}
                />
              </label>
            </div>
          )}

          <div className="text-toolbar">
            <button
              type="button"
              className={selected?.type === "text" && selected.bold ? "active" : ""}
              disabled={selected?.type !== "text"}
              onClick={() => updateSelectedText({ bold: !(selected as TextLayer)?.bold })}
            >
              <Bold size={14} />
            </button>
            <button
              type="button"
              className={selected?.type === "text" && selected.italic ? "active" : ""}
              disabled={selected?.type !== "text"}
              onClick={() => updateSelectedText({ italic: !(selected as TextLayer)?.italic })}
            >
              <Italic size={14} />
            </button>
            <button
              type="button"
              className={selected?.type === "text" && selected.align === "left" ? "active" : ""}
              disabled={selected?.type !== "text"}
              onClick={() => updateSelectedText({ align: "left" })}
            >
              <AlignLeft size={14} />
            </button>
            <button
              type="button"
              className={selected?.type === "text" && selected.align === "center" ? "active" : ""}
              disabled={selected?.type !== "text"}
              onClick={() => updateSelectedText({ align: "center" })}
            >
              <AlignCenter size={14} />
            </button>
            <button
              type="button"
              className={selected?.type === "text" && selected.align === "right" ? "active" : ""}
              disabled={selected?.type !== "text"}
              onClick={() => updateSelectedText({ align: "right" })}
            >
              <AlignRight size={14} />
            </button>
          </div>
        </div>

        <div className="designer-field">
          <h4>Quantity</h4>
          <div className="qty-control">
            <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
              −
            </button>
            <input
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            />
            <button type="button" onClick={() => setQuantity((q) => q + 1)}>
              +
            </button>
          </div>
        </div>
      </div>

      <div className="designer-mobile-quick">
        <label>
          <span>Product</span>
          <select value={productId} onChange={(e) => selectProduct(e.target.value)}>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <div className="mobile-colors">
          <span>Colour</span>
          <div className="color-swatches">
            {product.colors.map((c) => (
              <button
                type="button"
                key={c}
                className={`color-swatch ${color === c ? "selected" : ""}`}
                style={{ background: swatchColor(c) }}
                onClick={() => selectColor(c)}
                aria-label={`Select ${c}`}
              />
            ))}
          </div>
        </div>
        <button type="button" className="designer-mobile-tools-toggle" onClick={() => setToolsOpen(true)}>
          Design tools
        </button>
      </div>

      <div className="designer-canvas-wrap">
        <div className="designer-canvas-topline">
          <div className="designer-canvas-tabs">
            <button className={side === "front" ? "active" : ""} onClick={() => setSide("front")}>
              Front
            </button>
            <button className={side === "back" ? "active" : ""} onClick={() => setSide("back")}>
              Back
            </button>
          </div>
          <span className="designer-3d-hint">Drag to rotate • Scroll to zoom</span>
        </div>

        <div className={`designer-canvas ${isApparel3D ? "designer-canvas-true3d" : ""}`} onPointerDown={() => setSelectedId(null)}>
          {isApparel3D ? (
            <PremiumGarmentViewer
              productSlug={product.slug}
              colorName={color}
              side={side}
              design={design}
              className="three-shirt-viewer"
            />
          ) : (
            <div className={`garment-stage garment-${product.slug}`}>
              <img
                className="mockup"
                src={product.images[imageIndex] || product.images[0]}
                alt={product.name}
              />
              <div
                className={`print-area print-area-${product.slug} print-side-${side}`}
                ref={printAreaRef}
              >
                <div className="fabric-light" aria-hidden="true" />
                {layers.map((layer) => (
                  <div
                    key={layer.id}
                    className={`design-layer ${selectedId === layer.id ? "selected" : ""}`}
                    style={{
                      left: `${layer.x}%`,
                      top: `${layer.y}%`,
                      transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
                      width: layer.type === "image" ? `${layer.widthPct}%` : "auto",
                    }}
                    onPointerDown={(e) => startDrag(e, layer.id)}
                  >
                    {layer.type === "text" ? (
                      <span
                        className="design-layer-text"
                        style={{
                          fontFamily: layer.fontFamily,
                          fontWeight: layer.bold ? 800 : 500,
                          fontStyle: layer.italic ? "italic" : "normal",
                          textAlign: layer.align,
                          color: layer.color,
                          fontSize: layer.fontSize,
                        }}
                      >
                        {layer.content}
                      </span>
                    ) : (
                      <img src={layer.src} alt="Uploaded artwork" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="admin-toolbar designer-actions">
          <button className="admin-link-button" disabled={!selected} onClick={duplicateSelected} type="button">
            <Copy size={13} /> Duplicate
          </button>
          <button className="admin-link-button" disabled={!selected} onClick={deleteSelected} type="button">
            <Trash2 size={13} /> Delete
          </button>
          <button className="admin-link-button" disabled={!selected} onClick={rotateSelected} type="button">
            <RotateCw size={13} /> Rotate
          </button>
          <button className="admin-link-button" disabled={!selected} onClick={centerSelected} type="button">
            <Crosshair size={13} /> Center
          </button>
        </div>
      </div>

      <div className="summary-panel">
        <div className="summary-product-preview">
          <img src={product.images[imageIndex] || product.images[0]} alt="" />
          <div>
            <small>{product.category || "Product"}</small>
            <strong>{product.name}</strong>
          </div>
        </div>

        {product.images.length > 1 && (
          <div className="summary-image-picker">
            {product.images.map((src, index) => (
              <button
                type="button"
                className={index === imageIndex ? "selected" : ""}
                key={src}
                onClick={() => setImageIndex(index)}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        )}

        <div className="designer-field">
          <h4>Size</h4>
          <select value={size} onChange={(e) => setSize(e.target.value)}>
            {product.sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {quoteOnly ? (
          <div className="quote-required-note">
            This item needs production dimensions/specifications before final pricing.
          </div>
        ) : (
          <>
            <div className="summary-row">
              <span>Item price</span>
              <span>{formatJMD(product.basePrice)}</span>
            </div>
            <div className="summary-row">
              <span>Quantity ({quantity})</span>
              <span>{formatJMD(price)}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>{formatJMD(price)}</span>
            </div>
          </>
        )}

        <button className="button button-red" onClick={handlePrimaryAction} type="button">
          {quoteOnly ? "Continue to Custom Quote" : added ? "Added to Cart ✓" : "Add to Cart"}
        </button>

        {!quoteOnly && (
          <a className="button button-outline" href="/quote">
            Get a Custom Quote
          </a>
        )}
      </div>
    </div>
  );
}

function contrastTextColor(name: string): string {
  const hex = swatchColor(name);
  if (!hex.startsWith("#")) return "#ffffff";
  const clean = hex.slice(1);
  const normalized = clean.length === 3 ? clean.split("").map((x) => x + x).join("") : clean;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (name === "Red") return "#ffd84a";
  if (name === "Navy" || name === "Black") return "#ffffff";
  return luminance > 0.58 ? "#111111" : "#ffffff";
}

function swatchColor(name: string): string {
  const map: Record<string, string> = {
    White: "#ffffff",
    Black: "#111111",
    Grey: "#9a9a9a",
    Navy: "#1c2a4a",
    Red: "#c91418",
    Sand: "#dcd3c0",
    Gold: "#aa7b35",
    Custom: "linear-gradient(135deg,#111 0 33%,#d20d14 33% 66%,#efefef 66%)",
  };
  return map[name] ?? "#cccccc";
}
