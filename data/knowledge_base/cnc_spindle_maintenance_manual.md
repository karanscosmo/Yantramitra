# Technical Maintenance Manual: High-Precision CNC Milling Spindle Overhaul

**Document ID:** MAN-CNC-SPD-2026  
**Document Type:** Equipment Maintenance Manual  
**Target Equipment:** Jyoti CNC Vertical Machining Center (VMC 850 / VMC 1050)  
**Applicable Facilities:** Pune Machining Division, Chennai Precision Hub  
**Effective Date:** February 1, 2026  
**Version:** 3.1  

---

## 1. System Description & Specifications
The CNC spindle assembly utilizes ceramic hybrid angular contact ball bearings arranged in a quad-set configuration (7014 C/P4A). Driven by a 15 kW AC synchronous servo motor, the spindle achieves stepless speeds up to 12,000 RPM with tool clamping force of 11.5 kN via internal Belleville spring stack.

---

## 2. Preventive Maintenance Schedule
- **Daily:** Inspect tool unclamping pneumatic pressure (6.0 bar ± 0.5 bar). Verify chiller unit coolant temperature (20°C ± 2°C).
- **Weekly:** Check drawbar spring tension using Haimer force gauge. Minimum acceptable clamping force: 10.0 kN.
- **Monthly:** Run laser interferometer runout check. Radial runout at spindle nose must not exceed 0.003 mm.
- **Quarterly:** Conduct vibration FFT analysis (1x, 2x, BPFO, BPFI bearing pass frequencies).

---

## 3. Spindle Overhaul & Bearing Replacement Procedure
1. Disconnect spindle motor power, rotary encoder cable, and tool unclamp sensor wires.
2. Remove front labyrinth cover using brass drift. Inspect front quad bearing set for fretting corrosion.
3. Extract drawbar assembly. Measure Belleville disc springs; replace full stack if free length is reduced by > 1.5mm.
4. Clean housing bore with trichloroethylene substitute and inspect for scoring.
5. Heat new 7014 ceramic hybrid bearings to 90°C using induction heater. Slide onto ground shaft in 'DBT' tandem-back-to-back arrangement.
6. Torque locknut to 140 Nm using precision hook spanner and loctite 243 threadlocker.
7. Reassemble spindle into housing, set pre-load shim to 0.045mm, and perform 4-hour step-up run-in sequence (1000 -> 3000 -> 6000 -> 12000 RPM).

---

## 4. Diagnostic Trouble Shooting Guide
- **Fault Code E-301 (Spindle Overheat Alarm):**
  - *Cause:* Chiller pump flow failure or contaminated heat exchanger.
  - *Resolution:* Clean chiller filter mesh, inspect glycol ratio (30% ethylene glycol / 70% DI water), verify pump pressure > 2.2 bar.
- **Fault Code E-308 (Unclamp Position Sensor Timeout):**
  - *Cause:* Low pneumatic pressure or misadjusted proximity switch.
  - *Resolution:* Adjust air regulator to 6.2 bar; set proximity switch gap to 1.5mm ± 0.2mm.
- **Surface Finish Chatter / Tool Marks:**
  - *Cause:* Drawbar spring fatigue or worn spindle bearings.
  - *Resolution:* Measure tool retention force. If < 10 kN, overhaul Belleville spring cartridge immediately.
