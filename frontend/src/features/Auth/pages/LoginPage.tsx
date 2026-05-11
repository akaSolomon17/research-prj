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
    <div className="page-shell flex min-h-screen items-center">
      <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="panel-strong overflow-hidden p-0">
          <div className="grid min-h-[640px] lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col justify-between bg-slate-950 px-8 py-8 text-white sm:px-10 sm:py-10">
              <div className="max-w-xl space-y-5">
                <span className="chip border-white/10 bg-white/10 text-white/80">Order Admin Tool</span>
                <div className="space-y-3">
                  <h1 className="font-heading text-4xl font-bold leading-tight text-white">
                    Manage personal orders with a clean operational dashboard.
                  </h1>
                  <p className="max-w-lg text-sm leading-6 text-slate-300">
                    Sign in with Supabase auth, view charts, manage orders, and keep profile data in sync.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400">Auth</p>
                  <p className="mt-2 text-lg font-semibold text-white">Supabase</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400">Orders</p>
                  <p className="mt-2 text-lg font-semibold text-white">CRUD table</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400">Profile</p>
                  <p className="mt-2 text-lg font-semibold text-white">Editable record</p>
                </div>
              </div>
            </div>

            <div className="flex items-center bg-white px-6 py-8 sm:px-10">
              <div className="w-full">
                <div className="space-y-2">
                  <p className="font-heading text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Secure sign in
                  </p>
                  <h2 className="font-heading text-3xl font-bold text-slate-900">Login</h2>
                  <p className="text-sm text-slate-500">
                    Use your Supabase account to access dashboard and management screens.
                  </p>
                </div>

                <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
                      Email
                    </label>
                    <input
                      id="email"
                      className="field-soft"
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
                      className="field-soft"
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
                      className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
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
          </div>
        </section>
      </div>
    </div>
  );
};
