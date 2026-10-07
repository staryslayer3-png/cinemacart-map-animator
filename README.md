# 🌍 Cinemacart - Procedural Cinematic Map & Motion Graphics Video Engine

A high-performance, offline, procedural map animation and documentary motion graphics video engine inspired by Vox, Johnny Harris, and Casian style cartography.

Built with **Node.js, Canvas, D3-Geo, and FFmpeg** with a direct zero-disk memory pipe architecture.

---

## 🚀 Key Features

- **100% Offline & Free:** Bundled with Natural Earth 1:50m TopoJSON datasets (`world-atlas`). No map APIs or tokens needed.
- **Zero-Disk RAM Pipe Rendering:** Canvas frames stream directly into FFmpeg stdin (`image2pipe`), eliminating temporary disk write bottlenecks.
- **Cinematic Visual Styles:**
  - Dark Midnight Ocean (`#060a12`) + Charcoal Landmass (`#1e293b`).
  - Pulsing radar beacons, glowing neon borders, glassmorphic HUD tags, and dynamic vignette shaders.
  - Coordinate axis grids, great-circle flight arcs, and smooth cubic bezier easing.

---

## 🎬 Available Map Templates

| Template | File | Description |
| :--- | :--- | :--- |
| **1. Flight / Transit Route Arc** | `render_frames.js` | Great-circle curved trajectory (e.g. Islamabad ➔ Dubai) with airplane heading rotation. |
| **2. Multi-Stop Storyline Route** | `render_multistop.js` | Multi-checkpoint journey (Islamabad ➔ Dubai ➔ Istanbul) with staggered glass cards. |
| **3. Country / Territory Spotlight** | `render_highlight.js` | Geopolitical boundary isolation with multi-pass neon emerald glow. |
| **4. Multi-Country Comparison** | `render_3countries.js` | Staggered highlight across Eurasia (London ➔ Pakistan ➔ China) with trade ray connectors. |
| **5. 3D Rotating Globe Spin & Land** | `render_globe_fast.js` | 3D Orthographic spherical Earth rotating in cosmic space with atmospheric rim glow. |
| **6. Multi-Stop 3D Globe Tour** | `render_globe_4countries.js` | 3D Globe spinning from East Asia to Middle East (Tokyo, India, Iraq, Saudi Arabia). |
| **7. Locator Beacon / Focus Pulse** | `render_beacon_focus.js` | High-speed camera plunge with 3 concentric expanding radar ripples and crosshair reticle. |
| **8. Side-by-Side Territorial VS** | `render_split_comparison.js` | 1:1 true physical geographic size comparison (e.g. UK vs Pakistan 3.6x). |

---

## 📦 Installation

```bash
git clone https://github.com/staryslayer3-png/cinemacart-map-animator.git
cd cinemacart-map-animator
npm install
```

Make sure **FFmpeg** is installed and accessible on your PATH (or configure `FFMPEG_PATH` in the scripts).

---

## ⚡ Quick Start

Render any template with a single command:

```bash
# Render Flight Route
node render_frames.js

# Render 3D Rotating Globe
node render_globe_fast.js

# Render Locator Beacon
node render_beacon_focus.js

# Render Territorial Comparison
node render_split_comparison.js
```

Rendered high-definition 1080p MP4 videos are output right in the project root!

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Projections & Geo:** `d3-geo`, `topojson-client`, `world-atlas`
- **Graphics Canvas:** `canvas` (Cairo / Skia 2D Hardware-Accelerated Graphics Engine)
- **Video Encoder:** FFmpeg (libx264, yuv420p)