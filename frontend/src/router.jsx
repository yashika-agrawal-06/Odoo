import { createBrowserRouter, Navigate } from "react-router-dom";

import AuthLayout from "./layouts/auth-layout";
import DashboardLayout from "./layouts/dashboard-layout";
import Dashboard from "./pages/dashboard";
import Login from "./pages/login";
import NotFound from "./pages/not-found";
import Projects from "./pages/projects";
import Reports from "./pages/reports";
import Settings from "./pages/settings";

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
        element: <Dashboard />,
        index: true,
      },
      {
        element: <Projects />,
        path: "projects",
      },
      {
        element: <Reports />,
        path: "reports",
      },
      {
        element: <Settings />,
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
