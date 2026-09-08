"use client";

import { useRef, useState } from "react";
import {
  Bold,
  Copy,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RotateCw,
  Trash2,
  Crosshair,
  Palette,
  Type,
  Upload,
  Layers,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
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
  basePrice: number;
  colors: string[];
  sizes: string[];
  images: string[];
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
  const canvasRef = useRef<HTMLDivElement>(null);

  const [productId, setProductId] = useState(initialProductId);
  const product = products.find((p) => p.id === productId)!;

  const [color, setColor] = useState(product.colors[0]);
  const [size, setSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [side, setSide] = useState<"front" | "back">("front");
  const [design, setDesign] = useState<DesignSides>({ front: [], back: [] });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [textDraft, setTextDraft] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [added, setAdded] = useState(false);

  const layers = design[side];
  const selected = layers.find((l) => l.id === selectedId) ?? null;

  function updateLayers(updater: (layers: DesignLayer[]) => DesignLayer[]) {
    setDesign((prev) => ({ ...prev, [side]: updater(prev[side]) }));
  }

  function selectProduct(id: string) {
    const next = products.find((p) => p.id === id)!;
    setProductId(id);
    setColor(next.colors[0]);
    setSize(next.sizes[0]);
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
      color: "#111111",
      fontSize: 22,
    };
    updateLayers((ls) => [...ls, layer]);
    setSelectedId(layer.id);
    setTextDraft("");
  }

  function updateSelectedText(patch: Partial<TextLayer>) {
    if (!selected || selected.type !== "text") return;
    updateLayers((ls) =>
      ls.map((l) => (l.id === selected.id && l.type === "text" ? { ...l, ...patch } : l))
    );
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
        widthPct: 45,
      };
      updateLayers((ls) => [...ls, layer]);
      setSelectedId(layer.id);
    };
    reader.readAsDataURL(file);
  }

  function duplicateSelected() {
    if (!selected) return;
    const copy: DesignLayer =
      selected.type === "text"
        ? { ...selected, id: newId(), x: selected.x + 4, y: selected.y + 4 }
        : { ...selected, id: newId(), x: selected.x + 4, y: selected.y + 4 };
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
      ls.map((l) => (l.id === selected.id ? { ...l, rotation: (l.rotation + 15) % 360 } : l))
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
    const container = canvasRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    function onMove(moveEvent: PointerEvent) {
      const x = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const y = ((moveEvent.clientY - rect.top) / rect.height) * 100;
      updateLayers((ls) =>
        ls.map((l) =>
          l.id === layerId
            ? { ...l, x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) }
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

  function handleAddToCart() {
    cart.addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0],
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
    <div className="designer-page">
      {/* Left: tools */}
      <div className="designer-panel">
        <div className="designer-field">
          <h4>
            <Layers size={14} /> Product Type
          </h4>
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
              <div
                key={c}
                className={`color-swatch ${color === c ? "selected" : ""}`}
                style={{ background: swatchColor(c) }}
                title={c}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        <div className="designer-field">
          <h4>
            <Upload size={14} /> Upload Artwork
          </h4>
          <label className="upload-box">
            Click to upload or drag and drop
            <br />
            PNG, JPG, SVG (max 5MB)
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = "";
              }}
            />
          </label>
          {uploadError && (
            <p style={{ color: "var(--red)", fontSize: 11 }}>{uploadError}</p>
          )}
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

      {/* Center: canvas */}
      <div className="designer-canvas-wrap">
        <div className="designer-canvas-tabs">
          <button className={side === "front" ? "active" : ""} onClick={() => setSide("front")}>
            Front
          </button>
          <button className={side === "back" ? "active" : ""} onClick={() => setSide("back")}>
            Back
          </button>
        </div>
        <div className="designer-canvas" onPointerDown={() => setSelectedId(null)}>
          <img className="mockup" src={product.images[0]} alt={product.name} />
          <div className="print-area" ref={canvasRef}>
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
        <div className="admin-toolbar" style={{ justifyContent: "center" }}>
          <button
            className="admin-link-button"
            disabled={!selected}
            onClick={duplicateSelected}
            type="button"
          >
            <Copy size={13} /> Duplicate
          </button>
          <button
            className="admin-link-button"
            disabled={!selected}
            onClick={deleteSelected}
            type="button"
          >
            <Trash2 size={13} /> Delete
          </button>
          <button
            className="admin-link-button"
            disabled={!selected}
            onClick={rotateSelected}
            type="button"
          >
            <RotateCw size={13} /> Rotate
          </button>
          <button
            className="admin-link-button"
            disabled={!selected}
            onClick={centerSelected}
            type="button"
          >
            <Crosshair size={13} /> Center
          </button>
        </div>
      </div>

      {/* Right: summary */}
      <div className="summary-panel">
        <h3>Your Design</h3>
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
        <button className="button button-red" onClick={handleAddToCart} type="button">
          {added ? "Added to Cart ✓" : "Add to Cart"}
        </button>
        <a className="button button-outline" href="/#quote">
          Get a Custom Quote
        </a>
      </div>
    </div>
  );
}

function swatchColor(name: string): string {
  const map: Record<string, string> = {
    White: "#ffffff",
    Black: "#111111",
    Grey: "#9a9a9a",
    Navy: "#1c2a4a",
    Red: "#c91418",
    Sand: "#dcd3c0",
  };
  return map[name] ?? "#cccccc";
}
