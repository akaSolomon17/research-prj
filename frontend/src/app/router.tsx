import { Navigate, createBrowserRouter } from "react-router-dom";

import { DashboardLayout } from "@/app/layouts/DashboardLayout";
import { ProtectedRoute } from "@/app/routes/ProtectedRoute";
import { LoginPage } from "@/features/Auth/pages/LoginPage";
import { HomeDashboardPage } from "@/features/Dashboard/pages/HomeDashboardPage";
import { CustomersPage } from "@/features/Customers/pages/CustomersPage";
import { OrdersPage } from "@/features/Orders/pages/OrdersPage";
import { ProfilePage } from "@/features/Profile/pages/ProfilePage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: <Navigate replace to="/dashboard" />,
          },
          {
            path: "/dashboard",
            element: <HomeDashboardPage />,
          },
          {
            path: "/orders",
            element: <OrdersPage />,
          },
          {
            path: "/customers",
            element: <CustomersPage />,
          },
          {
            path: "/profile",
            element: <ProfilePage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate replace to="/dashboard" />,
  },
]);
