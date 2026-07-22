---
docId: rca_rep_doc_7.md
version: 1.7
department: Maintenance Engineering
machine: Cleanroom HVAC Chiller System
plant: Chennai Electronics & Automotive Plant
oem: Jyoti CNC Automation
author: Senior Reliability Engineer
approvalStatus: Approved
revisionDate: 2026-07-20
docType: Root Cause Analysis Report
keywords: [cleanroom, maintenance, rca_rep, chennai]
---

# Chennai Electronics & Automotive Plant — Cleanroom HVAC Chiller System Root Cause Analysis Report (Rev 1.7)

**Document ID:** RCA_REP-2026-1007  
**Facility Node:** Chennai Electronics & Automotive Plant (Chennai, TN)  
**Equipment Tag:** Cleanroom HVAC Chiller System  
**OEM Manufacturer:** Jyoti CNC Automation  
**Department:** Maintenance Engineering  
**Version:** 1.7  

---

## 1. Executive Summary & Operational Scope
This official enterprise technical document outlines standard operating directives, safety parameters, calibration guidelines, and maintenance protocols for Cleanroom HVAC Chiller System installed at Chennai Electronics & Automotive Plant.

- **Operating Pressure Threshold:** 12.5 bar ± 0.5 bar.
- **Operating Temperature Limit:** 78°C warning, 92°C critical shutdown.
- **Vibration Velocity RMS:** 2.8 mm/s ISO 10816-3 Class II compliance.
- **Power Rating:** 45 kW, 415V 3-Phase 50 Hz supply.

---

## 2. Detailed Technical Directives & Maintenance Workflow
1. Execute pre-operational safety check including emergency stop circuit verification.
2. Inspect hydraulic and lubrication reservoir fluid levels. Top off with Mobil DTE 25 hydraulic oil if below 60% sight glass.
3. Perform electrical insulation megger check (minimum 50 MΩ @ 500V DC).
4. Inspect timing belt tension and optical encoder feedback wiring harnesses.
5. Record sensor readings in SCADA telemetry system every shift.

---

## 3. Safety Precautions & LOTO Isolation Procedure
- Apply LOTO padlocks to main electrical breaker CB-101 and pneumatic isolation valve PV-202 before entering machine cell.
- Wear Class 2 arc flash safety gear and high-temperature thermal gloves during inspection.
- Report any unusual mechanical binding or thermal spikes exceeding 85°C to shift supervisor immediately.
