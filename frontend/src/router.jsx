import {
  createBrowserRouter,
  Navigate,
} from "react-router-dom";

import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";
<!-- 
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Organization from "./pages/Organization";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound"; -->

export const router = createBrowserRouter([
  <!-- {
    element: <AuthLayout />,
    children: [
      {
        path: "/",
        element: <Login />,
      },
    ],
  },

  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "employees",
        element: <Employees />,
      },
      {
        path: "organization",
        element: <Organization />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
    ],
  }, -->

  {
    path: "*",
    element: <NotFound />,
  },
]);