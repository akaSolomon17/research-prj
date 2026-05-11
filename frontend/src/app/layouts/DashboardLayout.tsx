import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "@/features/Auth/auth-context";

const getNavLinkClassName = ({ isActive }: { isActive: boolean }) =>
  `block rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
    isActive
      ? "bg-slate-900 text-white shadow-sm"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;

export const DashboardLayout = () => {
  const { profile, signOut } = useAuth();

  return (
    <div className="page-shell">
      <div className="flex min-h-[calc(100vh-2rem)] flex-col gap-6 md:flex-row">
        <aside className="panel-strong w-full shrink-0 p-5 md:sticky md:top-6 md:h-fit md:w-72">
          <div className="space-y-4">
            <div>
              <p className="font-heading text-2xl font-bold text-slate-900">Order Admin</p>
              <p className="mt-1 text-sm text-slate-500">Operations dashboard for personal orders.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Signed in as</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-900">{profile?.email ?? "Unknown user"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="chip">{profile?.role ?? "user"} account</span>
                {profile?.name ? <span className="chip">{profile.name}</span> : null}
              </div>
            </div>
          </div>

          <nav className="mt-6 space-y-1">
          <NavLink className={getNavLinkClassName} data-atid="nav-dashboard" to="/dashboard">
            Home Dashboard
          </NavLink>
          <NavLink className={getNavLinkClassName} data-atid="nav-orders" to="/orders">
            Management
          </NavLink>
          {profile?.role === "admin" ? (
            <NavLink className={getNavLinkClassName} data-atid="nav-customers" to="/customers">
              Customers
            </NavLink>
          ) : null}
          <NavLink className={getNavLinkClassName} data-atid="nav-profile" to="/profile">
            Profile
          </NavLink>
          </nav>

          <button className="btn-secondary mt-6 w-full" data-atid="logout-button" onClick={() => void signOut()}>
            Sign out
          </button>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="page-band p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
