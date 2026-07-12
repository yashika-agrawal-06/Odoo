import {
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth.schema.js";
import { vehicles } from "./fleet.schema.js";

export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "in_shop",
  "completed",
]);
export const maintenanceLogs = pgTable(
  "maintenance_logs",
  {
    cost: numeric("cost", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    id: uuid("id").defaultRandom().primaryKey(),
    loggedBy: text("logged_by").references(() => user.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    serviceDate: timestamp("service_date", { mode: "date" }).notNull(),
    serviceType: text("service_type").notNull(),
    status: maintenanceStatusEnum("status").notNull().default("in_shop"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
  },
  (t) => ({
    statusIdx: index("maintenance_status_idx").on(t.status),
    vehicleIdx: index("maintenance_vehicle_idx").on(t.vehicleId),
  })
);
