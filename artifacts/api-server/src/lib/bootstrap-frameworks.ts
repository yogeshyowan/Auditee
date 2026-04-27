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

  // ─── Cybersecurity ─────────────────────────────────────────────────────
  {
    // Reuse the seed's ID so this upserts into the existing row instead of
    // creating a duplicate "ISO 27001" / "ISO/IEC 27001" pair.
    id: "fw-iso",
    code: "ISO/IEC 27001",
    name: "ISO/IEC 27001:2022 — Information Security Management Systems",
    category: "Information Security",
    status: "in_progress",
    controls: [
      { code: "A.5.1", title: "Policies for information security", description: "Information security policy and topic-specific policies shall be defined, approved, published, communicated and reviewed." },
      { code: "A.5.7", title: "Threat intelligence", description: "Information relating to information security threats shall be collected and analysed." },
      { code: "A.5.15", title: "Access control", description: "Rules to control physical and logical access to information and other associated assets shall be established and implemented." },
      { code: "A.5.23", title: "Information security for use of cloud services", description: "Processes for acquisition, use, management and exit from cloud services shall be established in line with the organization's requirements." },
      { code: "A.5.24", title: "Information security incident management planning and preparation", description: "The organization shall plan and prepare for managing information security incidents by defining roles, responsibilities and processes." },
      { code: "A.6.3", title: "Information security awareness, education and training", description: "Personnel and relevant interested parties shall receive appropriate awareness, education and training on the organization's information security policy." },
      { code: "A.7.4", title: "Physical security monitoring", description: "Premises shall be continuously monitored for unauthorised physical access." },
      { code: "A.8.2", title: "Privileged access rights", description: "The allocation and use of privileged access rights shall be restricted and managed." },
      { code: "A.8.7", title: "Protection against malware", description: "Protection against malware shall be implemented and supported by appropriate user awareness." },
      { code: "A.8.8", title: "Management of technical vulnerabilities", description: "Information about technical vulnerabilities of information systems shall be obtained, the organization's exposure evaluated and appropriate measures taken." },
      { code: "A.8.16", title: "Monitoring activities", description: "Networks, systems and applications shall be monitored for anomalous behaviour and appropriate actions taken to evaluate potential information security incidents." },
      { code: "A.8.24", title: "Use of cryptography", description: "Rules for the effective use of cryptography, including cryptographic key management, shall be defined and implemented." },
      { code: "A.8.28", title: "Secure coding", description: "Secure coding principles shall be applied to software development." },
    ],
  },
  {
    id: "fw-iso-27002",
    code: "ISO/IEC 27002",
    name: "ISO/IEC 27002:2022 — Information Security Controls",
    category: "Information Security",
    status: "in_progress",
    controls: [
      { code: "5.10", title: "Acceptable use of information and other assets", description: "Rules for the acceptable use and procedures for handling information and other associated assets shall be identified, documented and implemented." },
      { code: "5.12", title: "Classification of information", description: "Information shall be classified according to the information security needs of the organization based on confidentiality, integrity, availability and relevant interested party requirements." },
      { code: "5.14", title: "Information transfer", description: "Information transfer rules, procedures or agreements shall be in place for all types of transfer facilities within and outside the organization." },
      { code: "5.30", title: "ICT readiness for business continuity", description: "ICT readiness shall be planned, implemented, maintained and tested based on business continuity objectives and ICT continuity requirements." },
      { code: "6.7", title: "Remote working", description: "Security measures shall be implemented when personnel are working remotely to protect information accessed, processed or stored outside the organization's premises." },
      { code: "8.9", title: "Configuration management", description: "Configurations, including security configurations, of hardware, software, services and networks shall be established, documented, implemented, monitored and reviewed." },
      { code: "8.12", title: "Data leakage prevention", description: "Data leakage prevention measures shall be applied to systems, networks and any other devices that process, store or transmit sensitive information." },
      { code: "8.15", title: "Logging", description: "Logs that record activities, exceptions, faults and other relevant events shall be produced, stored, protected and analysed." },
      { code: "8.23", title: "Web filtering", description: "Access to external websites shall be managed to reduce exposure to malicious content." },
      { code: "8.25", title: "Secure development life cycle", description: "Rules for the secure development of software and systems shall be established and applied." },
      { code: "8.26", title: "Application security requirements", description: "Information security requirements shall be identified, specified and approved when developing or acquiring applications." },
      { code: "8.29", title: "Security testing in development and acceptance", description: "Security testing processes shall be defined and implemented in the development life cycle." },
    ],
  },
  {
    id: "fw-nist-csf",
    code: "NIST CSF 2.0",
    name: "NIST Cybersecurity Framework 2.0",
    category: "Cybersecurity",
    status: "in_progress",
    controls: [
      { code: "GV.OC", title: "Organizational Context", description: "The circumstances — mission, stakeholder expectations, dependencies, and legal, regulatory, and contractual requirements — surrounding the organization's cybersecurity risk management decisions are understood." },
      { code: "GV.RM", title: "Risk Management Strategy", description: "The organization's priorities, constraints, risk tolerance and assumptions are established, communicated, and used to support operational risk decisions." },
      { code: "GV.SC", title: "Cybersecurity Supply Chain Risk Management", description: "Cyber supply chain risk management processes are identified, established, managed, monitored, and improved." },
      { code: "ID.AM", title: "Asset Management", description: "Assets (data, hardware, software, systems, facilities, services, people) that enable the organization to achieve business purposes are identified and managed consistent with their relative importance to organizational objectives and the organization's risk strategy." },
      { code: "ID.RA", title: "Risk Assessment", description: "The organization understands the cybersecurity risk to organizational operations, assets and individuals." },
      { code: "PR.AA", title: "Identity Management, Authentication, and Access Control", description: "Access to physical and logical assets is limited to authorized users, services and hardware, and managed commensurate with the assessed risk of unauthorized access." },
      { code: "PR.DS", title: "Data Security", description: "Data is managed consistent with the organization's risk strategy to protect the confidentiality, integrity and availability of information." },
      { code: "PR.PS", title: "Platform Security", description: "The hardware, software and services of physical and virtual platforms are managed consistent with the organization's risk strategy." },
      { code: "DE.CM", title: "Continuous Monitoring", description: "Assets are monitored to find anomalies, indicators of compromise, and other potentially adverse events." },
      { code: "DE.AE", title: "Adverse Event Analysis", description: "Anomalies, indicators of compromise, and other potentially adverse events are analyzed to characterize the events and detect cybersecurity incidents." },
      { code: "RS.MA", title: "Incident Management", description: "Responses to detected cybersecurity incidents are managed." },
      { code: "RS.AN", title: "Incident Analysis", description: "Investigations are conducted to ensure effective response and support forensics and recovery activities." },
      { code: "RC.RP", title: "Incident Recovery Plan Execution", description: "Restoration activities are performed to ensure operational availability of systems and services affected by cybersecurity incidents." },
      { code: "RC.CO", title: "Incident Recovery Communication", description: "Restoration activities are coordinated with internal and external parties." },
    ],
  },
  {
    id: "fw-aspice-cyber",
    code: "ASPICE Cybersecurity 2.0",
    name: "Automotive SPICE for Cybersecurity v2.0 (2025)",
    category: "Automotive Cybersecurity",
    status: "in_progress",
    controls: [
      { code: "SEC.1", title: "Cybersecurity Requirements Elicitation", description: "Identify, elicit and document cybersecurity requirements derived from threat analysis and risk assessment (TARA)." },
      { code: "SEC.2", title: "Cybersecurity Implementation", description: "Implement cybersecurity controls in the architecture, design and code consistent with the elicited cybersecurity requirements." },
      { code: "SEC.3", title: "Risk Treatment Verification", description: "Verify that cybersecurity risks identified in TARA are appropriately treated and that residual risk is acceptable." },
      { code: "SEC.4", title: "Cybersecurity Validation", description: "Validate that the integrated system, in its operational environment, withstands the threats identified in the TARA and meets cybersecurity goals." },
      { code: "ACQ.2", title: "Supplier Cybersecurity Qualification", description: "Suppliers shall demonstrate cybersecurity capability appropriate to the items they deliver, including TARA, secure development and incident response." },
      { code: "MAN.7", title: "Cybersecurity Risk Management", description: "Continuously identify, analyze, treat and monitor cybersecurity risks across the product lifecycle." },
      { code: "SUP.11", title: "Cybersecurity Incident Response", description: "Establish a process to detect, triage, respond to and report cybersecurity incidents affecting fielded vehicles." },
      { code: "SUP.12", title: "Cryptographic Asset Management", description: "Manage cryptographic assets (keys, certificates, hardware roots of trust) over their lifecycle, including provisioning, rotation and revocation." },
    ],
  },
  {
    id: "fw-iec-62443",
    code: "IEC 62443",
    name: "IEC 62443 — Industrial Automation & Control Systems Security",
    category: "Industrial Cybersecurity",
    status: "in_progress",
    controls: [
      { code: "FR1", title: "Identification & Authentication Control (IAC)", description: "All users (humans, software processes and devices) shall be identified and authenticated before being granted access to the IACS." },
      { code: "FR2", title: "Use Control (UC)", description: "Authenticated users shall be enforced to use only the privileges they have been assigned, on the assets they are authorized to use." },
      { code: "FR3", title: "System Integrity (SI)", description: "Ensure the integrity of the IACS to prevent unauthorized manipulation of the control system, communications, software and configuration." },
      { code: "FR4", title: "Data Confidentiality (DC)", description: "Ensure the confidentiality of information on communication channels and in data repositories to prevent unauthorized disclosure." },
      { code: "FR5", title: "Restricted Data Flow (RDF)", description: "Segment the control system network via zones and conduits to limit unnecessary data flow between zones." },
      { code: "FR6", title: "Timely Response to Events (TRE)", description: "Respond to security violations by notifying the proper authority, reporting evidence of the violation and taking timely corrective action." },
      { code: "FR7", title: "Resource Availability (RA)", description: "Ensure the availability of the control system against the degradation or denial of essential services." },
      { code: "SR2.8", title: "Auditable Events", description: "The control system shall provide the capability to generate audit records of security-relevant events, including changes to audit-record settings and security functions." },
      { code: "SR3.4", title: "Software & Information Integrity", description: "Verify the integrity of software and information at startup and during operation, and respond to integrity violations." },
      { code: "SR7.6", title: "Network & Security Configuration Settings", description: "Configure network and security settings according to recommended hardening guides and verify the as-implemented state." },
    ],
  },

  // ─── Functional Safety ─────────────────────────────────────────────────
  {
    id: "fw-iso-26262",
    code: "ISO 26262",
    name: "ISO 26262 — Road Vehicles Functional Safety",
    category: "Automotive Functional Safety",
    status: "in_progress",
    controls: [
      { code: "Pt2-6", title: "Safety Management During Concept & Development", description: "Plan, coordinate and document the safety activities during the concept phase and product development; assign roles and responsibilities." },
      { code: "Pt3-6", title: "Hazard Analysis & Risk Assessment (HARA)", description: "Identify and categorize hazards triggered by malfunctioning behaviour and formulate the safety goals with associated ASIL." },
      { code: "Pt3-7", title: "Functional Safety Concept", description: "Derive the functional safety concept that describes the functional safety requirements with their allocation to system elements." },
      { code: "Pt4-6", title: "Technical Safety Concept", description: "Specify the technical safety requirements and the system architectural design that implements the functional safety concept." },
      { code: "Pt4-9", title: "Safety Validation", description: "Provide evidence that the safety goals are correct, complete and fully achieved at the vehicle level." },
      { code: "Pt6-7", title: "Software Architectural Design", description: "Develop a software architectural design that implements the software safety requirements with adequate freedom from interference." },
      { code: "Pt6-9", title: "Software Unit Verification", description: "Verify that software units fulfil the unit design specification, do not contain undesired functionality, and meet coverage targets appropriate to the ASIL." },
      { code: "Pt6-10", title: "Software Integration & Verification", description: "Integrate the software components and verify that the embedded software fulfils the software safety requirements." },
      { code: "Pt8-6", title: "Specification & Management of Safety Requirements", description: "Specify safety requirements with attributes (ASIL, allocation, traceability) and manage them throughout the lifecycle." },
      { code: "Pt8-7", title: "Configuration Management", description: "Apply configuration management to all safety-related work products to ensure their integrity and reproducibility." },
      { code: "Pt8-9", title: "Verification", description: "Define and execute verification activities (reviews, analyses, tests) appropriate to the ASIL of the work product." },
      { code: "Pt9-5", title: "Requirements Decomposition with Respect to ASIL", description: "If ASIL decomposition is applied, demonstrate sufficient independence between the decomposed requirements and their implementations." },
    ],
  },
  {
    id: "fw-iec-61508",
    code: "IEC 61508",
    name: "IEC 61508 — Functional Safety of E/E/PE Safety-Related Systems",
    category: "Functional Safety",
    status: "in_progress",
    controls: [
      { code: "Pt1-7.1", title: "Overall Safety Lifecycle", description: "Define and follow an overall safety lifecycle, with clear inputs, outputs and verification activities for each phase." },
      { code: "Pt1-7.4", title: "Hazard & Risk Analysis", description: "Determine hazards, hazardous events and hazardous situations; estimate the risk associated with each and identify the safety functions required." },
      { code: "Pt1-7.5", title: "Overall Safety Requirements & Allocation", description: "Specify the overall safety requirements (functional and integrity) and allocate them to designated E/E/PE safety-related systems." },
      { code: "Pt1-7.7", title: "Safety Validation Planning", description: "Plan the validation of the overall safety requirements, including the validation of safety functions and the SIL achieved." },
      { code: "Pt2-7.4", title: "E/E/PE System Design Requirements", description: "Specify the requirements for the design of the E/E/PE system to meet the safety functions and the required safety integrity level (SIL)." },
      { code: "Pt2-7.6", title: "Hardware Safety Integrity", description: "Demonstrate that the hardware safety integrity (architectural constraints and probability of failure) meets the required SIL." },
      { code: "Pt3-7.2", title: "Software Safety Lifecycle Requirements", description: "Apply a software safety lifecycle commensurate with the SIL, including planning, design, coding, verification and validation activities." },
      { code: "Pt3-7.4", title: "Software Architecture Design", description: "Specify a software architecture that meets the software safety requirements and supports the techniques and measures appropriate to the SIL." },
      { code: "Pt3-7.7", title: "Software Module Testing & Integration", description: "Plan, execute and document module testing and integration to demonstrate that the software meets the safety requirements." },
      { code: "Pt7", title: "Techniques & Measures", description: "Select and justify the techniques and measures used in each lifecycle phase from the recommendations in Part 7 against the target SIL." },
    ],
  },
  {
    id: "fw-iec-62304",
    code: "IEC 62304",
    name: "IEC 62304 — Medical Device Software Lifecycle",
    category: "Medical Device Safety",
    status: "in_progress",
    controls: [
      { code: "4.3", title: "Software Safety Classification", description: "Assign a software safety class (A, B or C) to each software system based on possible effects on the patient, operator or other people resulting from a hazard." },
      { code: "5.1", title: "Software Development Planning", description: "Establish a software development plan covering processes, deliverables, tools, configuration management and verification activities." },
      { code: "5.2", title: "Software Requirements Analysis", description: "Define and document software requirements derived from the system requirements and risk control measures." },
      { code: "5.3", title: "Software Architectural Design", description: "Develop and document software architecture that implements the software requirements, with explicit handling of SOUP (software of unknown provenance)." },
      { code: "5.5", title: "Software Unit Implementation & Verification", description: "Implement each software unit and verify it against the unit acceptance criteria appropriate for the safety class." },
      { code: "5.6", title: "Software Integration & Integration Testing", description: "Integrate the software units and verify the integrated software against the integration test plan." },
      { code: "5.7", title: "Software System Testing", description: "Verify that the integrated software system meets the software requirements." },
      { code: "5.8", title: "Software Release", description: "Document and version-control the released software, including known anomalies and associated risk evaluation." },
      { code: "6", title: "Software Maintenance Process", description: "Establish a maintenance process for received feedback, problem analysis, modification implementation and re-release." },
      { code: "7", title: "Software Risk Management Process", description: "Apply the risk management process of ISO 14971 to identify hazardous situations contributed to by software and define risk control measures." },
      { code: "8", title: "Software Configuration Management", description: "Identify configuration items, control changes to them and report on their status throughout the lifecycle." },
      { code: "9", title: "Software Problem Resolution Process", description: "Prepare problem reports for each problem detected, investigate and resolve them, and verify the resolution." },
    ],
  },
  {
    id: "fw-do-178c",
    code: "DO-178C",
    name: "DO-178C — Software Considerations in Airborne Systems",
    category: "Avionics Safety",
    status: "in_progress",
    controls: [
      { code: "4", title: "Software Planning Process", description: "Produce a Plan for Software Aspects of Certification (PSAC), Software Development Plan, Verification Plan, Configuration Management Plan and Quality Assurance Plan." },
      { code: "5.1", title: "Software Requirements Process", description: "Develop high-level software requirements that satisfy the system requirements allocated to software, with traceability to the system requirements." },
      { code: "5.2", title: "Software Design Process", description: "Develop low-level software requirements and software architecture from the high-level requirements, with traceability between levels." },
      { code: "5.3", title: "Software Coding Process", description: "Implement Source Code consistent with the software design and the coding standards defined in the planning process." },
      { code: "5.4", title: "Integration Process", description: "Integrate the Source Code with the target hardware and produce the Executable Object Code." },
      { code: "6.3", title: "Reviews & Analyses of the Requirements", description: "Conduct reviews and analyses of the software requirements, design and code to detect and report errors." },
      { code: "6.4", title: "Software Testing Process", description: "Perform requirements-based test case selection and execute hardware/software integration, software integration and low-level tests." },
      { code: "6.4.4", title: "Structural Coverage Analysis", description: "Analyse the structural coverage achieved by requirements-based testing (statement, decision, MC/DC) appropriate to the software level (DAL A–E)." },
      { code: "7", title: "Software Configuration Management Process", description: "Establish a Software Configuration Management process for control, identification, baselines, problem reporting, archive and release." },
      { code: "8", title: "Software Quality Assurance Process", description: "Provide assurance that the software lifecycle processes produce software that conforms to its requirements and that the processes are followed." },
      { code: "11.20", title: "Software Configuration Index (SCI)", description: "Identify the configuration of the software product including all software lifecycle data and the environment used to develop, verify and produce the software." },
      { code: "12.2", title: "Tool Qualification", description: "Qualify any software tool whose output is part of airborne software and is not verified, or that automates a verification activity such that the activity is eliminated, reduced or automated." },
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
