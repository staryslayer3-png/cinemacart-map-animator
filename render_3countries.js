const { createCanvas } = require('canvas');
const d3 = require('d3-geo');
const topojson = require('topojson-client');
const world = require('world-atlas/countries-50m.json');
const path = require('path');
const fs = require('fs');

const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;
const DURATION_SEC = 6;
const TOTAL_FRAMES = FPS * DURATION_SEC; // 180 frames
const FRAMES_DIR = path.join(__dirname, 'frames_3countries');

const countries = topojson.feature(world, world.objects.countries);

// 3 Highlighted Targets with custom colors & metadata
const TARGETS = [
  {
    id: '826',
    name: 'UNITED KINGDOM',
    subtext: 'LONDON HQ • EUROPE',
    color: '#3B82F6', // Vibrant Royal Blue
    trigger: 0.15,
    pinCoords: [-0.1276, 51.5072] // London coords
  },
  {
    id: '586',
    name: 'PAKISTAN',
    subtext: 'ISLAMABAD • SOUTH ASIA',
    color: '#10B981', // Neon Emerald Green
    trigger: 0.45,
    pinCoords: [73.0479, 33.6844]
  },
  {
    id: '156',
    name: 'CHINA',
    subtext: 'BEIJING • EAST ASIA',
    color: '#EF4444', // Crimson Red
    trigger: 0.70,
    pinCoords: [116.4074, 39.9042]
  }
];

// Target country features
const targetMap = new Map();
TARGETS.forEach(t => {
  const feat = countries.features.find(f => f.id === t.id);
  if (feat) targetMap.set(t.id, feat);
});

