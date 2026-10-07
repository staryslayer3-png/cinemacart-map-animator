const { createCanvas } = require('canvas');
const d3 = require('d3-geo');
const topojson = require('topojson-client');
const world = require('world-atlas/countries-50m.json');
const { spawn } = require('child_process');
const path = require('path');

const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;
const DURATION_SEC = 5;
const TOTAL_FRAMES = FPS * DURATION_SEC; // 150 frames
const OUTPUT_FILE = path.join(__dirname, 'locator_beacon_focus.mp4');
const FFMPEG_PATH = 'D:\\downloads\\Vid Optimus\\ffmpeg.exe';

const countries = topojson.feature(world, world.objects.countries);

// Target Focus Location: GHQ / Islamabad [73.0479, 33.6844]
const TARGET = {
  name: 'COORDINATES IDENTIFIED',
  location: 'ISLAMABAD, PAKISTAN',
  coords: [73.0479, 33.6844],
  latLongText: '33°41\'03.8"N  73°02\'52.4"E',
  color: '#06B6D4', // Tactical Neon Cyan
  glow: '#22D3EE'
};

// Start camera slightly wide [71.0, 31.0] and zoom in aggressively on Islamabad
const START_CENTER = [70.5, 31.5];
const END_CENTER = TARGET.coords;

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');
const projection = d3.geoMercator();
const geoPath = d3.geoPath().projection(projection).context(ctx);

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

console.log('🚀 Fast Direct Pipe Encoding: Locator Beacon / Focus Pulse...');
const startTime = Date.now();

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

