"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await signIn("credentials", {
        email: form.get("email"),
        password: form.get("password"),
        redirect: false,
        callbackUrl: "/dashboard",
      });
      if (result?.error) {
        setError(result.error === "CredentialsSignin" ? "Invalid email or password." : "Sign-in is unavailable. Please try again shortly.");
        return;
      }
      router.replace(result?.url ?? "/dashboard");
      router.refresh();
    } catch {
      setError("Sign-in is unavailable. Please try again shortly.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-login-card" onSubmit={submit}>
        <h1>RED UMBRELLA <span>Admin</span></h1>
        <p>Sign in to manage orders, work orders, POs and broadcasts.</p>
        {error && <div className="admin-login-error" role="alert">{error}</div>}
        <label>
          Email
          <input name="email" type="email" required autoComplete="username" />
        </label>
        <label>
          Password
          <input name="password" type="password" required autoComplete="current-password" />
        </label>
        <button className="button button-red" type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
