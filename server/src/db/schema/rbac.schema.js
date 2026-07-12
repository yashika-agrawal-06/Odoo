import { pgTable, uuid, text, boolean, pgEnum, timestamp, unique } from "drizzle-orm/pg-core";

export const accessLevelEnum = pgEnum("access_level", ["none", "view", "full"]);
export const resourceEnum = pgEnum("resource", [
  "fleet",          
  "drivers",
  "trips",
  "fuel_expenses",
  "analytics",
]);

export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(), 
  name: text("name").notNull(),
  canManageSettings: boolean("can_manage_settings").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    resource: resourceEnum("resource").notNull(),
    accessLevel: accessLevelEnum("access_level").notNull().default("none"),
  },
  (t) => ({
    roleResourceUnique: unique().on(t.roleId, t.resource),
  })
);