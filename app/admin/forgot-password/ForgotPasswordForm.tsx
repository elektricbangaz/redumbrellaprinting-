"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email") }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.message || "We could not send the reset email. Please try again later.");
        return;
      }
      setMessage(result.message);
    } catch {
      setError("We could not send the reset email. Please try again later.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="admin-login-card" onSubmit={submit}>
      <img className="admin-login-brand" src="/android-chrome-512x512.png" alt="Red Umbrella Printing" /><h1>Admin</h1>
      <p>Enter your admin email and we’ll send a secure reset link if an account exists.</p>
      {message && <div className="admin-login-success" role="status">{message}</div>}
      {error && <div className="admin-login-error" role="alert">{error}</div>}
      <label>Email<input name="email" type="email" required autoComplete="email" /></label>
      <button className="button button-red" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send Reset Link"}
      </button>
      <Link className="button admin-login-secondary" href="/login">Back to sign in</Link>
    </form>
  );
}