# 🦀 Cinemacart - Native Rust & Tauri v2 Backend Architecture Specification
> **Role:** High-Performance, Low-Memory Desktop Video Engine & IPC Core  
> **Tech Stack:** Rust 2021 Edition + Tauri v2 + Microsoft WebView2 + FFmpeg (HW Accelerated)  
> **Target Target Hardware:** 4GB / 8GB RAM Low-End Laptops to High-End Workstations

---

## 1. 🏗️ High-Level System Architecture

The core philosophy is **Zero-Copy Memory Stream**: Never write temporary frames to disk, never encode frames to Base64 in JavaScript, and keep RAM allocations strictly capped under 80 MB throughout the entire rendering lifecycle.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TAURI V2 FRONTEND (WEBVIEW2)                    │
│      React 18 UI  •  HTML5 Canvas Live Preview  •  Timeline State       │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                 Binary IPC Stream (Zero-Copy ArrayBuffer)
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│                           RUST CORE ENGINE                             │
│                                                                        │
│   ┌────────────────────┐  ┌─────────────────────┐  ┌────────────────┐  │
│   │ Storyboard Parser  │  │ Native Vector Math  │  │ Hardware Probe │  │
│   │ (JSON Schema Core) │  │ (D3-Geo Port / SIMD)│  │ (QSV / NVENC)  │  │
│   └─────────┬──────────┘  └──────────┬──────────┘  └────────┬───────┘  │
│             │                        │                      │          │
│             └────────────────────────┼──────────────────────┘          │
│                                      ▼                                 │
│                   ┌───────────────────────────────────┐                │
│                   │ Frame Memory Buffer Pool (RAII)   │                │
│                   │ Single 8.29 MB Recycled Buffer    │                │
│                   └──────────────────┬────────────────┘                │
└──────────────────────────────────────┼─────────────────────────────────┘
                                       │
                      Direct RAM Pipe (image2pipe stdin)
                                       │
┌──────────────────────────────────────▼─────────────────────────────────┐
│                    FFMPEG HARDWARE ACCELERATED ENCODER                 │
│    Intel QSV (h264_qsv)  •  NVIDIA (h264_nvenc)  •  CPU (libx264)     │
└──────────────────────────────────────┬─────────────────────────────────┘
                                       │
                                       ▼
                             [Final Output .mp4]
```

---

## 2. 📁 Rust Backend Directory Structure (`src-tauri`)

```
cinemacart-desktop/
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── icons/
│   └── src/
│       ├── main.rs                   # App initialization, window setup, plugin registry
│       ├── state.rs                  # Thread-safe global project state (Mutex/RwLock)
│       │
│       ├── commands/                 # Tauri IPC command handlers callable from frontend
│       │   ├── mod.rs
│       │   ├── project.rs            # Save, load, and export project files (.cart)
│       │   ├── render.rs             # Trigger render job, pause, cancel, progress events
│       │   ├── hardware.rs           # Probe available GPU encoders (QSV, NVENC, AMF)
│       │   └── tts.rs                # Edge-TTS / Elevenlabs speech synthesis runner
│       │
│       ├── engine/                   # Native geometry & frame generation
│       │   ├── mod.rs
│       │   ├── topo.rs               # Bundled Natural Earth TopoJSON parser (zero disk read)
│       │   ├── projection.rs         # Mercator, Equirectangular & Orthographic 3D Math
│       │   ├── raster.rs             # Fast memory-mapped NASA satellite texture sampler
│       │   └── typography.rs         # Bounding-box text collision & best-fit placement
│       │
│       ├── pipeline/                 # Frame streaming & memory management
│       │   ├── mod.rs
│       │   ├── buffer_pool.rs        # Reusable contiguous RGBA frame buffer (no allocations)
│       │   └── ffmpeg_runner.rs      # Subprocess lifecycle, stdin stream, progress listener
│       │
│       └── storyboard/               # Script-to-animation timeline schema
│           ├── mod.rs
│           ├── schema.rs             # Serde structs for Scene, Camera, Elements, Audio
│           └── validator.rs          # Validate timestamp continuity & bounds
```

---

## 3. ⚡ Core Rust Modules & Code Architecture

### A. Thread-Safe Global State (`src/state.rs`)
```rust
use std::sync::{Arc, Mutex};
use serde::{Serialize, Deserialize};

#[derive(Default, Clone, Serialize, Deserialize)]
pub struct RenderProgress {
    pub is_rendering: bool,
    pub current_frame: usize,
    pub total_frames: usize,
    pub fps: f32,
    pub estimated_seconds_left: f32,
}

pub struct AppState {
    pub active_storyboard: Arc<Mutex<Option<crate::storyboard::schema::Storyboard>>>,
    pub render_progress: Arc<Mutex<RenderProgress>>,
    pub cancel_flag: Arc<Mutex<bool>>,
}
```

---

### B. Hardware GPU Encoder Probe (`src/commands/hardware.rs`)

Low-end Intel laptops have **Intel QuickSync (QSV)**, while Nvidia laptops have **NVENC**. This module tests which encoder is available on the user's specific system:

```rust
use std::process::Command;

#[derive(serde::Serialize)]
pub struct GpuCapabilities {
    pub has_qsv: bool,
    pub has_nvenc: bool,
    pub has_amf: bool,
    pub recommended_encoder: String,
}

