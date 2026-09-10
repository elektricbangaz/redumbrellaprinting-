"use client";

import { Facebook, Instagram, Linkedin, MessageCircle, Music2, Youtube } from "lucide-react";
import { useState } from "react";

export function SiteFooter() {
  const [email,setEmail]=useState("");
  const [status,setStatus]=useState<"idle"|"sending"|"done"|"error">("idle");
  async function subscribe(e:React.FormEvent){
    e.preventDefault(); setStatus("sending");
    try{
      const res=await fetch("/api/subscribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});
      if(!res.ok) throw new Error();
      setEmail(""); setStatus("done");
    }catch{setStatus("error")}
  }

  return <footer className="footer2">
    <div className="footer2-inner">
      <section className="footer2-brand">
        <img src="/logo.svg" alt="Red Umbrella Printing"/>
        <h3>RED UMBRELLA<br/>PRINTING</h3>
        <p>Full-service print factory for apparel, signage, vehicle graphics, promotional products and large-format work.</p>
        <div className="footer2-social">
          <a href="#" aria-label="Instagram"><Instagram/></a><a href="#" aria-label="Facebook"><Facebook/></a>
          <a href="#" aria-label="TikTok"><Music2/></a><a href="#" aria-label="WhatsApp"><MessageCircle/></a>
          <a href="#" aria-label="YouTube"><Youtube/></a><a href="#" aria-label="LinkedIn"><Linkedin/></a>
        </div>
      </section>
      <section><h4>SHOP</h4><a href="/products">All Products</a><a href="/products?category=Apparel">Apparel</a><a href="/products?category=Promotional">Promotional Items</a><a href="/products?category=Signs">Signs & Displays</a><a href="/products?category=Vehicle">Vehicle Graphics</a><a href="/products?category=Banners">Banners & Prints</a></section>
      <section><h4>CREATE</h4><a href="/create">Design Online</a><a href="/create">Upload Artwork</a><a href="/quote">Custom Quote</a></section>
      <section><h4>COMPANY</h4><a href="/about">About Us</a><a href="/products">Our Services</a><a href="/#portfolio">Portfolio</a><a href="/contact">Contact Us</a></section>
      <section><h4>SUPPORT</h4><a href="/#how">How It Works</a><a href="/quote">Pricing</a><a href="/faq">FAQ</a><a href="/terms">Terms & Conditions</a><a href="/privacy">Privacy Policy</a></section>
      <section className="footer2-news"><h4>STAY IN THE LOOP</h4><p>Product drops, print tips, special offers and production updates.</p>
        <form onSubmit={subscribe}><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your email"/><button disabled={status==="sending"}>{status==="sending"?"Sending…":"Subscribe"}</button></form>
        {status==="done"&&<small>You're on the list.</small>}{status==="error"&&<small>Could not subscribe. Try again.</small>}
        <div className="footer2-payments"><b>VISA</b><b>Mastercard</b><b>WiPay</b><b>Fygaro</b></div>
      </section>
    </div>
    <div className="footer2-bottom"><span>© 2026 Red Umbrella Printing. All rights reserved.</span><span>Proudly Jamaican 🇯🇲</span></div>
  </footer>
}
