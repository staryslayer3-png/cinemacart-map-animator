const { createCanvas } = require('canvas');
const d3 = require('d3-geo');
const topojson = require('topojson-client');
const world = require('world-atlas/countries-50m.json');
const path = require('path');
const fs = require('fs');

const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;
const DURATION_SEC = 5;
const TOTAL_FRAMES = FPS * DURATION_SEC; // 150 frames
const FRAMES_DIR = path.join(__dirname, 'frames_highlight');

const countries = topojson.feature(world, world.objects.countries);

// Target country: Pakistan (ISO 586)
const targetCountry = countries.features.find(f => f.id === '586');
// Filter other countries
const otherCountries = {
  type: 'FeatureCollection',
  features: countries.features.filter(f => f.id !== '586')
};

// Target center: roughly [69.3451, 30.3753]
const CENTER_TARGET = [69.3451, 30.3753];
const START_CENTER = [65.0, 25.0];

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');
const projection = d3.geoMercator();
const geoPath = d3.geoPath().projection(projection).context(ctx);

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

console.log('Rendering 150 frames for Territory Highlight Template...');

for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
  const linearProgress = frame / (TOTAL_FRAMES - 1);
  const progress = easeInOutCubic(linearProgress);

  // Dynamic Camera Zoom & Pan into Pakistan
  const curLng = START_CENTER[0] + (CENTER_TARGET[0] - START_CENTER[0]) * progress;
  const curLat = START_CENTER[1] + (CENTER_TARGET[1] - START_CENTER[1]) * progress;
  const scale = 1100 + (2400 - 1100) * progress; // Smooth zoom into Pakistan

  projection
    .center([curLng, curLat])
    .scale(scale)
    .translate([WIDTH / 2, HEIGHT / 2]);

  // 1. Deep Midnight Ocean
  ctx.fillStyle = '#070b14';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // 2. Subtle Coordinate Grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.lineWidth = 1;
  const graticule = d3.geoGraticule().step([10, 10]);
  ctx.beginPath();
  geoPath(graticule());
  ctx.stroke();

  // 3. Other Countries (Dimmed out background context)
  ctx.fillStyle = '#131b2a'; // Dimmed charcoal land
  ctx.strokeStyle = '#1e293b'; // Faint border lines
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  geoPath(otherCountries);
  ctx.fill();
  ctx.stroke();

  // 4. Territory Highlight Animation (Emerald Glow & Neon Outline)
  // Glow pulses slightly once zoomed in
  const glowPulse = 1.0 + 0.15 * Math.sin(frame * 0.2);
  const fillAlpha = Math.min(0.45, 0.15 + 0.3 * progress);

  ctx.save();
  // Outer multi-layer neon glow
  ctx.shadowColor = '#10B981';
  ctx.shadowBlur = 24 * glowPulse * progress;

  // Fill highlight with emerald gradient
  ctx.fillStyle = `rgba(16, 185, 129, ${fillAlpha})`;
  ctx.beginPath();
  geoPath(targetCountry);
  ctx.fill();

  // Draw vibrant glowing neon border
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 2.8 * glowPulse;
  ctx.stroke();

  // Secondary bright inner line
  ctx.shadowBlur = 6;
  ctx.strokeStyle = '#6EE7B7';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();

  // 5. Floating Country Label & Info Card
  // Appears after 35% progress
  if (linearProgress > 0.35) {
    const cardProgress = Math.min(1.0, (linearProgress - 0.35) / 0.25);
    const cardEase = easeInOutCubic(cardProgress);

    const centroid = geoPath.centroid(targetCountry);
    const cx = centroid[0];
    const cy = centroid[1] - 40; // slightly above centroid

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(cardEase, cardEase);

    // Glowing beacon on centroid
    ctx.beginPath();
    ctx.arc(0, 40, 8 * glowPulse, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 40, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#10B981';
    ctx.fill();

    // Stem line connecting beacon to card
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 36);
    ctx.lineTo(0, 0);
    ctx.stroke();

    // High-tech Country Info Card
    const cardW = 280;
    const cardH = 84;
    const cardX = -cardW / 2;
    const cardY = -cardH;

    // Card background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 10);
    ctx.fill();

    // Card border
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Country Name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('PAKISTAN', 0, cardY + 14);

    // Subtitle / Territory stats badge
    ctx.fillStyle = '#10B981';
    ctx.font = '600 13px "Segoe UI", Arial, sans-serif';
    ctx.fillText('AREA: 881,913 KM²  •  POP: ~240M', 0, cardY + 48);

    ctx.restore();
  }

  // 6. Cinematic Vignette
  const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, WIDTH * 0.3, WIDTH / 2, HEIGHT / 2, WIDTH * 0.75);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Save frame
  const fname = path.join(FRAMES_DIR, `f_${String(frame).padStart(5, '0')}.png`);
  fs.writeFileSync(fname, canvas.toBuffer('image/png'));
}

console.log('Territory highlight frames rendered successfully!');