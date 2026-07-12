import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import "./index.css";
import { ThemeProvider } from "@/components/theme-provider";
import { PermissionsProvider } from "./context/PermissionsContext";
import { router } from "./router";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <PermissionsProvider>
        <RouterProvider router={router} />
      </PermissionsProvider>
    </ThemeProvider>
  </StrictMode>
);
