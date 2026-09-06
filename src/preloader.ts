import { gsap } from "gsap";
import { pulseWarp, setWarpProgress } from "./void-background.ts";

/**
 * The preloader as a branded intro (the real load is tiny). Attention research:
 * motion is pre-conscious, novelty drives first impressions, interactivity beats
 * passive waiting, and the finish must accelerate — never stall.
 *
 *  1 · the `for` loop emits a teal "signal" particle every iteration → feeds the
 *      void; warp speed is coupled to the counter (setWarpProgress)
 *  2 · one giant counter is the focal point
 *  3 · a terminal boot line names the real sections
 *  4 · the void core steers to the cursor (handled in void-background)
 *  5 · press & hold to drive the last stretch (auto-completes if ignored)
 *  6 · at 100: brace snaps in → shockwave → hyperspace punch → hero resolves
 */

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const BOOT: readonly [number, string][] = [
  [0, "mounting void"],
  [24, "compiling loop"],
  [48, "linking [ about · work · skills · experience · contact ]"],
  [74, "establishing signal"],
  [96, "ready"],
];

export function runPreloader(onDone: () => void) {
  const root = document.getElementById("preloader")!;
  const iEl = document.getElementById("pl-i")!;
  const countEl = document.getElementById("pl-count")!;
  const bootEl = document.getElementById("pl-boot")!;
  const braceEl = document.getElementById("pl-brace")!;
  const shockEl = document.getElementById("pl-shock")!;
  const holdBtn = document.getElementById("pl-hold") as HTMLButtonElement;
  const holdFill = document.getElementById("pl-hold-fill")!;
  const loopEl = root.querySelector(".pl-loop") as HTMLElement;
  const fx = root.querySelector(".pl-fx") as HTMLCanvasElement;

  const state = { p: 0 };
  let done = false;
  let lastN = -1;

  const MIN_MS = 1500;
  const started = performance.now();
  let pageLoaded = document.readyState === "complete";
  window.addEventListener("load", () => (pageLoaded = true), { once: true });

  /* ---- particle fx ---- */
  const ctx = fx.getContext("2d")!;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  type P = { x: number; y: number; vx: number; vy: number; life: number };
  const parts: P[] = [];
  const sizeFx = () => {
    fx.width = window.innerWidth * dpr;
    fx.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  sizeFx();
  window.addEventListener("resize", sizeFx);

  const emit = () => {
    if (REDUCED) return;
    const r = loopEl.getBoundingClientRect();
    const x = r.left + Math.random() * r.width;
    const y = r.top + Math.random() * r.height;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const ang = Math.atan2(cy - y, cx - x) + (Math.random() - 0.5) * 0.6;
    const sp = 150 + Math.random() * 140;
    parts.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 1 });
  };

  let fxRaf = 0;
  let prev = performance.now();
  const fxLoop = (now: number) => {
    const dt = Math.min((now - prev) / 1000, 1 / 20);
    prev = now;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.globalCompositeOperation = "lighter";
    for (let k = parts.length - 1; k >= 0; k--) {
      const p = parts[k]!;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.life -= dt * 1.6;
      if (p.life <= 0) {
        parts.splice(k, 1);
        continue;
      }
      ctx.fillStyle = `rgba(87, 217, 198, ${p.life * 0.85})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.7 * p.life + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    if (!done || parts.length) fxRaf = requestAnimationFrame(fxLoop);
  };
  fxRaf = requestAnimationFrame(fxLoop);

  /* ---- render ---- */
  const render = () => {
    const n = Math.round(state.p);
    iEl.textContent = String(n);
    countEl.textContent = String(n);
    setWarpProgress(state.p / 100);
    let msg = BOOT[0]![1];
    for (const [thr, m] of BOOT) if (n >= thr) msg = m;
    bootEl.textContent = `> ${msg} ${"·".repeat(6)} ${n}%`;
    if (n !== lastN) {
      lastN = n;
      emit();
    }
  };

  /* ---- finish (self-gates on the real load) ---- */
  const finish = () => {
    if (done) return;
    if (!(pageLoaded && performance.now() - started >= MIN_MS)) {
      requestAnimationFrame(finish);
      return;
    }
    done = true;
    state.p = 100;
    render();
    setWarpProgress(1);

    gsap.fromTo(
      braceEl,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(3)" },
    );
    if (!REDUCED) {
      gsap.set(shockEl, { scale: 0, opacity: 0.9 });
      gsap.to(shockEl, { scale: 16, opacity: 0, duration: 0.7, ease: "power2.out" });
    }
    pulseWarp(1.8);

    gsap.delayedCall(0.22, () => {
      root.classList.add("done");
      gsap.delayedCall(0.5, () => {
        setWarpProgress(0);
        window.removeEventListener("resize", sizeFx);
        cancelAnimationFrame(fxRaf);
        root.remove();
        onDone();
      });
    });
  };

  if (REDUCED) {
    gsap.to(state, { p: 100, duration: 0.4, onUpdate: render, onComplete: finish });
    return;
  }

  /* ---- phase 1: crawl to 88 ---- */
  gsap.to(state, { p: 88, duration: 1.6, ease: "power1.inOut", onUpdate: render, onComplete: arm });

  /* ---- phase 2: hold to jump (or auto) ---- */
  function arm() {
    holdBtn.hidden = false;
    gsap.fromTo(holdBtn, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4 });

    let holding = false;
    let holdTween: gsap.core.Tween | null = null;
    const setFill = () => (holdFill.style.width = `${Math.max(0, (state.p - 88) / 0.12)}%`);

    const start = () => {
      if (done || holding) return;
      holding = true;
      window.clearTimeout(auto);
      holdBtn.classList.add("is-holding");
      holdTween?.kill();
      holdTween = gsap.to(state, {
        p: 100,
        duration: 0.9,
        ease: "power1.in",
        overwrite: true,
        onUpdate: () => {
          render();
          setFill();
        },
        onComplete: finish,
      });
    };
    const end = () => {
      if (!holding || done) return;
      holding = false;
      holdBtn.classList.remove("is-holding");
      holdTween?.kill();
      gsap.to(state, {
        p: Math.max(88, state.p - 4),
        duration: 0.5,
        overwrite: true,
        onUpdate: () => {
          render();
          setFill();
        },
      });
    };

    holdBtn.addEventListener("pointerdown", start);
    window.addEventListener("pointerup", end);
    holdBtn.addEventListener("pointerleave", end);

    const auto = window.setTimeout(() => {
      if (done || holding) return;
      gsap.to(state, {
        p: 100,
        duration: 0.55,
        ease: "power2.in",
        overwrite: true,
        onUpdate: render,
        onComplete: finish,
      });
    }, 1700);
  }
}
