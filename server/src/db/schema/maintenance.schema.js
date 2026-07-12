import { pgTable, uuid, text, numeric, pgEnum, timestamp, index } from "drizzle-orm/pg-core";
import { vehicles } from "./fleet.schema.js";
import { user } from "./auth.schema.js";

export const maintenanceStatusEnum = pgEnum("maintenance_status", ["in_shop", "completed"]);
export const maintenanceLogs = pgTable(
  "maintenance_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vehicleId: uuid("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
    serviceType: text("service_type").notNull(), 
    cost: numeric("cost", { precision: 12, scale: 2 }).notNull(),
    serviceDate: timestamp("service_date", { mode: "date" }).notNull(),
    status: maintenanceStatusEnum("status").notNull().default("in_shop"),
    notes: text("notes"),
    loggedBy: text("logged_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    vehicleIdx: index("maintenance_vehicle_idx").on(t.vehicleId),
    statusIdx: index("maintenance_status_idx").on(t.status),
  })
);