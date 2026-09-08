import { Clock3, Headphones, Palette, ChevronRight, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const categories = [
  { title: "APPAREL", sub: "T-Shirts, Hoodies, Caps & More", image: "/apparel.svg" },
  { title: "PROMOTIONAL ITEMS", sub: "Bottles, Bags, Gifts & More", image: "/promo.svg" },
  { title: "SIGNS & DISPLAYS", sub: "Acrylic, LED, Foam Board & More", image: "/signage.svg" },
  { title: "VEHICLE GRAPHICS", sub: "Wraps, Decals, Fleets & More", image: "/vehicle.svg" },
  { title: "BANNERS & PRINTS", sub: "Vinyl, Mesh, Posters & More", image: "/banner.svg" },
];

const steps = [
  ["CHOOSE & DESIGN", "Pick your product and design online or upload your artwork."],
  ["REVIEW & PRICE", "Review your design, select options and see your price instantly."],
  ["PAY & CONFIRM", "Pay securely online. Standard orders are paid in full."],
  ["WE PRINT & DELIVER", "We produce with precision and deliver or have your order ready."],
];

export default function Home() {
  return (
    <main>
      <SiteHeader />

      <section className="hero">
        <div className="hero-copy">
          <h1>
            YOUR IDEA.
            <br />
            OUR PRINT.
            <br />
            <span>PERFECTLY DONE.</span>
          </h1>
          <p>
            Custom apparel, signage, vehicle wraps, and branded merchandise — printed
            with premium quality and factory precision.
          </p>
          <div className="hero-buttons">
            <a className="button button-red" href="/create">
              <Palette size={17} /> START DESIGNING
            </a>
            <a className="button button-outline" href="#quote">
              GET A CUSTOM QUOTE
            </a>
          </div>
          <div className="hero-proof">
            <span>
              <ShieldCheck />
              Premium Quality
            </span>
            <span>
              <Clock3 />
              Fast Turnaround
            </span>
            <span>
              <ShieldCheck />
              Secure Payments
            </span>
            <span>
              <Headphones />
              Dedicated Support
            </span>
          </div>
        </div>

        <div className="hero-visual" id="create">
          <div className="logo-watermark">
            RED
            <br />
            UMBRELLA
            <br />
            PRINTING
          </div>
          <img className="hero-shirt" src="/hero-shirt.svg" alt="Custom printed Kingston Culture T-shirt" />
          <div className="designer-card">
            <h3>Design Your Apparel</h3>
            <img src="/designer-shirt.svg" alt="Black custom T-shirt preview" />
            <div className="price-row">
              <small>Starting at</small>
              <strong>JMD $1,800</strong>
            </div>
            <a className="button button-red card-button" href="/create">
              START DESIGNING <ChevronRight size={18} />
            </a>
          </div>
        </div>
      </section>

      <section className="how-section" id="how">
        <div className="section-heading">
          <h2>HOW IT WORKS</h2>
          <p>Four simple steps from idea to delivery.</p>
        </div>
        <div className="steps">
          {steps.map((s, i) => (
            <div className="step" key={s[0]}>
              <div className="step-icon">
                {i === 0 && <Palette />}
                {i === 1 && <span className="calculator">123</span>}
                {i === 2 && <span className="card-icon">▭</span>}
                {i === 3 && <span className="box-icon">□</span>}
                <b>{i + 1}</b>
              </div>
              <h3>{s[0]}</h3>
              <p>{s[1]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="services" id="services">
        <div className="section-heading">
          <h2>WHAT CAN WE PRINT FOR YOU?</h2>
        </div>
        <div className="category-grid">
          {categories.map((c) => (
            <a className="category-card" key={c.title} href="/products">
              <div className="category-image">
                <img src={c.image} alt="" />
              </div>
              <div className="category-copy">
                <h3>{c.title}</h3>
                <p>{c.sub}</p>
                <button>
                  <ChevronRight />
                </button>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="quote-strip" id="quote">
        <div>
          <h2>NEED SOMETHING UNIQUE?</h2>
          <p>
            From custom signage to large format projects, our team is here to bring your
            vision to life.
          </p>
          <a className="button button-outline-red" href="#contact">
            GET A CUSTOM QUOTE
          </a>
        </div>
        <div className="quote-benefit">
          <span>◎</span>
          <p>
            <strong>Expert Production</strong>
            <br />
            Advanced equipment and skilled craftsmanship.
          </p>
        </div>
        <div className="quote-benefit">
          <span>◉</span>
          <p>
            <strong>Fast Turnaround</strong>
            <br />
            Reliable production and on-time delivery.
          </p>
        </div>
        <div className="quote-benefit">
          <span>🇯🇲</span>
          <p>
            <strong>Made in Jamaica</strong>
            <br />
            Proudly producing locally for you.
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