#[tauri::command]
pub fn detect_gpu_encoder() -> GpuCapabilities {
    let output = Command::new("ffmpeg")
        .args(&["-encoders"])
        .output();

    let mut has_qsv = false;
    let mut has_nvenc = false;
    let mut has_amf = false;

    if let Ok(out) = output {
        let stdout = String::from_utf8_lossy(&out.stdout);
        if stdout.contains("h264_qsv") { has_qsv = true; }
        if stdout.contains("h264_nvenc") { has_nvenc = true; }
        if stdout.contains("h264_amf") { has_amf = true; }
    }

    let recommended = if has_nvenc {
        "h264_nvenc"
    } else if has_qsv {
        "h264_qsv"
    } else if has_amf {
        "h264_amf"
    } else {
        "libx264" // CPU fallback
    };

    GpuCapabilities {
        has_qsv,
        has_nvenc,
        has_amf,
        recommended_encoder: recommended.to_string(),
    }
}
```

---

### C. Zero-Copy Frame Streaming to FFmpeg (`src/pipeline/ffmpeg_runner.rs`)

Instead of writing PNG files to disk, Rust spawns FFmpeg once and streams raw raw uncompressed RGBA or PNG bytes directly into `ffmpeg.stdin`:

```rust
use std::process::{Command, Stdio, Child};
use std::io::Write;
use anyhow::Result;

pub struct FfmpegPipe {
    process: Child,
}

impl FfmpegPipe {
    pub fn new(output_path: &str, width: u32, height: u32, fps: u32, encoder: &str) -> Result<Self> {
        let mut cmd = Command::new("ffmpeg");
        cmd.args(&[
            "-y",
            "-f", "image2pipe",
            "-vcodec", "png",
            "-r", &fps.to_string(),
            "-i", "-",
            "-c:v", encoder,
            "-pix_fmt", "yuv420p",
        ]);

        // Encoder-specific optimizations
        if encoder == "libx264" {
            cmd.args(&["-preset", "veryfast", "-crf", "19"]);
        } else if encoder == "h264_qsv" {
            cmd.args(&["-preset", "veryfast", "-global_quality", "21"]);
        } else if encoder == "h264_nvenc" {
            cmd.args(&["-preset", "p4", "-cq", "20"]);
        }

        cmd.arg(output_path)
           .stdin(Stdio::piped())
           .stdout(Stdio::null())
           .stderr(Stdio::null());

        let process = cmd.spawn()?;
        Ok(Self { process })
    }

    /// Feeds a single frame memory buffer into FFmpeg without hitting the SSD
    pub fn push_frame(&mut self, frame_bytes: &[u8]) -> Result<()> {
        if let Some(ref mut stdin) = self.process.stdin {
            stdin.write_all(frame_bytes)?;
        }
        Ok(())
    }

    pub fn finish(mut self) -> Result<()> {
        drop(self.process.stdin.take()); // Close stdin to signal EOF
        self.process.wait()?;
        Ok(())
    }
}
```

---

### D. Zero-Allocation Buffer Pool (`src/pipeline/buffer_pool.rs`)

To guarantee that an 8GB or 4GB RAM machine never crashes with an Out-Of-Memory (OOM) error, Rust pre-allocates **ONE single frame buffer** ($1920 \times 1080 \times 4 \text{ bytes} \approx 8.29 \text{ MB}$) and recycles it for every single frame:

```rust
pub struct FrameBufferPool {
    buffer: Vec<u8>,
    width: usize,
    height: usize,
}

impl FrameBufferPool {
    pub fn new(width: usize, height: usize) -> Self {
        // 1920 * 1080 * 4 = 8,294,400 bytes (~8.29 MB)
        let size = width * height * 4;
        Self {
            buffer: vec![0u8; size],
            width,
            height,
        }
    }

    /// Gives mutable access to the single recycled buffer
    #[inline(always)]
    pub fn get_buffer_mut(&mut self) -> &mut [u8] {
        &mut self.buffer
    }
}
```

---

## 4. 🔗 Tauri v2 IPC Command Interface (`Frontend ⟷ Rust`)

| Command Name | Arguments | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `detect_gpu_encoder` | None | `GpuCapabilities` | Checks Intel QSV, Nvidia NVENC, or CPU. |
| `start_render_job` | `storyboard: Storyboard, outputPath: String` | `Result<String, String>` | Starts background render thread. |
| `stream_frame_chunk` | `frameIndex: number, buffer: ArrayBuffer` | `()` | Binary IPC stream from canvas to Rust. |
| `cancel_render_job` | None | `()` | Sets atomic cancel flag to abort encoding immediately. |
| `synthesize_tts` | `scriptText: String, voice: String` | `AudioResult` | Runs Edge-TTS sidecar and outputs audio + word timestamps. |

---

## 5. 📉 Low-End PC Protection Rules (Strictly Enforced)

1. **Max Concurrency Cap:** Frame rendering is capped at `std::cmp::min(num_cpus, 4)`. On dual-core or quad-core low-end laptops, it never saturates 100% of CPU threads so the Windows UI stays responsive.
2. **Process Priority:** The spawned `ffmpeg.exe` process is given `BELOW_NORMAL_PRIORITY_CLASS` on Windows. This prevents the OS from lagging or freezing.
3. **Deterministic Cleanup:** If the user cancels the render or closes the window, Rust's `Drop` trait automatically terminates the child process and frees all pipes instantly.
