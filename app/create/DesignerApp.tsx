"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Copy,
  Crosshair,
  Eye,
  Italic,
  Layers,
  Move,
  Palette,
  RotateCw,
  Trash2,
  Type,
  Upload,
} from "lucide-react";
import { formatJMD } from "@/lib/money";
import type { DesignLayer, DesignSides, ImageLayer, TextLayer } from "@/lib/designer-types";
import { PremiumGarmentViewer } from "./PremiumGarmentViewer";
import { CylindricalProductViewer } from "./CylindricalProductViewer";
import { FlatProductPreview } from "./FlatProductPreview";
import { DesignOverlay } from "./DesignOverlay";
import { FontPicker } from "./FontPicker";
import { CompleteDesignModal } from "./CompleteDesignModal";
import { dimensionsFromLabel, renderFlatMockup, renderLayersToDataUrl } from "@/lib/design-export";

type ProductOption = {
  id: string;
  name: string;
  slug: string;
  category?: string;
  description?: string;
  basePrice: number;
  colors: string[];
  sizes: string[];
  images: string[];
  quoteOnly?: boolean;
  previewMode?: "apparel3d" | "cylinder3d" | "flat" | "vehicle";
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
  const initial = products.find((p) => p.id === initialProductId) || products[0];

  const [productId, setProductId] = useState(initial.id);
  const product = products.find((p) => p.id === productId) || products[0];
  const [color, setColor] = useState(initial.colors[0] || "White");
  const [customColor, setCustomColor] = useState(normalizeColor(initial.colors[0] || "White"));
  const [size, setSize] = useState(initial.sizes[0] || "Standard");
  const [quantity, setQuantity] = useState(1);
  const [side, setSide] = useState<"front" | "back">("front");
  const [design, setDesign] = useState<DesignSides>({ front: [], back: [] });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [textDraft, setTextDraft] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [toolsOpen, setToolsOpen] = useState(false);
  const [editMode, setEditMode] = useState(true);
  const [previewImage, setPreviewImage] = useState("");
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeBusy, setCompleteBusy] = useState(false);
  const [completeError, setCompleteError] = useState("");
  const [reference, setReference] = useState("");

  const layers = design[side];
  const selected = layers.find((l) => l.id === selectedId) ?? null;
  const previewMode = product.previewMode || (["standard-t-shirt", "polo-shirt", "pullover-hoodie"].includes(product.slug) ? "apparel3d" : "flat");
  const quoteOnly = Boolean(product.quoteOnly || product.basePrice <= 0);
  const price = product.basePrice * quantity;
  const smartTextColor = contrastTextColor(customColor);

  const flatRatio = useMemo(() => dimensionsFromLabel(size)?.aspectRatio || (previewMode === "vehicle" ? 2.2 : 1.5), [size, previewMode]);

  function updateLayers(updater: (layers: DesignLayer[]) => DesignLayer[]) {
    setDesign((prev) => ({ ...prev, [side]: updater(prev[side]) }));
  }

  function updateLayer(id: string, patch: Partial<DesignLayer>) {
    updateLayers((ls) => ls.map((layer) => layer.id === id ? ({ ...layer, ...patch } as DesignLayer) : layer));
  }

  function selectProduct(id: string) {
    const next = products.find((p) => p.id === id);
    if (!next) return;
    setProductId(id);
    const nextColor = next.colors[0] || "White";
    setColor(nextColor);
    setCustomColor(normalizeColor(nextColor));
    setSize(next.sizes[0] || "Standard");
    setSelectedId(null);
    setPreviewImage("");
    setEditMode(true);
  }

  function selectGarmentColor(nextColor: string) {
    setColor(nextColor);
    const hex = normalizeColor(nextColor);
    setCustomColor(hex);
    applySmartContrast(hex);
  }

  function selectCustomGarmentColor(hex: string) {
    setColor(hex);
    setCustomColor(hex);
    applySmartContrast(hex);
  }

  function applySmartContrast(hex: string) {
    const nextText = contrastTextColor(hex);
    setDesign((prev) => ({
      front: prev.front.map((l) => l.type === "text" ? { ...l, color: nextText } : l),
      back: prev.back.map((l) => l.type === "text" ? { ...l, color: nextText } : l),
    }));
  }

  function addText() {
    if (!textDraft.trim()) return;
    const layer: TextLayer = {
      id: newId(),
      type: "text",
      x: 50,
      y: 50,
      rotation: 0,
      content: textDraft.trim(),
      fontFamily: "Montserrat",
      bold: false,
      italic: false,
      align: "center",
      color: smartTextColor,
      fontSize: 30,
      widthPct: 42,
    };
    updateLayers((ls) => [...ls, layer]);
    setSelectedId(layer.id);
    setTextDraft("");
    setEditMode(true);
  }

  function updateSelectedText(patch: Partial<TextLayer>) {
    if (!selected || selected.type !== "text") return;
    updateLayer(selected.id, patch as Partial<DesignLayer>);
  }

  function updateSelectedImage(patch: Partial<ImageLayer>) {
    if (!selected || selected.type !== "image") return;
    updateLayer(selected.id, patch as Partial<DesignLayer>);
  }

  function handleUpload(file: File) {
    setUploadError("");
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError("File too large — upload artwork under 5MB.");
      return;
    }
    if (!/image\/(png|jpeg|webp|svg\+xml)/.test(file.type)) {
      setUploadError("Use PNG, JPG, WEBP or SVG artwork.");
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
        widthPct: 46,
      };
      updateLayers((ls) => [...ls, layer]);
      setSelectedId(layer.id);
      setEditMode(true);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }

  function duplicateSelected() {
    if (!selected) return;
    const copy = { ...selected, id: newId(), x: Math.min(95, selected.x + 4), y: Math.min(95, selected.y + 4) } as DesignLayer;
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
    updateLayer(selected.id, { rotation: (selected.rotation + 15) % 360 });
  }

  function centerSelected() {
    if (!selected) return;
    updateLayer(selected.id, { x: 50, y: 50 });
  }

  async function submitCompletedDesign(customer: { name: string; email: string; phone: string }) {
    setCompleteBusy(true);
    setCompleteError("");
    try {
      const frontExport = await renderLayersToDataUrl(design.front);
      const backExport = await renderLayersToDataUrl(design.back);

      let finalPreview = previewImage;
      if (!finalPreview && (previewMode === "flat" || previewMode === "vehicle")) {
        finalPreview = await renderFlatMockup({
          baseImage: product.images[0],
          layers: design.front,
          aspectRatio: flatRatio,
        });
      }

      const res = await fetch("/api/designs/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          productSlug: product.slug,
          productName: product.name,
          color: customColor,
          size,
          quantity,
          design,
          frontExport,
          backExport,
          previewImage: finalPreview || undefined,
          customer,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to save design.");
      setReference(data.reference);
    } catch (error) {
      setCompleteError(error instanceof Error ? error.message : "Unable to save design.");
    } finally {
      setCompleteBusy(false);
    }
  }

  const livePreview = (
    <>
      {previewMode === "apparel3d" && (
        <>
          <PremiumGarmentViewer
            productSlug={product.slug}
            colorName={customColor}
            side={side}
            design={design}
            interactive={!editMode}
            onPreviewChange={setPreviewImage}
            className="premium-garment-viewer"
          />
          {editMode && (
            <div className="design-edit-overlay apparel-edit-zone">
              <DesignOverlay layers={layers} selectedId={selectedId} onSelect={setSelectedId} onChange={updateLayer} />
            </div>
          )}
        </>
      )}

      {previewMode === "cylinder3d" && (
        <>
          <CylindricalProductViewer
            productSlug={product.slug}
            colorName={customColor}
            side={side}
            design={design}
            interactive={!editMode}
            onPreviewChange={setPreviewImage}
          />
          {editMode && (
            <div className="design-edit-overlay cylinder-edit-zone">
              <DesignOverlay layers={layers} selectedId={selectedId} onSelect={setSelectedId} onChange={updateLayer} />
            </div>
          )}
        </>
      )}

      {(previewMode === "flat" || previewMode === "vehicle") && (
        <FlatProductPreview
          productSlug={product.slug}
          image={product.images[0]}
          size={size}
          layers={layers}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onChange={updateLayer}
        />
      )}
    </>
  );

  return (
    <>
      <div className="designer-page designer-v4">
        <aside className={`designer-panel ${toolsOpen ? "mobile-open" : ""}`}>
          <button type="button" className="designer-mobile-close" onClick={() => setToolsOpen(false)} aria-label="Close design tools">×</button>

          <div className="designer-field product-picker">
            <h4><Layers size={14} /> Choose Product</h4>
            <motion.div className="product-visual-grid" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {products.map((p) => (
                <button type="button" key={p.id} className={p.id === productId ? "selected" : ""} onClick={() => selectProduct(p.id)}>
                  <img src={p.images[0]} alt="" />
                  <span>{p.name}</span>
                </button>
              ))}
            </motion.div>
          </div>

          <div className="designer-field">
            <h4><Palette size={14} /> Product Colour</h4>
            <div className="color-swatches">
              {product.colors.filter((c) => c !== "Custom").map((c) => (
                <button
                  type="button"
                  key={c}
                  className={`color-swatch ${color === c ? "selected" : ""}`}
                  style={{ background: normalizeColor(c) }}
                  onClick={() => selectGarmentColor(c)}
                  title={c}
                />
              ))}
              <label className="full-color-picker" title="Choose any colour">
                <input type="color" value={customColor} onChange={(e) => selectCustomGarmentColor(e.target.value)} />
                <span>+</span>
              </label>
            </div>
            <div className="color-value-row">
              <input value={customColor} onChange={(e) => /^#[0-9a-f]{6}$/i.test(e.target.value) && selectCustomGarmentColor(e.target.value)} />
              <span style={{ background: customColor }} />
            </div>
          </div>

          <div className="designer-field">
            <h4><Upload size={14} /> Upload Artwork</h4>
            <label
              className="upload-box upload-box-live"
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("drag-active"); }}
              onDragLeave={(e) => e.currentTarget.classList.remove("drag-active")}
              onDrop={(e) => { e.currentTarget.classList.remove("drag-active"); handleDrop(e); }}
            >
              <Upload size={24} />
              <strong>Drop artwork here</strong>
              <span>or click to browse — PNG, JPG, WEBP, SVG</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
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
            <h4><Type size={14} /> Add Text</h4>
            <div className="text-add-row">
              <input
                type="text"
                placeholder="Type your text…"
                value={selected?.type === "text" ? selected.content : textDraft}
                onChange={(e) => selected?.type === "text" ? updateSelectedText({ content: e.target.value }) : setTextDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && selected?.type !== "text") addText(); }}
              />
              {selected?.type !== "text" && <button type="button" onClick={addText}>Add</button>}
            </div>

            <FontPicker
              value={selected?.type === "text" ? selected.fontFamily : "Montserrat"}
              disabled={selected?.type !== "text"}
              onChange={(fontFamily) => updateSelectedText({ fontFamily })}
            />

            {selected?.type === "text" && (
              <>
                <div className="text-style-grid">
                  <label>
                    <span>Text colour</span>
                    <input type="color" value={selected.color} onChange={(e) => updateSelectedText({ color: e.target.value })} />
                  </label>
                  <label>
                    <span>Size</span>
                    <input type="range" min="12" max="96" value={selected.fontSize} onChange={(e) => updateSelectedText({ fontSize: Number(e.target.value) })} />
                  </label>
                  <label>
                    <span>Wrap width</span>
                    <input type="range" min="12" max="90" value={selected.widthPct ?? 42} onChange={(e) => updateSelectedText({ widthPct: Number(e.target.value) })} />
                  </label>
                </div>
              </>
            )}

            {selected?.type === "image" && (
              <label className="designer-range">
                <span>Artwork size</span>
                <input type="range" min="8" max="95" value={selected.widthPct} onChange={(e) => updateSelectedImage({ widthPct: Number(e.target.value) })} />
              </label>
            )}

            <div className="text-toolbar">
              <button type="button" disabled={selected?.type !== "text"} className={selected?.type === "text" && selected.bold ? "active" : ""} onClick={() => updateSelectedText({ bold: !selected?.bold })}><Bold size={14} /></button>
              <button type="button" disabled={selected?.type !== "text"} className={selected?.type === "text" && selected.italic ? "active" : ""} onClick={() => updateSelectedText({ italic: !selected?.italic })}><Italic size={14} /></button>
              <button type="button" disabled={selected?.type !== "text"} onClick={() => updateSelectedText({ align: "left" })}><AlignLeft size={14} /></button>
              <button type="button" disabled={selected?.type !== "text"} onClick={() => updateSelectedText({ align: "center" })}><AlignCenter size={14} /></button>
              <button type="button" disabled={selected?.type !== "text"} onClick={() => updateSelectedText({ align: "right" })}><AlignRight size={14} /></button>
            </div>
          </div>

          <div className="designer-field">
            <h4>Quantity</h4>
            <div className="qty-control">
              <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
              <input value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} />
              <button type="button" onClick={() => setQuantity((q) => q + 1)}>+</button>
            </div>
          </div>
        </aside>

        <motion.div className="designer-mobile-quick" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <label>
            <span>Product</span>
            <select value={productId} onChange={(e) => selectProduct(e.target.value)}>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <div className="mobile-colors">
            <span>Colour</span>
            <input type="color" value={customColor} onChange={(e) => selectCustomGarmentColor(e.target.value)} />
          </div>
          <button type="button" className="designer-mobile-tools-toggle" onClick={() => setToolsOpen(true)}>Design tools</button>
        </motion.div>

        <section className="designer-canvas-wrap">
          <div className="designer-canvas-topline">
            <div className="designer-canvas-tabs">
              <button className={side === "front" ? "active" : ""} onClick={() => setSide("front")}>Front</button>
              <button className={side === "back" ? "active" : ""} onClick={() => setSide("back")}>Back</button>
            </div>
            {(previewMode === "apparel3d" || previewMode === "cylinder3d") && (
              <div className="designer-mode-toggle">
                <button type="button" className={editMode ? "active" : ""} onClick={() => setEditMode(true)}><Move size={14} /> Place design</button>
                <button type="button" className={!editMode ? "active" : ""} onClick={() => setEditMode(false)}><Eye size={14} /> Inspect 3D</button>
              </div>
            )}
          </div>

          <div className={`designer-canvas preview-${previewMode}`} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
            {livePreview}
          </div>

          <div className="admin-toolbar designer-actions">
            <button className="admin-link-button" disabled={!selected} onClick={duplicateSelected} type="button"><Copy size={13} /> Duplicate</button>
            <button className="admin-link-button" disabled={!selected} onClick={deleteSelected} type="button"><Trash2 size={13} /> Delete</button>
            <button className="admin-link-button" disabled={!selected} onClick={rotateSelected} type="button"><RotateCw size={13} /> Rotate</button>
            <button className="admin-link-button" disabled={!selected} onClick={centerSelected} type="button"><Crosshair size={13} /> Center</button>
          </div>
        </section>

        <aside className="summary-panel design-submit-panel">
          <div className="summary-product-preview">
            <img src={product.images[0]} alt="" />
            <div>
              <small>{product.category || "Product"}</small>
              <strong>{product.name}</strong>
            </div>
          </div>

          <div className="designer-field">
            <h4>{previewMode === "flat" || previewMode === "vehicle" ? "Dimensions / Template" : "Size"}</h4>
            <select value={size} onChange={(e) => setSize(e.target.value)}>
              {product.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {!quoteOnly && (
            <>
              <div className="summary-row"><span>Item price</span><span>{formatJMD(product.basePrice)}</span></div>
              <div className="summary-row"><span>Quantity ({quantity})</span><span>{formatJMD(price)}</span></div>
              <div className="summary-row total"><span>Estimate</span><span>{formatJMD(price)}</span></div>
            </>
          )}

          {quoteOnly && (
            <div className="quote-required-note">
              Final pricing follows the submitted dimensions, material and production specifications.
            </div>
          )}

          <button className="button button-red complete-design-button" type="button" onClick={() => { setReference(""); setCompleteError(""); setCompleteOpen(true); }}>
            Complete Design
          </button>

          {quoteOnly && <a className="button button-outline" href={`/quote?product=${encodeURIComponent(product.slug)}`}>Continue to Production Quote</a>}

          <p className="design-capture-note">
            Saves artwork, font, colour, placement, dimensions and final mockup for Red Umbrella production.
          </p>
        </aside>
      </div>

      <CompleteDesignModal
        open={completeOpen}
        busy={completeBusy}
        error={completeError}
        reference={reference}
        onClose={() => setCompleteOpen(false)}
        onSubmit={submitCompletedDesign}
      />
    </>
  );
}

const COLOR_MAP: Record<string, string> = {
  White: "#f7f7f4",
  Black: "#111111",
  Grey: "#9a9a9a",
  Navy: "#1c2a4a",
  Red: "#c91418",
  Sand: "#dcd3c0",
  Gold: "#aa7b35",
};

function normalizeColor(name: string) {
  if (/^#[0-9a-f]{6}$/i.test(name)) return name;
  return COLOR_MAP[name] || "#d20d14";
}

function contrastTextColor(value: string) {
  const hex = normalizeColor(value).slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.57 ? "#111111" : "#ffffff";
}
