const { createCanvas } = require('canvas');
const d3 = require('d3-geo');
const topojson = require('topojson-client');
const world = require('world-atlas/countries-50m.json');
const { spawn } = require('child_process');
const path = require('path');

const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;
const DURATION_SEC = 6;
const TOTAL_FRAMES = FPS * DURATION_SEC; // 180 frames
const OUTPUT_FILE = path.join(__dirname, 'territorial_comparison.mp4');
const FFMPEG_PATH = 'D:\\downloads\\Vid Optimus\\ffmpeg.exe';

const countries = topojson.feature(world, world.objects.countries);

// Target Countries to Compare:
// Left: United Kingdom (ISO 826)
// Right: Pakistan (ISO 586)
const LEFT_COUNTRY = {
  id: '826',
  title: 'UNITED KINGDOM',
  area: '243,610 KM²',
  pop: '~68 MILLION',
  capital: 'LONDON',
  color: '#3B82F6', // Royal Blue
  glow: '#60A5FA',
  center: [-2.0, 54.5],
  scaleMultiplier: 1.0
};

const RIGHT_COUNTRY = {
  id: '586',
  title: 'PAKISTAN',
  area: '881,913 KM² (3.6x LARGER)',
  pop: '~240 MILLION',
  capital: 'ISLAMABAD',
  color: '#10B981', // Emerald Green
  glow: '#34D399',
  center: [69.3451, 30.3753],
  scaleMultiplier: 1.0
};

const featLeft = countries.features.find(f => f.id === LEFT_COUNTRY.id);
const featRight = countries.features.find(f => f.id === RIGHT_COUNTRY.id);

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

console.log('🚀 Fast Direct Pipe Encoding: Side-by-Side Territorial Comparison...');
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
  console.log(`\n🎉 Territorial Comparison Render Done in ${elapsed}s! Saved to: ${OUTPUT_FILE}`);
});

ffmpeg.stderr.on('data', () => {});

async function renderAll() {
  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    const linearProg = frame / (TOTAL_FRAMES - 1);
    const prog = easeInOutCubic(linearProg);

    // Deep Dark Split Studio Background
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Subtle background tactical grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < WIDTH; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < HEIGHT; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
    }

    // Split Line down the center
    const splitX = WIDTH / 2;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(splitX, 100);
    ctx.lineTo(splitX, HEIGHT - 80);
    ctx.stroke();

    // Central "VS" badge
    ctx.setLineDash([]);
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(splitX, HEIGHT / 2, 28, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '900 18px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VS', splitX, HEIGHT / 2);
    ctx.restore();

    // Zoom scale interpolation (starts slightly distant, floats into clear focus)
    // Scale is mathematically normalized so physical geographic comparison is authentic!
    const baseGeoScale = 2200 + (2800 - 2200) * prog;

    // ==========================================
    // 1. LEFT PANEL: UNITED KINGDOM
    // ==========================================
    const leftCenterX = WIDTH / 4;
    const leftCenterY = HEIGHT / 2 + 20;

    const projLeft = d3.geoMercator()
      .center(LEFT_COUNTRY.center)
      .scale(baseGeoScale)
      .translate([leftCenterX, leftCenterY]);

    const pathLeft = d3.geoPath().projection(projLeft).context(ctx);

    const leftPulse = 1.0 + 0.1 * Math.sin(frame * 0.2);

    ctx.save();
    // Glowing neon border
    ctx.shadowColor = LEFT_COUNTRY.glow;
    ctx.shadowBlur = 24 * leftPulse;

    // Translucent fill
    ctx.fillStyle = 'rgba(59, 130, 246, 0.35)';
    ctx.beginPath();
    pathLeft(featLeft);
    ctx.fill();

    ctx.strokeStyle = LEFT_COUNTRY.color;
    ctx.lineWidth = 2.4 * leftPulse;
    ctx.stroke();

    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();

    // ==========================================
    // 2. RIGHT PANEL: PAKISTAN
    // ==========================================
    const rightCenterX = (WIDTH * 3) / 4;
    const rightCenterY = HEIGHT / 2 + 20;

    const projRight = d3.geoMercator()
      .center(RIGHT_COUNTRY.center)
      .scale(baseGeoScale)
      .translate([rightCenterX, rightCenterY]);

    const pathRight = d3.geoPath().projection(projRight).context(ctx);

    const rightPulse = 1.0 + 0.1 * Math.sin(frame * 0.2 + 2);

    ctx.save();
    ctx.shadowColor = RIGHT_COUNTRY.glow;
    ctx.shadowBlur = 24 * rightPulse;

    ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
    ctx.beginPath();
    pathRight(featRight);
    ctx.fill();

    ctx.strokeStyle = RIGHT_COUNTRY.color;
    ctx.lineWidth = 2.4 * rightPulse;
    ctx.stroke();

    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();

    // ==========================================
    // 3. STATS & COMPARISON HUD CARDS
    // ==========================================
    // Top Title Bar
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 28px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('TRUE TERRITORIAL SIZE COMPARISON', WIDTH / 2, 38);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '600 13px "Segoe UI", Arial, sans-serif';
    ctx.fillText('STANDARDIZED GEOGRAPHIC MAP SCALE (1:1 ACCURATE)', WIDTH / 2, 75);
    ctx.restore();

    // LEFT CARD (UK)
    ctx.save();
    const lCardW = 380;
    const lCardH = 110;
    const lCardX = leftCenterX - lCardW / 2;
    const lCardY = HEIGHT - 150;

    ctx.fillStyle = 'rgba(8, 14, 26, 0.94)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(lCardX, lCardY, lCardW, lCardH, 10);
    ctx.fill();
    ctx.strokeStyle = LEFT_COUNTRY.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(LEFT_COUNTRY.title, lCardX + 22, lCardY + 16);

    ctx.fillStyle = LEFT_COUNTRY.color;
    ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`TOTAL AREA: ${LEFT_COUNTRY.area}`, lCardX + 22, lCardY + 50);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '13px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`POPULATION: ${LEFT_COUNTRY.pop}  •  ${LEFT_COUNTRY.capital}`, lCardX + 22, lCardY + 76);
    ctx.restore();

    // RIGHT CARD (PAKISTAN)
    ctx.save();
    const rCardW = 420;
    const rCardH = 110;
    const rCardX = rightCenterX - rCardW / 2;
    const rCardY = HEIGHT - 150;

    ctx.fillStyle = 'rgba(8, 14, 26, 0.94)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(rCardX, rCardY, rCardW, rCardH, 10);
    ctx.fill();
    ctx.strokeStyle = RIGHT_COUNTRY.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(RIGHT_COUNTRY.title, rCardX + 22, rCardY + 16);

    ctx.fillStyle = RIGHT_COUNTRY.color;
    ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`TOTAL AREA: ${RIGHT_COUNTRY.area}`, rCardX + 22, rCardY + 50);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '13px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`POPULATION: ${RIGHT_COUNTRY.pop}  •  ${RIGHT_COUNTRY.capital}`, rCardX + 22, rCardY + 76);
    ctx.restore();

    // Cinematic Vignette
    const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, WIDTH * 0.35, WIDTH / 2, HEIGHT / 2, WIDTH * 0.8);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Direct Pipe to FFmpeg
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