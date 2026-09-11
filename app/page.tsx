import { ArrowRight, BadgeCheck, Boxes, Clock3, CreditCard, PackageCheck, PenTool, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const categories=[
  {title:"Apparel",copy:"T-shirts, hoodies, caps & uniforms",href:"/products?category=Apparel",image:"/mockups/category-apparel.webp",kind:"image"},
  {title:"Promotional Items",copy:"Bottles, bags, gifts & event merchandise",href:"/products?category=Promotional",image:"/mockups/category-promotional.webp",kind:"image"},
  {title:"Signs & Displays",copy:"Acrylic, LED, routed signs & display systems",href:"/products?category=Signs",image:"/mockups/category-signage.webp",kind:"image"},
  {title:"Vehicle Graphics",copy:"Fleet wraps, decals and vehicle branding",href:"/products?category=Vehicle",image:"/mockups/category-vehicle.webp",kind:"image"},
  {title:"Banners & Prints",copy:"Vinyl, mesh, posters and large-format print",href:"/products?category=Banners",image:"/mockups/category-banners.webp",kind:"image"},
];

export default function Home(){
 return <main className="sf">
  <SiteHeader/>
  <section className="sf-hero">
    <div className="sf-hero-copy">
      <span className="sf-eyebrow">JAMAICA'S FULL-SERVICE PRINT FACTORY</span>
      <h1>PRINT THAT<br/>LOOKS <em>EXPENSIVE.</em></h1>
      <p>From one custom tee to a full fleet wrap, Red Umbrella turns ideas into finished print with professional production, clear ordering and real follow-through.</p>
      <div className="sf-actions"><a className="sf-primary" href="/create">Start Designing <ArrowRight/></a><a className="sf-secondary" href="/quote">Build a Custom Quote</a></div>
      <div className="sf-proof"><span><ShieldCheck/>Secure checkout</span><span><Clock3/>Production tracking</span><span><BadgeCheck/>Quality controlled</span></div>
    </div>
    <div className="sf-hero-visual">
      <div className="sf-hero-image"><img src="/mockups/category-apparel.webp" alt="Custom apparel produced by Red Umbrella Printing"/></div>
      <div className="sf-live-card"><span>START HERE</span><strong>Create your product</strong><p>Choose a blank, upload artwork, preview it, then order.</p><a href="/create">Open Create Studio <ArrowRight/></a></div>
    </div>
  </section>

  <section className="sf-categories">
    <div className="sf-section-head"><div><span>WHAT WE MAKE</span><h2>One factory. More ways to print.</h2></div><a href="/products">Browse all products <ArrowRight/></a></div>
    <div className="sf-category-grid">{categories.map(c=><a className={"sf-category sf-category-"+c.kind} href={c.href} key={c.title}>
      {c.image?<img src={c.image} alt=""/>:<div className="sf-art">{c.kind==="vehicle"?<Truck/>:<Boxes/>}</div>}
      <div><h3>{c.title}</h3><p>{c.copy}</p><ArrowRight/></div>
    </a>)}</div>
  </section>

  <section className="sf-process" id="how">
    <div className="sf-process-intro"><span>BUILT FOR REAL ORDERS</span><h2>From idea to production without the back-and-forth.</h2><p>Standard products move straight through the storefront. Complex commercial jobs go through a proper quote workflow.</p></div>
    <div className="sf-process-grid">
      <article><b>01</b><PenTool/><h3>Design or upload</h3><p>Customize standard products online or send production-ready artwork.</p></article>
      <article><b>02</b><CreditCard/><h3>Confirm & pay</h3><p>Review specifications and pricing before checkout.</p></article>
      <article><b>03</b><PackageCheck/><h3>We produce</h3><p>Your job enters the production queue with status tracking.</p></article>
      <article><b>04</b><Truck/><h3>Ready / delivered</h3><p>Get notified when the job is complete and ready for handoff.</p></article>
    </div>
  </section>

  <section className="sf-split">
    <div className="sf-split-visual"><img src="/mockups/category-signage.webp" alt="Red Umbrella signage production"/></div>
    <div className="sf-split-copy"><span>COMMERCIAL PRINTING</span><h2>Not everything belongs in a shopping cart.</h2><p>Large signage, vehicle fleets, fabrication and complex installations need dimensions, materials, finishing and production review. That's why Red Umbrella has a dedicated quote flow instead of forcing every job through a fake instant price.</p><a className="sf-primary" href="/quote">Start a commercial quote <ArrowRight/></a></div>
  </section>

  <section className="sf-portfolio" id="portfolio">
    <div className="sf-section-head"><div><span>PRODUCTION RANGE</span><h2>Built to serve brands, events and everyday customers.</h2></div></div>
    <div className="sf-portfolio-grid">
      <article><img src="/mockups/category-apparel.webp" alt="Apparel"/><strong>Apparel & uniforms</strong></article>
      <article><img src="/mockups/category-promotional.webp" alt="Promotional products"/><strong>Branded merchandise</strong></article>
      <article><img src="/mockups/category-signage.webp" alt="Signs"/><strong>Retail & business signage</strong></article>
      <article className="sf-portfolio-type"><Sparkles/><strong>Custom fabrication</strong><p>Have something unusual? Send the brief.</p></article>
    </div>
  </section>

  <section className="sf-cta">
    <div><span>READY TO PRINT?</span><h2>Start with the job, not a form maze.</h2><p>Choose a standard product or tell us what you're trying to build.</p></div>
    <div className="sf-actions"><a className="sf-primary" href="/create">Design a Product <ArrowRight/></a><a className="sf-dark" href="/quote">Request a Quote</a></div>
  </section>
  <SiteFooter/>
 </main>
}
