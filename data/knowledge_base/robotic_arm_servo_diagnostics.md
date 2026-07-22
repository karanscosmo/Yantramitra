# 6-Axis Industrial Robotic Arm Servo Drive Fault Resolution Guide

**Document ID:** MAN-ROB-SRV-2026  
**Document Type:** Diagnostic & Overhaul Manual  
**Target Equipment:** Fanuc R-2000iC / ABB IRB 6700 6-Axis Welding & Material Handling Robot  
**Applicable Facilities:** Pune Body Shop, Ahmedabad Stamping Plant  
**Effective Date:** March 1, 2026  
**Version:** 1.5  

---

## 1. Axis Joint Kinematics & Brake System Specifications
The 6-axis articulated robot arm utilizes AC brushless servo motors equipped with absolute optical pulse coders and electro-mechanical holding brakes on all 6 axes (J1 through J6):
- **J1 Swivel Axis:** ±185° travel, maximum speed 120°/s.
- **J2 Shoulder Axis:** +76° / -60° travel, maximum speed 105°/s.
- **J3 Arm Axis:** +90° / -180° travel, maximum speed 120°/s.
- **J4 Wrist Roll / J5 Pitch / J6 Twist:** High-speed assembly wrist axes.

---

## 2. Servo Alarm Code Matrix & Troubleshooting
- **Alarm Code SRVO-023 (Axis 2/3 HV Overcurrent Alarm):**
  - *Cause:* Transistor IPM short circuit in servo amplifier or motor power cable phase-to-ground fault.
  - *Resolution:* Measure motor winding resistance (U-V, V-W, W-U). Healthy winding resistance is 0.45 Ω ± 0.05 Ω. Check cable insulation with 500V megger (> 50 MΩ required).
- **Alarm Code SRVO-050 (Collision Detect / OVC Alarm):**
  - *Cause:* Mechanical jam, worn RV reduction gear set, or incorrect payload inertia parameters.
  - *Resolution:* Verify payload mass and center of gravity settings in teach pendant. Inspect RV reducer oil for metallic debris (change Mobilgear 600 XP 220 oil if metal particle count > 100 ppm).
- **Alarm Code SRVO-062 (BZAL Pulse Coder Battery Low):**
  - *Cause:* 3.6V Lithium backup battery voltage dropped below 2.8V.
  - *Resolution:* Replace battery pack in robot base *while controller power is ON* to preserve pulse coder zero-position reference data. If power was disconnected during replacement, perform Axis Mastering sequence.

---

## 3. Robot Arm Axis Mastering Procedure
1. Jog robot to zero mechanical reference marks on all 6 joints using teach pendant.
2. Select `MENU` -> `SYSTEM` -> `Master/Cal` on Fanuc iPendant.
3. Select `ZERO POSITION MASTER` and press `F4 (YES)`.
4. Select `CALIBRATE` and press `F4 (YES)`. Verify positioning error < 0.05 mm using dial indicator on TCP calibration fixture.
