/**
 * The "void" — a persistent canvas behind the whole page.
 *
 * A layered particle field (dust + stars) plus a couple of slow nebula blobs and
 * a faint "VOID" wordmark. Everything parallaxes off scroll: a scroll gesture in
 * any direction (wheel X/Y or page scroll) pushes a decaying "flow" vector, and
 * each layer drifts along it scaled by its depth. Stop scrolling → it eases back
 * to a slow ambient drift.
 */

type Layer = {
  depth: number; // 0 (far) .. 1 (near) — parallax + size + speed
  count: number;
  pts: Float32Array; // [x, y, r, tw, ...] flat
};

const DPR = () => Math.min(window.devicePixelRatio || 1, 2);

export function initVoid(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { alpha: true })!;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let w = 0;
  let h = 0;
  const layers: Layer[] = [];

  // accumulated parallax offset (eased) and the raw scroll-driven target
  let offX = 0;
  let offY = 0;
  let targetX = 0;
  let targetY = 0;
  // flow = short-lived velocity kick from an active scroll gesture
  let flowX = 0;
  let flowY = 0;

  let lastScrollY = window.scrollY;
  let running = true;

  function build() {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * DPR());
    canvas.height = Math.round(h * DPR());
    ctx.setTransform(DPR(), 0, 0, DPR(), 0, 0);

    layers.length = 0;
    const defs: Array<[number, number]> = [
      [0.15, 90], // far haze
      [0.4, 70],
      [0.7, 45],
      [1.0, 26], // near, bigger, fastest
    ];
    const spread = 1.6; // build the field larger than the viewport so parallax never reveals an edge
    for (const [depth, count] of defs) {
      const pts = new Float32Array(count * 4);
      for (let i = 0; i < count; i++) {
        pts[i * 4 + 0] = (Math.random() - 0.5) * w * spread;
        pts[i * 4 + 1] = (Math.random() - 0.5) * h * spread;
        pts[i * 4 + 2] = (0.4 + Math.random() * 1.6) * (0.5 + depth);
        pts[i * 4 + 3] = Math.random() * Math.PI * 2; // twinkle phase
      }
      layers.push({ depth, count, pts });
    }
  }

  function onResize() {
    build();
  }

  // --- scroll input: page scroll + raw wheel (works before the page can scroll)
  function onScroll() {
    const y = window.scrollY;
    const dy = y - lastScrollY;
    lastScrollY = y;
    targetY = -y * 0.15;
    flowY += -dy * 0.35;
  }
  function onWheel(e: WheelEvent) {
    flowX += -e.deltaX * 0.12;
    flowY += -e.deltaY * 0.12;
    targetX += -e.deltaX * 0.04;
  }

  let t = 0;
  let prev = performance.now();

  function frame(now: number) {
    if (!running) return;
    const dt = Math.min((now - prev) / 1000, 1 / 20);
    prev = now;
    t += dt;

    // ease the parallax offset toward target + apply decaying flow
    const k = 1 - Math.exp(-3 * dt);
    offX += (targetX + flowX - offX) * k;
    offY += (targetY + flowY - offY) * k;
    flowX *= Math.exp(-2.6 * dt);
    flowY *= Math.exp(-2.6 * dt);

    // ambient drift so it's never fully still
    const driftX = Math.sin(t * 0.05) * 12;
    const driftY = Math.cos(t * 0.037) * 10;

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";

    drawNebula(ctx, w, h, t, offX + driftX, offY + driftY);
    drawWordmark(ctx, w, h, (offX + driftX) * 0.5, (offY + driftY) * 0.5);

    for (const layer of layers) {
      const lx = w / 2 + (offX + driftX) * layer.depth;
      const ly = h / 2 + (offY + driftY) * layer.depth;
      const reach = Math.max(w, h) * 1.1;
      for (let i = 0; i < layer.count; i++) {
        let x = layer.pts[i * 4 + 0]! + lx;
        let y = layer.pts[i * 4 + 1]! + ly;
        // wrap around so the field is infinite
        x = wrap(x, -reach + w / 2, reach + w / 2);
        y = wrap(y, -reach + h / 2, reach + h / 2);
        const r = layer.pts[i * 4 + 2]!;
        const tw = reduce ? 1 : 0.6 + 0.4 * Math.sin(t * 2 + layer.pts[i * 4 + 3]!);
        const a = (0.12 + 0.5 * layer.depth) * tw;
        ctx.fillStyle = `rgba(${180 - layer.depth * 40}, ${170 + layer.depth * 30}, 255, ${a})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalCompositeOperation = "source-over";
    requestAnimationFrame(frame);
  }

  build();
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("wheel", onWheel, { passive: true });
  requestAnimationFrame(frame);

  return () => {
    running = false;
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("wheel", onWheel);
  };
}

function wrap(v: number, min: number, max: number) {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
}

function drawNebula(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  ox: number,
  oy: number,
) {
  const blobs = [
    { x: 0.3, y: 0.25, hue: "124, 92, 255", s: 0.55, ph: 0 },
    { x: 0.72, y: 0.6, hue: "34, 211, 238", s: 0.42, ph: 2 },
    { x: 0.5, y: 0.85, hue: "80, 60, 200", s: 0.6, ph: 4 },
  ];
  for (const b of blobs) {
    const cx = b.x * w + ox * 0.25 + Math.sin(t * 0.06 + b.ph) * 30;
    const cy = b.y * h + oy * 0.25 + Math.cos(t * 0.05 + b.ph) * 24;
    const rad = Math.max(w, h) * b.s;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, `rgba(${b.hue}, 0.10)`);
    g.addColorStop(0.5, `rgba(${b.hue}, 0.035)`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
}

function drawWordmark(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ox: number,
  oy: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  const size = Math.min(w, h) * 0.5;
  ctx.font = `900 ${size}px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(124, 92, 255, 0.045)";
  ctx.fillText("VOID", w / 2 + ox * 0.6, h / 2 + oy * 0.6);
  ctx.restore();
  ctx.globalCompositeOperation = "lighter";
}
