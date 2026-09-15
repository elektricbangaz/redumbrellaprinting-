"use client";

import { useState } from "react";
import { CheckCircle2, X } from "lucide-react";

export function CompleteDesignModal({
  open,
  busy,
  error,
  reference,
  onClose,
  onSubmit,
}: {
  open: boolean;
  busy: boolean;
  error: string;
  reference: string;
  onClose: () => void;
  onSubmit: (customer: { name: string; email: string; phone: string }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  if (!open) return null;

  return (
    <div className="complete-design-backdrop" role="dialog" aria-modal="true">
      <div className="complete-design-modal">
        <button className="complete-design-close" type="button" onClick={onClose}><X /></button>
        {reference ? (
          <div className="complete-design-success">
            <CheckCircle2 />
            <span>DESIGN CAPTURED</span>
            <h2>Your design is locked in.</h2>
            <p>
              Red Umbrella has the mockup, artwork placement, font selection, colours and production metadata.
            </p>
            <strong>{reference}</strong>
            <button className="button button-red" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <span className="modal-kicker">COMPLETE DESIGN</span>
            <h2>Send this design to Red Umbrella.</h2>
            <p>
              We’ll capture the final mockup and production data exactly as configured.
            </p>
            <label>Full name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label>Phone<input value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
            {error && <div className="designer-error complete-design-error">{error}</div>}
            <button
              className="button button-red"
              type="button"
              disabled={busy || name.trim().length < 2 || !email.includes("@")}
              onClick={() => onSubmit({ name, email, phone })}
            >
              {busy ? "Saving design…" : "Submit Final Design"}
            </button>
            <small>
              Customer artwork and generated previews are stored with the design record for production.
            </small>
          </>
        )}
      </div>
    </div>
  );
}
