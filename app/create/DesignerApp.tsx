"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Box,
  ChevronLeft,
  Copy,
  Crosshair,
  Eye,
  Image as ImageIcon,
  Italic,
  Layers3,
  Move,
  Package2,
  Palette,
  RotateCw,
  Sparkles,
  Trash2,
  Type,
  Upload,
  X,
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

type ToolId = "start" | "product" | "upload" | "text" | "art" | "color" | "layers";

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
  const uploadRef = useRef<HTMLInputElement>(null);
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
  const [editMode, setEditMode] = useState(true);
  const [previewImage, setPreviewImage] = useState("");
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeBusy, setCompleteBusy] = useState(false);
  const [completeError, setCompleteError] = useState("");
  const [reference, setReference] = useState("");
  const [activeTool, setActiveTool] = useState<ToolId>("start");
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 761px)");
    const sync = () => setPanelOpen(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  const layers = design[side];
  const selected = layers.find((l) => l.id === selectedId) ?? null;
  const previewMode =
    product.previewMode ||
    (["standard-t-shirt", "polo-shirt", "pullover-hoodie"].includes(product.slug) ? "apparel3d" : "flat");
  const quoteOnly = Boolean(product.quoteOnly || product.basePrice <= 0);
  const price = product.basePrice * quantity;
  const smartTextColor = contrastTextColor(customColor);
  const flatRatio = useMemo(
    () => dimensionsFromLabel(size)?.aspectRatio || (previewMode === "vehicle" ? 2.2 : 1.5),
    [size, previewMode]
  );

  function updateLayers(updater: (layers: DesignLayer[]) => DesignLayer[]) {
    setDesign((prev) => ({ ...prev, [side]: updater(prev[side]) }));
  }

  function updateLayer(id: string, patch: Partial<DesignLayer>) {
    updateLayers((ls) =>
      ls.map((layer) => (layer.id === id ? ({ ...layer, ...patch } as DesignLayer) : layer))
    );
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

  function applySmartContrast(hex: string) {
    const nextText = contrastTextColor(hex);
    setDesign((prev) => ({
      front: prev.front.map((l) => (l.type === "text" ? { ...l, color: nextText } : l)),
      back: prev.back.map((l) => (l.type === "text" ? { ...l, color: nextText } : l)),
    }));
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
      widthPct: 32,
    };
    updateLayers((ls) => [...ls, layer]);
    setSelectedId(layer.id);
    setTextDraft("");
    setEditMode(true);
    setActiveTool("text");
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
        widthPct: 30,
      };
      updateLayers((ls) => [...ls, layer]);
      setSelectedId(layer.id);
      setEditMode(true);
      setActiveTool("layers");
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }

  function duplicateLayerById(id: string) {
    const source = layers.find((layer) => layer.id === id);
    if (!source) return;
    const copy = {
      ...source,
      id: newId(),
      x: Math.min(95, source.x + 4),
      y: Math.min(95, source.y + 4),
    } as DesignLayer;
    updateLayers((ls) => [...ls, copy]);
    setSelectedId(copy.id);
  }

  function duplicateSelected() {
    if (selected) duplicateLayerById(selected.id);
  }

  function deleteLayerById(id: string) {
    updateLayers((ls) => ls.filter((l) => l.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function deleteSelected() {
    if (selected) deleteLayerById(selected.id);
  }

  function rotateSelected() {
    if (!selected) return;
    updateLayer(selected.id, { rotation: (selected.rotation + 15) % 360 });
  }

  function centerSelected() {
    if (!selected) return;
    updateLayer(selected.id, { x: 50, y: 50 });
  }

  function openTool(tool: ToolId) {
    setActiveTool(tool);
    setPanelOpen(true);
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
              <DesignOverlay
                layers={layers}
                selectedId={selectedId}
                onSelect={(id) => {
                  setSelectedId(id);
                  if (id) setActiveTool("layers");
                }}
                onChange={updateLayer}
                onDelete={deleteLayerById}
                onDuplicate={duplicateLayerById}
                renderMode="controls"
              />
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
              <DesignOverlay
                layers={layers}
                selectedId={selectedId}
                onSelect={(id) => {
                  setSelectedId(id);
                  if (id) setActiveTool("layers");
                }}
                onChange={updateLayer}
                onDelete={deleteLayerById}
                onDuplicate={duplicateLayerById}
                renderMode="controls"
              />
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
          onSelect={(id) => {
            setSelectedId(id);
            if (id) setActiveTool("layers");
          }}
          onChange={updateLayer}
          onDelete={deleteLayerById}
          onDuplicate={duplicateLayerById}
        />
      )}
    </>
  );

  return (
    <>
      <div className={`rup-lab ${panelOpen ? "panel-open" : "panel-closed"}`}>
        <nav className="rup-lab-toolbar" aria-label="Design tools">
          <button className={activeTool === "start" ? "active" : ""} onClick={() => openTool("start")} type="button">
            <Sparkles />
            <span>Start</span>
          </button>
          <button className={activeTool === "product" ? "active" : ""} onClick={() => openTool("product")} type="button">
            <Package2 />
            <span>Product</span>
          </button>
          <button className={activeTool === "upload" ? "active" : ""} onClick={() => openTool("upload")} type="button">
            <Upload />
            <span>Upload</span>
          </button>
          <button className={activeTool === "text" ? "active" : ""} onClick={() => openTool("text")} type="button">
            <Type />
            <span>Text</span>
          </button>
          <button className={activeTool === "art" ? "active" : ""} onClick={() => openTool("art")} type="button">
            <ImageIcon />
            <span>Art</span>
          </button>
          <button className={activeTool === "color" ? "active" : ""} onClick={() => openTool("color")} type="button">
            <Palette />
            <span>Colour</span>
          </button>
          <button className={activeTool === "layers" ? "active" : ""} onClick={() => openTool("layers")} type="button">
            <Layers3 />
            <span>Layers</span>
          </button>
        </nav>

        <aside className="rup-lab-panel">
          <div className="rup-lab-panel-head">
            <button type="button" className="rup-panel-back" onClick={() => setPanelOpen(false)} aria-label="Close tool panel">
              <ChevronLeft />
            </button>
            <div>
              <span>RED UMBRELLA DESIGN LAB</span>
              <strong>{panelTitle(activeTool)}</strong>
            </div>
            <button type="button" className="rup-panel-close" onClick={() => setPanelOpen(false)} aria-label="Close tool panel">
              <X />
            </button>
          </div>

          <div className="rup-lab-panel-body">
            {activeTool === "start" && (
              <div className="rup-welcome-panel">
                <span className="rup-kicker">MAKE SOMETHING YOURS</span>
                <h2>What would you like to do?</h2>
                <p>Choose a product, upload your artwork, or start with text. Everything appears live on the product.</p>
                <div className="rup-welcome-grid">
                  <button onClick={() => openTool("upload")} type="button"><Upload /><strong>Upload artwork</strong><span>Logo, photo or design</span></button>
                  <button onClick={() => openTool("text")} type="button"><Type /><strong>Add text</strong><span>Search Google Fonts</span></button>
                  <button onClick={() => openTool("product")} type="button"><Package2 /><strong>Change product</strong><span>Shirts, mugs, banners + more</span></button>
                  <button onClick={() => openTool("color")} type="button"><Palette /><strong>Choose colour</strong><span>Full colour control</span></button>
                </div>
              </div>
            )}

            {activeTool === "product" && (
              <div className="rup-tool-section">
                <div className="rup-tool-copy">
                  <span className="rup-kicker">PRODUCT DETAILS</span>
                  <h3>{product.name}</h3>
                  <p>{product.description || "Choose the product you want to customise."}</p>
                </div>
                <div className="rup-product-grid">
                  {products.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      className={p.id === productId ? "selected" : ""}
                      onClick={() => selectProduct(p.id)}
                    >
                      <img src={p.images[0]} alt="" />
                      <strong>{p.name}</strong>
                      <span>{p.category}</span>
                    </button>
                  ))}
                </div>
                <label className="rup-field-label">
                  <span>{previewMode === "flat" || previewMode === "vehicle" ? "Dimensions / template" : "Size"}</span>
                  <select value={size} onChange={(e) => setSize(e.target.value)}>
                    {product.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>
            )}

            {activeTool === "upload" && (
              <div className="rup-tool-section">
                <div className="rup-tool-copy">
                  <span className="rup-kicker">UPLOAD</span>
                  <h3>Bring your own artwork.</h3>
                  <p>Drop a logo, photo or finished design here. Then drag, resize and rotate it directly on the product.</p>
                </div>
                <label
                  className="rup-dropzone"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <Upload />
                  <strong>Drop file here</strong>
                  <span>or click to browse</span>
                  <small>PNG, JPG, WEBP or SVG · Max 5MB</small>
                  <input
                    ref={uploadRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file);
                      e.target.value = "";
                    }}
                  />
                </label>
                {uploadError && <div className="designer-error">{uploadError}</div>}
                <button className="rup-secondary-action" type="button" onClick={() => uploadRef.current?.click()}>
                  Choose from device
                </button>
              </div>
            )}

            {activeTool === "text" && (
              <div className="rup-tool-section">
                <div className="rup-tool-copy">
                  <span className="rup-kicker">ADD TEXT</span>
                  <h3>{selected?.type === "text" ? "Edit text" : "Create a text layer"}</h3>
                  <p>Type it, choose a Google Font, set the colour and place it anywhere in the print area.</p>
                </div>
                <label className="rup-field-label">
                  <span>Text</span>
                  <input
                    type="text"
                    placeholder="Type your text…"
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
                </label>
                {selected?.type !== "text" && (
                  <button className="rup-primary-action" type="button" onClick={addText}>Add text to design</button>
                )}
                <FontPicker
                  value={selected?.type === "text" ? selected.fontFamily : "Montserrat"}
                  disabled={selected?.type !== "text"}
                  onChange={(fontFamily) => updateSelectedText({ fontFamily })}
                />
                {selected?.type === "text" && (
                  <>
                    <div className="rup-inline-fields">
                      <label>
                        <span>Colour</span>
                        <input type="color" value={selected.color} onChange={(e) => updateSelectedText({ color: e.target.value })} />
                      </label>
                      <label>
                        <span>Size</span>
                        <input type="range" min="12" max="96" value={selected.fontSize} onChange={(e) => updateSelectedText({ fontSize: Number(e.target.value) })} />
                      </label>
                    </div>
                    <label className="rup-field-label">
                      <span>Wrap width</span>
                      <input type="range" min="12" max="90" value={selected.widthPct ?? 42} onChange={(e) => updateSelectedText({ widthPct: Number(e.target.value) })} />
                    </label>
                    <div className="rup-format-row">
                      <button className={selected.bold ? "active" : ""} onClick={() => updateSelectedText({ bold: !selected.bold })} type="button"><Bold /></button>
                      <button className={selected.italic ? "active" : ""} onClick={() => updateSelectedText({ italic: !selected.italic })} type="button"><Italic /></button>
                      <button onClick={() => updateSelectedText({ align: "left" })} type="button"><AlignLeft /></button>
                      <button onClick={() => updateSelectedText({ align: "center" })} type="button"><AlignCenter /></button>
                      <button onClick={() => updateSelectedText({ align: "right" })} type="button"><AlignRight /></button>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTool === "art" && (
              <div className="rup-tool-section">
                <div className="rup-tool-copy">
                  <span className="rup-kicker">ADD ART</span>
                  <h3>Artwork starts with your files.</h3>
                  <p>Use your own logo, illustration or image. A Red Umbrella clip-art library can plug into this same panel later without changing the editor.</p>
                </div>
                <button className="rup-art-card" onClick={() => openTool("upload")} type="button">
                  <Upload />
                  <strong>Upload your artwork</strong>
                  <span>Best for logos, event graphics and finished designs</span>
                </button>
                <button className="rup-art-card" onClick={() => openTool("text")} type="button">
                  <Type />
                  <strong>Build with type</strong>
                  <span>Create a typographic design with Google Fonts</span>
                </button>
              </div>
            )}

            {activeTool === "color" && (
              <div className="rup-tool-section">
                <div className="rup-tool-copy">
                  <span className="rup-kicker">COLOUR</span>
                  <h3>Make the product any colour.</h3>
                  <p>Use a stock colour or open the full picker. New text automatically starts with a contrasting colour.</p>
                </div>
                <div className="rup-colour-swatches">
                  {product.colors.filter((c) => c !== "Custom").map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={color === c ? "selected" : ""}
                      onClick={() => selectGarmentColor(c)}
                    >
                      <span style={{ background: normalizeColor(c) }} />
                      <strong>{c}</strong>
                    </button>
                  ))}
                </div>
                <label className="rup-full-colour">
                  <span>Custom colour</span>
                  <div>
                    <input type="color" value={customColor} onChange={(e) => selectCustomGarmentColor(e.target.value)} />
                    <input value={customColor.toUpperCase()} onChange={(e) => /^#[0-9a-f]{6}$/i.test(e.target.value) && selectCustomGarmentColor(e.target.value)} />
                  </div>
                </label>
              </div>
            )}

            {activeTool === "layers" && (
              <div className="rup-tool-section">
                <div className="rup-tool-copy">
                  <span className="rup-kicker">LAYERS</span>
                  <h3>{selected ? "Selected layer" : "Your design layers"}</h3>
                  <p>Select an item on the product to edit it, or choose a layer below.</p>
                </div>
                <div className="rup-layer-list">
                  {layers.length === 0 && <div className="rup-empty-state">No layers on the {side} yet.</div>}
                  {layers.map((layer, index) => (
                    <button
                      key={layer.id}
                      type="button"
                      className={selectedId === layer.id ? "selected" : ""}
                      onClick={() => setSelectedId(layer.id)}
                    >
                      <span>{index + 1}</span>
                      <strong>{layer.type === "text" ? layer.content || "Text" : "Artwork"}</strong>
                      <small>{layer.type === "text" ? layer.fontFamily : "Image layer"}</small>
                    </button>
                  ))}
                </div>
                {selected && (
                  <>
                    {selected.type === "image" && (
                      <label className="rup-field-label">
                        <span>Artwork size</span>
                        <input type="range" min="8" max="95" value={selected.widthPct} onChange={(e) => updateSelectedImage({ widthPct: Number(e.target.value) })} />
                      </label>
                    )}
                    <div className="rup-layer-actions">
                      <button type="button" onClick={duplicateSelected}><Copy /> Duplicate</button>
                      <button type="button" onClick={rotateSelected}><RotateCw /> Rotate</button>
                      <button type="button" onClick={centerSelected}><Crosshair /> Center</button>
                      <button type="button" onClick={deleteSelected} className="danger"><Trash2 /> Delete</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </aside>

        <section className="rup-lab-stage-shell">
          <header className="rup-lab-stage-top">
            <div className="rup-side-tabs">
              <button className={side === "front" ? "active" : ""} onClick={() => setSide("front")} type="button">Front</button>
              <button className={side === "back" ? "active" : ""} onClick={() => setSide("back")} type="button">Back</button>
            </div>

            <div className="rup-stage-product-label">
              <Box />
              <span><strong>{product.name}</strong>{size}</span>
            </div>

            <div className="rup-stage-actions">
              {(previewMode === "apparel3d" || previewMode === "cylinder3d") && (
                <div className="rup-view-toggle">
                  <button className={editMode ? "active" : ""} onClick={() => setEditMode(true)} type="button"><Move /> Design</button>
                  <button className={!editMode ? "active" : ""} onClick={() => setEditMode(false)} type="button"><Eye /> 3D view</button>
                </div>
              )}
              <button
                className="rup-complete-button"
                type="button"
                onClick={() => {
                  setReference("");
                  setCompleteError("");
                  setCompleteOpen(true);
                }}
              >
                Complete Design
              </button>
            </div>
          </header>

          <div className={`rup-lab-canvas preview-${previewMode}`} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
            {livePreview}
          </div>

          <footer className="rup-lab-bottom">
            <div className="rup-bottom-product">
              <img src={product.images[0]} alt="" />
              <div><strong>{product.name}</strong><span>{product.category}</span></div>
            </div>
            <div className="rup-bottom-controls">
              <label>
                <span>Qty</span>
                <div className="rup-qty">
                  <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
                  <input value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} />
                  <button type="button" onClick={() => setQuantity((q) => q + 1)}>+</button>
                </div>
              </label>
              {!quoteOnly ? (
                <div className="rup-price-block">
                  <span>Estimate</span>
                  <strong>{formatJMD(price)}</strong>
                </div>
              ) : (
                <div className="rup-price-block"><span>Pricing</span><strong>Custom quote</strong></div>
              )}
            </div>
          </footer>
        </section>
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

function panelTitle(tool: ToolId) {
  return {
    start: "Design Lab",
    product: "Product Details",
    upload: "Upload",
    text: "Add Text",
    art: "Add Art",
    color: "Colour",
    layers: "Layers",
  }[tool];
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
