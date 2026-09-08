"use client";

import Image from "next/image";
import {
  AlignCenter, AlignLeft, AlignRight, Box, ChevronDown, Headphones, Maximize2,
  Minus, Palette, Plus, RotateCcw, ShieldCheck, ShoppingCart, Trash2, Type,
  Upload, ZoomIn, ZoomOut
} from "lucide-react";
import { ChangeEvent, useMemo, useRef, useState } from "react";

const swatches = [
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#161616" },
  { name: "Grey", value: "#a8a8a8" },
  { name: "Navy", value: "#18345f" },
  { name: "Red", value: "#d83a43" },
  { name: "Cream", value: "#e9dfcf" }
];

const basePrices: Record<string, number> = {
  "Standard T-Shirt": 1800, Hoodie: 3500, "Crop Top": 1900, Cap: 1500
};

export default function CreatePage() {
  const [product, setProduct] = useState("Standard T-Shirt");
  const [color, setColor] = useState("White");
  const [side, setSide] = useState<"Front" | "Back">("Front");
  const [size, setSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [text, setText] = useState("");
  const [font, setFont] = useState("Montserrat");
  const [align, setAlign] = useState<"left" | "center" | "right">("center");
  const [uploadedArtwork, setUploadedArtwork] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const unitPrice = basePrices[product] + (side === "Back" ? 500 : 0);
  const total = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUploadedArtwork(String(reader.result));
    reader.readAsDataURL(file);
  }

  const selectedColor = swatches.find((item) => item.name === color)?.value ?? "#ffffff";

  return (
    <main className="create-page">
      <header className="create-header">
        <a className="create-logo" href="/" aria-label="Red Umbrella Printing home">
          <Image src="/logo.svg" alt="Red Umbrella Printing" width={86} height={86} priority />
        </a>
        <nav className="create-nav" aria-label="Primary">
          <a href="/">Products <ChevronDown size={14} /></a>
          <a className="active" href="/create">Create <ChevronDown size={14} /></a>
          <a href="/#how">How It Works</a><a href="/#pricing">Pricing</a>
          <a href="/#about">About Us</a><a href="/#faq">FAQ</a><a href="/#contact">Contact</a>
        </nav>
        <div className="create-header-actions">
          <button className="create-cart" aria-label="Cart"><ShoppingCart size={26} /><span>0</span></button>
          <a className="button button-red create-start" href="#studio">Start Designing</a>
        </div>
      </header>

      <section className="create-intro">
        <div>
          <h1>CREATE YOUR <span>CUSTOM APPAREL</span></h1>
          <p>Bring your ideas to life — custom prints made with premium quality and factory precision.</p>
        </div>
        <div className="create-trust">
          <div><span><ShieldCheck /></span><p><strong>Premium Quality</strong><small>Vibrant, long-lasting prints</small></p></div>
          <div><span><Box /></span><p><strong>Fast Turnaround</strong><small>Get your order on time</small></p></div>
          <div><span><ShieldCheck /></span><p><strong>Secure Payments</strong><small>Shop with confidence</small></p></div>
        </div>
      </section>

      <section className="studio-shell" id="studio">
        <aside className="studio-panel studio-tools">
          <h2>Design Tools</h2>

          <label className="field-label">Product Type</label>
          <div className="field-with-icon">
            <span>👕</span>
            <select value={product} onChange={(event) => setProduct(event.target.value)}>
              <option>Standard T-Shirt</option><option>Hoodie</option><option>Crop Top</option><option>Cap</option>
            </select>
          </div>

          <label className="field-label">Color</label>
          <div className="field-with-icon">
            <Palette size={20} />
            <select value={color} onChange={(event) => setColor(event.target.value)}>
              {swatches.map((swatch) => <option key={swatch.name}>{swatch.name}</option>)}
            </select>
          </div>
          <div className="swatch-row">
            {swatches.map((swatch) => (
              <button key={swatch.name} className={color === swatch.name ? "swatch selected" : "swatch"}
                style={{ background: swatch.value }} onClick={() => setColor(swatch.name)} aria-label={swatch.name} />
            ))}
          </div>

          <label className="field-label upload-label"><Upload size={19} /> Upload Artwork</label>
          <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.svg,.pdf" hidden onChange={handleUpload} />
          <button className="upload-zone" onClick={() => fileRef.current?.click()}>
            <Upload size={28} /><span>Click to upload or drag and drop</span><small>PNG, JPG, SVG, PDF (Max 25MB)</small>
          </button>

          <label className="field-label"><Type size={20} /> Add Text</label>
          <input className="text-input" value={text} onChange={(event) => setText(event.target.value)} placeholder="Your text here..." />
          <select className="full-select" value={font} onChange={(event) => setFont(event.target.value)}>
            <option>Montserrat</option><option>Arial</option><option>Georgia</option><option>Impact</option>
          </select>
          <div className="format-row">
            <button><strong>B</strong></button><button><em>I</em></button>
            <button onClick={() => setAlign("left")} className={align === "left" ? "active" : ""}><AlignLeft size={18} /></button>
            <button onClick={() => setAlign("center")} className={align === "center" ? "active" : ""}><AlignCenter size={18} /></button>
            <button onClick={() => setAlign("right")} className={align === "right" ? "active" : ""}><AlignRight size={18} /></button>
          </div>

          <div className="tool-line">
            <span>▱</span><strong>Front / Back</strong>
            <div className="segmented"><button className={side === "Front" ? "active" : ""} onClick={() => setSide("Front")}>Front</button><button className={side === "Back" ? "active" : ""} onClick={() => setSide("Back")}>Back</button></div>
          </div>
          <div className="tool-line">
            <Box size={21} /><strong>Quantity</strong>
            <div className="qty-control"><button onClick={() => setQuantity((q) => Math.max(1, q - 1))}><Minus size={16} /></button><span>{quantity}</span><button onClick={() => setQuantity((q) => q + 1)}><Plus size={16} /></button></div>
          </div>
        </aside>

        <section className="studio-canvas-card">
          <div className="canvas-toolbar">
            <div className="segmented canvas-side"><button className={side === "Front" ? "active" : ""} onClick={() => setSide("Front")}>Front</button><button className={side === "Back" ? "active" : ""} onClick={() => setSide("Back")}>Back</button></div>
            <div className="zoom-tools"><button><ZoomIn size={17} /> Zoom In</button><button><ZoomOut size={17} /> Zoom Out</button><button><Maximize2 size={17} /> Fit</button></div>
          </div>
          <div className="canvas-area">
            <div className="shirt-stage" style={{ backgroundColor: selectedColor === "#ffffff" ? "#f7f7f7" : "#f5f2ef" }}>
              <Image className="shirt-base" src="/hero-shirt.svg" alt="Custom T-shirt preview" width={560} height={650} priority />
              <div className="print-boundary">
                {uploadedArtwork ? <img className="uploaded-art" src={uploadedArtwork} alt="Uploaded artwork preview" /> : null}
                {text ? <div className="custom-text" style={{ fontFamily: font, textAlign: align }}>{text}</div> : null}
              </div>
            </div>
            <div className="canvas-actions">
              <button><span>▣</span>Duplicate</button><button onClick={() => setUploadedArtwork(null)}><Trash2 size={20} />Delete</button><button><RotateCcw size={20} />Rotate</button><button><span className="target-icon">◎</span>Center</button>
            </div>
          </div>
        </section>

        <aside className="studio-panel design-summary">
          <h2>Your Design</h2>
          <div className="summary-preview"><Image src="/hero-shirt.svg" alt="Your design preview" width={235} height={245} /></div>
          <div className="summary-meta">
            <div><span>👕</span><p>{product}</p><strong>JMD {basePrices[product].toLocaleString()}</strong></div>
            <div><Palette size={17} /><p>{color}</p></div><div><span>▱</span><p>{side} Print</p></div>
          </div>

          <div className="summary-control"><label>Size</label><select value={size} onChange={(event) => setSize(event.target.value)}><option>XS</option><option>S</option><option>M</option><option>L</option><option>XL</option><option>2XL</option></select></div>
          <div className="summary-control"><label>Quantity</label><div className="qty-control wide"><button onClick={() => setQuantity((q) => Math.max(1, q - 1))}><Minus size={16} /></button><span>{quantity}</span><button onClick={() => setQuantity((q) => q + 1)}><Plus size={16} /></button></div></div>

          <div className="summary-prices"><div><span>Item Price</span><strong>JMD {unitPrice.toLocaleString()}</strong></div><div><span>Quantity ({quantity})</span><strong>JMD {total.toLocaleString()}</strong></div></div>
          <div className="summary-total"><span>Total</span><strong>JMD {total.toLocaleString()}</strong></div>
          <button className="button button-red add-cart"><ShoppingCart size={21} /> Add to Cart</button>
          <button className="button button-outline quote-button">▧ Get a Custom Quote</button>
          <div className="complex-note">ⓘ Need signage, banners, vehicle wraps or custom fabrication? Request a quote.</div>
        </aside>
      </section>

      <section className="create-help-row">
        <a href="#"><span>▤</span><p><strong>Print Guidelines</strong><small>File requirements, resolution and design tips for the best results.</small></p><b>→</b></a>
        <a href="#"><span>⬡</span><p><strong>Bulk Orders</strong><small>Get special pricing for team, business and event orders.</small></p><b>→</b></a>
        <a href="#contact"><Headphones /><p><strong>Need Help?</strong><small>Our team is here to assist you. Get in touch anytime.</small></p><b>→</b></a>
      </section>

      <footer id="contact" className="create-footer">
        <div className="footer-grid">
          <div className="footer-brand"><Image src="/logo.svg" alt="Red Umbrella Printing" width={86} height={86} /><div><h3>RED UMBRELLA PRINTING</h3><p>Full service print factory specializing in apparel, signage, vehicle graphics, promotional items and large format printing.</p></div></div>
          <div><h4>SHOP</h4><a href="/">All Products</a><a href="/">Apparel</a><a href="/">Promotional Items</a><a href="/">Signs & Displays</a><a href="/">Vehicle Graphics</a></div>
          <div><h4>CREATE</h4><a href="/create">Design Online</a><a href="/create">Upload Artwork</a><a href="/">Custom Quote</a></div>
          <div><h4>COMPANY</h4><a href="/">About Us</a><a href="/">Our Services</a><a href="/">Portfolio</a><a href="#contact">Contact Us</a></div>
          <div><h4>SUPPORT</h4><a href="/#how">How It Works</a><a href="/">Pricing</a><a href="/">FAQ</a><a href="/">Terms & Conditions</a><a href="/">Privacy Policy</a></div>
          <div className="newsletter"><h4>STAY IN THE LOOP</h4><p>Get updates on new products, special offers and more.</p><div><input placeholder="Enter your email" /><button>Subscribe</button></div><p className="payments">VISA &nbsp; ● &nbsp; mastercard &nbsp; wipay</p></div>
        </div>
        <div className="copyright">© 2026 Red Umbrella Printing. All rights reserved.</div>
      </footer>
    </main>
  );
}
