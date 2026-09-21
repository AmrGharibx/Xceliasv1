const STAR_COUNT = 1400;
const FAR_COUNT = 980;
const MID_COUNT = 300;
const NEAR_COUNT = STAR_COUNT - FAR_COUNT - MID_COUNT;

const canvas = document.createElement('canvas');
canvas.className = 'starfield';
canvas.setAttribute('aria-hidden', 'true');
document.body.prepend(canvas);

const context = canvas.getContext('2d', { alpha: true });
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let width = 0;
let height = 0;
let depth = 0;
let frame = 0;
let lastTime = performance.now();
let stars = [];
let pointerX = 0;
let pointerY = 0;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function createStar(layer, index) {
  const layerDepth = layer === 'far' ? randomBetween(0.12, 0.34) : layer === 'mid' ? randomBetween(0.36, 0.68) : randomBetween(0.7, 1);
  return {
    layer,
    x: randomBetween(-width, width),
    y: randomBetween(-height, height),
    z: layerDepth,
    size: layer === 'far' ? randomBetween(0.35, 1.05) : layer === 'mid' ? randomBetween(0.55, 1.45) : randomBetween(0.85, 2.25),
    // Keep the original depth movement, but use the slower historical ranges
    // so each layer remains visible instead of rushing toward the viewer.
    speed: layer === 'far' ? randomBetween(0.00008, 0.00028) : layer === 'mid' ? randomBetween(0.00014, 0.0005) : randomBetween(0.00022, 0.00082),
    alpha: layer === 'far' ? randomBetween(0.18, 0.5) : layer === 'mid' ? randomBetween(0.28, 0.75) : randomBetween(0.45, 0.95),
    hue: index % 11 === 0 ? 'rgba(244, 142, 142,' : index % 17 === 0 ? 'rgba(255, 221, 180,' : 'rgba(245, 247, 255,',
    lightHue: index % 13 === 0 ? 'rgba(151, 111, 194,' : index % 19 === 0 ? 'rgba(190, 112, 147,' : 'rgba(79, 96, 145,',
    phase: Math.random() * Math.PI * 2,
  };
}

function resetStar(star) {
  star.x = randomBetween(-width, width);
  star.y = randomBetween(-height, height);
  star.z = star.layer === 'far' ? randomBetween(0.12, 0.34) : star.layer === 'mid' ? randomBetween(0.36, 0.68) : randomBetween(0.7, 1);
}

function resize() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  stars = Array.from({ length: STAR_COUNT }, (_, index) => createStar(index < FAR_COUNT ? 'far' : index < FAR_COUNT + MID_COUNT ? 'mid' : 'near', index));
}

function drawLightGalaxy() {
  const diagonal = Math.max(width, height) * 0.72;
  const centerX = width * 0.67 + pointerX * 28;
  const centerY = height * 0.27 + pointerY * 18;

  context.save();
  context.translate(centerX, centerY);
  context.rotate(-0.26);
  context.scale(1, 0.2);
  const core = context.createRadialGradient(0, 0, 0, 0, 0, diagonal);
  core.addColorStop(0, 'rgba(114, 98, 190, 0.16)');
  core.addColorStop(0.28, 'rgba(175, 117, 178, 0.09)');
  core.addColorStop(0.62, 'rgba(123, 143, 202, 0.035)');
  core.addColorStop(1, 'rgba(123, 143, 202, 0)');
  context.fillStyle = core;
  context.beginPath();
  context.arc(0, 0, diagonal, 0, Math.PI * 2);
  context.fill();
  context.restore();

  const haze = context.createRadialGradient(width * 0.22, height * 0.78, 0, width * 0.22, height * 0.78, diagonal * 0.7);
  haze.addColorStop(0, 'rgba(224, 139, 180, 0.07)');
  haze.addColorStop(0.5, 'rgba(176, 145, 209, 0.025)');
  haze.addColorStop(1, 'rgba(176, 145, 209, 0)');
  context.fillStyle = haze;
  context.fillRect(0, 0, width, height);
}

function draw(time) {
  const delta = Math.min(time - lastTime, 40);
  lastTime = time;
  depth += delta * 0.00008;
  context.clearRect(0, 0, width, height);

  const lightMode = document.body.classList.contains('light');
  if (lightMode) drawLightGalaxy();

  const centerX = width / 2 + pointerX * 24;
  const centerY = height / 2 + pointerY * 18;
  const focal = Math.max(width, height) * 0.82;

  for (const star of stars) {
    if (!reducedMotion.matches) {
      star.z += star.speed * delta;
      if (star.z > 1.35) resetStar(star);
    }

    const scale = star.z / (star.layer === 'far' ? 0.34 : 1);
    const x = centerX + star.x * scale;
    const y = centerY + star.y * scale;
    if (x < -8 || x > width + 8 || y < -8 || y > height + 8) {
      if (!reducedMotion.matches) resetStar(star);
      continue;
    }

    const pulse = 0.82 + Math.sin(time * 0.0011 + star.phase) * 0.18;
    const radius = star.size * (0.72 + star.z * 0.62);
    const alpha = Math.min(1, star.alpha * pulse * (reducedMotion.matches ? 0.82 : 1));
    context.fillStyle = `${lightMode ? star.lightHue : star.hue}${alpha})`;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();

    if (star.layer === 'near' && star.z > 0.96 && !reducedMotion.matches) {
      const trail = Math.min(42, star.z * focal * 0.018);
      context.strokeStyle = `${lightMode ? star.lightHue : star.hue}${alpha * 0.24})`;
      context.lineWidth = Math.max(0.35, radius * 0.42);
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x - (x - centerX) / focal * trail, y - (y - centerY) / focal * trail);
      context.stroke();
    }
  }

  frame = requestAnimationFrame(draw);
}

window.addEventListener('resize', resize, { passive: true });
window.addEventListener('pointermove', (event) => {
  pointerX = event.clientX / Math.max(width, 1) - 0.5;
  pointerY = event.clientY / Math.max(height, 1) - 0.5;
}, { passive: true });
reducedMotion.addEventListener?.('change', () => {
  if (reducedMotion.matches) {
    cancelAnimationFrame(frame);
    draw(performance.now());
  }
});

resize();
draw(performance.now());
