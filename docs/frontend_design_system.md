# 🎨 Cinemacart - Complete UI/UX Specification & 9-Page Creation Wizard
> **Extracted & Reverse-Engineered Directly from Vid Optimus Core Bundles**  
> **Architecture:** 9-Step Creation Wizard + Left Global Navigation + Studio Timeline Editor  
> **Tech Stack:** React 18 + Tailwind CSS + Lucide Icons + HTML5/WebGL Canvas

---

## 1. 🧭 Global Left Sidebar Menu Bar (Navigation Rail)

The app features a persistent vertical rail on the far left (`width: 64px` collapsed, expandable to `240px`) that controls top-level navigation:

| Nav Item | Icon | Role & Action |
| :--- | :--- | :--- |
| **New Project** | `PlusSquare` | Opens the 9-Step Video Creation Wizard. |
| **Projects** | `FolderKanban` | Grid library of recent projects (`.cart`), with status badges: `Draft`, `Script ready`, `Voiced`, `Visualized`, `Exported`. |
| **Templates** | `LayoutGrid` | Quick-start library (Route Transit, 3D Globe Spin, Territory Spotlight, Satellite Corridor, VS Comparison). |
| **Asset Library** | `Film` | Stored voiceovers, downloaded NASA satellite textures, TopoJSON regions, and SFX audio wavs. |
| **Settings / APIs** | `Sliders` | API Keys (Groq, OpenAI, Gemini, ElevenLabs, Fish Audio, Ollama endpoint: `http://localhost:11434`). |
| **Account / License** | `ShieldCheck` | License tier status, device identifier, and offline unlock state. |

---

## 2. 🧙 The Complete 9-Step Video Creation Wizard

Vid Optimus uses a sequential 9-step wizard before entering the studio editor. Each step has an explicit `title`, `subtitle`, `heading`, `lede` (explanation), interactive inputs, and bottom navigation (`[Back]` and `[Next]` buttons):

```
[1. Script] ➔ [2. Direction] ➔ [3. Frame] ➔ [4. Visual Style] ➔ [5. Colour]
     ➔ [6. Models] ➔ [7. Voice & Sound] ➔ [8. Captions] ➔ [9. Review & Build]
```

---

### Step 1: Script (`id: "script"`)
* **Title:** Script  
* **Subtitle:** Your words  
* **Heading:** *"What is this video saying?"*  
* **Lede:** *"Paste a script and a voice reads it, or bring a recording and it is transcribed and cut on the timings it already has. Your words are never rewritten."*

#### Controls & UI Elements:
1. **Input Mode Segmented Switch:**
   * ✍️ **Paste Script:** Multi-line textarea with auto-resizing, character count, and real-time word counter.
   * 🤖 **AI Scriptwriter:** Topic input field (`"History of the Silk Road through Pakistan & Iran"`), Tone selector (`Documentary`, `Dramatic`, `Educational`), Target Duration dropdown (`30s`, `60s`, `2 min`, `5 min`).
   * 🎙️ **Audio File Upload:** Drag-and-drop `.mp3`/`.wav` recording for automatic local Whisper speech-to-text alignment.
2. **Hook Generator Button:** `llm_write_hook` — generates 3 attention-grabbing intro hooks.
3. **Pacing Indicator Badge:** Estimated reading duration calculated at 140 words per minute (WPM).

---

### Step 2: Direction (`id: "build"`)
* **Title:** Direction  
* **Subtitle:** Who cuts it  
* **Heading:** *"Who decides the edit?"*  
* **Lede:** *"Hand the shot list to the model, or keep one visual per scene and stay in charge of every one."*

#### Controls & UI Elements:
1. **Director Mode Toggle Cards:**
   * **AI Director Mode:** LLM automatically plans the edit, determines how many map shots/scenes, shot duration (2s - 8s), and transitions.
   * **Manual / 1 Visual Per Scene:** Strict 1:1 mapping where each paragraph or sentence gets a dedicated scene.
2. **Pacing / Cut Speed Slider:**
   * `Fast` (2s - 3s per cut - TikTok/Shorts pacing).
   * `Documentary` (4s - 6s per cut - Vox / Johnny Harris standard).
   * `Cinematic` (8s - 12s per cut - Slow panoramic sweep).
