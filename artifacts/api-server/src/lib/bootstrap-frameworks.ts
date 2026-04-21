import { pool } from "@workspace/db";
import { logger } from "./logger";

type SeedFramework = {
  id: string;
  code: string;
  name: string;
  category: string;
  status: string;
  controls: Array<{ code: string; title: string; description: string }>;
};

const FRAMEWORKS: SeedFramework[] = [
  {
    id: "fw-aspice-4",
    code: "ASPICE 4.0",
    name: "Automotive SPICE 4.0",
    category: "Automotive Process",
    status: "in_progress",
    controls: [
      { code: "ACQ.4", title: "Supplier Monitoring", description: "Monitor the supplier's performance against agreed requirements." },
      { code: "SYS.1", title: "Requirements Elicitation", description: "Establish and maintain stakeholder requirements over the life cycle." },
      { code: "SYS.2", title: "System Requirements Analysis", description: "Transform stakeholder requirements into a set of system requirements." },
      { code: "SYS.3", title: "System Architectural Design", description: "Establish a system architectural design and identify which system requirements are allocated to which elements." },
      { code: "SYS.4", title: "System Integration and Integration Verification", description: "Integrate system items and verify integration against the system architectural design." },
      { code: "SYS.5", title: "System Verification", description: "Verify the integrated system against the system requirements." },
      { code: "SWE.1", title: "Software Requirements Analysis", description: "Establish a structured set of software requirements consistent with system requirements." },
      { code: "SWE.2", title: "Software Architectural Design", description: "Establish a software architectural design and allocate requirements to software components." },
      { code: "SWE.3", title: "Software Detailed Design and Unit Construction", description: "Provide a detailed design for the software components and produce verified software units." },
      { code: "SWE.4", title: "Software Unit Verification", description: "Verify software units against the software detailed design and unit verification criteria." },
      { code: "SWE.5", title: "Software Component Verification and Integration Verification", description: "Verify software components and the integration of software components against the architectural design." },
      { code: "SWE.6", title: "Software Verification", description: "Verify the integrated software against the software requirements." },
      { code: "VAL.1", title: "Validation", description: "Provide objective evidence that the system, when used in its intended operational environment, satisfies stakeholder needs." },
      { code: "SUP.1", title: "Quality Assurance", description: "Provide independent and objective assurance that work products and processes comply with predefined provisions and plans." },
      { code: "SUP.8", title: "Configuration Management", description: "Establish and maintain the integrity of all work products of a process or project." },
      { code: "SUP.9", title: "Problem Resolution Management", description: "Identify, analyze, manage and control problems to resolution." },
      { code: "SUP.10", title: "Change Request Management", description: "Manage all change requests in a systematic and traceable way." },
      { code: "MAN.3", title: "Project Management", description: "Identify, establish, and control the activities and resources necessary for a project to produce a product." },
      { code: "MAN.5", title: "Risk Management", description: "Continuously identify, analyze, treat and monitor risks." },
      { code: "MAN.6", title: "Measurement", description: "Collect and analyze data relating to products, processes and projects to support effective management." },
    ],
  },
  {
    id: "fw-cmmi-3",
    code: "CMMI 3.0",
    name: "CMMI for Development v3.0",
    category: "Process Maturity",
    status: "in_progress",
    controls: [
      { code: "GOV", title: "Governance", description: "Provide guidance to senior management on their role in sponsoring and steering process activities." },
      { code: "II", title: "Implementation Infrastructure", description: "Ensure processes important to the organization are persistently and habitually used and improved." },
      { code: "EST", title: "Estimating", description: "Estimate the size, effort, duration, resources, and cost of the work and resources required to develop, acquire, or deliver the solution." },
      { code: "PLAN", title: "Planning", description: "Develop plans to describe what is needed to accomplish the work within the standards and constraints of the organization." },
      { code: "MC", title: "Monitor and Control", description: "Provide an understanding of the project progress so appropriate corrective actions can be taken when performance deviates significantly from plans." },
      { code: "SAM", title: "Supplier Agreement Management", description: "Manage the acquisition of products and services from suppliers." },
      { code: "RDM", title: "Requirements Development and Management", description: "Elicit requirements, ensure common understanding by stakeholders, and align requirements, plans, and work products." },
      { code: "TS", title: "Technical Solution", description: "Design and build solutions (products, services, and solution components) that meet customer requirements." },
      { code: "PI", title: "Product Integration", description: "Integrate and deliver the solution that addresses functionality and quality requirements." },
      { code: "VV", title: "Verification and Validation", description: "Confirm that the solution and solution components meet their requirements and validate that they fulfill their intended use." },
      { code: "PR", title: "Peer Reviews", description: "Identify and address work product issues through reviews by the producer's peers or subject matter experts." },
      { code: "RSK", title: "Risk and Opportunity Management", description: "Identify, record, analyze, and manage potential risks or opportunities." },
      { code: "CM", title: "Configuration Management", description: "Manage the integrity of work products using configuration identification, control, status accounting, and audits." },
      { code: "PQA", title: "Process Quality Assurance", description: "Verify and enable improvement of the quality of the performed processes and resulting work products." },
      { code: "CAR", title: "Causal Analysis and Resolution", description: "Identify causes of selected outcomes and take action to either prevent recurrence of undesirable outcomes or ensure recurrence of positive outcomes." },
      { code: "DAR", title: "Decision Analysis and Resolution", description: "Make and record decisions using a recorded process that analyzes alternatives." },
      { code: "OT", title: "Organizational Training", description: "Develop the competence of people to perform their roles effectively and efficiently." },
      { code: "PAD", title: "Process Asset Development", description: "Develop and keep updated the process assets necessary to perform the work." },
      { code: "MPM", title: "Managing Performance and Measurement", description: "Manage performance using measurement and analysis to achieve business objectives." },
    ],
  },
];

export async function bootstrapFrameworks(): Promise<void> {
  try {
    for (const fw of FRAMEWORKS) {
      await pool.query(
        `INSERT INTO compliance_frameworks (id, code, name, category, status, score, controls_total, last_audit_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7, NOW())
         ON CONFLICT (id) DO UPDATE SET
           code = EXCLUDED.code,
           name = EXCLUDED.name,
           category = EXCLUDED.category,
           controls_total = EXCLUDED.controls_total`,
        [fw.id, fw.code, fw.name, fw.category, fw.status, 0, fw.controls.length],
      );
      let inserted = 0;
      for (const c of fw.controls) {
        const id = `${fw.id}-${c.code.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
        const res = await pool.query(
          `INSERT INTO compliance_controls (id, framework_id, code, title, description, status, owner, evidence_count)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (id) DO NOTHING`,
          [id, fw.id, c.code, c.title, c.description, "not_assessed", "Unassigned", 0],
        );
        if (res.rowCount && res.rowCount > 0) inserted++;
      }
      if (inserted > 0) {
        logger.info({ framework: fw.code, inserted }, "Bootstrapped framework controls");
      }
    }
  } catch (err) {
    logger.warn({ err }, "Framework bootstrap failed (continuing startup)");
  }
}