// All other background countries
const otherCountries = {
  type: 'FeatureCollection',
  features: countries.features.filter(f => !TARGETS.some(t => t.id === f.id))
};

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');
const projection = d3.geoMercator();
const geoPath = d3.geoPath().projection(projection).context(ctx);

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Draw Floating Card with Stem & Beacon
function drawHighlightCard(ctx, x, y, title, subtext, color, progress, pulse) {
  if (progress <= 0) return;
  const p = Math.min(1.0, progress);
  
  ctx.save();
  ctx.translate(x, y);
  
  const scale = p < 0.8 ? p * 1.25 : 1.0 + (1.0 - p) * 0.4;
  ctx.scale(scale, scale);

  // Centroid radar beacon
  ctx.beginPath();
  ctx.arc(0, 0, 10 * pulse, 0, 2 * Math.PI);
  ctx.fillStyle = color.replace('1)', '0.25)');
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fill();

  // Stem line
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(0, -28);
  ctx.stroke();

  // Glass card
  ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
  const tW = ctx.measureText(title).width;
  ctx.font = '12px "Segoe UI", Arial, sans-serif';
  const sW = ctx.measureText(subtext).width;
  const cardW = Math.max(tW, sW) + 36;
  const cardH = 50;
  const cardX = -cardW / 2;
  const cardY = -28 - cardH;

  ctx.fillStyle = 'rgba(11, 15, 25, 0.94)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 20;
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

console.log('Rendering 180 frames for 3-Countries Highlight (UK, Pakistan, China)...');

for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
  const linearProg = frame / (TOTAL_FRAMES - 1);
  const prog = easeInOutCubic(linearProg);

  // Dynamic Camera Center (Spanning from UK across Eurasia to China)
  // [lng, lat] transitions: starts around 30°E, glides towards 65°E for panoramic Eurasia view
  const camLng = 35.0 + (62.0 - 35.0) * prog;
  const camLat = 42.0 + (36.0 - 42.0) * prog;
  
  // High-altitude wide Eurasia panorama view
  const scale = 520 + Math.sin(prog * Math.PI) * 70;

  projection
    .center([camLng, camLat])
    .scale(scale)
    .translate([WIDTH / 2, HEIGHT / 2]);

  // 1. Deep Midnight Ocean
  ctx.fillStyle = '#060a12';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // 2. Coordinates Graticule
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.lineWidth = 1;
  const graticule = d3.geoGraticule().step([15, 15]);
  ctx.beginPath();
  geoPath(graticule());
  ctx.stroke();

  // 3. Other Countries (Dimmed Background Landmass)
  ctx.fillStyle = '#121927';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  geoPath(otherCountries);
  ctx.fill();
  ctx.stroke();

  // 4. Render Highlight for Each Country (UK, Pakistan, China)
  TARGETS.forEach(t => {
    const feat = targetMap.get(t.id);
    if (!feat) return;

    // Trigger timing for each country highlight
    const appear = Math.max(0, Math.min(1.0, (linearProg - t.trigger) / 0.15));
    if (appear <= 0) return;

    const easeAppear = easeInOutCubic(appear);
    const pulse = 1.0 + 0.15 * Math.sin(frame * 0.2 + t.trigger * 10);

    ctx.save();
    // Neon glow layer
    ctx.shadowColor = t.color;
    ctx.shadowBlur = 25 * easeAppear * pulse;

    // Translucent country fill
    ctx.fillStyle = t.color.replace('#', 'rgba(') ; // fallback
    // Convert hex to rgba
    const hex = t.color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.35 * easeAppear})`;

    ctx.beginPath();
    geoPath(feat);
    ctx.fill();

    // Vibrant neon boundary
    ctx.strokeStyle = t.color;
    ctx.lineWidth = 2.4 * pulse;
    ctx.stroke();

    // Inner bright rim
    ctx.shadowBlur = 5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  });

  // 5. Connecting Strategic Trade / Belt Arc Lines (UK <-> Pakistan <-> China)
  // Subtle glowing connection rays between the 3 highlights
  if (linearProg > 0.4) {
    const rayProg = Math.min(1.0, (linearProg - 0.4) / 0.35);
    const easeRay = easeInOutCubic(rayProg);

    const ukPos = projection(TARGETS[0].pinCoords);
    const pakPos = projection(TARGETS[1].pinCoords);
    const chnPos = projection(TARGETS[2].pinCoords);

    // Ray 1: UK -> Pakistan
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(ukPos[0], ukPos[1]);
    const mid1X = ukPos[0] + (pakPos[0] - ukPos[0]) * easeRay;
    const mid1Y = ukPos[1] + (pakPos[1] - ukPos[1]) * easeRay;
    ctx.lineTo(mid1X, mid1Y);
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.restore();

    // Ray 2: Pakistan -> China
    if (linearProg > 0.65) {
      const ray2Prog = Math.min(1.0, (linearProg - 0.65) / 0.25);
      const easeRay2 = easeInOutCubic(ray2Prog);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pakPos[0], pakPos[1]);
      const mid2X = pakPos[0] + (chnPos[0] - pakPos[0]) * easeRay2;
      const mid2Y = pakPos[1] + (chnPos[1] - pakPos[1]) * easeRay2;
      ctx.lineTo(mid2X, mid2Y);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 6. Draw Highlight Stat Cards on Centroids
  const pulse = 1.0 + 0.25 * Math.sin(frame * 0.25);
  TARGETS.forEach(t => {
    const appear = Math.max(0, Math.min(1.0, (linearProg - t.trigger) / 0.15));
    if (appear <= 0) return;

    const pinPos = projection(t.pinCoords);
    drawHighlightCard(ctx, pinPos[0], pinPos[1], t.name, t.subtext, t.color, appear, pulse);
  });

  // 7. Cinematic Vignette
  const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, WIDTH * 0.35, WIDTH / 2, HEIGHT / 2, WIDTH * 0.8);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Save PNG frame
  const fname = path.join(FRAMES_DIR, `f_${String(frame).padStart(5, '0')}.png`);
  fs.writeFileSync(fname, canvas.toBuffer('image/png'));
}

console.log('All 180 frames saved for 3-Countries Highlight!');