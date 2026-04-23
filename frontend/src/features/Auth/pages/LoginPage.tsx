import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "@/features/Auth/auth-context";
import { validateLoginForm } from "@/features/Auth/utils";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn, session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => !pending && email.trim().length > 0 && password.trim().length > 0,
    [email, password, pending],
  );

  if (!loading && session) {
    return <Navigate replace to="/dashboard" />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const validationError = validateLoginForm({ email, password });
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setPending(true);
    const result = await signIn({
      email: email.trim(),
      password: password.trim(),
    });
    setPending(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="panel w-full max-w-md p-8">
        <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
          Order Admin Tool
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-slate-900">Login</h1>
        <p className="mt-2 text-sm text-slate-500">
          Sign in with your Supabase account to manage orders.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="field"
              data-atid="login-email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@demo.com"
              type="email"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="field"
              data-atid="login-password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="******"
              type="password"
            />
          </div>

          {errorMessage ? (
            <div
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              data-atid="login-error"
              role="alert"
            >
              {errorMessage}
            </div>
          ) : null}

          <button className="btn-primary w-full" data-atid="login-submit" disabled={!canSubmit} type="submit">
            {pending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};
