const { createCanvas, registerFont } = require('canvas');
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

const countries = topojson.feature(world, world.objects.countries);

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Intelligent Best-Fit On-Territory Typography Renderer
 * - Dynamically calculates proportional font size based on bounding box
 * - Letter tracking for high-end documentary look
 * - Multi-layer contrast outline & shadow so it never blends into landmass
 * - Auto safe padding to prevent border collisions or overflow
 */
function drawTerritoryLabel(ctx, geoPath, feature, labelText, options = {}) {
  const centroid = geoPath.centroid(feature);
  const bounds = geoPath.bounds(feature);
  const [ [x0, y0], [x1, y1] ] = bounds;
  const bboxW = x1 - x0;
  const bboxH = y1 - y0;

  let [cx, cy] = centroid;
  if (options.offsetY) cy += options.offsetY;
  if (options.offsetX) cx += options.offsetX;

  // Auto-fit font size calculation
  const targetTextWidth = bboxW * (options.widthRatio || 0.44);
  ctx.font = `bold 30px ${options.fontFamily || 'CinematicSans, "Segoe UI", sans-serif'}`;
  const baseWidth = ctx.measureText(labelText).width;
  
  let calculatedFontSize = Math.round(30 * (targetTextWidth / baseWidth));
  const minFont = options.minFontSize || 24;
  const maxFont = options.maxFontSize || 56;
  calculatedFontSize = Math.max(minFont, Math.min(maxFont, calculatedFontSize));

  // Cap height to max 28% of territory bounding height
  if (calculatedFontSize > bboxH * 0.28) {
    calculatedFontSize = Math.max(minFont, Math.floor(bboxH * 0.28));
  }

  ctx.save();
  ctx.translate(cx, cy);

  if (options.angle) {
    ctx.rotate(options.angle * Math.PI / 180);
  }
  if (options.scale !== undefined) {
    ctx.scale(options.scale, options.scale);
  }
  ctx.globalAlpha = options.opacity !== undefined ? options.opacity : 1.0;

  ctx.font = `bold ${calculatedFontSize}px ${options.fontFamily || 'CinematicSans, "Segoe UI", sans-serif'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const letters = labelText.toUpperCase().split('');
  const tracking = options.tracking || Math.round(calculatedFontSize * 0.14);
  
  let totalWidth = 0;
  const widths = letters.map(l => {
    const w = ctx.measureText(l).width;
    totalWidth += w;
    return w;
  });
  totalWidth += (letters.length - 1) * tracking;

  let startX = -totalWidth / 2;

  // 1. Deep ambient shadow for strong contrast
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = Math.round(calculatedFontSize * 0.38);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  // 2. Subtle dark edge stroke
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.lineWidth = Math.max(3.5, Math.round(calculatedFontSize * 0.12));
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  let curX = startX;
  for (let i = 0; i < letters.length; i++) {
    const charX = curX + widths[i] / 2;
    ctx.strokeText(letters[i], charX, 0);
    curX += widths[i] + tracking;
  }

  // 3. Crisp solid white fill
  ctx.shadowBlur = 0;
  ctx.fillStyle = options.color || '#FFFFFF';

  curX = startX;
  for (let i = 0; i < letters.length; i++) {
    const charX = curX + widths[i] / 2;
    ctx.fillText(letters[i], charX, 0);
    curX += widths[i] + tracking;
  }

  // 4. Optional Subtitle
  if (options.subtitle) {
    const subSize = Math.max(13, Math.round(calculatedFontSize * 0.32));
    ctx.font = `600 ${subSize}px "Segoe UI", Arial, sans-serif`;
    ctx.fillStyle = options.subtitleColor || 'rgba(255, 255, 255, 0.85)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 6;
    ctx.fillText(options.subtitle, 0, calculatedFontSize * 0.75);
  }

  ctx.restore();
}

/**
 * Render complete animation for a specified country
 */
async function renderCountryVideo(config) {
  const {
    countryId,
    countryName,
    subtitle,
    targetCoords,
    startCoords,
    theme, // 'documentary' (Warm red) or 'neon' (Emerald)
    outputFile,
    labelOptions = {}
  } = config;

  console.log(`\nRendering: ${countryName} (${theme} theme) ➔ ${outputFile}...`);

  const targetCountry = countries.features.find(f => f.id === countryId);
  const otherCountries = {
    type: 'FeatureCollection',
    features: countries.features.filter(f => f.id !== countryId)
  };

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  const projection = d3.geoMercator();
  const geoPath = d3.geoPath().projection(projection).context(ctx);

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
    outputFile
  ]);

  ffmpeg.stderr.on('data', () => {}); // silence ffmpeg logs

  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    const linearProgress = frame / (TOTAL_FRAMES - 1);
    const progress = easeInOutCubic(linearProgress);

    // Camera Pan & Zoom
    const curLng = startCoords[0] + (targetCoords[0] - startCoords[0]) * progress;
    const curLat = startCoords[1] + (targetCoords[1] - startCoords[1]) * progress;
    const startScale = config.startScale || 1200;
    const targetScale = config.targetScale || 3000;
    const scale = startScale + (targetScale - startScale) * progress;

    projection
      .center([curLng, curLat])
      .scale(scale)
      .translate([WIDTH / 2, HEIGHT / 2]);

    if (theme === 'documentary') {
      // Documentary Warm Palette (Johnny Harris / Vox Style)
      // 1. Warm cream ocean
      ctx.fillStyle = '#dfd3c3';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // 2. Surrounding countries
      ctx.fillStyle = '#eee4d7';
      ctx.strokeStyle = '#d5c4b1';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      geoPath(otherCountries);
      ctx.fill();
      ctx.stroke();

      // 3. Highlighted country
      const fillAlpha = Math.min(1.0, 0.4 + 0.6 * progress);
      ctx.fillStyle = `rgba(225, 29, 72, ${fillAlpha})`; // Crimson red
      ctx.beginPath();
      geoPath(targetCountry);
      ctx.fill();

      ctx.strokeStyle = '#be123c';
      ctx.lineWidth = 2.5;
      ctx.stroke();

    } else {
      // Dark Midnight Neon Palette
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Graticule
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      const graticule = d3.geoGraticule().step([10, 10]);
      ctx.beginPath();
      geoPath(graticule());
      ctx.stroke();

      // Background countries
      ctx.fillStyle = '#111827';
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      geoPath(otherCountries);
      ctx.fill();
      ctx.stroke();

      // Neon Highlight
      const glowPulse = 1.0 + 0.12 * Math.sin(frame * 0.2);
      ctx.save();
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 25 * glowPulse * progress;
      ctx.fillStyle = `rgba(16, 185, 129, ${Math.min(0.55, 0.2 + 0.35 * progress)})`;
      ctx.beginPath();
      geoPath(targetCountry);
      ctx.fill();

      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2.8 * glowPulse;
      ctx.stroke();
      ctx.restore();
    }

    // Territory Label entrance (Appears after 35% progress with smooth scale and opacity)
    if (linearProgress > 0.30) {
      const labelProg = Math.min(1.0, (linearProgress - 0.30) / 0.25);
      const labelEase = easeInOutCubic(labelProg);

      // Scale in: 1.15 down to 1.0
      const currentScale = 1.15 - 0.15 * labelEase;
      const currentOpacity = labelEase;

      drawTerritoryLabel(ctx, geoPath, targetCountry, countryName, {
        color: '#FFFFFF',
        fontFamily: 'CinematicSans, "Segoe UI", sans-serif',
        scale: currentScale,
        opacity: currentOpacity,
        subtitle: subtitle,
        ...labelOptions
      });
    }

    // Subtle Vignette
    const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, WIDTH * 0.3, WIDTH / 2, HEIGHT / 2, WIDTH * 0.75);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Stream frame to FFmpeg stdin
    const ok = ffmpeg.stdin.write(canvas.toBuffer('image/png'));
    if (!ok) {
      await new Promise(resolve => ffmpeg.stdin.once('drain', resolve));
    }
  }

  ffmpeg.stdin.end();

  await new Promise((resolve, reject) => {
    ffmpeg.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });
  });

  console.log(`✅ Successfully generated: ${outputFile}`);
}

async function main() {
  // 1. Render GERMANY in Documentary Warm Red style (Exact match to User Reference Image 2)
  await renderCountryVideo({
    countryId: '276',
    countryName: 'GERMANY',
    subtitle: 'CENTRAL EUROPE',
    targetCoords: [10.4515, 51.1657],
    startCoords: [8.0, 48.0],
    startScale: 1500,
    targetScale: 3200,
    theme: 'documentary',
    outputFile: path.join(__dirname, 'germany_territory_label.mp4'),
    labelOptions: {
      widthRatio: 0.45
    }
  });

  // 2. Render PAKISTAN in Tactical Neon Emerald style (With on-land typography)
  await renderCountryVideo({
    countryId: '586',
    countryName: 'PAKISTAN',
    subtitle: 'SOUTH ASIA',
    targetCoords: [69.3451, 30.3753],
    startCoords: [65.0, 26.0],
    startScale: 1200,
    targetScale: 2600,
    theme: 'neon',
    outputFile: path.join(__dirname, 'pakistan_territory_label.mp4'),
    labelOptions: {
      widthRatio: 0.40,
      offsetY: -10
    }
  });
}

main().catch(console.error);
