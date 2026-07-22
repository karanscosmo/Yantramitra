# Standard Operating Procedure: Main Drive Bearing Lubrication & Thermal Inspection

**Document ID:** SOP-LUB-2026-V2  
**Document Type:** Standard Operating Procedure (SOP)  
**Target Equipment:** CNC Milling Machines, Lathes, Industrial Drives  
**Applicable Facilities:** Pune, Chennai, Ahmedabad, Bengaluru, Nagpur  
**Effective Date:** January 15, 2026  
**Version:** 2.4  

---

## 1. Safety & Lockout/Tagout (LOTO) Requirements
Before commencing any bearing lubrication or thermal inspection, maintenance personnel must strictly enforce LOTO isolation protocols:
1. De-energize primary 415V 3-phase electrical supply at the isolator cabinet.
2. Apply physical lockout padlock and danger tag signed by the lead maintenance technician.
3. Verify zero mechanical rotation using tachometer and lockout confirmation checklist.
4. Wear thermal safety gloves and protective eyewear conforming to IS 5983 / EN 166.

---

## 2. Lubricant Specifications & Quantities
- **Approved Grease Type:** Klüberplex BEV 41-822 / Mobilith SHC 220 Synthetic Lithium Complex.
- **Base Oil Viscosity:** 220 cSt at 40°C.
- **Relubrication Interval:** 1,200 operating hours or every 60 operational days.
- **Dose Quantity:**
  - Standard Bearing Housing (70mm - 100mm bore): 18 grams ± 2g.
  - Heavy Duty Main Spindle Bearing (>100mm bore): 35 grams ± 3g.
- **Caution:** Over-greasing increases internal churning friction, causing thermal rise > 85°C and premature seal degradation.

---

## 3. Step-by-Step Lubrication Workflow
1. Clean grease zerk fitting using isopropyl alcohol wipe to remove abrasive particulates.
2. Remove bottom purge plug to allow old grease expulsion.
3. Attach calibrated manual grease gun. Inject prescribed dose slowly (1 stroke per 5 seconds).
4. Run machine at idle speed (500 RPM) for 15 minutes to purge excess lubricant.
5. Wipe clean purge port and re-install purge plug with fresh Teflon thread seal tape.

---

## 4. Vibration Spectrum & Thermal Thresholds
Post-lubrication baseline checks must satisfy ISO 10816-3 Class II industrial machine limits:
- **Normal Operating Temperature:** 45°C – 68°C.
- **Warning Threshold:** 75°C (Schedule vibration spectrum analysis within 48 hours).
- **Critical Shutdown Threshold:** 88°C (Immediate emergency stop; inspect for bearing raceway pitting or alignment error).
- **Vibration Velocity RMS:**
  - Good (Green): < 2.3 mm/s.
  - Acceptable (Yellow): 2.3 mm/s – 4.5 mm/s.
  - Unsatisfactory (Orange): 4.5 mm/s – 7.1 mm/s.
  - Critical (Red): > 7.1 mm/s (Immediate overhaul required).

---

## 5. Root Cause Matrix for Bearing Anomalies
- **High Vibration + High Temp:** Insufficient lubrication, contaminated grease, or excessive belt tension.
- **High Vibration + Normal Temp:** Mechanical unbalance, shaft misalignment, or loose mounting bolts.
- **Noise / Clicking + Normal Temp:** Raceway spalling or ball cage fracture.
