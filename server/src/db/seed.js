const ROLES = [
  { slug: "fleet_manager", name: "Fleet Manager", canManageSettings: true,
    perms: { fleet: "full", drivers: "full", trips: "none", fuel_expenses: "none", analytics: "full" } },
  { slug: "dispatcher", name: "Dispatcher", canManageSettings: false,
    perms: { fleet: "view", drivers: "none", trips: "full", fuel_expenses: "none", analytics: "none" } },
  { slug: "safety_officer", name: "Safety Officer", canManageSettings: false,
    perms: { fleet: "none", drivers: "full", trips: "view", fuel_expenses: "none", analytics: "none" } },
  { slug: "financial_analyst", name: "Financial Analyst", canManageSettings: false,
    perms: { fleet: "view", drivers: "none", trips: "none", fuel_expenses: "full", analytics: "full" } },
];