3. **Graphics Direction Switch:** LTR (Left to right / English) vs RTL (Right to left / Urdu & Arabic).

---

### Step 3: Frame (`id: "frame"`)
* **Title:** Frame  
* **Subtitle:** Shape & source  
* **Heading:** *"What shape is the video?"*  
* **Lede:** *"Wide for YouTube, tall for Shorts, Reels and TikTok — and, for one visual per scene, where the pictures come from."*

#### Controls & UI Elements:
1. **Aspect Ratio Selection Cards (Visual Preview):**
   * 🖥️ **16:9 Landscape (1920x1080):** YouTube, TV, Desktop documentaries.
   * 📱 **9:16 Portrait (1080x1920):** YouTube Shorts, Instagram Reels, TikTok.
   * ⏹️ **1:1 Square (1080x1080):** Instagram post, LinkedIn feed.
2. **Visual Source Priority Checkboxes:**
   * `[x] Procedural Maps & Cartography` (Our vector and satellite map engine).
   * `[ ] AI Generated B-Roll` (Flux / Stable Diffusion).
   * `[x] Free Stock Media` (NASA, Wikimedia, Pexels, Pixabay).

---

### Step 4: Visual Style (`id: "style"`)
* **Title:** Visual style  
* **Subtitle:** How pictures are drawn  
* **Heading:** *"What should the pictures look like?"*  
* **Lede:** *"The style shapes every image prompt in the project, so it is worth a moment here."*

#### Controls & UI Elements:
1. **Category Filter Tabs:**
   * `All`, `Documentary & Maps`, `Realistic`, `Digital Art`, `Traditional`, `Cyber`, `Minimalist`.
2. **Interactive Visual Style Tiles (With thumbnail preview & badge):**
   * 🌍 **Vox / Johnny Harris Documentary:** Dark slate ocean (`#060a12`), glowing vector borders, graticule grid lines.
   * 🛰️ **NASA Blue Marble Satellite:** True photorealistic physical terrain, mountain shaded relief, and desert dunes.
   * 📜 **Vintage Parchment & Watercolor:** Antique cream paper texture, hand-drawn ink boundaries.
   * ⚡ **Tactical Military Radar:** Monochromatic emerald neon HUD, coordinate crosshairs, sonar beacon pulses.
   * 📊 **Minimalist Infographic:** Flat pastel colors, clean vector shapes, bold high-contrast topography.

---

### Step 5: Colour (`id: "colour"`)
* **Title:** Colour  
* **Subtitle:** Grade & finish  
* **Heading:** *"Which colour look?"*  
* **Lede:** *"One grade over every picture and clip, so a video made from many sources still looks like one film. Each tile is the real export."*

#### Controls & UI Elements:
1. **The 22 Extracted Presets Grid (Hex Swatches):**
   * `Obsidian Slate`: `#0a0d14` bg with `#10b981` (Emerald) or `#38bdf8` (Sky) accent.
   * `Warm Documentary`: `#dfd3c3` taupe bg with `#e11d48` (Crimson red) Germany style.
   * `Cyberpunk Neon`: `#0a1a24` bg with `#22d3ee` (Cyan) and `#ec4899` (Magenta).
   * `Desert Sand`: `#fef3c7` bg with `#d97706` (Amber) and `#059669` (Forest).
2. **Custom Color Overrides:**
   * `Background Colour`: Color picker for ocean/space canvas.
   * `Accent Colour`: Key elements, waypoint pins, laser lines.
   * `Ink / Text Colour`: On-map typography and card text fill.

---

### Step 6: Models (`id: "models"`)
* **Title:** Models  
* **Subtitle:** Who writes & draws  
* **Heading:** *"Which models do the work?"*  
* **Lede:** *"The model that writes the visual prompts, and the providers that turn them into pictures."*

#### Controls & UI Elements:
1. **Language & Script Model Dropdown:**
   * 🦙 **Ollama (Local / Free / Offline):** Direct connection to `http://localhost:11434` (Llama 3, Mistral, Qwen).
   * ⚡ **Groq (Recommended):** Llama-3.3-70b (sub-second script generation + Whisper transcription).
   * 🧠 **OpenAI:** GPT-4o / GPT-4o-mini.
   * 🔮 **Google Gemini:** Gemini 1.5 Pro / Flash.
