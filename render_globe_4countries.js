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
const DURATION_SEC = 7;
const TOTAL_FRAMES = FPS * DURATION_SEC; // 210 frames
const OUTPUT_FILE = path.join(__dirname, 'globe_4countries_tour.mp4');
const FFMPEG_PATH = 'D:\\downloads\\Vid Optimus\\ffmpeg.exe';

const countries = topojson.feature(world, world.objects.countries);

// 4 Country Targets with metadata & colors
const TARGETS = [
  {
    id: '392',
    name: 'TOKYO / JAPAN',
    subtext: 'EAST ASIA • PACIFIC',
    coords: [139.6917, 35.6895],
    color: '#EC4899', // Pink / Magenta
    glow: '#F472B6',
    trigger: 0.15
  },
  {
    id: '356',
    name: 'INDIA',
    subtext: 'NEW DELHI • SOUTH ASIA',
    coords: [78.9629, 20.5937],
    color: '#F59E0B', // Saffron Gold
    glow: '#FBBF24',
    trigger: 0.42
  },
  {
    id: '368',
    name: 'IRAQ',
    subtext: 'BAGHDAD • MIDDLE EAST',
    coords: [43.6793, 33.2232],
    color: '#3B82F6', // Cobalt Blue
    glow: '#60A5FA',
    trigger: 0.65
  },
  {
    id: '682',
    name: 'SAUDI ARABIA',
    subtext: 'RIYADH • ARABIAN PENINSULA',
    coords: [45.0792, 23.8859],
    color: '#10B981', // Emerald Green
    glow: '#34D399',
    trigger: 0.80
  }
];

const targetMap = new Map();
TARGETS.forEach(t => {
  const feat = countries.features.find(f => f.id === t.id);
  if (feat) targetMap.set(t.id, feat);
});

// Other countries
const otherCountries = {
  type: 'FeatureCollection',
  features: countries.features.filter(f => !TARGETS.some(t => t.id === f.id))
};

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');

// 3D Orthographic Globe Projection
const projection = d3.geoOrthographic().clipAngle(90);
const geoPath = d3.geoPath().projection(projection).context(ctx);

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Function to draw floating card on the sphere
function drawGlobeCard(ctx, x, y, title, subtext, color, progress, pulse) {
  if (progress <= 0) return;
  const p = Math.min(1.0, progress);

  ctx.save();
  ctx.translate(x, y);

  const scale = p < 0.8 ? p * 1.25 : 1.0 + (1.0 - p) * 0.4;
  ctx.scale(scale, scale);

  // Radar beacon
  ctx.beginPath();
  ctx.arc(0, 0, 11 * pulse, 0, 2 * Math.PI);
  ctx.fillStyle = color.replace('1)', '0.25)');
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.fill();

  // Stem
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(0, -28);
  ctx.stroke();

  // Card
  ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
  const tW = ctx.measureText(title).width;
  ctx.font = '12px "Segoe UI", Arial, sans-serif';
  const sW = ctx.measureText(subtext).width;
  const cardW = Math.max(tW, sW) + 36;
  const cardH = 50;
  const cardX = -cardW / 2;
  const cardY = -28 - cardH;

  ctx.fillStyle = 'rgba(6, 11, 22, 0.95)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 8);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(title, 0, cardY + 8);

  // Subtext
  ctx.fillStyle = color;
  ctx.font = '600 11px "Segoe UI", Arial, sans-serif';
  ctx.fillText(subtext, 0, cardY + 29);

  ctx.restore();
}

console.log('🚀 Fast Direct Pipe Encoding: 3D Rotating Globe 4-Countries...');
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
  console.log(`\n🎉 4-Countries 3D Globe Render Done in ${elapsed}s! Saved to: ${OUTPUT_FILE}`);
});

ffmpeg.stderr.on('data', () => {});

