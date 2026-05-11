import { useEffect, useState } from "react";

import { useAuth } from "@/features/Auth/auth-context";
import { getProfile, updateProfile } from "@/features/Profile/api";

interface OrderSummary {
  total: number;
  totalSpent: number;
  totalQuantity: number;
  averageOrderValue: number;
}

export const ProfilePage = () => {
  const { session, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [source, setSource] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [summary, setSummary] = useState<OrderSummary>({
    total: 0,
    totalSpent: 0,
    totalQuantity: 0,
    averageOrderValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }
    setLoading(true);
    void getProfile(session.accessToken)
      .then((payload) => {
        setName(payload.profile.name ?? "");
        setAddress(payload.profile.address ?? "");
        setCity(payload.profile.city ?? "");
        setState(payload.profile.state ?? "");
        setZip(payload.profile.zip ?? "");
        setSource(payload.profile.source ?? "");
        setBirthDate(payload.profile.birth_date ?? "");
        setSummary(payload.orderSummary);
        setError(null);
      })
      .catch((reason: unknown) => {
        const text = reason instanceof Error ? reason.message : "Failed to load profile";
        setError(text);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [session]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) {
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updateProfile(session.accessToken, {
        name: name.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zip: zip.trim() || undefined,
        source: source.trim() || undefined,
        birthDate: birthDate.trim() || undefined,
      });
      await refreshProfile();
      setMessage("Profile updated.");
    } catch (reason: unknown) {
      const text = reason instanceof Error ? reason.message : "Failed to update profile";
      setError(text);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <span className="chip">Personal record</span>
          <h1 className="font-heading text-3xl font-bold text-slate-900">Profile</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-500">
            Edit your personal record and review your order summary without touching order CRUD.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Orders</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{summary.total}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Spent</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">${summary.totalSpent.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Quantity</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{summary.totalQuantity}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Average</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">${summary.averageOrderValue.toLocaleString()}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <aside className="panel-strong space-y-4 p-5">
          <div className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-slate-900">Quick profile summary</h2>
            <p className="text-sm text-slate-500">
              These fields map directly to the `people` table and can be updated independently from orders.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Email</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-900">{session?.user.email ?? "-"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Role</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{session?.user.role ?? "user"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Location</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {[city, state].filter(Boolean).join(", ") || "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Birth date</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{birthDate || "-"}</p>
            </div>
          </div>
        </aside>

        <div className="panel-strong p-5">
        {loading ? (
          <p className="text-sm text-slate-500">Loading profile...</p>
        ) : (
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
            <div className="sm:col-span-2">
              <h2 className="font-heading text-xl font-semibold text-slate-900">Editable fields</h2>
              <p className="mt-1 text-sm text-slate-500">
                Keep this aligned with the table schema and Supabase data model.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                className="field"
                data-atid="profile-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="address">
                Address
              </label>
              <input
                id="address"
                className="field"
                data-atid="profile-address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="city">
                City
              </label>
              <input
                id="city"
                className="field"
                data-atid="profile-city"
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="state">
                State
              </label>
              <input
                id="state"
                className="field"
                data-atid="profile-state"
                value={state}
                onChange={(event) => setState(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="zip">
                ZIP
              </label>
              <input
                id="zip"
                className="field"
                data-atid="profile-zip"
                value={zip}
                onChange={(event) => setZip(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="source">
                Source
              </label>
              <input
                id="source"
                className="field"
                data-atid="profile-source"
                value={source}
                onChange={(event) => setSource(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="birth-date">
                Birth date
              </label>
              <input
                id="birth-date"
                className="field"
                data-atid="profile-birth-date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                type="date"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <button className="btn-primary" data-atid="profile-submit" disabled={saving} type="submit">
                {saving ? "Saving..." : "Save profile"}
              </button>
              {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
              {error ? <p className="text-sm text-rose-700">{error}</p> : null}
            </div>
          </form>
        )}
        </div>
      </div>
    </section>
  );
};
