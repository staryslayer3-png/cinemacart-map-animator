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
const FRAMES_DIR = path.join(__dirname, 'frames_multistop');

// 3 Connected Locations
const STOPS = [
  { name: 'ISLAMABAD', coords: [73.0479, 33.6844], time: '10:00 AM', color: '#10B981', trigger: 0.1 },
  { name: 'DUBAI', coords: [55.2708, 25.2048], time: '01:30 PM', color: '#F59E0B', trigger: 0.5 },
  { name: 'ISTANBUL', coords: [28.9784, 41.0082], time: '05:45 PM', color: '#3B82F6', trigger: 0.85 }
];

const countries = topojson.feature(world, world.objects.countries);
const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');
const projection = d3.geoMercator();
const geoPath = d3.geoPath().projection(projection).context(ctx);

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const leg1 = d3.geoInterpolate(STOPS[0].coords, STOPS[1].coords);
const leg2 = d3.geoInterpolate(STOPS[1].coords, STOPS[2].coords);

// Modern Glassmorphism Card Pin Template (with timestamp & flag/badge)
function drawModernCardPin(ctx, x, y, label, subtext, color, appearProgress, pulse) {
  if (appearProgress <= 0) return;
  const p = Math.min(1.0, appearProgress);
  
  ctx.save();
  ctx.translate(x, y);
  
  // Spring pop-up scaling
  const scale = p < 0.8 ? p * 1.25 : 1.0 + (1.0 - p) * 0.5;
  ctx.scale(scale, scale);

  // Radar wave pulsing rings
  ctx.beginPath();
  ctx.arc(0, 0, 16 * pulse, 0, 2 * Math.PI);
  ctx.fillStyle = color.replace('1)', '0.2)');
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 15;
  ctx.fill();

  // Floating stem line
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(0, -32);
  ctx.stroke();

  // Multi-line Glassmorphism Card
  ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
  const titleWidth = ctx.measureText(label).width;
  ctx.font = '13px "Segoe UI", Arial, sans-serif';
  const subWidth = ctx.measureText(subtext).width;
  const cardW = Math.max(titleWidth, subWidth) + 36;
  const cardH = 54;
  const cardX = -cardW / 2;
  const cardY = -32 - cardH;

  // Background blur card
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 8);
  ctx.fill();

  // Card glowing border
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Title Text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(label, 0, cardY + 9);

  // Subtext / Tag
  ctx.fillStyle = color;
  ctx.font = '600 12px "Segoe UI", Arial, sans-serif';
  ctx.fillText(subtext, 0, cardY + 31);

  ctx.restore();
}

console.log('Rendering 180 frames of Multi-Stop Pin Template...');

for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
  const linearProg = frame / (TOTAL_FRAMES - 1);
  const prog = easeInOutCubic(linearProg);

  // Dynamic Camera Center spanning the 3 regions (Central Asia / Middle East / Turkey)
  let camLng, camLat;
  if (linearProg < 0.5) {
    const subProg = easeInOutCubic(linearProg / 0.5);
    camLng = STOPS[0].coords[0] + (STOPS[1].coords[0] - STOPS[0].coords[0]) * subProg;
    camLat = STOPS[0].coords[1] + (STOPS[1].coords[1] - STOPS[0].coords[1]) * subProg;
  } else {
    const subProg = easeInOutCubic((linearProg - 0.5) / 0.5);
    camLng = STOPS[1].coords[0] + (STOPS[2].coords[0] - STOPS[1].coords[0]) * subProg;
    camLat = STOPS[1].coords[1] + (STOPS[2].coords[1] - STOPS[1].coords[1]) * subProg;
  }

  // Wide cinematic zoom
  const scale = 1450 + Math.sin(prog * Math.PI) * 200;

  projection
    .center([camLng, camLat])
    .scale(scale)
    .translate([WIDTH / 2, HEIGHT / 2]);

  // Deep Navy background
  ctx.fillStyle = '#060a12';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Geographic coordinates grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.lineWidth = 1;
  const graticule = d3.geoGraticule().step([10, 10]);
  ctx.beginPath();
  geoPath(graticule());
  ctx.stroke();

  // Dark slate landmass
  ctx.fillStyle = '#182234';
  ctx.strokeStyle = '#2b3952';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  geoPath(countries);
  ctx.fill();
  ctx.stroke();

  // Draw Route 1: Islamabad -> Dubai
  const r1Prog = Math.min(1.0, linearProg / 0.5);
  if (r1Prog > 0) {
    ctx.save();
    ctx.beginPath();
    const steps = 40;
    const active = Math.floor(steps * r1Prog);
    for (let s = 0; s <= active; s++) {
      const pt = projection(leg1(s / steps));
      if (s === 0) ctx.moveTo(pt[0], pt[1]);
      else ctx.lineTo(pt[0], pt[1]);
    }
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#10B981';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.restore();
  }

  // Draw Route 2: Dubai -> Istanbul
  if (linearProg > 0.5) {
    const r2Prog = Math.min(1.0, (linearProg - 0.5) / 0.5);
    ctx.save();
    ctx.beginPath();
    const steps = 40;
    const active = Math.floor(steps * r2Prog);
    for (let s = 0; s <= active; s++) {
      const pt = projection(leg2(s / steps));
      if (s === 0) ctx.moveTo(pt[0], pt[1]);
      else ctx.lineTo(pt[0], pt[1]);
    }
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#3B82F6';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.restore();
  }

  // Draw Modern Card Pins
  const pulse = 1.0 + 0.3 * Math.sin(frame * 0.25);
  
  // Pin 1 (Islamabad)
  const isbPos = projection(STOPS[0].coords);
  const p1Appear = (linearProg - STOPS[0].trigger) / 0.15;
  drawModernCardPin(ctx, isbPos[0], isbPos[1], 'ISLAMABAD', 'STOP 01 • DEPARTURE', 'rgba(16, 185, 129, 1)', p1Appear, pulse);

  // Pin 2 (Dubai)
  const dxbPos = projection(STOPS[1].coords);
  const p2Appear = (linearProg - STOPS[1].trigger) / 0.15;
  drawModernCardPin(ctx, dxbPos[0], dxbPos[1], 'DUBAI', 'STOP 02 • TRANSIT', 'rgba(245, 158, 11, 1)', p2Appear, pulse);

  // Pin 3 (Istanbul)
  const istPos = projection(STOPS[2].coords);
  const p3Appear = (linearProg - STOPS[2].trigger) / 0.15;
  drawModernCardPin(ctx, istPos[0], istPos[1], 'ISTANBUL', 'STOP 03 • DESTINATION', 'rgba(59, 130, 246, 1)', p3Appear, pulse);

  // Vignette
  const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, WIDTH * 0.35, WIDTH / 2, HEIGHT / 2, WIDTH * 0.75);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Save frame
  const fname = path.join(FRAMES_DIR, `f_${String(frame).padStart(5, '0')}.png`);
  fs.writeFileSync(fname, canvas.toBuffer('image/png'));
}

console.log('All 180 frames saved!');