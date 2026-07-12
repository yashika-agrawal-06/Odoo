import { pgTable, text, integer } from "drizzle-orm/pg-core";
export const posts = pgTable("posts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: text().notNull(),
  userId: text("user_id").notNull(), 
});
