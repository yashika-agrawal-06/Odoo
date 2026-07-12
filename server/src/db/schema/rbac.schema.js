import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const accessLevelEnum = pgEnum("access_level", ["none", "view", "full"]);
export const resourceEnum = pgEnum("resource", [
  "fleet",
  "drivers",
  "trips",
  "fuel_expenses",
  "analytics",
]);

export const roles = pgTable("roles", {
  canManageSettings: boolean("can_manage_settings").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    accessLevel: accessLevelEnum("access_level").notNull().default("none"),
    id: uuid("id").defaultRandom().primaryKey(),
    resource: resourceEnum("resource").notNull(),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
  },
  (t) => ({
    roleResourceUnique: unique().on(t.roleId, t.resource),
  })
);
