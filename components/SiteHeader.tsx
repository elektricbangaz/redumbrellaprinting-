"use client";

import { ChevronDown, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";

const nav = [
  { href: "/products", label: "Products", chevron: true },
  { href: "/create", label: "Create" },
  { href: "/#how", label: "How It Works" },
  { href: "/quote", label: "Pricing / Quote" },
  { href: "/about", label: "About Us" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const cart = useCart();

  return (
    <>
      <div className="site2-utility">
        <div>
          <span>Custom Apparel</span><i>•</i><span>Signage</span><i>•</i><span>Vehicle Graphics</span><i>•</i><span>Promotional Items</span><i>•</i><span>Large Format Printing</span>
        </div>
        <strong>PROUDLY JAMAICAN 🇯🇲 &nbsp; | &nbsp; QUALITY THAT LASTS</strong>
      </div>
      <header className="site2-header">
        <a className="site2-brand" href="/" aria-label="Red Umbrella Printing home">
          <img src="/logo.svg" alt="Red Umbrella Printing" />
        </a>

        <nav className="site2-nav" aria-label="Primary">
          {nav.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}{item.chevron && <ChevronDown size={14} />}
            </a>
          ))}
        </nav>

        <div className="site2-actions">
          <button className="site2-icon" aria-label="Search products" onClick={() => setSearchOpen(v => !v)}><Search /></button>
          <button className="site2-icon site2-cart" aria-label="Open cart" onClick={cart.openCart}><ShoppingBag /><span>{cart.count}</span></button>
          <a href="/create" className="site2-start">Start Designing <span>→</span></a>
          <button className="site2-menu" aria-label="Open menu" onClick={() => setMenuOpen(v => !v)}>{menuOpen ? <X /> : <Menu />}</button>
        </div>

        {menuOpen && (
          <div className="site2-mobile-menu">
            {nav.map((item) => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>)}
            <a className="site2-mobile-cta" href="/create">Start Designing →</a>
          </div>
        )}
      </header>

      {searchOpen && (
        <form className="site2-searchbar" action="/products">
          <Search size={18} />
          <input name="q" autoFocus placeholder="Search apparel, signs, banners, bottles…" />
          <button type="button" onClick={() => setSearchOpen(false)}><X size={18} /></button>
        </form>
      )}
    </>
  );
}
