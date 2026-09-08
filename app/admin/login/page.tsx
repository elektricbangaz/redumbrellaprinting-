"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { error: "" };

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="admin-login">
      <form className="admin-login-card" action={formAction}>
        <h1>RED UMBRELLA <span>Admin</span></h1>
        <p>Sign in to manage orders, work orders, POs and broadcasts.</p>
        {state.error && <div className="admin-login-error">{state.error}</div>}
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
