# 🎨 Cinemacart - Universal Frontend Design System & UI Specification
> **Role:** Universal UI/UX Design System for Map Motion Graphics & Documentary Video Editors  
> **Tech Stack:** React 18 / Svelte 5 + Tailwind CSS v3/v4 + Lucide Icons + HTML5 Canvas  
> **Target Theme:** Professional Dark Slate & Obsidian (with High-Contrast Documentary Accents)

---

## 1. 🌈 Design Tokens & Color Palette

The design system uses a strict hierarchical token system built around deep slate/obsidian backgrounds, crisp border delimiters, and high-impact cinematic neon & documentary accents.

### A. Core Neutral Surfaces (Dark Mode Default)

| Token Name | Hex Code | RGB | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `--c-bg` (Base Canvas) | `#0a0d14` | `10, 13, 20` | `bg-[#0a0d14]` | App background behind panels & workspace. |
| `--c-surface-1` (Panels) | `#111622` | `17, 22, 34` | `bg-[#111622]` | Sidebar, top toolbar, inspector, and timeline base. |
| `--c-surface-2` (Cards) | `#182030` | `24, 32, 48` | `bg-[#182030]` | Elevated cards, input fields, dropdown triggers, and buttons. |
| `--c-surface-3` (Hover) | `#222d42` | `34, 45, 66` | `bg-[#222d42]` | Hover states, active dropdown items, and focused states. |
| `--c-border-subtle` | `#1e293b` | `30, 41, 59` | `border-slate-800` | Section dividers, subtle grid lines, and canvas frame. |
| `--c-border-active` | `#334155` | `51, 65, 85` | `border-slate-700` | Input borders, card outlines, and modal borders. |

### B. Typography Colors

| Token Name | Hex Code | RGB | Usage |
| :--- | :--- | :--- | :--- |
| `--c-text-primary` | `#f8fafc` | `248, 250, 252` | Headings, active values, button labels, and country titles. |
| `--c-text-secondary` | `#94a3b8` | `148, 163, 184` | Subtitles, input placeholders, property labels, and hints. |
| `--c-text-muted` | `#64748b` | `100, 116, 139` | Disabled states, timestamps, frame counters, and shortcuts. |

### C. Cinematic Accent & Highlight Accents

| Accent Name | Hex Code | Secondary Glow | Cartographic Role |
| :--- | :--- | :--- | :--- |
| **Emerald Neon** | `#10b981` | `rgba(16, 185, 129, 0.4)` | Tactical territory spotlight, active waypoints, and playhead. |
| **Crimson Coral** | `#e11d48` | `rgba(225, 29, 72, 0.4)` | Warm documentary highlights (Germany/Europe) & Export CTA. |
| **Royal Indigo** | `#6366f1` | `rgba(99, 102, 241, 0.4)` | Flight route arcs, ocean features, and multi-country hub 1. |
| **Electric Amber** | `#f59e0b` | `rgba(245, 158, 11, 0.4)` | Trade corridors, checkpoint badges, and keyframe diamonds. |
| **Magenta Pink** | `#ec4899` | `rgba(236, 72, 153, 0.4)` | Geopolitical boundary comparison and focus pulse ripples. |
| **Cyan Laser** | `#06b6d4` | `rgba(6, 182, 212, 0.4)` | Great-circle flight trajectories and satellite ray connectors. |

---

## 2. 🔤 Typography Hierarchy & Font Stack

### A. Font Families
```css
/* Display & Cinematic Map Typography */
--font-display: "Montserrat", "Bebas Neue", "Inter", -apple-system, sans-serif;

/* Clean UI & Toolbars */
--font-sans: "Inter", "Segoe UI", -apple-system, system-ui, sans-serif;

/* Timestamps, GPS Coordinates & Metrics */
--font-mono: "JetBrains Mono", "Courier Prime", monospace;
```

### B. Typography Scale
* **Hero / Country Header (In-Map):** `32px - 48px`, Weight: `800 (Bold)`, Tracking: `+0.12em` (`tracking-wider`), Transform: `uppercase`.
* **Section Title:** `14px - 16px`, Weight: `700`, Tracking: `+0.05em`.
* **Property Label:** `12px`, Weight: `500`, Color: `--c-text-secondary`.
* **Value / Badge / Tag:** `11px - 12px`, Weight: `600`, Radius: `4px`.
* **Timestamp / Timecode:** `11px`, Family: `mono`, Color: `--c-text-muted`.

---

## 3. 📐 Layout Architecture (The 5-Panel Workspace)

The desktop editor uses a responsive 5-zone viewport designed for zero distraction and maximum canvas focus.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ZONE 1: TOP APP HEADER (Window Controls, Project Name, Aspect, Export CTA) │
├───────────┬─────────────────────────────────────────┬───────────────────────┤
│           │                                         │                       │
│  ZONE 2:  │        ZONE 3: INTERACTIVE CANVAS       │        ZONE 4:        │
│  TOOL &   │               VIEWPORT                  │       PROPERTY        │
│  TEMPLATE │      (Live 60 FPS HTML5 / WebGL)        │       INSPECTOR       │
│  SIDEBAR  │      Pan / Zoom / Gizmo Reticles        │     (Contextual)      │
│  (64px /  │                                         │       (280px)         │
│   240px)  │                                         │                       │
├───────────┴─────────────────────────────────────────┴───────────────────────┤
│  ZONE 5: TIMELINE & SCROLLER BAR (Multi-Track, Playhead, Keyframe Diamond)   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. 🧩 Core Component Library Specifications

