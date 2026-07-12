import { Outlet, useLocation } from "react-router-dom";

import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function DashboardLayout() {
  const location = useLocation();

  const getHeaderTitle = () => {
    switch (location.pathname) {
      case "/dashboard":
        return "Dashboard Overview";
      case "/dashboard/fleet":
        return "Fleet Registry";
      case "/dashboard/drivers":
        return "Drivers & Safety Profiles";
      case "/dashboard/trips":
        return "Trip Dispatcher";
      case "/dashboard/maintenance":
        return "Maintenance Logs";
      case "/dashboard/finance":
        return "Fuel & Expenses";
      case "/dashboard/analytics":
        return "Reports & Analytics";
      case "/dashboard/settings":
        return "RBAC Settings Matrix";
      default:
        return "TransitOps";
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator className="mr-2" orientation="vertical" />
          <span className="font-semibold">{getHeaderTitle()}</span>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
