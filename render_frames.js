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
const TOTAL_FRAMES = FPS * DURATION_SEC;
const FRAMES_DIR = path.join(__dirname, 'frames');

const ISLAMABAD = [73.0479, 33.6844];
const DUBAI = [55.2708, 25.2048];

const countries = topojson.feature(world, world.objects.countries);
const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');
const projection = d3.geoMercator();
const geoPath = d3.geoPath().projection(projection).context(ctx);

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const interpolateGeo = d3.geoInterpolate(ISLAMABAD, DUBAI);

function drawAirplane(ctx, x, y, angleRad) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angleRad + Math.PI / 2);

  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 14;

  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.lineTo(5, -7);
  ctx.lineTo(22, 5);
  ctx.lineTo(22, 10);
  ctx.lineTo(5, 4);
  ctx.lineTo(4, 17);
  ctx.lineTo(10, 22);
  ctx.lineTo(10, 24);
  ctx.lineTo(0, 22);
  ctx.lineTo(-10, 24);
  ctx.lineTo(-10, 22);
  ctx.lineTo(-4, 17);
  ctx.lineTo(-5, 4);
  ctx.lineTo(-22, 10);
  ctx.lineTo(-22, 5);
  ctx.lineTo(-5, -7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPin(ctx, x, y, label, color, pulseScale = 1.0) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 12 * pulseScale, 0, 2 * Math.PI);
  ctx.fillStyle = color.replace('1)', '0.25)');
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, 6, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fill();

  ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
  const textWidth = ctx.measureText(label).width;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.roundRect(x - textWidth / 2 - 14, y - 48, textWidth + 28, 34, 8);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y - 31);
  ctx.restore();
}

console.log('Rendering 150 frames to disk...');

for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
  const linearProgress = frame / (TOTAL_FRAMES - 1);
  const progress = easeInOutCubic(linearProgress);

  const camLng = ISLAMABAD[0] + (DUBAI[0] - ISLAMABAD[0]) * progress;
  const camLat = ISLAMABAD[1] + (DUBAI[1] - ISLAMABAD[1]) * progress;
  
  const zoomArc = Math.sin(progress * Math.PI) * 450;
  const scale = 2300 - zoomArc;

  projection
    .center([camLng, camLat])
    .scale(scale)
    .translate([WIDTH / 2, HEIGHT / 2]);

  // Ocean
  ctx.fillStyle = '#0a0e17';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  const graticule = d3.geoGraticule().step([10, 10]);
  ctx.beginPath();
  geoPath(graticule());
  ctx.stroke();

  // Countries Landmass
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  geoPath(countries);
  ctx.fill();
  ctx.stroke();

  const isbPos = projection(ISLAMABAD);
  const dxbPos = projection(DUBAI);
  const currentCoord = interpolateGeo(progress);
  const currentPos = projection(currentCoord);

  // Faded Route Guide
  ctx.save();
  ctx.beginPath();
  const subSegments = 60;
  for (let s = 0; s <= subSegments; s++) {
    const pt = projection(interpolateGeo(s / subSegments));
    if (s === 0) ctx.moveTo(pt[0], pt[1]);
    else ctx.lineTo(pt[0], pt[1]);
  }
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 8]);
  ctx.stroke();
  ctx.restore();

  // Active Flight Route
  ctx.save();
  ctx.beginPath();
  const activeSegments = Math.max(1, Math.floor(subSegments * progress));
  for (let s = 0; s <= activeSegments; s++) {
    const pt = projection(interpolateGeo(s / subSegments));
    if (s === 0) ctx.moveTo(pt[0], pt[1]);
    else ctx.lineTo(pt[0], pt[1]);
  }
  ctx.lineTo(currentPos[0], currentPos[1]);
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#F59E0B';
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.restore();

  // Heading calculation
  const nextCoord = interpolateGeo(Math.min(1.0, progress + 0.01));
  const nextPos = projection(nextCoord);
  const headingAngle = Math.atan2(nextPos[1] - currentPos[1], nextPos[0] - currentPos[0]);

  // Airplane
  drawAirplane(ctx, currentPos[0], currentPos[1], headingAngle);

  // Pins
  const pulse = 1.0 + 0.25 * Math.sin(frame * 0.2);
  drawPin(ctx, isbPos[0], isbPos[1], 'ISLAMABAD', 'rgba(16, 185, 129, 1)', pulse);
  drawPin(ctx, dxbPos[0], dxbPos[1], 'DUBAI', 'rgba(245, 158, 11, 1)', pulse);

  // Cinematic Vignette
  const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, WIDTH * 0.35, WIDTH / 2, HEIGHT / 2, WIDTH * 0.75);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Save PNG frame
  const frameFileName = path.join(FRAMES_DIR, `f_${String(frame).padStart(5, '0')}.png`);
  fs.writeFileSync(frameFileName, canvas.toBuffer('image/png'));
}

console.log('All 150 frames saved successfully!');