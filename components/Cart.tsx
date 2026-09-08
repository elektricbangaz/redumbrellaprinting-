"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatJMD } from "@/lib/money";

export function CartRoot() {
  const cart = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  if (!cart.isOpen && !checkoutOpen) return null;

  return (
    <>
      {cart.isOpen && !checkoutOpen && (
        <div className="cart-overlay" onClick={cart.closeCart}>
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cart-drawer-head">
              <h2>Your Cart ({cart.count})</h2>
              <button onClick={cart.closeCart} aria-label="Close cart">
                <X size={20} />
              </button>
            </div>
            <div className="cart-items">
              {cart.items.length === 0 && (
                <div className="cart-empty">Your cart is empty.</div>
              )}
              {cart.items.map((item) => (
                <div className="cart-item" key={item.cartItemId}>
                  <img
                    src={item.design?.previewImage || item.productImage}
                    alt={item.productName}
                  />
                  <div className="cart-item-info">
                    <h4>{item.productName}</h4>
                    <p>
                      {item.color} · {item.size}
                    </p>
                    <p>{formatJMD(item.unitPrice)}</p>
                    <div className="cart-item-controls">
                      <button
                        onClick={() =>
                          cart.updateQuantity(item.cartItemId, item.quantity - 1)
                        }
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() =>
                          cart.updateQuantity(item.cartItemId, item.quantity + 1)
                        }
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        className="cart-item-remove"
                        onClick={() => cart.removeItem(item.cartItemId)}
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {cart.items.length > 0 && (
              <div className="cart-drawer-foot">
                <div className="cart-total-row">
                  <span>Subtotal</span>
                  <span>{formatJMD(cart.subtotal)}</span>
                </div>
                <button
                  className="button button-red"
                  onClick={() => setCheckoutOpen(true)}
                >
                  Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {checkoutOpen && <CheckoutModal onClose={() => setCheckoutOpen(false)} />}
    </>
  );
}

function CheckoutModal({ onClose }: { onClose: () => void }) {
  const cart = useCart();
  const router = useRouter();
  const [provider, setProvider] = useState<"WIPAY" | "FYGARO">("WIPAY");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: form.get("name"),
            email: form.get("email"),
            phone: form.get("phone"),
            address: form.get("address"),
            notes: form.get("notes"),
          },
          paymentProvider: provider,
          items: cart.items.map((i) => ({
            productId: i.productId,
            size: i.size,
            color: i.color,
            quantity: i.quantity,
            design: i.design
              ? { canvasData: i.design.canvasData, previewImage: i.design.previewImage }
              : undefined,
          })),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong placing your order.");
      }

      const data = await res.json();
      cart.clear();
      onClose();
      cart.closeCart();
      router.push(data.redirectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
        <button className="checkout-close" onClick={onClose} aria-label="Close checkout">
          <X size={20} />
        </button>
        <h2>Checkout</h2>
        <p>Enter your details to complete your order.</p>

        <div className="checkout-summary">
          {cart.items.map((i) => (
            <div className="checkout-summary-row" key={i.cartItemId}>
              <span>
                {i.productName} ({i.color}/{i.size}) × {i.quantity}
              </span>
              <span>{formatJMD(i.unitPrice * i.quantity)}</span>
            </div>
          ))}
          <div className="checkout-summary-row total">
            <span>Total</span>
            <span>{formatJMD(cart.subtotal)}</span>
          </div>
        </div>

        {error && <div className="checkout-error">{error}</div>}

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-row">
            <label>
              Full Name
              <input name="name" required />
            </label>
            <label>
              Email
              <input name="email" type="email" required />
            </label>
          </div>
          <div className="admin-form-row">
            <label>
              Phone
              <input name="phone" />
            </label>
            <label>
              Delivery Address
              <input name="address" />
            </label>
          </div>
          <label>
            Order Notes (optional)
            <textarea name="notes" rows={2} />
          </label>

          <div className="payment-options">
            <div
              className={`payment-option ${provider === "WIPAY" ? "selected" : ""}`}
              onClick={() => setProvider("WIPAY")}
            >
              <strong>WiPay</strong>
              <span>Cards &amp; local bank transfer</span>
            </div>
            <div
              className={`payment-option ${provider === "FYGARO" ? "selected" : ""}`}
              onClick={() => setProvider("FYGARO")}
            >
              <strong>Fygaro</strong>
              <span>Cards &amp; online payments</span>
            </div>
          </div>

          <div className="checkout-actions">
            <button
              type="button"
              className="button button-outline"
              onClick={onClose}
            >
              Back to Cart
            </button>
            <button className="button button-red" type="submit" disabled={submitting}>
              {submitting ? "Placing Order…" : `Pay ${formatJMD(cart.subtotal)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
