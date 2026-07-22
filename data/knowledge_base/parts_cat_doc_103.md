---
docId: parts_cat_doc_103.md
version: 2.4
department: Maintenance Engineering
machine: ASMPT SIPLACE TX2 Pick & Place
plant: Chennai Electronics & Automotive Plant
oem: Siemens AG
author: Senior Reliability Engineer
approvalStatus: Approved
revisionDate: 2026-07-20
docType: Spare Parts Catalog
keywords: [asmpt, maintenance, parts_cat, chennai]
---

# Chennai Electronics & Automotive Plant — ASMPT SIPLACE TX2 Pick & Place Spare Parts Catalog (Rev 2.4)

**Document ID:** PARTS_CAT-2026-1103  
**Facility Node:** Chennai Electronics & Automotive Plant (Chennai, TN)  
**Equipment Tag:** ASMPT SIPLACE TX2 Pick & Place  
**OEM Manufacturer:** Siemens AG  
**Department:** Maintenance Engineering  
**Version:** 2.4  

---

## 1. Executive Summary & Operational Scope
This official enterprise technical document outlines standard operating directives, safety parameters, calibration guidelines, and maintenance protocols for ASMPT SIPLACE TX2 Pick & Place installed at Chennai Electronics & Automotive Plant.

- **Operating Pressure Threshold:** 12.5 bar ± 0.5 bar.
- **Operating Temperature Limit:** 78°C warning, 92°C critical shutdown.
- **Vibration Velocity RMS:** 2.8 mm/s ISO 10816-3 Class II compliance.
- **Power Rating:** 45 kW, 415V 3-Phase 50 Hz supply.

---

## 2. Technical Specifications & Hydraulic Directives
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

---

## 4. Calibration Protocols & Precision Tolerances
- Verify laser interferometer linear axis accuracy to within ±0.005 mm over 1,000 mm travel length.
- Calibrate thermocouple transmitters (Type K) using dry-block temperature calibrator at 50°C, 100°C, and 150°C points.
- Verify vibration accelerometer mounting torque to 2.5 Nm to eliminate high-frequency resonance distortion.

---

## 5. Root Cause Analysis & Common Failure Modes
- **Symptom 1 (Excessive Thermal Rise):** Check cooling fan airflow and flush heat exchanger tubes using 5% citric acid solution.
- **Symptom 2 (Vibration Harmonic Spike):** Inspect drive shaft universal joint for needle bearing spalling or alignment mismatch.
- **Symptom 3 (Pressure Droop):** Replace worn proportional relief valve O-rings (Viton 70 Durometer).

---

## 6. Spare Parts Catalog & OEM Cross Reference
- **Part # 401-992:** Spindle Belleville Spring Pack (Qty: 24 pcs per set).
- **Part # 208-114:** Telecentric Optical Lens Assembly with LED Ring.
- **Part # 882-015:** High-Temperature Viton Shaft Seal 45x62x8mm.
