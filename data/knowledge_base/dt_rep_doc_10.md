---
docId: dt_rep_doc_10.md
version: 1.1
department: Production Operations
machine: Conveyor System Assembly Line 2
plant: Pune Heavy Machinery Plant
oem: Fanuc Robotics
author: Senior Reliability Engineer
approvalStatus: Approved
revisionDate: 2026-07-20
docType: Downtime Report
keywords: [conveyor, maintenance, dt_rep, pune]
---

# Pune Heavy Machinery Plant — Conveyor System Assembly Line 2 Downtime Report (Rev 1.1)

**Document ID:** DT_REP-2026-1010  
**Facility Node:** Pune Heavy Machinery Plant (Pune, MH)  
**Equipment Tag:** Conveyor System Assembly Line 2  
**OEM Manufacturer:** Fanuc Robotics  
**Department:** Production Operations  
**Version:** 1.1  

---

## 1. Executive Summary & Operational Scope
This official enterprise technical document outlines standard operating directives, safety parameters, calibration guidelines, and maintenance protocols for Conveyor System Assembly Line 2 installed at Pune Heavy Machinery Plant.

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
