const { createCanvas } = require('canvas');
const d3 = require('d3-geo');
const topojson = require('topojson-client');
const world = require('world-atlas/countries-50m.json');

const WIDTH = 1920;
const HEIGHT = 1080;
const countries = topojson.feature(world, world.objects.countries);
const pak = countries.features.find(f => f.id === '586');

// 1. Mercator Projection Benchmark (Route / Highlight)
const canvas1 = createCanvas(WIDTH, HEIGHT);
const ctx1 = canvas1.getContext('2d');
const projMercator = d3.geoMercator().center([69.3451, 30.3753]).scale(2200).translate([WIDTH/2, HEIGHT/2]);
const path1 = d3.geoPath().projection(projMercator).context(ctx1);

function renderMercatorFrame() {
  ctx1.fillStyle = '#060a12';
  ctx1.fillRect(0, 0, WIDTH, HEIGHT);
  ctx1.fillStyle = '#182234';
  ctx1.beginPath();
  path1(countries);
  ctx1.fill();
  ctx1.fillStyle = 'rgba(16, 185, 129, 0.4)';
  ctx1.beginPath();
  path1(pak);
  ctx1.fill();
}

// Warmup
renderMercatorFrame();

// 1 Frame Benchmark
let t0 = process.hrtime.bigint();
renderMercatorFrame();
let t1 = process.hrtime.bigint();
const singleMercatorMs = Number(t1 - t0) / 1e6;

// 100 Frames Benchmark
t0 = process.hrtime.bigint();
for (let i = 0; i < 100; i++) {
  renderMercatorFrame();
}
t1 = process.hrtime.bigint();
const hundredMercatorMs = Number(t1 - t0) / 1e6;

// 2. 3D Orthographic Globe Benchmark
const canvas2 = createCanvas(WIDTH, HEIGHT);
const ctx2 = canvas2.getContext('2d');
const projGlobe = d3.geoOrthographic().clipAngle(90).rotate([-70, -30, 0]).scale(500).translate([WIDTH/2, HEIGHT/2]);
const path2 = d3.geoPath().projection(projGlobe).context(ctx2);

function renderGlobeFrame() {
  ctx2.fillStyle = '#030712';
  ctx2.fillRect(0, 0, WIDTH, HEIGHT);
  ctx2.fillStyle = '#1e293b';
  ctx2.beginPath();
  path2(countries);
  ctx2.fill();
}

renderGlobeFrame();

// 1 Globe Frame
t0 = process.hrtime.bigint();
renderGlobeFrame();
t1 = process.hrtime.bigint();
const singleGlobeMs = Number(t1 - t0) / 1e6;

// 100 Globe Frames
t0 = process.hrtime.bigint();
for (let i = 0; i < 100; i++) {
  renderGlobeFrame();
}
t1 = process.hrtime.bigint();
const hundredGlobeMs = Number(t1 - t0) / 1e6;

console.log('BENCHMARK_RESULTS:');
console.log(`Mercator (Route/Highlight): 1 Frame = ${singleMercatorMs.toFixed(2)} ms | 100 Frames = ${(hundredMercatorMs / 1000).toFixed(2)} s (Avg: ${(hundredMercatorMs/100).toFixed(2)} ms/frame)`);
console.log(`3D Globe (Orthographic): 1 Frame = ${singleGlobeMs.toFixed(2)} ms | 100 Frames = ${(hundredGlobeMs / 1000).toFixed(2)} s (Avg: ${(hundredGlobeMs/100).toFixed(2)} ms/frame)`);