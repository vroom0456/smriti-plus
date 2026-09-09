---
name: Serene Heritage
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#444653'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#757684'
  outline-variant: '#c4c5d5'
  surface-tint: '#3755c3'
  primary: '#00288e'
  on-primary: '#ffffff'
  primary-container: '#1e40af'
  on-primary-container: '#a8b8ff'
  inverse-primary: '#b8c4ff'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#440098'
  on-tertiary: '#ffffff'
  tertiary-container: '#5f00d1'
  on-tertiary-container: '#c9aeff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4ff'
  on-primary-fixed: '#001453'
  on-primary-fixed-variant: '#173bab'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#eaddff'
  tertiary-fixed-dim: '#d2bbff'
  on-tertiary-fixed: '#25005a'
  on-tertiary-fixed-variant: '#5a00c6'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: 0em
  body-xl:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0.01em
  body-md:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  touch-min: 3.5rem
  touch-comfortable: 4rem
  inset-card: 1.5rem
  gutter-screen: 1.25rem
  stack-tight: 0.75rem
  stack-base: 1rem
  stack-loose: 1.75rem
  stack-section: 2.5rem
---

## Brand & Style

This design system embodies a calm, dignified cognitive wellness companion tailored for seniors (60+ years) in India, particularly bridging modern geriatric cognitive care with culturally grounded Northeastern iconography (Assamese tea estates, gentle bamboo weave textures, and rhythmic jaapi/gamosa red-and-white border inspirations softened into meditative tones). 

The emotional tone balances reassurance, respect, and cognitive clarity. It avoids patronizing, overly childish gamification as well as sterile, anxiety-inducing clinical tropes. The design movement marries **Tactile Soft Minimalism** with **Biophilic Heritage Accents**:
- Generous, uncluttered visual rhythm allowing ample processing time for the aging eye.
- High-contrast touch affordances with tactile reassurance (soft elevated card surfaces, clear edge demarcation).
- Organic, nature-derived calming tones (tea mint, deep ocean blue, and comforting parchment whites).

## Colors

The palette is engineered specifically for mature vision, addressing age-related optical changes such as yellowing of the crystalline lens, reduced contrast sensitivity, and spatial frequency loss.

- **Primary (`#1E40AF` Ocean Deep / `#2563EB` Classic Blue):** Provides steadfast authority and navigational anchors. Used for primary CTAs, active indicators, and high-importance interactive elements.
- **Secondary (`#0D9488` Tea-Leaf Teal / `#14B8A6` Soft Mint):** Evokes the lush, healing hills of Assam. Used for supportive actions, positive cognitive feedback, and calm wellness markers.
- **Tertiary (`#7C3AED` Meditative Lavender / `#8B5CF6`):** Stimulates cognitive engagement without over-excitation. Applied to memory milestones, sensory audio cues, and heritage highlights.
- **Neutral Surface & Base:** Soft warm off-white (`#F8FAFC` to `#F1F5F9`) avoids high-glare blinding whites, reducing eye strain. Text is set in strict WCAG AAA slate blacks (`#0F172A` and `#1E293B`) ensuring maximum legibility under varying ambient lighting.
- **Accent Gold (`#D97706` Amber / `#FEF3C7` Soft Cream):** Reserved for celebratory milestones, daily cognitive streaks, and achievement badges.

## Typography

Typography prioritizes hyper-legibility, open counter-forms, and unmistakable glyph distinction (such as distinguishing 'I', 'l', and '1').

- **Headlines (Plus Jakarta Sans):** Warm, geometric, and clear, lending a welcoming and dignified human touch to headings and section titles.
- **Body & Prompts (Atkinson Hyperlegible Next):** Specifically crafted to remove ambiguity for low-vision readers. The minimum baseline body size is strictly fixed at 17px/18px with elevated line-heights (1.5x minimum) to prevent typographic crowding.
- **Rules:** Never use font sizes below 14px anywhere in the interface. Maintain uppercase usage strictly for short categorical tags (e.g., badges) to prevent fatigue in reading full sentences.

## Layout & Spacing

The layout adheres to a single-column, distraction-free fluid mobile container with strict tap boundaries.

