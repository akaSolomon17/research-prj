import { useEffect, useState } from "react";

import { useAuth } from "@/features/Auth/auth-context";
import { getProfile, updateProfile } from "@/features/Profile/api";

interface OrderSummary {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
}

export const ProfilePage = () => {
  const { session, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [summary, setSummary] = useState<OrderSummary>({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
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
        setFullName(payload.profile.full_name ?? "");
        setPhone(payload.profile.phone ?? "");
        setAvatarUrl(payload.profile.avatar_url ?? "");
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
        fullName: fullName.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl.trim(),
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
      <header>
        <h1 className="font-heading text-3xl font-bold text-slate-900">Profile</h1>
        <p className="mt-2 text-sm text-slate-500">
          Edit your account profile and review your personal order summary.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total orders</p>
          <p className="mt-2 font-heading text-2xl font-bold text-slate-900">{summary.total}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending</p>
          <p className="mt-2 font-heading text-2xl font-bold text-amber-600">{summary.pending}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Completed</p>
          <p className="mt-2 font-heading text-2xl font-bold text-emerald-600">{summary.completed}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cancelled</p>
          <p className="mt-2 font-heading text-2xl font-bold text-rose-600">{summary.cancelled}</p>
        </div>
      </div>

      <div className="panel p-5">
        {loading ? (
          <p className="text-sm text-slate-500">Loading profile...</p>
        ) : (
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="full-name">
                Full name
              </label>
              <input
                id="full-name"
                className="field"
                data-atid="profile-full-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="phone">
                Phone
              </label>
              <input
                id="phone"
                className="field"
                data-atid="profile-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="avatar-url">
                Avatar URL
              </label>
              <input
                id="avatar-url"
                className="field"
                data-atid="profile-avatar-url"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
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
    </section>
  );
};