ffmpeg.on('close', (code) => {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 Locator Beacon Render Done in ${elapsed}s! Saved to: ${OUTPUT_FILE}`);
});

ffmpeg.stderr.on('data', () => {});

async function renderAll() {
  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    const linearProg = frame / (TOTAL_FRAMES - 1);
    const prog = easeInOutCubic(linearProg);

    // 1. Aggressive Focus Zoom Plunge
    const curLng = START_CENTER[0] + (END_CENTER[0] - START_CENTER[0]) * prog;
    const curLat = START_CENTER[1] + (END_CENTER[1] - START_CENTER[1]) * prog;
    // Scale starts at medium country scale (1400) and dives into deep tactical target scale (6500)
    const scale = 1400 + (6500 - 1400) * Math.pow(prog, 1.8);

    projection
      .center([curLng, curLat])
      .scale(scale)
      .translate([WIDTH / 2, HEIGHT / 2]);

    // 2. High-Tech Tactical Dark Slate Ocean (#050811)
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 3. Dense Tactical Radar Grid
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
    ctx.lineWidth = 1;
    const graticule = d3.geoGraticule().step([2, 2]);
    ctx.beginPath();
    geoPath(graticule());
    ctx.stroke();

    // 4. Detailed Landmass & Borders
    ctx.save();
    ctx.fillStyle = '#111827';
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    geoPath(countries);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 5. Target Position Calculation
    const targetPos = projection(TARGET.coords);
    const tx = targetPos[0];
    const ty = targetPos[1];

    // 6. Expanding Radar Beacon Waves (Focus Pulse)
    // 3 expanding concentric ripples with fading opacity
    const waveCount = 3;
    for (let w = 0; w < waveCount; w++) {
      const wavePhase = (frame * 0.05 + w / waveCount) % 1.0;
      const waveRadius = 15 + wavePhase * 160;
      const waveAlpha = Math.max(0, (1.0 - wavePhase) * 0.7);

      ctx.save();
      ctx.beginPath();
      ctx.arc(tx, ty, waveRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(6, 182, 212, ${waveAlpha})`;
      ctx.lineWidth = 2.5 * (1.0 - wavePhase);
      ctx.shadowColor = '#06B6D4';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.restore();
    }

    // 7. Rotating Crosshair Reticle around Target
    const reticleAngle = frame * 0.04;
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(reticleAngle);

    // Target box corners
    const boxSize = 35;
    const cornerLen = 12;
    ctx.strokeStyle = TARGET.color;
    ctx.lineWidth = 2;
    ctx.shadowColor = TARGET.glow;
    ctx.shadowBlur = 10;

    // Top-Left corner
    ctx.beginPath();
    ctx.moveTo(-boxSize, -boxSize + cornerLen);
    ctx.lineTo(-boxSize, -boxSize);
    ctx.lineTo(-boxSize + cornerLen, -boxSize);
    ctx.stroke();

    // Top-Right corner
    ctx.beginPath();
    ctx.moveTo(boxSize - cornerLen, -boxSize);
    ctx.lineTo(boxSize, -boxSize);
    ctx.lineTo(boxSize, -boxSize + cornerLen);
    ctx.stroke();

    // Bottom-Left corner
    ctx.beginPath();
    ctx.moveTo(-boxSize, boxSize - cornerLen);
    ctx.lineTo(-boxSize, boxSize);
    ctx.lineTo(-boxSize + cornerLen, boxSize);
    ctx.stroke();

    // Bottom-Right corner
    ctx.beginPath();
    ctx.moveTo(boxSize - cornerLen, boxSize);
    ctx.lineTo(boxSize, boxSize);
    ctx.lineTo(boxSize, boxSize - cornerLen);
    ctx.stroke();

    ctx.restore();

    // 8. Solid Core Center Beacon Dot
    ctx.save();
    ctx.beginPath();
    ctx.arc(tx, ty, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = TARGET.color;
    ctx.shadowBlur = 15;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(tx, ty, 10, 0, 2 * Math.PI);
    ctx.strokeStyle = TARGET.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // 9. Crosshair Axis Lines (Laser Guide Cross)
    ctx.save();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(tx - 120, ty);
    ctx.lineTo(tx + 120, ty);
    ctx.moveTo(tx, ty - 120);
    ctx.lineTo(tx, ty + 120);
    ctx.stroke();
    ctx.restore();

    // 10. Tactical HUD Info Card (Fades in as camera locks target)
    if (linearProg > 0.3) {
      const cardProg = Math.min(1.0, (linearProg - 0.3) / 0.3);
      const cardEase = easeInOutCubic(cardProg);

      ctx.save();
      ctx.translate(tx, ty);
      ctx.scale(cardEase, cardEase);

      // Angled HUD Leader Line
      ctx.strokeStyle = TARGET.color;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(25, -25);
      ctx.lineTo(65, -65);
      ctx.lineTo(130, -65);
      ctx.stroke();

      // Info Card Frame
      const cardX = 135;
      const cardY = -105;
      const cardW = 320;
      const cardH = 80;

      ctx.fillStyle = 'rgba(8, 14, 26, 0.94)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 8);
      ctx.fill();

      ctx.strokeStyle = TARGET.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Flashing REC / LOCK badge
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(cardX + 22, cardY + 22, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Header Tag
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(TARGET.name, cardX + 36, cardY + 22);

      // Location Name
      ctx.fillStyle = TARGET.color;
      ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
      ctx.fillText(TARGET.location, cardX + 18, cardY + 44);

      // GPS Coordinates
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.font = '12px "Consolas", monospace';
      ctx.fillText(TARGET.latLongText, cardX + 18, cardY + 65);

      ctx.restore();
    }

    // 11. Tactical Viewfinder Corners on Screen
    ctx.save();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 3;
    const pad = 40;
    const len = 30;
    // Screen Top-Left
    ctx.beginPath();
    ctx.moveTo(pad, pad + len);
    ctx.lineTo(pad, pad);
    ctx.lineTo(pad + len, pad);
    ctx.stroke();
    // Screen Top-Right
    ctx.beginPath();
    ctx.moveTo(WIDTH - pad - len, pad);
    ctx.lineTo(WIDTH - pad, pad);
    ctx.lineTo(WIDTH - pad, pad + len);
    ctx.stroke();
    // Screen Bottom-Left
    ctx.beginPath();
    ctx.moveTo(pad, HEIGHT - pad - len);
    ctx.lineTo(pad, HEIGHT - pad);
    ctx.lineTo(pad + len, HEIGHT - pad);
    ctx.stroke();
    // Screen Bottom-Right
    ctx.beginPath();
    ctx.moveTo(WIDTH - pad - len, HEIGHT - pad);
    ctx.lineTo(WIDTH - pad, HEIGHT - pad);
    ctx.lineTo(WIDTH - pad, HEIGHT - pad - len);
    ctx.stroke();
    ctx.restore();

    // 12. Cinematic Vignette
    const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, WIDTH * 0.35, WIDTH / 2, HEIGHT / 2, WIDTH * 0.78);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Direct buffer write into FFmpeg stdin
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