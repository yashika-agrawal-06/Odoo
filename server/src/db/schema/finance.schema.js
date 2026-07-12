import {
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth.schema.js";
import { vehicles } from "./fleet.schema.js";
import { trips } from "./trips.schema.js";

export const fuelLogs = pgTable(
  "fuel_logs",
  {
    cost: numeric("cost", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    date: timestamp("date", { mode: "date" }).notNull(),
    id: uuid("id").defaultRandom().primaryKey(),
    liters: numeric("liters", { precision: 8, scale: 2 }).notNull(),
    loggedBy: text("logged_by").references(() => user.id, {
      onDelete: "set null",
    }),
    tripId: uuid("trip_id").references(() => trips.id, {
      onDelete: "set null",
    }),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
  },
  (t) => ({
    tripIdx: index("fuel_logs_trip_idx").on(t.tripId),
    vehicleIdx: index("fuel_logs_vehicle_idx").on(t.vehicleId),
  })
);

export const expenses = pgTable(
  "expenses",
  {
    createdAt: timestamp("created_at").notNull().defaultNow(),
    id: uuid("id").defaultRandom().primaryKey(),
    loggedBy: text("logged_by").references(() => user.id, {
      onDelete: "set null",
    }),
    otherAmount: numeric("other_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    tollAmount: numeric("toll_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
  },
  (t) => ({
    tripIdx: index("expenses_trip_idx").on(t.tripId),
    vehicleIdx: index("expenses_vehicle_idx").on(t.vehicleId),
  })
);
