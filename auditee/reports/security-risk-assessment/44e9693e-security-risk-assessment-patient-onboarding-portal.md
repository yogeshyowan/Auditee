# Security Risk Assessment: Patient Onboarding Portal

_Comprehensive Review for a Hospital Network_


> **Kind:** `security_risk_assessment` · **Tone:** `executive` · **Generated:** 2026-05-07T02:32:09.457Z

## Executive summary

This Security Risk Assessment (SRA) details the inherent risks associated with the new Patient Onboarding Portal for the hospital network. The portal will handle sensitive Protected Health Information (PHI) and integrate with critical hospital systems. Our analysis identifies key assets, potential threats, vulnerabilities, and the commensurate impact on confidentiality, integrity, and availability. We propose a strategic treatment plan involving specific controls to mitigate identified risks, ensuring HIPAA compliance and safeguarding patient data. The findings emphasize critical areas requiring immediate attention to secure patient information and maintain operational integrity.

## System Characterisation

The Patient Onboarding Portal is designed to streamline the patient registration process for a hospital network. Its primary purpose is to allow patients to securely submit medical history, upload insurance documentation, and book initial appointments prior to their visit. The system's boundary encompasses the mobile-accessible web application, backend services, and all associated data stores. It interfaces directly with critical hospital systems, including Epic EHR for patient records via HL7 v2 and Cerner for appointment scheduling via FHIR REST APIs. Billing data is transmitted to the hospital's billing system using HL7 FHIR APIs, and payment processing is handled by Stripe. Insurance eligibility verification is conducted via Experian through SFTP batch processing. Hosting will be on AWS cloud infrastructure, chosen for its compliance features and scalability, rather than on-premise. The system handles highly sensitive data, including Protected Health Information (PHI), which is classified as *critical* for confidentiality, integrity, and availability. Users include patients (accessing their own data), hospital staff (e.g., clinic, billing, and administrative personnel with role-based access), and third-party vendors accessing specific data elements per contractual agreements tied to BAAs.

_Evidence: `A-0001`, `A-0009`, `A-0010`, `A-0011`, `A-0012`, `A-0017`, `A-0019`, `A-0020`, `A-0021`, `A-0022`, `A-0037`, `A-PA-0001`_

## Asset Inventory & Valuation

A comprehensive inventory of data-processing assets is crucial for understanding the system's risk profile. Key assets include:

*   **Patient PHI Database (PostgreSQL):** Stores names, dates of birth, medical conditions, medications, social security numbers, and emergency contact details. Rated *Critical* for Confidentiality, Integrity, and Availability due to its highly sensitive nature and direct impact on patient safety and regulatory compliance.
*   **Insurance Card Image Storage:** Stores encrypted images of insurance cards. Rated *High* for Confidentiality and Integrity, *Medium* for Availability. Loss or compromise could lead to identity theft and billing issues.
*   **Authentication & Authorization Service:** Manages user identities and access controls. Rated *Critical* for Confidentiality and Integrity, *High* for Availability. Failure here compromises the entire system.
*   **External Integration APIs (Epic, Cerner, Stripe, Experian, Twilio):** The conduits for data exchange with key hospital and third-party systems. Rated *High* for Integrity and Availability, *Medium* for Confidentiality. Disruptions directly impact business operations and data consistency.
*   **Audit Logs:** Records all PHI access and system events. Rated *Critical* for Integrity, *High* for Availability, but *Low* for Confidentiality itself (contains metadata, not raw PHI). Essential for forensic analysis and compliance.
*   **Encryption Keys:** Used for AES-256 at-rest and TLS in-transit encryption. Rated *Critical* for Confidentiality and Integrity. Compromise renders all encrypted data vulnerable.

_Evidence: `A-0002`, `A-0001`, `A-0015`, `A-0016`, `A-0018`, `A-0026`, `A-0034`_

## Threat Source Identification

Threat sources to the Patient Onboarding Portal can be categorised as adversarial or non-adversarial:

