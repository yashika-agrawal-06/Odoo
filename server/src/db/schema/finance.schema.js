import { pgTable, uuid, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { vehicles } from "./fleet.schema.js";
import { trips } from "./trips.schema.js";
import { user } from "./auth.schema.js";

export const fuelLogs = pgTable(
  "fuel_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vehicleId: uuid("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
    tripId: uuid("trip_id").references(() => trips.id, { onDelete: "set null" }), 
    date: timestamp("date", { mode: "date" }).notNull(),
    liters: numeric("liters", { precision: 8, scale: 2 }).notNull(),
    cost: numeric("cost", { precision: 12, scale: 2 }).notNull(),
    loggedBy: text("logged_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    vehicleIdx: index("fuel_logs_vehicle_idx").on(t.vehicleId),
    tripIdx: index("fuel_logs_trip_idx").on(t.tripId),
  })
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
    tollAmount: numeric("toll_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    otherAmount: numeric("other_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    loggedBy: text("logged_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    tripIdx: index("expenses_trip_idx").on(t.tripId),
    vehicleIdx: index("expenses_vehicle_idx").on(t.vehicleId),
  })
);