- **Grid & Margins:** Fluid 4-column layout on mobile devices (max viewport bounded at 480px on larger tablets for cognitive ergonomics), anchored by `1.25rem` (20px) side margins.
- **Vertical Spacing Hierarchy:** Employs generous spacing tiers (`stack-loose` at 28px, `stack-section` at 40px) to prevent cognitive overload. Interactive elements maintain an absolute minimum touch clearance of `12px` between adjacent interactive bounds.
- **Safe Ergonomics:** Content is positioned within the bottom-two-thirds thumb-reach zone; high-frequency triggers are barred from inaccessible screen corners.

## Elevation & Depth

To avoid visual disorientation caused by high blur or artificial hyper-realistic skeuomorphism, depth is communicated through **Grounded Tactile Enclosures**:

- **Layering:** Crisp, low-contrast protective borders (`1.5px solid #E2E8F0`) reinforced by subtle, ultra-soft ambient drop shadows tinted with slate (`rgba(15, 23, 42, 0.05)` with `12px` blur and `4px` Y-offset).
- **Surface Elevation Levels:**
  - *Base Surface:* `#F8FAFC` (matte paper feel).
  - *Resting Interactive Cards:* `#FFFFFF` with boundary border `#E2E8F0` and `0 4px 14px -2px rgba(15, 23, 42, 0.06)`.
  - *Pressed / Engaged State:* Scaled down slightly (`transform: scale(0.98)`), border color shifts to primary blue (`#2563EB`), shadow snaps to `0 1px 3px rgba(15, 23, 42, 0.1)`.
  - *Overlays & Action Sheets:* Backed with high opacity (92% tint) to shield the user from background visual distraction.

## Shapes

The design system uses deliberate, organic curves derived from Northeastern bamboo weaves and river stones. 

- Interactive buttons and primary container cards feature a balanced `0.75rem` (12px) to `1.25rem` (20px) corner radius.
- Small indicators, badges, and progress pills employ full pill radiuses for high contrast against rectilinear text layouts.
- Sharp 90-degree corners are explicitly prohibited to prevent the user from perceiving edges as harsh, clinical, or unforgiving.

## Components

### Buttons & Touch Targets
- **Primary Buttons:** Minimum height of `60px` (`touch-comfortable`). Rendered in `#1E40AF` with white `#FFFFFF` text in `label-lg`, rounded-2xl (`16px`), accompanied by an explicit right-aligned forward icon (24px) to signal progression.
- **Secondary / Action Buttons:** Outlined with `2px solid #0D9488`, background in soft mint tint (`#CCFBF1` at 20%), text in `#0D9488`. Minimum tap height `56px`.

### Cards & Cognitive Prompts
- Cards must use internal padding of `1.5rem` (`p-6`). Surface is solid `#FFFFFF` framed by `#E2E8F0`. 
- Cultural cards (e.g., daily memory exercises, Assamese storytelling modules) include a top-left decorative motif border inspired by geometric *Gamosa* woven strips, rendered in soft terracotta or warm crimson muted to accessibility standards.

### Form Inputs & Toggles
- **Input Fields:** Minimum height of `58px`, with a permanently visible floating label (`label-md`), high-contrast placeholder text (`#64748B`), and a clear focus border (`2.5px solid #2563EB`).
- **Toggle Switches:** Oversized toggle tracks (`64px` width by `36px` height) with an interior thumb of `28px`. Always accompany toggles with an explicit text indicator ("चालू / ON" or "बंद / OFF") rather than relying on color alone.

### Checkboxes & Radios
- Size set to `28px × 28px` minimum. Checkmark icons feature a stroke width of `3.5px` for instant recognition without squinting.

### Heritage Badges & Tags
- Distinctive badges (e.g., 'Northeast Heritage Pack', 'Morning Mind Care') with a background tint of `#FEF3C7`, text `#B45309`, framed with rounded-full pill radius, containing an accompanying symbolic icon (e.g., stylized two-leaf tea sprout).

### Bottom Navigation Bar
- High-profile bar (`76px` height) anchored at the bottom. Icons are `28px` coupled with permanent, non-collapsing `15px` high-contrast text labels below each icon. Active state uses an underlined indicator and deep ocean blue fill.