# High-Speed SMT Pick-and-Place Machine Optical Alignment & Calibration SOP

**Document ID:** SOP-SMT-CAL-2026  
**Document Type:** Technical Calibration Guide  
**Target Equipment:** ASMPT SIPLACE TX2 High-Speed Placement Head  
**Applicable Facilities:** Chennai Electronics Plant, Bengaluru Micro-Fab  
**Effective Date:** February 15, 2026  
**Version:** 2.0  

---

## 1. Vision System & Component Fiducial Alignment
High-speed surface-mount technology (SMT) component placement accuracy requires precision optical fiducial calibration:
- **Placement Accuracy Target:** ±0.025 mm @ 3 Sigma for 0201 (0.6mm x 0.3mm) micro-passives and 0.3mm pitch QFP/BGA ICs.
- **Fiducial Inspection Camera:** Top-down telecentric lens camera with multi-angle LED ring illumination.
- **Glass Calibration Target Calibration:** Run automatic grid calibration using 50mm x 50mm chrome-on-glass calibration plate every 500 operating hours.

---

## 2. Nozzle Vacuum & Mechanical Feeder Offset Calibration
- **Vacuum Level Standard:** Minimum -85 kPa vacuum pressure during component pickup.
- **Nozzle Inspection:** Check nozzle tips (Type 901 to 915) under 40x optical microscope for ceramic chip cracks or solder paste buildup. Replace damaged tips immediately.
- **Feeder Pitch Verification:** Verify 8mm, 12mm, 16mm tape feeder index pitch using digital dial indicator. Feeder index repeatability must be within ±0.015 mm.

---

## 3. Placement Head X-Y Gantry Belt Tension & Servo Calibration
- **Linear Drive Motor Calibration:** Run X-Y linear motor encoder zeroing sequence.
- **Gantry Belt Tension:** Adjust Kevlar timing belt tension using Gates sonic tension meter. Correct frequency range: 145 Hz – 155 Hz.
- **Nozzle Z-Axis Force Calibration:** Calibrate Z-axis placement force cell to 1.5 N ± 0.2 N to prevent component micro-cracking during PCB touchdown.