*   **Adversarial:**
    *   **Nation-State Actors:** *Capability: Very High, Intent: High (Espionage/Disruption)*. They possess sophisticated tools and resources for targeted attacks, aiming for large-scale data exfiltration or critical infrastructure disruption.
    *   **Organized Cybercriminals:** *Capability: High, Intent: Very High (Financial Gain)*. Highly motivated to exploit PHI for identity theft, insurance fraud, or ransomware attacks, leveraging common vulnerabilities and zero-day exploits.
    *   **Malicious Insiders (Employees/Contractors):** *Capability: Medium, Intent: Medium (Financial Gain/Revenge/Espionage)*. Possess legitimate access, enabling them to bypass perimeter defenses and exfiltrate data, often difficult to detect.
    *   **Hacktivists:** *Capability: Medium, Intent: Medium (Reputational Damage/Political Agenda)*. May target healthcare entities to expose data or disrupt services for ideological reasons.

*   **Non-Adversarial:**
    *   **Accidental User Error:** *Capability: High, Intent: N/A*. Mistakes by patients or staff (e.g., misconfiguration, accidental sharing, data entry errors) leading to data compromise or system interruption.
    *   **System Malfunction/Software Bugs:** *Capability: High, Intent: N/A*. Unforeseen software defects or hardware failures causing data corruption, service outages, or security vulnerabilities.
    *   **Environmental Disasters:** *Capability: Medium, Intent: N/A*. Events like power outages, natural disasters impacting data centers, leading to service unavailability.
    *   **Third-Party Vendor Vulnerabilities:** *Capability: High, Intent: N/A*. Vulnerabilities in integrated external services (e.g., AWS, Stripe, Experian, Twilio) that could be exploited by other threats or lead to data exposure through misconfiguration.

_Evidence: `A-0006`, `A-0008`, `A-0023`_

## Vulnerability Identification

Identified vulnerabilities within the Patient Onboarding Portal present potential avenues for threat actors to exploit system weaknesses:

*   **Insufficient Access Control Enforcement (CWE-284):** Inadequate implementation of Role-Based Access Control (RBAC) could allow unauthorized staff or patients to access sensitive PHI beyond their permissions. This includes potential for privilege escalation if roles are not granularly defined or enforced, leading to breaches of confidentiality and integrity, particularly for `Patient PHI Database` and `Audit Logs`.
*   **Weak Encryption Key Management (CWE-320):** If encryption keys for `Patient PHI Database` and `Encryption Keys` are not securely stored, rotated, or managed, they can be compromised. This could render AES-256 encryption ineffective, exposing PHI at rest.
*   **Insecure API Design/Implementation (CWE-287, CWE-200):** Vulnerabilities in `External Integration APIs` (Epic, Cerner, Stripe, Experian, Twilio) such as weak authentication, lack of input validation, or excessive data exposure. These could lead to data injection, unauthorized access to PHI, or denial of service impacting `External Integration APIs` and `Patient PHI Database`.
*   **Lack of Real-time Security Monitoring (CWE-778):** Absence of robust anomaly detection and real-time alerting (beyond basic logging) limits the ability to identify and respond to active threats, impacting `Audit Logs` and `Authentication & Authorization Service`.
*   **Inadequate Third-Party Vendor Security Assurance:** Reliance on `Third-Party Vendor Vulnerabilities` without continuous auditing of their security posture introduces supply chain risk, affecting `External Integration APIs` and potentially all data processed through them.
*   **Cross-Site Scripting (XSS) / SQL Injection (CWE-79, CWE-89):** Common web application vulnerabilities that, if present, could allow attackers to steal user session tokens, deface the portal, or extract data directly from `Patient PHI Database`.

_Evidence: `A-0015`, `A-0016`, `A-0017`, `A-0004`, `A-0006`, `A-0040`, `A-PA-0001`_

## Likelihood & Impact Determination

For critical threat-vulnerability pairs, the likelihood and impact are assessed:

