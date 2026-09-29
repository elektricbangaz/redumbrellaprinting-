"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirmation = String(form.get("confirmation") || "");
    if (password !== confirmation) {
      setError("The passwords do not match.");
      setPending(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.message || "The password could not be reset. Request a new link.");
        return;
      }
      setMessage(result.message);
    } catch {
      setError("The password could not be reset. Please try again later.");
    } finally {
      setPending(false);
    }
  }

  if (!token) {
    return <div className="admin-login-card">
      <h1>RED UMBRELLA <span>Admin</span></h1>
      <p>This reset link is invalid or expired. Request a new one.</p>
      <Link className="button button-red" href="/forgot-password">Request a new link</Link>
    </div>;
  }

  return (
    <form className="admin-login-card" onSubmit={submit}>
      <h1>RED UMBRELLA <span>Admin</span></h1>
      <p>Choose a new password for your admin account. Use 16–72 characters.</p>
      {message && <div className="admin-login-success" role="status">{message}</div>}
      {error && <div className="admin-login-error" role="alert">{error}</div>}
      {!message && <>
        <label>New password<input name="password" type="password" required minLength={16} maxLength={72} autoComplete="new-password" /></label>
        <label>Confirm new password<input name="confirmation" type="password" required minLength={16} maxLength={72} autoComplete="new-password" /></label>
        <button className="button button-red" type="submit" disabled={pending}>
          {pending ? "Updating…" : "Reset Password"}
        </button>
      </>}
      {message ? <Link className="button button-red" href="/login">Go to sign in</Link> : <Link className="button admin-login-secondary" href="/login">Cancel</Link>}
    </form>
  );
}