---
docId: manual_jyoti_cnc_vMC850.md
version: 3.4
department: Maintenance Engineering
machine: VMC 850 CNC Milling Machine
plant: Pune Heavy Machinery Plant
oem: Jyoti CNC Automation
author: Principal Systems Engineer
approvalStatus: Approved
revisionDate: 2026-07-15
docType: Equipment Manual
keywords: [industrial, vmc, maintenance, safety, sop]
---

# Jyoti VMC 850 Vertical Machining Center OEM Manual

**Document ID:** MAN-CNC-VMC850-2026  
**OEM Vendor:** Jyoti CNC Automation Ltd.  
**Applicable Equipment:** Jyoti VMC 850 (Spindle Speed 10,000 RPM, BT-40 Taper)  

## 1. Machine Kinematics & Guide Way Lubrication
The VMC 850 employs hardened LM guideways on X, Y, and Z axes lubricated via a central automatic grease dispenser:
- **Lubricant Grade:** Mobil vactra Oil No. 2 (ISO VG 68).
- **Dispensing Cycle:** 3.5 cc per 30 minutes of X/Y axis travel.
- **Guideway Pressure:** 14.5 bar ± 0.5 bar. If pressure drops below 10 bar, SCADA Alarm A-201 triggers.

## 2. Spindle Belt Tension & Alignment
- **Spindle Motor Power:** 11 kW continuous, 15 kW peak.
- **Drive Belt Spec:** 8M-1200 Poly-V belt.
- **Tension Measurement:** Sonic tension meter frequency set to 140 Hz ± 5 Hz.
- **Tool Clamping Force:** Belleville spring pack must maintain 9.5 kN clamping force. Check Belleville stack height every 1,000 operating hours.