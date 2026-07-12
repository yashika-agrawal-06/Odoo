import {
  AudioLinesIcon,
  BarChart3,
  Fuel,
  GalleryVerticalEndIcon,
  LayoutDashboard,
  Route,
  Settings,
  TerminalIcon,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import * as React from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { usePermissions } from "../context/PermissionsContext.jsx";

const data = {
  projects: [
    {
      icon: <LayoutDashboard />,
      name: "Dashboard",
      url: "/dashboard",
    },
    {
      icon: <Truck />,
      name: "Fleet Registry",
      resource: "fleet",
      url: "/dashboard/fleet",
    },
    {
      icon: <Users />,
      name: "Drivers & Safety",
      resource: "drivers",
      url: "/dashboard/drivers",
    },
    {
      icon: <Route />,
      name: "Trip Dispatcher",
      resource: "trips",
      url: "/dashboard/trips",
    },
    {
      icon: <Wrench />,
      name: "Maintenance Log",
      resource: "fleet",
      url: "/dashboard/maintenance",
    },
    {
      icon: <Fuel />,
      name: "Fuel & Expenses",
      resource: "fuel_expenses",
      url: "/dashboard/finance",
    },
    {
      icon: <BarChart3 />,
      name: "Reports & Analytics",
      resource: "analytics",
      url: "/dashboard/analytics",
    },
    {
      icon: <Settings />,
      name: "Settings (RBAC)",
      resource: "settings",
      url: "/dashboard/settings",
    },
  ],
  teams: [
    {
      logo: <GalleryVerticalEndIcon />,
      name: "TransitOps Inc.",
      plan: "Enterprise",
    },
    {
      logo: <AudioLinesIcon />,
      name: "Acme Logistics",
      plan: "Startup",
    },
    {
      logo: <TerminalIcon />,
      name: "Evil Corp Freight",
      plan: "Free",
    },
  ],
};

export function AppSidebar({ ...props }) {
  const { user, roleSlug, hasPermission } = usePermissions();

  const filteredProjects = React.useMemo(
    () =>
      data.projects.filter((project) => {
        if (!project.resource) {
          return true;
        }
        return hasPermission(project.resource, "view");
      }),
    [hasPermission]
  );

  const navUserMock = React.useMemo(
    () => ({
      avatar: user?.image || "",
      email: user?.email || "",
      name: user?.name || "User",
    }),
    [user]
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={filteredProjects} />
      </SidebarContent>
      <SidebarFooter>
        <ModeToggle className="= hidden group-data-[collapsible=icon]:flex" />
        <div className="flex items-center gap-2">
          <NavUser roleSlug={roleSlug} user={navUserMock} />
          <ModeToggle className="group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
export default AppSidebar;
