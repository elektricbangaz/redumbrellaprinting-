"use client";

import { useState } from "react";

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <footer id="contact">
      <div className="footer-grid">
        <div className="footer-brand">
          <img src="/logo.svg" alt="" />
          <div>
            <h3>RED UMBRELLA PRINTING</h3>
            <p>
              Full service print factory specializing in apparel, signage, vehicle
              graphics, promotional items and large format printing.
            </p>
          </div>
        </div>
        <div>
          <h4>SHOP</h4>
          <a href="/products">All Products</a>
          <a href="/products">Apparel</a>
          <a href="/products">Promotional Items</a>
          <a href="/products">Signs &amp; Displays</a>
        </div>
        <div>
          <h4>CREATE</h4>
          <a href="/create">Design Online</a>
          <a href="/create">Upload Artwork</a>
          <a href="/#quote">Custom Quote</a>
        </div>
        <div>
          <h4>COMPANY</h4>
          <a href="/#about">About Us</a>
          <a href="/products">Our Services</a>
          <a href="/#contact">Contact Us</a>
        </div>
        <div>
          <h4>SUPPORT</h4>
          <a href="/#how">How It Works</a>
          <a href="/#pricing">Pricing</a>
          <a href="/#faq">FAQ</a>
          <a href="/#contact">Privacy Policy</a>
        </div>
        <div className="newsletter">
          <h4>STAY IN THE LOOP</h4>
          <p>Get updates on new products, special offers and more.</p>
          <form onSubmit={subscribe}>
            <div>
              <input
                placeholder="Enter your email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" disabled={status === "sending"}>
                {status === "sending" ? "…" : "SUBSCRIBE"}
              </button>
            </div>
          </form>
          {status === "done" && (
            <p style={{ color: "#8fe0a8", margin: 0 }}>You&apos;re on the list!</p>
          )}
          {status === "error" && (
            <p style={{ color: "#f19a9a", margin: 0 }}>Something went wrong, try again.</p>
          )}
          <p className="payments">VISA &nbsp; ● &nbsp; mastercard &nbsp; wipay &nbsp; fygaro</p>
        </div>
      </div>
      <div className="copyright">© 2026 Red Umbrella Printing. All rights reserved.</div>
    </footer>
  );
}
