# High-Pressure Industrial Boiler Vessel Safety & Relief Valve Standard

**Document ID:** SOP-BLR-SAF-2026  
**Document Type:** Safety Protocol & Standard Operating Procedure  
**Target Equipment:** Thermax Industrial Steam Boiler (30 Ton/hr, 17.5 bar)  
**Applicable Facilities:** Pune Energy Block, Ahmedabad Utility Facility  
**Effective Date:** January 10, 2026  
**Version:** 4.2  

---

## 1. Statutory Compliance & Boiler Inspector Regulations
All high-pressure steam boilers operating above 1.0 kg/cm² must comply with the Indian Boiler Regulations (IBR 1950) Section 33. Annual hydraulic pressure testing at 1.5 times maximum allowable working pressure (MAWP = 17.5 bar) must be witnessed and certified by an authorized Boiler Inspector.

---

## 2. Dual Safety Valve Testing & Set Points
Industrial boilers are equipped with twin spring-loaded safety valves (SV-101 and SV-102) mounted directly on the steam drum:
- **Primary Safety Valve (SV-101 Set Point):** Opens precisely at 17.5 bar (+0.0 / -0.2 bar).
- **Secondary Safety Valve (SV-102 Set Point):** Opens at 17.8 bar (+0.0 / -0.2 bar).
- **Relief Capacity:** Each valve must discharge 100% of maximum steam generation capacity without drum pressure exceeding 110% MAWP (19.25 bar).
- **Manual Hand-Lever Test Procedure:** Perform a manual pop test every Monday at 08:00 hrs when boiler operating pressure reaches at least 75% MAWP (13.0 bar). Pull easing lever for 3 seconds to clear scale deposits.

---

## 3. Water Level Column & Low-Level Cutout Interlocks
- **Normal Operating Level:** 50% gauge glass height.
- **First Alarm (Low Water):** 35% level — Audible warning bell activates on SCADA panel.
- **Second Interlock (Low-Low Cutout):** 20% level — Immediate automatic trip of burner fuel solenoid valve and FD fan motor.
- **Blowdown Procedure:** Perform daily bottom blowdown for 10 seconds to flush dissolved solids and silica sludge. Maintain boiler feed water total dissolved solids (TDS) < 2,500 ppm.

---

## 4. Emergency Explosion & Flame Failure Shutdown Workflow
1. If flame failure occurs (UV scanner trip Code F-402), do not attempt instant reignition.
2. Execute a 5-minute pre-purge cycle using the FD fan at 100% air damper opening to purge unburnt fuel gas from the furnace chamber.
3. Inspect igniter spark gap (3.5mm) and fuel gas supply pressure regulator (set to 250 mbar).
4. Reset burner management controller manually after purging confirmation.
