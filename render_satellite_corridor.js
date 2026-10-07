const { createCanvas, loadImage, registerFont } = require('canvas');
const d3 = require('d3-geo');
const topojson = require('topojson-client');
const world = require('world-atlas/countries-50m.json');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

try {
  registerFont('C:\\Windows\\Fonts\\segoeuib.ttf', { family: 'CinematicSans', weight: 'bold' });
} catch (e) {}

const FFMPEG_PATH = 'D:\\downloads\\Vid Optimus\\ffmpeg.exe';
const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;
const DURATION_SEC = 5;
const TOTAL_FRAMES = FPS * DURATION_SEC; // 150 frames
const OUTPUT_FILE = path.join(__dirname, 'satellite_corridor_tour.mp4');

const countries = topojson.feature(world, world.objects.countries);

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp01(t) {
  return Math.max(0, Math.min(1, t));
}

async function renderVideo() {
  console.log('🚀 Loading NASA Blue Marble texture and initializing satellite animation engine...');
  const earthImg = await loadImage(path.join(__dirname, 'earth_terrain_5400.jpg'));

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  const projection = d3.geoEquirectangular();
  const geoPath = d3.geoPath().projection(projection).context(ctx);

  const turkey = countries.features.find(f => f.id === '792');
  const iran = countries.features.find(f => f.id === '364');
  const pakistan = countries.features.find(f => f.id === '586');
  const saudi = countries.features.find(f => f.id === '682');

  const targets = [
    { f: turkey, name: 'TURKEY', fill: 'rgba(99, 102, 241, 0.62)', border: '#c7d2fe', startFr: 0.15, hub: [35.2433, 38.9637], offset: [-15, -5], angle: 0 },
    { f: iran, name: 'IRAN', fill: 'rgba(236, 72, 153, 0.62)', border: '#fbcfe8', startFr: 0.35, hub: [53.6880, 32.4279], offset: [0, -5], angle: 0 },
    { f: pakistan, name: 'PAKISTAN', fill: 'rgba(234, 179, 8, 0.65)', border: '#fef08a', startFr: 0.52, hub: [69.3451, 30.3753], offset: [5, -5], angle: -12 },
    { f: saudi, name: 'SAUDI ARABIA', fill: 'rgba(34, 197, 94, 0.62)', border: '#bbf7d0', startFr: 0.68, hub: [45.0792, 23.8859], offset: [0, 25], angle: 0, darkOutline: true }
  ];

  const ffmpeg = spawn(FFMPEG_PATH, [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'png',
    '-r', String(FPS),
    '-i', '-',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', '19',
    '-preset', 'veryfast',
    OUTPUT_FILE
  ]);

  ffmpeg.stderr.on('data', () => {});

  console.log(`Rendering ${TOTAL_FRAMES} frames of Real Satellite Terrain Corridor animation...`);

  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    const linearProgress = frame / (TOTAL_FRAMES - 1);
    const cameraEase = easeInOutCubic(linearProgress);

    // Subtle dynamic camera drift across Middle East / South Asia
    const curLng = 42.0 + (49.0 - 42.0) * cameraEase;
    const curLat = 29.0 + (26.5 - 29.0) * cameraEase;
    const curScale = 1600 + (1780 - 1600) * cameraEase;

    projection
      .center([curLng, curLat])
      .scale(curScale)
      .translate([WIDTH / 2, HEIGHT / 2]);

    // 1. Draw Satellite Terrain
    const [minLng, maxLat] = projection.invert([0, 0]);
    const [maxLng, minLat] = projection.invert([WIDTH, HEIGHT]);
    const sx = ((minLng + 180) / 360) * earthImg.width;
    const sy = ((90 - maxLat) / 180) * earthImg.height;
    const sw = ((maxLng - minLng) / 360) * earthImg.width;
    const sh = ((maxLat - minLat) / 180) * earthImg.height;

    ctx.drawImage(earthImg, sx, sy, sw, sh, 0, 0, WIDTH, HEIGHT);

    // 2. Render Activated Countries with dynamic entrance animation
    for (const t of targets) {
      if (linearProgress < t.startFr) continue;

      const countryProg = clamp01((linearProgress - t.startFr) / 0.18);
      const countryEase = easeInOutCubic(countryProg);

      // Glow & border
      ctx.save();
      ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
      ctx.shadowBlur = 14 * countryEase;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.8 * countryEase;
      ctx.beginPath();
      geoPath(t.f);
      ctx.stroke();
      ctx.restore();

      // Semi-transparent color tint revealing terrain texture
      ctx.save();
      ctx.globalAlpha = countryEase;
      ctx.fillStyle = t.fill;
      ctx.beginPath();
      geoPath(t.f);
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.0;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Animated Trade Laser Rays
    const hubPoints = targets.map(t => projection(t.hub));
    const rayConnections = [
      { from: 0, to: 1, trigger: 0.38 }, // Turkey -> Iran
      { from: 1, to: 2, trigger: 0.55 }, // Iran -> Pakistan
      { from: 2, to: 3, trigger: 0.72 }, // Pakistan -> Saudi
      { from: 3, to: 0, trigger: 0.80 }, // Saudi -> Turkey
      { from: 0, to: 2, trigger: 0.85 }  // Turkey -> Pakistan
    ];

    ctx.save();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#10B981';
    ctx.shadowBlur = 14;

    for (const ray of rayConnections) {
      if (linearProgress < ray.trigger) continue;
      const rayProg = clamp01((linearProgress - ray.trigger) / 0.12);
      const rayEase = easeInOutCubic(rayProg);

      const p1 = hubPoints[ray.from];
      const p2 = hubPoints[ray.to];
      const curX = p1[0] + (p2[0] - p1[0]) * rayEase;
      const curY = p1[1] + (p2[1] - p1[1]) * rayEase;

      ctx.beginPath();
      ctx.moveTo(p1[0], p1[1]);
      ctx.lineTo(curX, curY);
      ctx.stroke();
    }
    ctx.restore();

    // Hub Nodes
    for (let i = 0; i < targets.length; i++) {
      if (linearProgress < targets[i].startFr) continue;
      const pt = hubPoints[i];
      const pulse = 1.0 + 0.15 * Math.sin(frame * 0.25 + i);

      ctx.save();
      ctx.beginPath();
      ctx.arc(pt[0], pt[1], 7 * pulse, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 16;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pt[0], pt[1], 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#10B981';
      ctx.fill();
      ctx.restore();
    }

    // 4. In-Map Typography with Scale-In & Fade
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      if (linearProgress < t.startFr + 0.05) continue;

      const textProg = clamp01((linearProgress - (t.startFr + 0.05)) / 0.14);
      const textEase = easeInOutCubic(textProg);
      const scaleVal = 1.15 - 0.15 * textEase;

      const pt = hubPoints[i];
      const tx = pt[0] + t.offset[0];
      const ty = pt[1] + t.offset[1];

      ctx.save();
      ctx.translate(tx, ty);
      ctx.scale(scaleVal, scaleVal);
      ctx.globalAlpha = textEase;

      if (t.angle) ctx.rotate(t.angle * Math.PI / 180);

      const fontSize = (t.name === 'SAUDI ARABIA') ? 34 : (t.name === 'PAKISTAN' ? 32 : 36);
      ctx.font = `bold ${fontSize}px CinematicSans, "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const tracking = Math.round(fontSize * 0.12);
      const chars = t.name.split('');
      let totalW = 0;
      const charWidths = chars.map(c => {
        const w = ctx.measureText(c).width;
        totalW += w;
        return w;
      });
      totalW += (chars.length - 1) * tracking;
      let startX = -totalW / 2;

      // Dark shadow & outline
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = t.darkOutline ? 16 : Math.round(fontSize * 0.35);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      ctx.strokeStyle = t.darkOutline ? '#000000' : 'rgba(0, 0, 0, 0.85)';
      ctx.lineWidth = t.darkOutline ? 5.5 : Math.max(3.5, Math.round(fontSize * 0.12));
      ctx.lineJoin = 'round';

      let curX = startX;
      for (let ci = 0; ci < chars.length; ci++) {
        const cxPos = curX + charWidths[ci] / 2;
        ctx.strokeText(chars[ci], cxPos, 0);
        curX += charWidths[ci] + tracking;
      }

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFFFFF';
      curX = startX;
      for (let ci = 0; ci < chars.length; ci++) {
        const cxPos = curX + charWidths[ci] / 2;
        ctx.fillText(chars[ci], cxPos, 0);
        curX += charWidths[ci] + tracking;
      }

      ctx.restore();
    }

    // 5. Cinematic Vignette
    const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, WIDTH * 0.35, WIDTH / 2, HEIGHT / 2, WIDTH * 0.75);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // RAM pipe stream to FFmpeg
    const ok = ffmpeg.stdin.write(canvas.toBuffer('image/png'));
    if (!ok) {
      await new Promise(resolve => ffmpeg.stdin.once('drain', resolve));
    }

    if (frame % 30 === 0) {
      process.stdout.write(`Rendered ${frame} / ${TOTAL_FRAMES} frames\r`);
    }
  }

  ffmpeg.stdin.end();

  await new Promise((resolve, reject) => {
    ffmpeg.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });
  });

  console.log(`\n🎉 Full HD Video successfully rendered and saved to: ${OUTPUT_FILE}`);
}

renderVideo().catch(console.error);
