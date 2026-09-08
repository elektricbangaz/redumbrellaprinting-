"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BroadcastComposer({ subscriberCount }: { subscriberCount: number }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send broadcast.");
      setMessage(data.note || `Sent to ${data.broadcast.sentCount} subscribers.`);
      setSubject("");
      setBody("");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <p style={{ margin: 0, color: "#666", fontSize: 12 }}>
        Sending to <strong>{subscriberCount}</strong> active subscriber
        {subscriberCount === 1 ? "" : "s"}.
      </p>
      <label>
        Subject
        <input value={subject} onChange={(e) => setSubject(e.target.value)} required />
      </label>
      <label>
        Message
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          required
        />
      </label>
      {message && <div className="checkout-summary">{message}</div>}
      <button className="button button-red" type="submit" disabled={submitting}>
        {submitting ? "Sending…" : "Send Broadcast"}
      </button>
    </form>
  );
}