*   **Threat: Malicious Insider + Vulnerability: Insufficient Access Control Enforcement:**
    *   **Likelihood: High.** Malicious insiders already possess legitimate access, reducing the attack surface complexity. The risk is magnified if granular RBAC is not fully enforced (A-0017, A-PA-0001). Training and robust system controls are essential.
    *   **Impact: Very High.** Can lead to widespread PHI exfiltration, direct manipulation of `Patient PHI Database` or `Audit Logs` with severe legal, reputational, and financial consequences (HIPAA violations, fines, patient lawsuits).

*   **Threat: Organized Cybercriminals + Vulnerability: Insecure API Design/Implementation:**
    *   **Likelihood: High.** APIs are exposed to the internet. Flaws in authentication or data handling (A-0019, A-0020, A-0022) are frequently targeted. Automated scanning tools can quickly identify common API vulnerabilities.
    *   **Impact: Very High.** Compromise of `External Integration APIs` could result in large-scale PHI exposure from the `Patient PHI Database`, disruption of core hospital operations, and significant data integrity issues.

*   **Threat: Accidental User Error + Vulnerability: Weak Encryption Key Management:**
    *   **Likelihood: Medium.** While accidental, misconfigurations or lack of adherence to key management policies can inadvertently expose or weaken key protection for `Encryption Keys` (A-0015). This is less about direct attack and more about operational oversight.
    *   **Impact: Very High.** Loss or compromise of encryption keys effectively negates all data-at-rest encryption, leading to direct exposure of `Patient PHI Database` contents, making it a critical threat to confidentiality.

*   **Threat: System Malfunction + Vulnerability: Lack of Real-time Security Monitoring:**
    *   **Likelihood: Medium.** Software bugs or infrastructure failures are inevitable. Without adequate logging and real-time anomaly detection (A-0004, A-0042), such malfunctions could go unnoticed or delay incident response.
    *   **Impact: High.** Can lead to prolonged outages, data corruption if unaddressed, or undetected breaches, impacting availability and integrity of all system assets and delaying recovery.

_Evidence: `A-0004`, `A-0005`, `A-0015`, `A-0017`, `A-0019`, `A-0020`, `A-0022`, `A-0023`, `A-0026`, `A-0034`, `A-0040`, `A-0042`, `A-PA-0001`_

## Risk Ranking & Treatment

Based on the likelihood and impact analysis, risks are ranked and treatment decisions are made.

*   **Risk 1: Insider Threat via Weak Access Controls.** *(Likelihood: High, Impact: Very High) -> Risk Score: Critical.*
    *   **Treatment: Mitigate.** Implement robust Role-Based Access Control (RBAC) with regular audits. Mandate Multi-Factor Authentication (MFA) for all staff (A-0017, A-0040, A-PA-0001). Conduct mandatory security awareness training including PHI handling and least privilege principles. Review access logs (A-0026, A-0034) frequently for anomalous activity.
    *   **Residual Risk: Medium-Low.** With strong controls, the likelihood of an insider successfully exploiting weak access is significantly reduced.

*   **Risk 2: API Compromise by Cybercriminals.** *(Likelihood: High, Impact: Very High) -> Risk Score: Critical.*
    *   **Treatment: Mitigate.** Conduct thorough security testing (penetration testing, code review) of all APIs before deployment and on an ongoing basis (A-0019, A-0020, A-0022). Implement API gateway with rate limiting, input validation, and strong authentication. Ensure TLS 1.2+ is universally enforced (A-0016). Implement comprehensive API monitoring (A-0042).
    *   **Residual Risk: Medium.** While continuous vigilance is needed, proactive security in API development and deployment lowers exploitable surface.

*   **Risk 3: Data Exposure due to Poor Encryption Key Management.** *(Likelihood: Medium, Impact: Very High) -> Risk Score: High.*
    *   **Treatment: Mitigate.** Implement a dedicated Key Management System (KMS) for AES-256 encryption keys, ensuring secure storage, automated rotation, and strict access controls (A-0015). Establish clear operational procedures and mandatory training for key management.
    *   **Residual Risk: Medium-Low.** Centralized and automated KMS significantly reduces human error and direct compromise of keys.

