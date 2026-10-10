import { pgTable, text, integer } from "drizzle-orm/pg-core";

export const siteStats = pgTable("site_stats", {
  id: text("id").primaryKey(),
  visitors: integer("visitors").notNull().default(0),
});