2. **Provider Status Badges:** Green dot (`Connected`), Gray dot (`API Key Required`).

---

### Step 7: Voice & Sound (`id: "audio"`)
* **Title:** Voice & sound  
* **Subtitle:** How it's heard  
* **Heading:** *"How should it sound?"*  
* **Lede:** *"The narrator, the bed under them, and the sounds each cut makes."*

#### Controls & UI Elements:
1. **TTS Engine Selector:**
   * 🎙️ **Voicely TTS (Bundled Edge-TTS):** 100% Free, 322 voices, 75 languages (including Urdu `ur-PK`, English `en-US`, Arabic `ar-SA`). No API key needed!
   * 💎 **ElevenLabs:** Ultra-realistic emotional AI voices (API key required).
   * 🐟 **Fish Audio / Musa:** Voice cloning and specialized accents.
2. **Voice Picker & Preview:**
   * Dropdown with search by language, gender (Male/Female), and accent.
   * `[▶ Play Sample]` instant audition button.
3. **Sound Effects (SFX) Library:**
   * Toggles for automatic sound effects:
     * `[x] Deep Whoosh` on camera pans and map transitions.
     * `[x] Inception Thump / Dramatic Impact` on country highlight locks.
     * `[x] Riser / Buildup` on route arc arrivals.
4. **Background Music (BGM):**
   * Ambient Drone, Investigation Tension, Documentary Acoustic.
   * Background Volume slider (`Default: 12% - ducked under voiceover`).

---

### Step 8: Captions (`id: "captions"`)
* **Title:** Captions  
* **Subtitle:** Text & graphics  
* **Heading:** *"Text on screen"*  
* **Lede:** *"Captions and motion graphics share one accent, so they are set together — and set now, so the first graphic is drawn in the right colour rather than recoloured later."*

#### Controls & UI Elements:
1. **Caption Style Cards:**
   * **Karaoke Word Pop:** Active spoken word illuminates in accent color.
   * **Minimal Clean Subtitle:** 3 to 5 words per chunk with dark outline.
   * **News Documentary Lower Third:** Frosted glass banner at screen bottom.
2. **Typography Selector:**
   * Bundled Fonts: `Montserrat`, `Arial Black`, `Impact`, `Bebas Neue`, `Inter`, `Noto Nastaliq Urdu`, `Amiri Arabic`.
   * Font Size Slider (`40px - 90px`).
   * Outline Width (`0px - 8px`) & Outline Color picker.
3. **Screen Position Selector:** `Bottom` (standard), `Center` (TikTok viral), `Top`.

---

### Step 9: Review & Build (`id: "review"`)
* **Title:** Review  
* **Subtitle:** Create the project  
* **Heading:** *"Ready to build"*  
* **Lede:** *"Everything below can still be changed after the project is made."*

#### Controls & UI Elements:
1. **Summary Inspection Card:**
   * Displays chips: `Duration: 60s`, `Aspect: 16:9`, `Style: NASA Satellite`, `Voice: Christopher Neural`, `Captions: Montserrat Bold`.
2. **Primary Action:**
   * **[🚀 BUILD PROJECT & OPEN STUDIO]** button.
   * Instantly initializes the storyboard, generates the timeline scenes, and loads the interactive Canvas Workspace!

---

## 3. 🎬 The Post-Wizard Studio Workspace (Timeline & Inspector)

Once the user clicks **Build Project**, the app switches to the full Studio Editor with:
1. **Center Interactive Canvas:** Live 60 FPS HTML5 preview of the active scene.
2. **Bottom Multi-Track Timeline:**
   * Scene strips with thumbnail cards.
   * Audio waveform track with word timestamp markers.
   * SFX cues (`deep-whoosh-1.wav`, `impact-hit.wav`).
3. **Right Inspector Panel:** Fine-tune camera lat/long, zoom scale, territory glow, and route curve height.
4. **Header Bar:** Real-time timecode readout, Undo/Redo, and **Export Video** dialog.
