import { createBrowserRouter, Navigate } from "react-router-dom";

import AuthLayout from "./layouts/auth-layout";
import DashboardLayout from "./layouts/dashboard-layout";
import Analytics from "./pages/analytics";
import Dashboard from "./pages/dashboard";
import Drivers from "./pages/drivers";
import Finance from "./pages/finance";
import Fleet from "./pages/fleet";
import Login from "./pages/login";
import Maintenance from "./pages/maintenance";
import NotFound from "./pages/not-found";
import Settings from "./pages/settings";
import Trips from "./pages/trips";
import ProtectedRoute from "./routes/ProtectedRoute";

export const router = createBrowserRouter([
  {
    children: [
      {
        element: <Login />,
        path: "/",
      },
    ],
    element: <AuthLayout />,
  },
  {
    children: [
      {
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
        index: true,
      },
      {
        element: (
          <ProtectedRoute level="view" resource="fleet">
            <Fleet />
          </ProtectedRoute>
        ),
        path: "fleet",
      },
      {
        element: (
          <ProtectedRoute level="view" resource="drivers">
            <Drivers />
          </ProtectedRoute>
        ),
        path: "drivers",
      },
      {
        element: (
          <ProtectedRoute level="view" resource="trips">
            <Trips />
          </ProtectedRoute>
        ),
        path: "trips",
      },
      {
        element: (
          <ProtectedRoute level="view" resource="fleet">
            <Maintenance />
          </ProtectedRoute>
        ),
        path: "maintenance",
      },
      {
        element: (
          <ProtectedRoute level="view" resource="fuel_expenses">
            <Finance />
          </ProtectedRoute>
        ),
        path: "finance",
      },
      {
        element: (
          <ProtectedRoute level="view" resource="analytics">
            <Analytics />
          </ProtectedRoute>
        ),
        path: "analytics",
      },
      {
        element: (
          <ProtectedRoute resource="settings">
            <Settings />
          </ProtectedRoute>
        ),
        path: "settings",
      },
    ],
    element: <DashboardLayout />,
    path: "/dashboard",
  },
  {
    element: <Navigate replace to="/" />,
    path: "/login",
  },
  {
    element: <NotFound />,
    path: "*",
  },
]);
export default router;
