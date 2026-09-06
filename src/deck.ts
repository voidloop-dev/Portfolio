import { gsap, REDUCED } from "./lib/anim.ts";
import { pulseWarp } from "./void-background.ts";
import { playSection } from "./sections.ts";

/**
 * Paged deck. Each section is a full-screen "page". A scroll/key/swipe past a
 * page's edge runs a transition: the current page drops away, the warp jumps to
 * hyperspace with nothing else on screen, and ~0.5s later — while it's still
 * fast — the next page drops in and the warp decays back to the quiet cruise.
 *
 * Tall pages (work, experience) scroll internally; only scrolling past their
 * top/bottom edge triggers a page change.
 */
/* strict, non-overlapping phases */
const EXIT = 0.3; // s — the current page leaves completely
const WARP_SOLO = 0.72; // s — empty screen, warp burst only
const ENTER = 0.55; // s — the next page arrives + runs its own reveals
const TAIL = 0.15; // s — small buffer before input unlocks

export function initDeck() {
  const slides = Array.from(
    document.querySelectorAll<HTMLElement>("#site > section, #site > footer"),
  );
  const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>("#nav .nav-links a"));
  if (slides.length === 0) return;
  slides.forEach((s) => s.classList.add("slide"));

  if (REDUCED) {
    document.documentElement.classList.add("reduced-deck");
    slides.forEach((s) => {
      s.classList.add("slide--active");
      playSection(s.id);
    });
    return;
  }

  let active = 0;
  let busy = false;
  slides[0]!.classList.add("slide--active");
  playSection(slides[0]!.id);
  setNav(0);

  function setNav(i: number) {
    const id = slides[i]!.id;
    navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`));
  }

  function transition(to: number, dir: 1 | -1) {
    if (busy || to < 0 || to >= slides.length || to === active) return;
    busy = true;
    const cur = slides[active]!;
    const nxt = slides[to]!;

    // strict sequence — no phase overlaps another:
    const tl = gsap.timeline({
      onComplete: () => {
        busy = false;
      },
    });

    // 1 · current page leaves completely
    tl.to(cur, { autoAlpha: 0, y: dir * -55, duration: EXIT, ease: "power2.in" });

    // 2 · page is gone → fire the warp onto an empty screen
    tl.add(() => {
      cur.classList.remove("slide--active");
      gsap.set(cur, { clearProps: "all" });
      pulseWarp(1.35);
    });

    // 3 · hold on the warp alone
    tl.to({}, { duration: WARP_SOLO });

    // 4 · warp done → the next page arrives and starts its own animation
    tl.add(() => {
      nxt.scrollTop = 0;
      nxt.classList.add("slide--active");
      active = to;
      setNav(to);
      playSection(nxt.id);
    });
    tl.fromTo(
      nxt,
      { autoAlpha: 0, y: dir * 55 },
      { autoAlpha: 1, y: 0, duration: ENTER, ease: "power3.out" },
    );
    tl.to({}, { duration: TAIL });
  }

  const go = (dir: 1 | -1) => transition(active + dir, dir);

  /** true while the project-preview overlay is open — deck ignores input then. */
  const locked = () => document.documentElement.dataset.pm != null;

  /** true when the active page still has room to scroll in `dir`. */
  function canScrollInside(dir: 1 | -1) {
    const s = slides[active]!;
    const atTop = s.scrollTop <= 1;
    const atBottom = s.scrollTop + s.clientHeight >= s.scrollHeight - 1;
    return dir === 1 ? !atBottom : !atTop;
  }

  // --- wheel: at a page edge you must keep pushing past it (build up "intent")
  // before it changes page — so scrolling to read the last/first line doesn't
  // immediately fling you to the next section.
  const EDGE_PUSH = 200;
  let edgeAccum = 0;
  let edgeDir: 1 | -1 = 1;
  let edgeTimer = 0;
  window.addEventListener(
    "wheel",
    (e) => {
      if (locked()) return;
      const dir: 1 | -1 = e.deltaY > 0 ? 1 : -1;
      if (canScrollInside(dir)) {
        edgeAccum = 0;
        return; // let the page scroll normally
      }
      e.preventDefault();
      if (busy) {
        edgeAccum = 0;
        return;
      }
      if (dir !== edgeDir) {
        edgeDir = dir;
        edgeAccum = 0;
      }
      edgeAccum += Math.abs(e.deltaY);
      window.clearTimeout(edgeTimer);
      edgeTimer = window.setTimeout(() => (edgeAccum = 0), 320);
      if (edgeAccum >= EDGE_PUSH) {
        edgeAccum = 0;
        go(dir);
      }
    },
    { passive: false },
  );

  // --- keys
  window.addEventListener("keydown", (e) => {
    if (locked()) return;
    const down = e.key === "ArrowDown" || e.key === "PageDown" || (e.key === " " && !e.shiftKey);
    const up = e.key === "ArrowUp" || e.key === "PageUp" || (e.key === " " && e.shiftKey);
    if (!down && !up) return;
    const dir: 1 | -1 = down ? 1 : -1;
    if (!canScrollInside(dir)) {
      e.preventDefault();
      go(dir);
    }
  });

  // --- touch
  let ty = 0;
  window.addEventListener("touchstart", (e) => (ty = e.touches[0]?.clientY ?? 0), { passive: true });
  window.addEventListener(
    "touchend",
    (e) => {
      if (locked()) return;
      const dy = ty - (e.changedTouches[0]?.clientY ?? ty);
      if (Math.abs(dy) < 90) return; // a deliberate swipe, not a nudge
      const dir: 1 | -1 = dy > 0 ? 1 : -1;
      if (!canScrollInside(dir)) go(dir);
    },
    { passive: true },
  );

  // --- nav (single transition regardless of distance)
  navLinks.forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const idx = slides.findIndex((s) => s.id === a.getAttribute("href")!.slice(1));
      if (idx >= 0) transition(idx, idx > active ? 1 : -1);
    });
  });
  document.querySelectorAll<HTMLAnchorElement>('a[href="#top"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      transition(0, -1);
    });
  });
}