### Component 1: Top Navigation & Control Header (`HeaderBar`)
* **Height:** `52px`, Background: `--c-surface-1`, Border: `border-b border-slate-800`.
* **Left:** App Logo (`Cinemacart`), Project Title Input (Inline editable).
* **Center Controls:**
  * **Undo / Redo:** Icon buttons with keyboard shortcut tooltips (`Ctrl+Z`, `Ctrl+Y`).
  * **Aspect Ratio Selector (Dropdown):**
    * `16:9` (1920x1080 - YouTube / Landscape)
    * `9:16` (1080x1920 - Shorts / TikTok / Reels)
    * `1:1` (1080x1080 - Square Feed)
  * **Zoom / Fit Toggle:** `Fit to Screen`, `50%`, `100%`, `200%`.
* **Right Controls:**
  * Performance Metric Badge: `Render: GPU (NVENC/QSV)`.
  * **Primary CTA:** **"Export Video"** (`bg-rose-600 hover:bg-rose-500 text-white font-semibold px-4 py-1.5 rounded-lg shadow-lg shadow-rose-900/30`).

---

### Component 2: Left Tool & Template Drawer (`LeftSidebar`)
* **Width:** Compact mode `64px` (Icons only) / Expanded mode `260px`.
* **Tab Items:**
  1. 🗺️ **Templates:** Route Arc, Multi-Stop, Territory Spotlight, 3D Globe Spin, Satellite Corridor, VS Comparison.
  2. 📍 **Waypoints:** Search city/country autocomplete, lat/long input, Pin style selector.
  3. 🎨 **Map Styles:** Dark Midnight, Warm Documentary, Military Tactical, NASA Blue Marble Satellite.
  4. 🔤 **Text & HUD:** Country header, info badge, statistics card, glassmorphic card.
  5. 🎵 **Audio & SFX:** Deep Whoosh, Inception Thump, Drone Ambient, Dramatic Riser, Edge-TTS Voiceover.

---

### Component 3: The Map Canvas Viewport (`CanvasViewport`)
* **Center Stage:** Hardware-accelerated canvas element with smooth mouse drag (pan) and wheel (zoom).
* **HUD Overlay Controls (Floating on canvas):**
  * Top-Left: Coordinate Readout (`Lat: 33.68° N, Long: 73.04° E | Scale: 2400x`).
  * Bottom-Center: Floating Mini-Transport (`[⏮] [◀ 10s] [ ▶ PLAY ] [ 10s ▶] [⏭]`).
  * Bottom-Right: Timecode Pill (`00:03.20 / 00:15.00 | Frame: 96/450`).

---

### Component 4: Multi-Track Timeline & Scrubber (`TimelinePanel`)
* **Height:** `220px`, Resizable via drag handle.
* **Header Bar:**
  * Playhead Timecode, Snapping Toggle (`Snap to Grid`), Zoom Slider (Timeline zoom).
* **Track Structure:**
  * **Track 1 (Camera & Motion):** Camera Zoom, Pan Keyframes, Ease Curves (`easeInOutCubic`).
  * **Track 2 (Map Elements):** Country Highlights, Pin Drop triggers, Route line draws.
  * **Track 3 (Typography & HUD):** Title reveals, Glass card entrance, Subtitle timings.
  * **Track 4 (Audio & SFX):** Voiceover waveform, Whoosh effects, Background drone.
* **Scrubber Head:** Neon Emerald vertical line (`#10b981`) with glowing diamond handle.

---

### Component 5: Contextual Property Inspector (`RightInspector`)
* **Width:** `280px`, Background: `--c-surface-1`.
* **Dynamically adapts based on user selection:**
  * **When Territory Selected:**
    * Color Picker (Hex, RGB, Presets).
    * Fill Opacity Slider (`0% - 100%`).
    * Outer Glow Blur Slider (`0px - 50px`).
    * On-Map Label Toggle: Enable/Disable, Font size auto-clamp, Angle slider.
  * **When Route Selected:**
    * Start / Destination search inputs.
    * Arc Altitude slider (`Flat` to `Deep High Arc`).
    * Vehicle Icon: Airplane, Ship, Car, Pulsing Dot.
    * Dash Pattern: Solid, Dashed `[8, 6]`, Laser Ray.

---

### Component 6: Standard Interactive Controls (`Atoms`)

#### A. Custom Segmented Switch (Tabs):
```html
<div class="flex p-1 bg-slate-900 border border-slate-800 rounded-lg">
  <button class="flex-1 py-1.5 text-xs font-semibold text-white bg-slate-800 rounded-md shadow-sm">Vector</button>
  <button class="flex-1 py-1.5 text-xs font-medium text-slate-400 hover:text-white">Satellite</button>
</div>
```

#### B. Slider with Numeric Readout:
```html
<div class="space-y-1.5">
  <div class="flex justify-between text-xs font-medium text-slate-300">
    <span>Glow Radius</span>
    <span class="font-mono text-emerald-400">28px</span>
  </div>
  <input type="range" min="0" max="50" value="28" 
    class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
</div>
```

#### C. Glassmorphic HUD Card (Preset):
```css
.hud-glass-card {
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(16, 185, 129, 0.3);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}
```

---

## 5. 🎬 Export Modal Specification (`ExportDialog`)

* **Title:** Export Animation to Video
* **Settings:**
  * **Resolution:** `1080p Full HD (1920x1080)` (Default) / `4K Ultra HD (3840x2160)` / `720p HD`.
  * **Frame Rate:** `30 FPS` (Standard) / `60 FPS` (Ultra Smooth).
  * **Encoder Engine:** 
    * `Hardware Accelerated (Auto: Intel QSV / NVIDIA NVENC)` — Ultra Fast.
    * `Software CPU (libx264 - CRF 19)` — High Quality.
  * **Audio Options:** Include SFX, Voiceover mix, Mute.
* **Progress Bar:** Animated emerald pulse bar showing `Frame 84 / 150 (56%) • Est. 4s remaining`.
