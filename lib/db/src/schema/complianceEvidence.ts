import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Evidence locker — every artefact that supports a control's "met" claim.
 * One control can have many evidence rows; evidence may be human-uploaded,
 * AI-asserted (from compliance audits or gap-promote), or auto-derived from
 * traceability links.
 *
 * status:
 *   - ai_asserted : machine-claimed, awaiting human verification
 *   - verified    : human approved — counts as audit-grade evidence
 *   - rejected    : human rejected — kept for history but ignored in scoring
 */
export const complianceEvidenceTable = pgTable("compliance_evidence", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  controlId: text("control_id").notNull(),
  frameworkId: text("framework_id").notNull(),
  kind: text("kind").notNull(), // requirement | file | test_result | report | screenshot | note
  refId: text("ref_id"), // optional FK-ish (requirement.id, file path, test_case.id, …)
  refLabel: text("ref_label").notNull(), // human-readable label used in UI
  source: text("source").notNull().default("ai"), // ai | user | trace
  status: text("status").notNull().default("ai_asserted"),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  verifiedBy: text("verified_by"),
  verifiedAt: timestamp("verified_at"),
});

export type ComplianceEvidence = typeof complianceEvidenceTable.$inferSelect;