*   **Risk 4: Undetected Security Incidents due to Inadequate Monitoring.** *(Likelihood: Medium, Impact: High) -> Risk Score: High.*
    *   **Treatment: Mitigate.** Implement a Security Information and Event Management (SIEM) system for real-time anomaly detection and alerting (A-0004). Develop and regularly test incident response procedures with defined RTO/RPO (A-0005). Ensure comprehensive audit trails are maintained for 7 years (A-0026, A-0034).
    *   **Residual Risk: Medium.** While incidents may occur, early detection and a mature incident response plan significantly reduce impact durations.

## Evidence index

- `A-0001` — System shall collect and store specified PHI elements securely _(requirement)_
- `A-0002` — System shall maintain an inventory of all data-processing assets with risk-tier classification _(requirement)_
- `A-0003` — System shall enforce 6-year retention and cryptographic erasure for patient data _(requirement)_
- `A-0004` — System shall detect and log security anomalies in real-time _(requirement)_
- `A-0005` — System shall define incident response and recovery procedures with defined roles and RTO/RPO _(requirement)_
- `A-0006` — System shall assess and monitor third-party vendor security compliance _(requirement)_
- `A-0007` — System shall support mobile browsers and meet accessibility standards _(requirement)_
- `A-0008` — System shall achieve defined availability and completion targets _(requirement)_
- `A-0009` — System shall integrate bidirectionally with Epic EHR for patient records _(requirement)_
- `A-0010` — System shall retrieve real-time appointment availability from Cerner scheduling _(requirement)_
- `A-0011` — System shall transmit billing data to hospital billing system via HL7 FHIR APIs _(requirement)_
- `A-0012` — System shall implement patient registration workflow with mandatory fields _(requirement)_
- `A-0013` — System shall conditionally request re-upload of invalid insurance documents _(requirement)_
- `A-0014` — System shall send confirmation email upon successful appointment booking _(requirement)_
- `A-0015` — System shall encrypt SSN and health history at rest using AES-256 _(requirement)_
- `A-0016` — System shall encrypt all PHI in transit using TLS 1.2 or higher _(requirement)_
- `A-0017` — System shall restrict PHI access to authenticated patients and authorized staff _(requirement)_
- `A-0018` — System shall encrypt insurance card images at rest and in transit _(requirement)_
- `A-0019` — System shall integrate with Cerner scheduling via FHIR REST API _(requirement)_
- `A-0020` — System shall integrate with Epic EHR via HL7 v2 for patient records _(requirement)_
- `A-0021` — System shall verify insurance eligibility via Experian using SFTP batch processing _(requirement)_
- `A-0022` — System shall process payments via Stripe using HTTPS webhooks _(requirement)_
- `A-0023` — System shall maintain 99.5% availability during business hours _(requirement)_
- `A-0024` — System shall load pages in under 3 seconds on 4G networks _(requirement)_
- `A-0025` — System shall provide intuitive mobile UI for diverse literacy levels _(requirement)_
- `A-0026` — System shall maintain comprehensive audit trail of all PHI access _(requirement)_
- `A-0027` — System security architecture shall be documented in Security and Deployment viewpoint _(requirement)_
- `A-0028` — System availability architecture shall be documented in Operations viewpoint _(requirement)_
- `A-0029` — System UX architecture shall be documented in Logical and Interface viewpoints _(requirement)_
- `A-0030` — System shall support 500 concurrent patient sessions _(requirement)_
- `A-0031` — System shall process 5,000 new patient registrations per week _(requirement)_
- `A-0032` — System shall achieve sub-2-second page load time _(requirement)_
- `A-0033` — System shall store and manage 100 GB of patient documents within 18 months _(requirement)_
- `A-0034` — System shall log full audit trail of all PHI access for 7 years _(requirement)_
- `A-0035` — System shall comply with WCAG 2.1 Level AA accessibility standards _(requirement)_
- `A-0036` — System shall notify state AGs of data breaches within 60 days _(requirement)_
- `A-0037` — System shall document AWS cloud vs. on-premise deployment decision with risk analysis _(requirement)_
- `A-0038` — System shall document single-page app vs. server-side rendering decision with prototypes _(requirement)_
- `A-0039` — System shall document technology stack decisions with compliance and testing justification _(requirement)_
- `A-0040` — System shall implement multi-factor authentication (MFA) for patient and staff logins _(requirement)_
- `A-0041` — System shall provide user-friendly error messages and recovery options _(requirement)_
- `A-0042` — System shall implement comprehensive API monitoring for external integrations _(requirement)_
- `A-0043` — System shall conduct regular accessibility audits and user testing with diverse populations _(requirement)_
- `A-PA-0001` — System shall support role-based access control for patients, clinic staff, and admin staff _(requirement)_
- `APAT-0044` — req-1 _(requirement)_
- `APAT-0045` — REQ_OBJ_UA_002 _(requirement)_
- `APAT-0046` — REQ_OBJ_UA_003 _(requirement)_
- `APAT-0047` — req-1 _(requirement)_
- `APAT-0048` — REQ_OBJ_UA_002 _(requirement)_
- `APAT-0049` — REQ_OBJ_UA_003 _(requirement)_
- `REQ_OBJ_UA_002` — REQ_OBJ_UA_002 _(requirement)_
- `REQ_OBJ_UA_003` — REQ_OBJ_UA_003 _(requirement)_
- `req-1` — req-1 _(requirement)_
- `CAPA-A-PA-0020` — [ASPICE 4.0 SYS.1] Partial: Requirements Elicitation _(capa)_
- `CAPA-A-PA-0002` — [PCI-DSS Req.10] Partial: Track and monitor all access _(capa)_
- `CAPA-A-PA-0003` — [ASPICE 4.0 MAN.6] Gap: Measurement _(capa)_
- `CAPA-A-PA-0004` — [ASPICE 4.0 ACQ.4] Partial: Supplier Monitoring _(capa)_
- `CAPA-A-PA-0005` — [ASPICE 4.0 SYS.2] Gap: System Requirements Analysis _(capa)_
- `CAPA-A-PA-0006` — [ASPICE 4.0 SYS.3] Gap: System Architectural Design _(capa)_
- `CAPA-A-PA-0007` — [ASPICE 4.0 SYS.4] Gap: System Integration and Integration Verification _(capa)_
- `CAPA-A-PA-0008` — [ASPICE 4.0 SYS.5] Gap: System Verification _(capa)_
- `CAPA-A-PA-0009` — [ASPICE 4.0 SWE.2] Gap: Software Architectural Design _(capa)_
- `CAPA-A-PA-0010` — [ASPICE 4.0 SWE.5] Gap: Software Component Verification and Integration Verification _(capa)_
- `CAPA-A-PA-0011` — [ASPICE 4.0 SWE.6] Gap: Software Verification _(capa)_
- `CAPA-A-PA-0012` — [ASPICE 4.0 VAL.1] Gap: Validation _(capa)_
- `CAPA-A-PA-0013` — [ASPICE 4.0 SUP.8] Partial: Configuration Management _(capa)_
- `CAPA-A-PA-0014` — [ASPICE 4.0 MAN.3] Gap: Project Management _(capa)_
- `CAPA-A-PA-0015` — [ASPICE 4.0 SWE.1] Gap: Software Requirements Analysis _(capa)_
- `CAPA-A-PA-0016` — [ASPICE 4.0 SUP.9] Gap: Problem Resolution Management _(capa)_
- `CAPA-A-PA-0017` — [ASPICE 4.0 SUP.10] Gap: Change Request Management _(capa)_
- `CAPA-A-PA-0018` — [ASPICE 4.0 SWE.4] Gap: Software Unit Verification _(capa)_
- `CAPA-A-PA-0019` — [ASPICE 4.0 MAN.5] Partial: Risk Management _(capa)_
- `CAPA-A-PA-0021` — [ASPICE 4.0 SUP.1] Gap: Quality Assurance _(capa)_
- `CAPA-A-PA-0022` — [ASPICE 4.0 SWE.3] Gap: Software Detailed Design and Unit Construction _(capa)_
- `CAPA-A-PA-0001` — [PCI-DSS Req.3] Gap: Protect stored cardholder data _(capa)_
- `CAPA-A-PA-0023` — [ISO/SAE 21434 9.5] Gap: Cybersecurity Concept _(capa)_
- `CAPA-A-PA-0024` — [ISO/SAE 21434 6.4.2] Gap: Cybersecurity Planning _(capa)_
- `CAPA-A-PA-0025` — [ISO/SAE 21434 6.4.7] Gap: Cybersecurity Case _(capa)_
- `CAPA-A-PA-0026` — [ISO/SAE 21434 6.4.8] Gap: Cybersecurity Assessment _(capa)_
- `CAPA-A-PA-0027` — [ISO/SAE 21434 7.4] Gap: Distributed Cybersecurity Activities _(capa)_
- `CAPA-A-PA-0028` — [ISO/SAE 21434 8.3] Partial: Cybersecurity Monitoring _(capa)_
- `CAPA-A-PA-0029` — [ISO/SAE 21434 8.4] Gap: Cybersecurity Event Evaluation _(capa)_
- `CAPA-A-PA-0030` — [ISO/SAE 21434 8.5] Gap: Vulnerability Analysis _(capa)_
- `CAPA-A-PA-0031` — [ISO/SAE 21434 8.6] Gap: Vulnerability Management _(capa)_
- `CAPA-A-PA-0032` — [ISO/SAE 21434 9.3] Partial: Item Definition _(capa)_
- `CAPA-A-PA-0033` — [ISO/SAE 21434 9.4] Gap: Cybersecurity Goals _(capa)_
- `CAPA-A-PA-0034` — [ISO/SAE 21434 5.4.1] Gap: Cybersecurity Governance _(capa)_
- `CAPA-A-PA-0035` — [ISO/SAE 21434 5.4.2] Gap: Cybersecurity Culture _(capa)_
- `CAPA-A-PA-0036` — [ISO/SAE 21434 5.4.3] Gap: Information Sharing _(capa)_
- `CAPA-A-PA-0037` — [ISO/SAE 21434 5.4.4] Gap: Management Systems _(capa)_
- `CAPA-A-PA-0038` — [ISO/SAE 21434 5.4.5] Gap: Tool Management _(capa)_
- `CAPA-A-PA-0039` — [ISO/SAE 21434 5.4.6] Partial: Information Security Management _(capa)_
- `CAPA-A-PA-0040` — [ISO/SAE 21434 5.4.7] Gap: Organizational Cybersecurity Audit _(capa)_
- `CAPA-A-PA-0041` — [ISO/SAE 21434 6.4.1] Gap: Cybersecurity Responsibilities (Project) _(capa)_
- `CAPA-A-PA-0042` — [ISO/SAE 21434 10.4.2] Gap: Integration and Verification _(capa)_
- `CAPA-A-PA-0043` — [ISO/SAE 21434 11.2] Gap: Cybersecurity Validation _(capa)_
- `CAPA-A-PA-0044` — [ISO/SAE 21434 13.2.1] Partial: Cybersecurity Incident Response _(capa)_
- `CAPA-A-PA-0045` — [ISO/SAE 21434 13.2.2] Gap: Updates _(capa)_
- `CAPA-A-PA-0046` — [ISO/SAE 21434 14] Gap: End of Cybersecurity Support and Decommissioning _(capa)_
- `CAPA-A-PA-0047` — [ISO/SAE 21434 15.3-15.9] Gap: Threat Analysis and Risk Assessment (TARA) _(capa)_
- `CAPA-A-PA-0048` — [ISO/SAE 21434 10.4.1] Partial: Design _(capa)_
- `CAPA-A-PA-0049` — [ISO 9001 5.3] Gap: Organizational Roles, Responsibilities and Authorities _(capa)_
- `CAPA-A-PA-0050` — [ISO 9001 4.1] Gap: Understanding the Organization and its Context _(capa)_
- `CAPA-A-PA-0051` — [ISO 9001 4.2] Gap: Understanding the Needs and Expectations of Interested Parties _(capa)_
- `CAPA-A-PA-0052` — [ISO 9001 4.3] Gap: Determining the Scope of the QMS _(capa)_
- `CAPA-A-PA-0053` — [ISO 9001 4.4] Gap: QMS and its Processes _(capa)_
- `CAPA-A-PA-0054` — [ISO 9001 5.1] Gap: Leadership and Commitment _(capa)_
- `CAPA-A-PA-0055` — [ISO 9001 5.2] Gap: Quality Policy _(capa)_
- `CAPA-A-PA-0056` — [ISO 9001 10.3] Gap: Continual Improvement _(capa)_
- `CAPA-A-PA-0057` — [ISO 9001 6.2] Partial: Quality Objectives and Planning to Achieve Them _(capa)_
- `CAPA-A-PA-0058` — [ISO 9001 6.3] Gap: Planning of Changes _(capa)_
- `CAPA-A-PA-0059` — [ISO 9001 7.4] Gap: Communication _(capa)_
- `CAPA-A-PA-0060` — [ISO 9001 7.5] Partial: Documented Information _(capa)_
- `CAPA-A-PA-0061` — [ISO 9001 8.1] Partial: Operational Planning and Control _(capa)_
- `CAPA-A-PA-0062` — [ISO 9001 8.3] Partial: Design and Development of Products and Services _(capa)_
- `CAPA-A-PA-0063` — [ISO 9001 8.4] Partial: Control of Externally Provided Processes, Products and Services _(capa)_
- `CAPA-A-PA-0064` — [ISO 9001 8.5] Partial: Production and Service Provision _(capa)_
- `CAPA-A-PA-0065` — [ISO 9001 8.6] Partial: Release of Products and Services _(capa)_
- `CAPA-A-PA-0066` — [ISO 9001 9.1] Partial: Monitoring, Measurement, Analysis and Evaluation _(capa)_
- `CAPA-A-PA-0067` — [ISO 9001 9.2] Gap: Internal Audit _(capa)_
- `CAPA-A-PA-0068` — [ISO 9001 9.3] Gap: Management Review _(capa)_
- `CAPA-A-PA-0069` — [ISO 9001 10.1] Gap: Improvement — General _(capa)_
- `CAPA-A-PA-0070` — [ISO 9001 10.2] Partial: Nonconformity and Corrective Action _(capa)_
- `CAPA-A-PA-0071` — [ISO 9001 7.1] Partial: Resources _(capa)_
- `CAPA-A-PA-0072` — [ISO 9001 7.2] Gap: Competence _(capa)_
- `CAPA-A-PA-0073` — [ISO 9001 6.1] Partial: Actions to Address Risks and Opportunities _(capa)_
- `CAPA-A-PA-0074` — [ISO 9001 7.3] Gap: Awareness _(capa)_
- `CAPA-A-PA-0075` — [ISO 9001 8.7] Partial: Control of Nonconforming Outputs _(capa)_
- `CLD.8.1.5` — Removal of Cloud Service Customer Assets _(control)_
- `CLD.9.5.1` — Segregation in Virtual Environments _(control)_
- `CLD.12.4.5` — Monitoring of Cloud Services _(control)_
- `SVS` — Service Value System _(control)_
- `ChgEnable` — Change Enablement Practice _(control)_
- `IncMgmt` — Incident Management Practice _(control)_
- `PrbMgmt` — Problem Management Practice _(control)_
- `Rel` — Release Management Practice _(control)_
- `CLD.6.3.1` — Shared Roles & Responsibilities _(control)_


---
_Generated by Auditee. Re-import into Auditee or feed into your compliance pipeline._