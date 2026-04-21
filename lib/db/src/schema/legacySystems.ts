import { pgTable, text, integer } from "drizzle-orm/pg-core";

export const legacySystemsTable = pgTable("legacy_systems", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  language: text("language").notNull(),
  description: text("description").notNull().default(""),
  locScanned: integer("loc_scanned").notNull().default(0),
  requirementsExtracted: integer("requirements_extracted").notNull().default(0),
  riskScore: integer("risk_score").notNull().default(0),
  modernizationStatus: text("modernization_status").notNull().default("pending"),
});

export type LegacySystem = typeof legacySystemsTable.$inferSelect;
