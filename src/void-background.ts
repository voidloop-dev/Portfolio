/**
 * The "void" — a continuous flight into a dark core, behind the whole page.
 * Reference: a hyperspace starfield. It is ALWAYS moving forward (you're
 * travelling into the void); the cursor steers and throttles it, and a scroll
 * gesture punches the speed up before it eases back to the cruise.
 *
 * All motion is damped (never 1:1). Respects prefers-reduced-motion (becomes a
 * near-still dim field). Palette per DESIGN.md: white/blue streaks, the odd
 * teal "signal" star, over deep blue-black.
 */

const DPR = () => Math.min(window.devicePixelRatio || 1, 2);
const STAR_COUNT = 300;
const CRUISE = 0.42; // gentle idle drift — quiet enough to read over

type Star = { a: number; r: number; speed: number; teal: boolean };

/** Fire a warp burst — called on section changes, not on every scroll. */
let impulse: ((strength: number) => void) | null = null;
export function pulseWarp(strength = 1) {
  impulse?.(strength);
}

export function initVoid(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { alpha: true })!;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let w = 0;
  let h = 0;
  let maxR = 0;
  const stars: Star[] = [];

  // eased vanishing-point offset + targets
  let offX = 0;
  let offY = 0;
  let pointerTX = 0;
  let pointerTY = 0;
  let throttle = 0; // small cursor-distance nudge (eased)
  let throttleT = 0;
  let boost = 0; // section-change burst, decays to 0
  let holdUntil = 0; // keep the burst at peak briefly (a real "in hyperspace" beat)

  let running = true;

  function seedStar(s: Star, atCore: boolean) {
    s.a = Math.random() * Math.PI * 2;
    s.r = atCore ? Math.random() * 0.04 : Math.random();
    s.speed = 0.05 + Math.random() * 0.1;
    s.teal = Math.random() < 0.06;
  }

  function build() {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    maxR = (Math.hypot(w, h) / 2) * 1.12;
    canvas.width = Math.round(w * DPR());
    canvas.height = Math.round(h * DPR());
    ctx.setTransform(DPR(), 0, 0, DPR(), 0, 0);

    if (stars.length === 0) {
      for (let i = 0; i < STAR_COUNT; i++) {
        const s: Star = { a: 0, r: 0, speed: 0, teal: false };
        seedStar(s, false);
        stars.push(s);
      }
    }
  }

  const onResize = () => build();

  // the burst — one hit per section change: jump to hyperspace, hold, then decay
  impulse = (strength: number) => {
    boost = Math.min(boost + strength * 7.5, 9.5);
    holdUntil = performance.now() + 460;
  };

  function onPointerMove(e: PointerEvent) {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    pointerTX = nx * 80; // steer: where the core drifts toward (no speed change)
    pointerTY = ny * 60;
    throttleT = Math.min(Math.hypot(nx, ny), 1) * 0.16; // barely perceptible
  }
  function onPointerLeave() {
    pointerTX = 0;
    pointerTY = 0;
    throttleT = 0;
  }

  let t = 0;
  let prev = performance.now();

  function frame(now: number) {
    if (!running) return;
    const dt = Math.min((now - prev) / 1000, 1 / 20);
    prev = now;
    t += dt;

    const k = 1 - Math.exp(-3 * dt);
    offX += (pointerTX - offX) * k;
    offY += (pointerTY - offY) * k;
    throttle += (throttleT - throttle) * (1 - Math.exp(-2.5 * dt));
    if (now >= holdUntil) boost *= Math.exp(-2.1 * dt); // hold at peak, then fade over ~1s

    const cx = w / 2 + offX;
    const cy = h / 2 + offY;
    const breathe = 1 + 0.12 * Math.sin(t * 0.4);
    const warp = reduce ? 0.02 : CRUISE * breathe + throttle + boost;

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";

    for (const s of stars) {
      const prevR = s.r;
      // accelerate as the star nears the viewer — the "falling in" feel
      s.r += s.speed * warp * dt * (0.2 + s.r * 2.8);
      if (s.r >= 1) {
        seedStar(s, true);
        continue;
      }
      const dx = Math.cos(s.a);
      const dy = Math.sin(s.a);
      const r2 = s.r * maxR;
      const r1 = prevR * maxR;
      // always some streak; more with distance from core + more with speed
      const stretch = 1.6 + s.r * 7 + (throttle + boost) * 9;
      const tailR = Math.max(0, r2 - (r2 - r1) * stretch - s.r * 7);

      const x1 = cx + dx * tailR;
      const y1 = cy + dy * tailR;
      const x2 = cx + dx * r2;
      const y2 = cy + dy * r2;

      const a = Math.min(0.92, 0.05 + s.r * s.r * 0.98);
      ctx.strokeStyle = s.teal
        ? `rgba(87, 217, 198, ${a})`
        : `rgba(${205 + s.r * 40}, ${215 + s.r * 30}, 255, ${a})`;
      ctx.lineWidth = 0.4 + s.r * 1.8;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.globalCompositeOperation = "source-over";
    requestAnimationFrame(frame);
  }

  build();
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("pointerleave", onPointerLeave);
  requestAnimationFrame(frame);

  return () => {
    running = false;
    impulse = null;
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerleave", onPointerLeave);
  };
}
