import { pgTable, uuid, text, numeric, integer, pgEnum, timestamp, index } from "drizzle-orm/pg-core";
import { vehicles, drivers } from "./fleet.schema.js";
import { user } from "./auth.schema.js";

export const tripStatusEnum = pgEnum("trip_status", ["draft", "dispatched", "completed", "cancelled"]);

export const trips = pgTable(
  "trips",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull().unique(), 
    source: text("source").notNull(),
    destination: text("destination").notNull(),
    vehicleId: uuid("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "restrict" }),
    driverId: uuid("driver_id").notNull().references(() => drivers.id, { onDelete: "restrict" }),
    cargoWeightKg: numeric("cargo_weight_kg", { precision: 10, scale: 2 }).notNull(),
    plannedDistanceKm: numeric("planned_distance_km", { precision: 10, scale: 2 }).notNull(),
    status: tripStatusEnum("status").notNull().default("draft"),
    dispatchedAt: timestamp("dispatched_at"),
    completedAt: timestamp("completed_at"),
    cancelledAt: timestamp("cancelled_at"),
    cancelReason: text("cancel_reason"),
    finalOdometerKm: integer("final_odometer_km"),
    revenueAmount: numeric("revenue_amount", { precision: 12, scale: 2 }), 
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("trips_status_idx").on(t.status),
    vehicleIdx: index("trips_vehicle_idx").on(t.vehicleId),
    driverIdx: index("trips_driver_idx").on(t.driverId),
  })
);