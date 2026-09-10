"use client";
import {ChevronDown,ChevronRight,Clock3,Headphones,Menu,Palette,RotateCw,ShieldCheck,ShoppingCart,Type,Upload,X} from "lucide-react";
import {useState} from "react";

const steps=[
["CHOOSE & DESIGN","Pick your product and design online or upload your artwork."],
["REVIEW & PRICE","Review your design, select options and see your price instantly."],
["PAY & CONFIRM","Pay securely online. Standard orders are paid in full."],
["WE PRINT & DELIVER","We produce with precision and deliver or have your order ready."]];

export default function Home(){
const [menuOpen,setMenuOpen]=useState(false);
return <main>
<header className="site-header">
<a className="brand" href="#"><img src="/logo.svg" alt="Red Umbrella Printing"/></a>
<nav className="desktop-nav">
<a href="#services">Products <ChevronDown size={14}/></a><a href="/create">Create <ChevronDown size={14}/></a><a href="#how">How It Works</a><a href="#pricing">Pricing</a><a href="#about">About Us</a><a href="#faq">FAQ</a><a href="#contact">Contact</a>
</nav>
<div className="header-actions"><button className="cart-button"><ShoppingCart size={23}/><span>0</span></button><a className="button button-red header-cta" href="/create">START DESIGNING</a><button className="mobile-toggle" onClick={()=>setMenuOpen(v=>!v)}>{menuOpen?<X/>:<Menu/>}</button></div>
{menuOpen&&<nav className="mobile-nav"><a href="#services">Products</a><a href="/create">Create</a><a href="#how">How It Works</a><a href="#pricing">Pricing</a><a href="#about">About Us</a><a href="#contact">Contact</a></nav>}
</header>

<section className="hero">
<div className="hero-copy">
<h1>YOUR IDEA.<br/>OUR PRINT.<br/><span>PERFECTLY DONE.</span></h1>
<p>Custom apparel, signage, vehicle wraps, and branded merchandise — printed with premium quality and factory precision.</p>
<div className="hero-buttons"><a className="button button-red" href="/create"><Palette size={17}/> START DESIGNING</a><a className="button button-outline" href="#quote">GET A CUSTOM QUOTE</a></div>
<div className="hero-proof"><span><ShieldCheck/>Premium Quality</span><span><Clock3/>Fast Turnaround</span><span><ShieldCheck/>Secure Payments</span><span><Headphones/>Dedicated Support</span></div>
</div>

<div className="hero-visual" id="create">
<div className="logo-watermark">RED<br/>UMBRELLA<br/>PRINTING</div>
<img className="hero-shirt" src="/hero-shirt.svg" alt="Custom printed Kingston Culture T-shirt"/>
<div className="designer-card"><h3>Design Your Apparel</h3><img src="/designer-shirt.svg" alt="Black custom T-shirt preview"/>
<div className="designer-tools"><button><Type/><span>Add text</span></button><button><Upload/><span>Upload</span></button><button><Palette/><span>Colors</span></button><button><RotateCw/><span>Front/Back</span></button></div>
<div className="price-row"><small>Starting at</small><strong>JMD $1,800</strong></div><a className="button button-red card-button" href="/create">START DESIGNING <ChevronRight size={18}/></a></div>
</div>
</section>

<section className="how-section" id="how"><div className="section-heading"><h2>HOW IT WORKS</h2><p>Four simple steps from idea to delivery.</p></div><div className="steps">
{steps.map((s,i)=><div className="step" key={s[0]}><div className="step-icon">{i===0&&<Palette/>}{i===1&&<span className="calculator">123</span>}{i===2&&<span className="card-icon">▭</span>}{i===3&&<span className="box-icon">□</span>}<b>{i+1}</b></div><h3>{s[0]}</h3><p>{s[1]}</p></div>)}
</div></section>

<section className="services services-approved" id="services">
  <img className="services-approved-image" src="/mockups/categories-sprite.webp" alt="What can we print for you — apparel, promotional items, signs and displays, vehicle graphics, banners and prints"/>
</section>

<section className="quote-strip" id="quote"><div><h2>NEED SOMETHING UNIQUE?</h2><p>From custom signage to large format projects, our team is here to bring your vision to life.</p><a className="button button-outline-red" href="#contact">GET A CUSTOM QUOTE</a></div><div className="quote-benefit"><span>◎</span><p><strong>Expert Production</strong><br/>Advanced equipment and skilled craftsmanship.</p></div><div className="quote-benefit"><span>◉</span><p><strong>Fast Turnaround</strong><br/>Reliable production and on-time delivery.</p></div><div className="quote-benefit"><span>🇯🇲</span><p><strong>Made in Jamaica</strong><br/>Proudly producing locally for you.</p></div></section>

<footer id="contact"><div className="footer-grid"><div className="footer-brand"><img src="/logo.svg" alt=""/><div><h3>RED UMBRELLA PRINTING</h3><p>Full service print factory specializing in apparel, signage, vehicle graphics, promotional items and large format printing.</p></div></div><div><h4>SHOP</h4><a href="#services">All Products</a><a href="#services">Apparel</a><a href="#services">Promotional Items</a><a href="#services">Signs & Displays</a></div><div><h4>CREATE</h4><a href="/create">Design Online</a><a href="/create">Upload Artwork</a><a href="#quote">Custom Quote</a></div><div><h4>COMPANY</h4><a href="#about">About Us</a><a href="#services">Our Services</a><a href="#contact">Contact Us</a></div><div><h4>SUPPORT</h4><a href="#how">How It Works</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a><a href="#contact">Privacy Policy</a></div><div className="newsletter"><h4>STAY IN THE LOOP</h4><p>Get updates on new products, special offers and more.</p><div><input placeholder="Enter your email"/><button>SUBSCRIBE</button></div><p className="payments">VISA &nbsp; ● &nbsp; mastercard &nbsp; wipay</p></div></div><div className="copyright">© 2026 Red Umbrella Printing. All rights reserved.</div></footer>
</main>}