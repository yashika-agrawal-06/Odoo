import { relations } from "drizzle-orm";
import { user } from "./auth.schema.js";
import { roles, rolePermissions } from "./rbac.schema.js";
import { regions, vehicles, drivers } from "./fleet.schema.js";
import { trips } from "./trips.schema.js";
import { maintenanceLogs } from "./maintenance.schema.js";
import { fuelLogs, expenses } from "./finance.schema.js";

export const userRelations = relations(user, ({ one }) => ({
  role: one(roles, { fields: [user.roleId], references: [roles.id] }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  permissions: many(rolePermissions),
  users: many(user),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  region: one(regions, { fields: [vehicles.regionId], references: [regions.id] }),
  trips: many(trips),
  maintenanceLogs: many(maintenanceLogs),
  fuelLogs: many(fuelLogs),
  expenses: many(expenses),
}));

export const driversRelations = relations(drivers, ({ one, many }) => ({
  region: one(regions, { fields: [drivers.regionId], references: [regions.id] }),
  trips: many(trips),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  vehicle: one(vehicles, { fields: [trips.vehicleId], references: [vehicles.id] }),
  driver: one(drivers, { fields: [trips.driverId], references: [drivers.id] }),
  createdByUser: one(user, { fields: [trips.createdBy], references: [user.id] }),
  fuelLogs: many(fuelLogs),
  expenses: many(expenses),
}));

export const maintenanceLogsRelations = relations(maintenanceLogs, ({ one }) => ({
  vehicle: one(vehicles, { fields: [maintenanceLogs.vehicleId], references: [vehicles.id] }),
}));

export const fuelLogsRelations = relations(fuelLogs, ({ one }) => ({
  vehicle: one(vehicles, { fields: [fuelLogs.vehicleId], references: [vehicles.id] }),
  trip: one(trips, { fields: [fuelLogs.tripId], references: [trips.id] }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  vehicle: one(vehicles, { fields: [expenses.vehicleId], references: [vehicles.id] }),
  trip: one(trips, { fields: [expenses.tripId], references: [trips.id] }),
}));