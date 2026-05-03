/**
 * Shared sample project used by every tutorial module.
 * A concrete, regulated-industry product so the narration walks through
 * a real example end-to-end instead of abstract feature copy.
 */

export const SAMPLE_PROJECT = {
  company: "Acme Health",
  product: "SmartInhaler Connect",
  shortName: "SmartInhaler",
  description:
    "Class IIa connected medical inhaler with a companion mobile app",
  patientPopulation: "Asthmatics aged 6 and older",
  market: "EU + US + India",
  pm: "Priya Menon",
  qaLead: "Marcus Chen",
  swEng: "Ananya Iyer",
  standards: ["IEC 62304 Class B", "ISO 14971", "FDA QMSR (21 CFR 820)", "GDPR", "DPDP Act 2023"],
  keyMetrics: {
    requirements: 247,
    sources: 6,
    standards: 5,
    gaps: 18,
    testCases: 1247,
    auditReadiness: 87,
  },
};
