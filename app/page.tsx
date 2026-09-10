"use client";

import Image from "next/image";
import {
  ChevronDown, ChevronRight, Clock3, CreditCard, Headphones, MapPin, Menu,
  PackageCheck, Palette, PenLine, Settings2, ShieldCheck, ShoppingCart, Type,
  Upload, X
} from "lucide-react";
import { useState } from "react";

const steps = [
  { title: "CHOOSE & DESIGN", copy: "Pick your product and design online or upload your artwork.", icon: PenLine },
  { title: "REVIEW & PRICE", copy: "Review your design, select options and see your price instantly.", icon: "calculator" },
  { title: "PAY & CONFIRM", copy: "Pay securely online. Standard orders are paid in full.", icon: CreditCard },
  { title: "WE PRINT & DELIVER", copy: "We produce with precision and deliver or have your order ready.", icon: PackageCheck }
];

const categories = [
  { title: "APPAREL", copy: "T-Shirts, Hoodies, Caps & More", image: "/mockups/category-apparel.webp" },
  { title: "PROMOTIONAL ITEMS", copy: "Bottles, Bags, Gifts & More", image: "/mockups/category-promotional.webp" },
  { title: "SIGNS & DISPLAYS", copy: "Acrylic, LED, Foam Board & More", image: "/mockups/category-signage.webp" },
  { title: "VEHICLE GRAPHICS", copy: "Wraps, Decals, Fleets & More", image: "/mockups/category-vehicle.webp" },
  { title: "BANNERS & PRINTS", copy: "Vinyl, Mesh, Posters & More", image: "/mockups/category-banners.webp" }
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="rup-site">
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="Red Umbrella Printing home">
            <Image src="/logo.svg" alt="Red Umbrella Printing" width={92} height={92} priority />
          </a>

          <nav className="desktop-nav" aria-label="Primary">
            <a href="#services">Products <ChevronDown size={13} /></a>
            <a href="/create">Create <ChevronDown size={13} /></a>
            <a href="#how">How It Works</a>
            <a href="#pricing">Pricing</a>
            <a href="#about">About Us</a>
            <a href="#faq">FAQ</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="header-actions">
            <button className="cart-button" aria-label="Shopping cart"><ShoppingCart size={25} /><span>0</span></button>
            <a className="button button-red header-cta" href="/create">Start Designing</a>
            <button className="mobile-toggle" onClick={() => setMenuOpen(v => !v)} aria-label="Toggle menu">
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {menuOpen && (
            <nav className="mobile-nav">
              <a href="#services">Products</a><a href="/create">Create</a><a href="#how">How It Works</a>
              <a href="#pricing">Pricing</a><a href="#about">About Us</a><a href="#faq">FAQ</a><a href="#contact">Contact</a>
            </nav>
          )}
        </div>
      </header>

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <h1>YOUR IDEA.<br />OUR PRINT.<br /><span>PERFECTLY DONE.</span></h1>
            <p>Custom apparel, signage, vehicle wraps, and branded merchandise — printed with premium quality and factory precision.</p>
            <div className="hero-buttons">
              <a className="button button-red" href="/create"><PenLine size={17} /> Start Designing</a>
              <a className="button button-outline" href="#quote"><CreditCard size={17} /> Get a Custom Quote</a>
            </div>
            <div className="hero-proof">
              <span><ShieldCheck />Secure Payments</span>
              <span><Clock3 />Fast Turnaround</span>
              <span><span className="trophy-mark">♜</span>Premium Quality</span>
            </div>
          </div>

          <div className="hero-product">
            <Image
              className="hero-shirt-photo"
              src="/mockups/kingston-culture-shirt.webp"
              alt="Kingston Culture custom printed white T-shirt"
              width={520}
              height={693}
              priority
            />
          </div>

          <aside className="designer-card">
            <div className="designer-title"><span className="shirt-symbol">♙</span><h3>Design Your Apparel</h3></div>
            <div className="designer-photo-wrap">
              <Image src="/mockups/designer-good-vibes.webp" alt="Good Vibes black T-shirt" width={205} height={190} />
              <button className="designer-arrow left" aria-label="Previous product">‹</button>
              <button className="designer-arrow right" aria-label="Next product">›</button>
            </div>
            <div className="designer-tools">
              <button><Type /><span>Add Text</span></button>
              <button><Upload /><span>Upload</span></button>
              <button><Palette /><span>Colors</span></button>
              <button><span className="side-icon">▱</span><span>Front/Back</span></button>
            </div>
            <div className="price-row"><small>Starting at</small><strong>JMD $1,800</strong></div>
            <a className="button button-red card-button" href="/create">Start Designing <ChevronRight size={18} /></a>
          </aside>
        </div>
      </section>

      <section className="how-section" id="how">
        <div className="how-card">
          <div className="section-heading"><h2>HOW IT WORKS</h2><p>Four simple steps from idea to delivery.</p></div>
          <div className="steps">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <article className="step" key={step.title}>
                  <div className="step-icon">
                    <b>{i + 1}</b>
                    {Icon === "calculator" ? <span className="calculator">123</span> : <Icon />}
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="services" id="services">
        <div className="section-heading"><h2>WHAT CAN WE PRINT FOR YOU?</h2></div>
        <div className="category-grid">
          {categories.map(category => (
            <article className="category-card" key={category.title}>
              <div className="category-image">
                <Image src={category.image} alt={category.title} width={360} height={285} />
              </div>
              <div className="category-copy">
                <h3>{category.title}</h3>
                <p>{category.copy}</p>
                <button aria-label={`View ${category.title}`}><ChevronRight /></button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="quote-section" id="quote">
        <div className="quote-strip">
          <div className="quote-lead">
            <h2>NEED SOMETHING UNIQUE?</h2>
            <p>From custom signage to large format projects, our team is here to bring your vision to life.</p>
            <a className="button button-red" href="#contact">Get a Custom Quote</a>
          </div>
          <div className="quote-benefit"><Settings2 /><p><strong>Expert Production</strong><br />Advanced equipment and skilled craftsmanship.</p></div>
          <div className="quote-benefit"><Clock3 /><p><strong>Fast Turnaround</strong><br />Reliable production and on-time delivery.</p></div>
          <div className="quote-benefit"><MapPin /><p><strong>Made in Jamaica</strong><br />Proudly producing locally for you.</p></div>
        </div>
      </section>

      <footer id="contact">
        <div className="footer-grid">
          <div className="footer-brand">
            <Image src="/logo.svg" alt="Red Umbrella Printing" width={88} height={88} />
            <div>
              <h3>RED UMBRELLA PRINTING</h3>
              <p>Full service print factory specializing in apparel, signage, vehicle graphics, promotional items and large format printing.</p>
              <div className="social-row"><span>◎</span><span>●</span><span>♪</span><span>◉</span></div>
            </div>
          </div>
          <div><h4>SHOP</h4><a href="#services">All Products</a><a href="#services">Apparel</a><a href="#services">Promotional Items</a><a href="#services">Signs & Displays</a><a href="#services">Vehicle Graphics</a><a href="#services">Banners & Prints</a></div>
          <div><h4>CREATE</h4><a href="/create">Design Online</a><a href="/create">Upload Artwork</a><a href="#quote">Custom Quote</a></div>
          <div><h4>COMPANY</h4><a href="#about">About Us</a><a href="#services">Our Services</a><a href="#">Portfolio</a><a href="#contact">Contact Us</a></div>
          <div><h4>SUPPORT</h4><a href="#how">How It Works</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a><a href="#">Terms & Conditions</a><a href="#">Privacy Policy</a></div>
          <div className="newsletter"><h4>STAY IN THE LOOP</h4><p>Get updates on new products, special offers and more.</p><div><input placeholder="Enter your email" /><button>Subscribe</button></div><p className="payments">VISA &nbsp; ● &nbsp; mastercard &nbsp; wipay &nbsp; Fygaro</p></div>
        </div>
        <div className="copyright">© 2026 Red Umbrella Printing. All rights reserved.</div>
      </footer>
    </main>
  );
}
