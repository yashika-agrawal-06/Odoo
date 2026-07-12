import { pgTable, uuid, text, integer, numeric, pgEnum, timestamp, index } from "drizzle-orm/pg-core";

export const vehicleTypeEnum = pgEnum("vehicle_type", ["van", "truck", "mini", "bus", "other"]);
export const vehicleStatusEnum = pgEnum("vehicle_status", ["available", "on_trip", "in_shop", "retired"]);
export const licenseCategoryEnum = pgEnum("license_category", ["lmv", "hmv"]);
export const driverStatusEnum = pgEnum("driver_status", ["available", "on_trip", "off_duty", "suspended"]);

// Normalized out of vehicles/drivers instead of a free-text "region" column
// on every table — avoids typo'd duplicates ("Ahmedabad" vs "ahmedabad").
export const regions = pgTable("regions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
});

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    regNo: text("reg_no").notNull().unique(),
    name: text("name").notNull(), // e.g. "VAN-05"
    type: vehicleTypeEnum("type").notNull(),
    capacityKg: numeric("capacity_kg", { precision: 10, scale: 2 }).notNull(),
    odometerKm: integer("odometer_km").notNull().default(0), // maintained cache, see design notes
    acquisitionCost: numeric("acquisition_cost", { precision: 12, scale: 2 }).notNull(),
    status: vehicleStatusEnum("status").notNull().default("available"),
    regionId: uuid("region_id").references(() => regions.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("vehicles_status_idx").on(t.status),
    typeIdx: index("vehicles_type_idx").on(t.type),
  })
);

export const drivers = pgTable(
  "drivers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    licenseNumber: text("license_number").notNull().unique(),
    licenseCategory: licenseCategoryEnum("license_category").notNull(),
    licenseExpiry: timestamp("license_expiry", { mode: "date" }).notNull(),
    contactNumber: text("contact_number").notNull(),
    safetyScore: integer("safety_score").notNull().default(100),
    status: driverStatusEnum("status").notNull().default("available"),
    regionId: uuid("region_id").references(() => regions.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("drivers_status_idx").on(t.status),
    expiryIdx: index("drivers_license_expiry_idx").on(t.licenseExpiry), // for the license-expiry reminder bonus feature
  })
);