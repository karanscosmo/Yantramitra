---
name: Dreamy Industrial
colors:
  surface: '#fbf8ff'
  surface-dim: '#d9d8ec'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f2ff'
  surface-container: '#eeecff'
  surface-container-high: '#e8e6fa'
  surface-container-highest: '#e2e1f4'
  on-surface: '#191a28'
  on-surface-variant: '#464555'
  inverse-surface: '#2e2f3e'
  inverse-on-surface: '#f1efff'
  outline: '#767586'
  outline-variant: '#c7c4d7'
  surface-tint: '#4948de'
  primary: '#413fd6'
  on-primary: '#ffffff'
  primary-container: '#5b5bf0'
  on-primary-container: '#f6f2ff'
  inverse-primary: '#c1c1ff'
  secondary: '#006b5f'
  on-secondary: '#ffffff'
  secondary-container: '#5efae4'
  on-secondary-container: '#007165'
  tertiary: '#774f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#986500'
  on-tertiary-container: '#fff2e5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1dfff'
  primary-fixed-dim: '#c1c1ff'
  on-primary-fixed: '#09006b'
  on-primary-fixed-variant: '#2e29c6'
  secondary-fixed: '#5efae4'
  secondary-fixed-dim: '#36ddc8'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005047'
  tertiary-fixed: '#ffddb1'
  tertiary-fixed-dim: '#ffba4b'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#624000'
  background: '#fbf8ff'
  on-background: '#191a28'
  surface-variant: '#e2e1f4'
typography:
  display-hero:
    fontFamily: Geist
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  section-header:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  kpi-numeric:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  nav-width: 72px
  gutter: 24px
---

## Brand & Style
The design system bridges the gap between mechanical precision and ethereal aesthetics. Designed for high-end SaaS environments, it evokes a "Dreamy Industrial" atmosphere—professional and data-dense, yet softened by atmospheric light and depth. 

The aesthetic leverages **Glassmorphism** for structural surfaces and **Minimalism** for content layout, creating a sense of weightlessness. The target audience is high-level stakeholders who require clarity without the sterile coldness of traditional enterprise software. The UI should feel sophisticated, high-performance, and technologically advanced.

## Colors
The palette is centered on a high-energy Electric Indigo. The canvas is a near-white neutral that breathes through the use of atmospheric gradient "blobs":
- **Ambient Accents:** Use large, low-opacity (15%) blurred circles. Indigo/Violet at the top-right and Soft Teal at the bottom-left to create a dynamic, living background.
- **Surface Logic:** Backgrounds are not solid white. Use `#FAFAFC` as the base.
- **States:** Primary Indigo for actions; Teal for "Healthy" or "Success" states; Amber to Coral gradients for alerts and warnings.
- **Text:** Maintain high legibility with Charcoal for primary content and Slate Grey for metadata and inactive labels.

## Typography
The typographic hierarchy uses a multi-font approach to balance editorial style with industrial utility.
- **Geist** provides a sharp, technical feel for headlines and page titles.
- **Inter** ensures maximum readability for body text and functional UI descriptions.
- **Space Grotesk** is reserved for tabular data, KPIs, and labels, providing a monospaced "instrument panel" aesthetic that suits a data-rich SaaS platform.
- **Formatting:** Use all-caps with increased letter spacing for Space Grotesk labels to denote categories or small metadata.

## Layout & Spacing
The design system utilizes a **Fluid Grid** model with high-density content containers.
- **Navigation:** A slim, 72px wide vertical rail floats on the right edge of the viewport. It features a pill-shaped background and active indicators.
- **Top Bar:** A 64px tall glass header persists at the top, housing the logo and a pill-shaped search input.
- **Breakpoints:** 
  - *Desktop (1440px+):* 12-column grid, 24px gutters, 40px side margins.
  - *Tablet (768px-1024px):* 8-column grid, 16px gutters, 24px side margins. Navigation collapses to a bottom bar or hidden drawer.
  - *Mobile (<768px):* 4-column grid, 16px gutters, 16px side margins.
- **Content Density:** Maintain tight internal padding (16-24px) for cards to allow for data-heavy dashboards.

## Elevation & Depth
Depth is created through transparency and refraction rather than traditional shadows.
- **Glassmorphism:** All cards use 60-80% white opacity with a 12px to 16px backdrop-blur. 
- **Borders:** Every glass surface must have a 1px hairline border (`#E7E9F5`) to define its edges against the gradient background.
- **Ambient Shadows:** Do not use grey or black shadows. Use a soft, 20% opacity Indigo shadow for primary elements and a 10% opacity Teal shadow for success-related cards.
- **Z-Index:** High-priority modals or dropdowns increase backdrop-blur to 24px to visually "lift" off the page.

## Shapes
The shape language is sophisticated and friendly. 
- **Large Containers:** Dashboard cards and main content areas use `rounded-xl` (24px).
- **Interactive Elements:** Buttons and input fields use `rounded-md` (12px) to provide a more "tool-like" feel.
- **Status/Badges:** Tags, badges, and the active navigation indicator use full-pill rounding (999px) to contrast against the structured grid.

## Components
- **Buttons:** 
  - *Primary:* Linear gradient (#5B5BF0 to #7C7CFA). Apply a 10px outer glow in Indigo. On hover, trigger a white "shimmer sweep" across the face.
  - *Secondary:* Frosted glass fill (40% white) with the hairline border.
- **Navigation Rail:** Right-aligned floating pill. Active state is a smaller Indigo pill behind the icon with a pulsing glow.
- **Search Pill:** The (⌘K) search bar should be a semi-transparent pill shape with an inset 1px border.
- **Data Visualization:** 
  - Charts use thin 1px gridlines in `#E7E9F5`.
  - Data series should use the Primary Indigo and Secondary Teal.
  - Use pulsing "glow rings" for status indicators (Success = Teal, Warning = Amber, Critical = Coral).
- **Inputs:** Focused states should transition the 1px border to Electric Indigo with a 4px soft outer glow. Use Space Grotesk for any numeric input values.
- **Cards:** Heavy use of "Inner Glow" (1px white 20% opacity) on the top edge to simulate light hitting a physical glass pane.