"use client";

import { ChevronDown, Menu, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const cart = useCart();

  return (
    <header className="site-header">
      <a className="brand" href="/">
        <img src="/logo.svg" alt="Red Umbrella Printing" />
      </a>
      <nav className="desktop-nav">
        <a href="/products">
          Products <ChevronDown size={14} />
        </a>
        <a href="/create">
          Create <ChevronDown size={14} />
        </a>
        <a href="/#how">How It Works</a>
        <a href="/#pricing">Pricing</a>
        <a href="/#about">About Us</a>
        <a href="/#faq">FAQ</a>
        <a href="/#contact">Contact</a>
      </nav>
      <div className="header-actions">
        <button className="cart-button" onClick={cart.openCart} aria-label="Open cart">
          <ShoppingCart size={23} />
          <span>{cart.count}</span>
        </button>
        <a className="button button-red header-cta" href="/create">
          START DESIGNING
        </a>
        <button className="mobile-toggle" onClick={() => setMenuOpen((v) => !v)}>
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>
      {menuOpen && (
        <nav className="mobile-nav">
          <a href="/products">Products</a>
          <a href="/create">Create</a>
          <a href="/#how">How It Works</a>
          <a href="/#pricing">Pricing</a>
          <a href="/#about">About Us</a>
          <a href="/#contact">Contact</a>
        </nav>
      )}
    </header>
  );
}
