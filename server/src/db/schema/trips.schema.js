import {
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth.schema.js";
import { drivers, vehicles } from "./fleet.schema.js";

export const tripStatusEnum = pgEnum("trip_status", [
  "draft",
  "dispatched",
  "completed",
  "cancelled",
]);

export const trips = pgTable(
  "trips",
  {
    cancelledAt: timestamp("cancelled_at"),
    cancelReason: text("cancel_reason"),
    cargoWeightKg: numeric("cargo_weight_kg", {
      precision: 10,
      scale: 2,
    }).notNull(),
    code: text("code").notNull().unique(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    destination: text("destination").notNull(),
    dispatchedAt: timestamp("dispatched_at"),
    driverId: uuid("driver_id")
      .notNull()
      .references(() => drivers.id, { onDelete: "restrict" }),
    finalOdometerKm: integer("final_odometer_km"),
    id: uuid("id").defaultRandom().primaryKey(),
    plannedDistanceKm: numeric("planned_distance_km", {
      precision: 10,
      scale: 2,
    }).notNull(),
    revenueAmount: numeric("revenue_amount", { precision: 12, scale: 2 }),
    source: text("source").notNull(),
    status: tripStatusEnum("status").notNull().default("draft"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "restrict" }),
  },
  (t) => ({
    driverIdx: index("trips_driver_idx").on(t.driverId),
    statusIdx: index("trips_status_idx").on(t.status),
    vehicleIdx: index("trips_vehicle_idx").on(t.vehicleId),
  })
);
