const { createCanvas } = require('canvas');
const d3 = require('d3-geo');
const topojson = require('topojson-client');
const world = require('world-atlas/countries-50m.json');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;
const DURATION_SEC = 5;
const TOTAL_FRAMES = FPS * DURATION_SEC; // 150 frames
const OUTPUT_FILE = path.join(__dirname, 'globe_spin_and_land.mp4');
const FFMPEG_PATH = 'D:\\downloads\\Vid Optimus\\ffmpeg.exe';

const countries = topojson.feature(world, world.objects.countries);

// Target landing location: Pakistan [69.3451, 30.3753]
const TARGET_LNG = 69.3451;
const TARGET_LAT = 30.3753;
// Start rotation far away on the globe (e.g. Pacific / Americas at -120° longitude)
const START_ROT_LNG = -120;
const START_ROT_LAT = -10;

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');

// 3D Orthographic Globe Projection
const projection = d3.geoOrthographic().clipAngle(90);
const geoPath = d3.geoPath().projection(projection).context(ctx);

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

console.log('🚀 Fast Direct Pipe Encoding: 3D Rotating Globe...');
const startTime = Date.now();

// Spawn FFmpeg with direct image2pipe (PNG stream)
const ffmpeg = spawn(FFMPEG_PATH, [
  '-y',
  '-f', 'image2pipe',
  '-vcodec', 'png',
  '-r', `${FPS}`,
  '-i', '-',
  '-c:v', 'libx264',
  '-preset', 'veryfast',
  '-crf', '19',
  '-pix_fmt', 'yuv420p',
  OUTPUT_FILE
]);

let isFfmpegClosed = false;

ffmpeg.on('close', (code) => {
  isFfmpegClosed = true;
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 3D Globe Render Done in ${elapsed}s! Saved to: ${OUTPUT_FILE}`);
});

ffmpeg.stderr.on('data', () => {}); // silence ffmpeg logs

// Stream frames directly into FFmpeg stdin with backpressure handling
async function renderAll() {
  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    const linearProg = frame / (TOTAL_FRAMES - 1);
    const prog = easeInOutCubic(linearProg);

    // 1. Globe 3D Rotation Calculation
    // Rotates smoothly from START_ROT_LNG to -TARGET_LNG so target faces camera
    // Note: D3 rotation requires negative longitude [-curLng, -curLat]
    const curRotLng = START_ROT_LNG + (-TARGET_LNG - START_ROT_LNG) * prog;
    const curRotLat = START_ROT_LAT + (-TARGET_LAT - START_ROT_LAT) * prog;
    
    // Scale: from full globe view (radius ~380) to deep cinematic landing plunge (radius ~1800)
    const globeRadius = 380 + (1800 - 380) * Math.pow(prog, 2.2);

    projection
      .rotate([curRotLng, curRotLat, 0])
      .scale(globeRadius)
      .translate([WIDTH / 2, HEIGHT / 2]);

    // 2. Space / Cosmic Dark Void Background (#030712)
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 3. Subtle Distant Stars in Space
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let s = 0; s < 50; s++) {
      const sx = (s * 137.5) % WIDTH;
      const sy = (s * 293.7) % HEIGHT;
      ctx.fillRect(sx, sy, 1.2, 1.2);
    }

    // 4. Globe Sphere Base (Ocean Fill)
    ctx.save();
    ctx.beginPath();
    geoPath({ type: 'Sphere' });
    ctx.fillStyle = '#0b1324'; // Deep ocean blue
    ctx.fill();

    // 5. Globe Atmosphere Outer Glow & Rim Lighting
    ctx.shadowColor = '#38BDF8';
    ctx.shadowBlur = 28;
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();

    // 6. Globe Graticules (Latitude & Longitude Grid Curves)
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.07)';
    ctx.lineWidth = 1;
    const graticule = d3.geoGraticule().step([15, 15]);
    ctx.beginPath();
    geoPath(graticule());
    ctx.stroke();
    ctx.restore();

    // 7. World Landmass on Sphere
    ctx.save();
    ctx.fillStyle = '#1e293b'; // Charcoal landmass
    ctx.strokeStyle = '#334155'; // Clean border
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    geoPath(countries);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 8. Pakistan Landing Spotlight & Beacon (Appears as globe finishes turning)
    if (linearProg > 0.45) {
      const landProg = Math.min(1.0, (linearProg - 0.45) / 0.35);
      const easeLand = easeInOutCubic(landProg);

      // Check if target is facing camera
      const targetScreen = projection([TARGET_LNG, TARGET_LAT]);
      if (targetScreen) {
        const tx = targetScreen[0];
        const ty = targetScreen[1];

        // Pulsing ground impact radar beacon
        const pulse = 1.0 + 0.35 * Math.sin(frame * 0.3);
        ctx.save();
        ctx.beginPath();
        ctx.arc(tx, ty, 20 * pulse * easeLand, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(tx, ty, 7 * easeLand, 0, 2 * Math.PI);
        ctx.fillStyle = '#10B981';
        ctx.shadowColor = '#10B981';
        ctx.shadowBlur = 18;
        ctx.fill();

        // 9. Floating Target Lock HUD
        if (landProg > 0.6) {
          const hudProg = (landProg - 0.6) / 0.4;
          const hudEase = easeInOutCubic(hudProg);

          ctx.translate(tx, ty - 35);
          ctx.scale(hudEase, hudEase);

          // Stem
          ctx.strokeStyle = '#10B981';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, 30);
          ctx.lineTo(0, 0);
          ctx.stroke();

          // High-tech Tactical Reticle Card
          const cardW = 260;
          const cardH = 54;
          ctx.fillStyle = 'rgba(6, 11, 22, 0.92)';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 22;
          ctx.beginPath();
          ctx.roundRect(-cardW / 2, -cardH, cardW, cardH, 8);
          ctx.fill();

          ctx.strokeStyle = '#10B981';
          ctx.lineWidth = 1.8;
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText('TARGET LOCKED', 0, -cardH + 8);

          ctx.fillStyle = '#10B981';
          ctx.font = '600 12px "Segoe UI", Arial, sans-serif';
          ctx.fillText('33.68° N, 73.04° E  •  PAKISTAN', 0, -cardH + 30);
        }
        ctx.restore();
      }
    }

    // 10. Outer Space Atmospheric Vignette
    const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, WIDTH * 0.35, WIDTH / 2, HEIGHT / 2, WIDTH * 0.75);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Direct buffer write into FFmpeg stdin pipe (zero disk I/O)
    const pngBuf = canvas.toBuffer('image/png');
    const ok = ffmpeg.stdin.write(pngBuf);
    if (!ok) {
      await new Promise(resolve => ffmpeg.stdin.once('drain', resolve));
    }

    if (frame % 30 === 0) {
      process.stdout.write(`Rendered ${frame} / ${TOTAL_FRAMES} frames\r`);
    }
  }

  ffmpeg.stdin.end();
}

renderAll();