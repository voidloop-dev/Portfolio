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
const REVEAL_AT = 460; // ms into the transition when the next page appears
const COOLDOWN = 1150; // ms lock after a change

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

    gsap.to(cur, { autoAlpha: 0, y: dir * -46, duration: 0.26, ease: "power2.in" });
    pulseWarp(1.25);

    gsap.delayedCall(REVEAL_AT / 1000, () => {
      cur.classList.remove("slide--active");
      gsap.set(cur, { clearProps: "all" });
      nxt.scrollTop = 0;
      nxt.classList.add("slide--active");
      gsap.fromTo(
        nxt,
        { autoAlpha: 0, y: dir * 46 },
        { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out" },
      );
      active = to;
      setNav(to);
      playSection(nxt.id);
    });

    gsap.delayedCall(COOLDOWN / 1000, () => {
      busy = false;
    });
  }

  const go = (dir: 1 | -1) => transition(active + dir, dir);

  /** true when the active page still has room to scroll in `dir`. */
  function canScrollInside(dir: 1 | -1) {
    const s = slides[active]!;
    const atTop = s.scrollTop <= 1;
    const atBottom = s.scrollTop + s.clientHeight >= s.scrollHeight - 1;
    return dir === 1 ? !atBottom : !atTop;
  }

  // --- wheel
  let wheelLock = false;
  window.addEventListener(
    "wheel",
    (e) => {
      const dir: 1 | -1 = e.deltaY > 0 ? 1 : -1;
      if (canScrollInside(dir)) return; // let the page scroll normally
      e.preventDefault();
      if (busy || wheelLock || Math.abs(e.deltaY) < 6) return;
      wheelLock = true;
      window.setTimeout(() => (wheelLock = false), 140);
      go(dir);
    },
    { passive: false },
  );

  // --- keys
  window.addEventListener("keydown", (e) => {
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
      const dy = ty - (e.changedTouches[0]?.clientY ?? ty);
      if (Math.abs(dy) < 55) return;
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
