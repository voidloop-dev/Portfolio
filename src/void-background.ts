/**
 * The "void" — a persistent canvas behind the whole page.
 *
 * A layered particle field (dust + stars) plus slow nebula blobs and a faint
 * "VOID" wordmark. Two inputs move it, both damped (never 1:1):
 *   • the cursor — the field leans toward the pointer, by layer depth
 *   • scrolling — a wheel/scroll gesture in any direction adds a decaying push
 * Idle → it eases back to a slow ambient drift. Respects reduced-motion.
 *
 * Palette follows DESIGN.md: teal "signal" against deep blue-black.
 */

type Layer = {
  depth: number; // 0 (far) .. 1 (near) — parallax + size + speed
  count: number;
  pts: Float32Array; // [x, y, r, tw] flat
};

const DPR = () => Math.min(window.devicePixelRatio || 1, 2);

export function initVoid(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { alpha: true })!;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let w = 0;
  let h = 0;
  const layers: Layer[] = [];

  // eased parallax offset, and the targets that drive it
  let offX = 0;
  let offY = 0;
  let scrollTX = 0; // from page scroll / wheel accumulation
  let pointerTX = 0; // from cursor position
  let pointerTY = 0;
  let flowX = 0; // decaying kick from an active scroll gesture
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
      [0.15, 90],
      [0.4, 70],
      [0.7, 46],
      [1.0, 26],
    ];
    const spread = 1.7;
    for (const [depth, count] of defs) {
      const pts = new Float32Array(count * 4);
      for (let i = 0; i < count; i++) {
        pts[i * 4 + 0] = (Math.random() - 0.5) * w * spread;
        pts[i * 4 + 1] = (Math.random() - 0.5) * h * spread;
        pts[i * 4 + 2] = (0.4 + Math.random() * 1.6) * (0.5 + depth);
        pts[i * 4 + 3] = Math.random() * Math.PI * 2;
      }
      layers.push({ depth, count, pts });
    }
  }

  const onResize = () => build();

  function onScroll() {
    const y = window.scrollY;
    const dy = y - lastScrollY;
    lastScrollY = y;
    flowY += -dy * 0.35;
  }
  function onWheel(e: WheelEvent) {
    flowX += -e.deltaX * 0.12;
    flowY += -e.deltaY * 0.12;
    scrollTX += -e.deltaX * 0.04;
  }
  function onPointerMove(e: PointerEvent) {
    // -1..1 from centre → a gentle lean toward the cursor
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    pointerTX = nx * 46;
    pointerTY = ny * 34;
  }
  function onPointerLeave() {
    pointerTX = 0;
    pointerTY = 0;
  }

  let t = 0;
  let prev = performance.now();

  function frame(now: number) {
    if (!running) return;
    const dt = Math.min((now - prev) / 1000, 1 / 20);
    prev = now;
    t += dt;

    const targetX = scrollTX + flowX + pointerTX;
    const targetY = -window.scrollY * 0.12 + flowY + pointerTY;

    const k = 1 - Math.exp(-3 * dt);
    offX += (targetX - offX) * k;
    offY += (targetY - offY) * k;
    flowX *= Math.exp(-2.6 * dt);
    flowY *= Math.exp(-2.6 * dt);

    const driftX = reduce ? 0 : Math.sin(t * 0.05) * 12;
    const driftY = reduce ? 0 : Math.cos(t * 0.037) * 10;
    const px = offX + driftX;
    const py = offY + driftY;

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";

    drawNebula(ctx, w, h, t, px, py, reduce);
    drawWordmark(ctx, w, h, px * 0.5, py * 0.5);

    for (const layer of layers) {
      const lx = w / 2 + px * layer.depth;
      const ly = h / 2 + py * layer.depth;
      const reach = Math.max(w, h) * 1.15;
      for (let i = 0; i < layer.count; i++) {
        let x = wrap(layer.pts[i * 4 + 0]! + lx, -reach + w / 2, reach + w / 2);
        let y = wrap(layer.pts[i * 4 + 1]! + ly, -reach + h / 2, reach + h / 2);
        const r = layer.pts[i * 4 + 2]!;
        const tw = reduce ? 1 : 0.62 + 0.38 * Math.sin(t * 2 + layer.pts[i * 4 + 3]!);
        const a = (0.1 + 0.5 * layer.depth) * tw;
        // deep layers cool blue-grey, near layers pick up the teal signal
        const g = Math.round(190 + layer.depth * 40);
        const b = Math.round(200 + layer.depth * 30);
        ctx.fillStyle = `rgba(150, ${g}, ${b}, ${a})`;
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
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("pointerleave", onPointerLeave);
  requestAnimationFrame(frame);

  return () => {
    running = false;
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerleave", onPointerLeave);
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
  reduce: boolean,
) {
  const blobs = [
    { x: 0.28, y: 0.22, hue: "87, 217, 198", s: 0.5, ph: 0 }, // signal teal
    { x: 0.74, y: 0.62, hue: "78, 120, 170", s: 0.44, ph: 2 }, // cool blue
    { x: 0.52, y: 0.88, hue: "228, 179, 99", s: 0.4, ph: 4 }, // rare amber, faint
  ];
  for (const b of blobs) {
    const wob = reduce ? 0 : 1;
    const cx = b.x * w + ox * 0.22 + Math.sin(t * 0.06 + b.ph) * 26 * wob;
    const cy = b.y * h + oy * 0.22 + Math.cos(t * 0.05 + b.ph) * 20 * wob;
    const rad = Math.max(w, h) * b.s;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, `rgba(${b.hue}, 0.075)`);
    g.addColorStop(0.5, `rgba(${b.hue}, 0.025)`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
}

function drawWordmark(ctx: CanvasRenderingContext2D, w: number, h: number, ox: number, oy: number) {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  const size = Math.min(w, h) * 0.52;
  ctx.font = `700 ${size}px "Space Grotesk", ui-sans-serif, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(87, 217, 198, 0.035)";
  ctx.fillText("VOID", w / 2 + ox * 0.6, h / 2 + oy * 0.6);
  ctx.restore();
  ctx.globalCompositeOperation = "lighter";
}
