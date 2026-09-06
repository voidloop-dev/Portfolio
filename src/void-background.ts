/**
 * The "void" — a slow star-warp emanating from a dark core, behind the whole
 * page. Reference: a hyperspace starfield (sparse streaks radiating from a
 * vanishing point), not a flat particle field.
 *
 * Two inputs move it, both damped (never 1:1):
 *   • the cursor — the vanishing point leans toward the pointer
 *   • scrolling — a wheel/scroll gesture briefly speeds the warp + stretches
 *     the streaks, then decays back to the idle crawl
 * Respects prefers-reduced-motion (stars become a still, dim field).
 *
 * Palette follows DESIGN.md: near-white/blue streaks, the odd teal "signal"
 * star, over deep blue-black.
 */

const DPR = () => Math.min(window.devicePixelRatio || 1, 2);
const STAR_COUNT = 260;

type Star = { a: number; r: number; speed: number; teal: boolean };

export function initVoid(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { alpha: true })!;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let w = 0;
  let h = 0;
  let maxR = 0;
  const stars: Star[] = [];

  // eased vanishing-point offset + the targets that drive it
  let offX = 0;
  let offY = 0;
  let pointerTX = 0;
  let pointerTY = 0;
  // warp boost: rises on a scroll gesture, decays to 0
  let boost = 0;

  let lastScrollY = window.scrollY;
  let running = true;

  function seedStar(s: Star, atCore: boolean) {
    s.a = Math.random() * Math.PI * 2;
    s.r = atCore ? Math.random() * 0.05 : Math.random();
    s.speed = 0.04 + Math.random() * 0.09;
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

  function onScroll() {
    const y = window.scrollY;
    const dy = y - lastScrollY;
    lastScrollY = y;
    boost += Math.min(Math.abs(dy) * 0.012, 1.4);
  }
  function onWheel(e: WheelEvent) {
    boost += Math.min((Math.abs(e.deltaY) + Math.abs(e.deltaX)) * 0.004, 1.2);
  }
  function onPointerMove(e: PointerEvent) {
    pointerTX = ((e.clientX / window.innerWidth) * 2 - 1) * 60;
    pointerTY = ((e.clientY / window.innerHeight) * 2 - 1) * 44;
  }
  function onPointerLeave() {
    pointerTX = 0;
    pointerTY = 0;
  }

  let prev = performance.now();

  function frame(now: number) {
    if (!running) return;
    const dt = Math.min((now - prev) / 1000, 1 / 20);
    prev = now;

    const k = 1 - Math.exp(-3 * dt);
    offX += (pointerTX - offX) * k;
    offY += (pointerTY - offY) * k;
    boost *= Math.exp(-2.2 * dt);

    const cx = w / 2 + offX;
    const cy = h / 2 + offY;
    const warp = reduce ? 0 : 0.16 + boost; // idle crawl + gesture boost

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";

    for (const s of stars) {
      const prevR = s.r;
      s.r += s.speed * warp * dt * (0.15 + s.r * 2.4);
      if (s.r >= 1) {
        seedStar(s, true);
        continue;
      }
      const dx = Math.cos(s.a);
      const dy = Math.sin(s.a);
      const r1 = prevR * maxR;
      const r2 = s.r * maxR;
      // streak length grows with distance from core and with warp speed
      const stretch = 1 + s.r * 6 + boost * 10;
      const tailR = Math.max(0, r2 - (r2 - r1) * stretch - s.r * 6);

      const x1 = cx + dx * tailR;
      const y1 = cy + dy * tailR;
      const x2 = cx + dx * r2;
      const y2 = cy + dy * r2;

      const a = Math.min(0.9, 0.06 + s.r * s.r * 0.95);
      const width = 0.4 + s.r * 1.7;
      ctx.strokeStyle = s.teal
        ? `rgba(87, 217, 198, ${a})`
        : `rgba(${205 + s.r * 40}, ${215 + s.r * 30}, 255, ${a})`;
      ctx.lineWidth = width;
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