async function renderAll() {
  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    const linearProg = frame / (TOTAL_FRAMES - 1);
    const prog = easeInOutCubic(linearProg);

    // 1. Globe 3D Rotation Calculation
    // Starts centered near Japan/Tokyo (lng: 139°), smoothly spins west towards India (78°), then Middle East (Iraq & Saudi ~45°)
    const startRotLng = -140; // facing Tokyo
    const endRotLng = -50;    // facing Saudi Arabia & Iraq
    const startRotLat = -35;
    const endRotLat = -25;

    const curRotLng = startRotLng + (endRotLng - startRotLng) * prog;
    const curRotLat = startRotLat + (endRotLat - startRotLat) * prog;
    
    // Scale: starts wide to see Tokyo & Asia, gently zooms closer to Middle East
    const globeRadius = 520 + Math.sin(prog * Math.PI) * 120;

    projection
      .rotate([curRotLng, curRotLat, 0])
      .scale(globeRadius)
      .translate([WIDTH / 2, HEIGHT / 2]);

    // 2. Cosmic Space Void
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 3. Stars in Space
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    for (let s = 0; s < 50; s++) {
      const sx = (s * 137.5) % WIDTH;
      const sy = (s * 293.7) % HEIGHT;
      ctx.fillRect(sx, sy, 1.2, 1.2);
    }

    // 4. Globe Sphere Base (Deep Ocean)
    ctx.save();
    ctx.beginPath();
    geoPath({ type: 'Sphere' });
    ctx.fillStyle = '#0a1222';
    ctx.fill();

    // 5. Atmosphere Outer Rim Glow
    ctx.shadowColor = '#38BDF8';
    ctx.shadowBlur = 28;
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.restore();

    // 6. Coordinates Graticule
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
    ctx.lineWidth = 1;
    const graticule = d3.geoGraticule().step([15, 15]);
    ctx.beginPath();
    geoPath(graticule());
    ctx.stroke();
    ctx.restore();

    // 7. Base Dimmed Landmass
    ctx.save();
    ctx.fillStyle = '#182234';
    ctx.strokeStyle = '#2b3952';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    geoPath(otherCountries);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 8. Highlight Each of the 4 Target Countries
    TARGETS.forEach(t => {
      const feat = targetMap.get(t.id);
      if (!feat) return;

      const appear = Math.max(0, Math.min(1.0, (linearProg - t.trigger) / 0.15));
      if (appear <= 0) return;

      const easeAppear = easeInOutCubic(appear);
      const pulse = 1.0 + 0.15 * Math.sin(frame * 0.25 + t.trigger * 10);

      ctx.save();
      // Glowing border
      ctx.shadowColor = t.glow;
      ctx.shadowBlur = 24 * easeAppear * pulse;

      // Fill color
      const hex = t.color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.45 * easeAppear})`;

      ctx.beginPath();
      geoPath(feat);
      ctx.fill();

      // Border outline
      ctx.strokeStyle = t.color;
      ctx.lineWidth = 2.6 * pulse;
      ctx.stroke();

      // Inner white highlight rim
      ctx.shadowBlur = 4;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();
    });

    // 9. Floating Target HUDs on the Spherical Surface
    const pulse = 1.0 + 0.25 * Math.sin(frame * 0.25);
    TARGETS.forEach(t => {
      const appear = Math.max(0, Math.min(1.0, (linearProg - t.trigger) / 0.15));
      if (appear <= 0) return;

      // Project spherical coordinate onto screen (null if hidden on the back of sphere)
      const screenPos = projection(t.coords);
      if (screenPos) {
        // Distance check from center to ensure it's not right on the edge horizon
        const dx = screenPos[0] - WIDTH / 2;
        const dy = screenPos[1] - HEIGHT / 2;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);

        if (distFromCenter < globeRadius * 0.95) {
          drawGlobeCard(ctx, screenPos[0], screenPos[1], t.name, t.subtext, t.color, appear, pulse);
        }
      }
    });

    // 10. Outer Space Atmospheric Vignette
    const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, WIDTH * 0.35, WIDTH / 2, HEIGHT / 2, WIDTH * 0.78);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
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