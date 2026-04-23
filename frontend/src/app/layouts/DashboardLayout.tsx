import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "@/features/Auth/auth-context";

const getNavLinkClassName = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-sky-100 text-sky-700"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;

export const DashboardLayout = () => {
  const { profile, signOut } = useAuth();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-3 py-4 md:flex-row md:px-6">
      <aside className="panel mb-4 w-full shrink-0 p-4 md:mb-0 md:w-64">
        <p className="font-heading text-lg font-bold text-slate-900">Order Admin</p>
        <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">{profile?.role ?? "user"} account</p>

        <nav className="mt-5 space-y-1">
          <NavLink className={getNavLinkClassName} data-atid="nav-dashboard" to="/dashboard">
            Home Dashboard
          </NavLink>
          <NavLink className={getNavLinkClassName} data-atid="nav-orders" to="/orders">
            Management
          </NavLink>
          <NavLink className={getNavLinkClassName} data-atid="nav-profile" to="/profile">
            Profile
          </NavLink>
        </nav>

        <button className="btn-secondary mt-6 w-full" data-atid="logout-button" onClick={() => void signOut()}>
          Sign out
        </button>
      </aside>

      <main className="w-full px-0 md:px-6">
        <Outlet />
      </main>
    </div>
  );
};
