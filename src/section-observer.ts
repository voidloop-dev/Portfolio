import { pulseWarp } from "./void-background.ts";
import { playSection } from "./sections.ts";
import { REDUCED } from "./lib/anim.ts";

/**
 * Section-to-section transitions. Crossing the viewport midline into a new
 * section fires ONE extreme warp burst; the section you're entering stays
 * hidden until the warp peaks (~0.5s) — "jumping to the next galaxy" — then it
 * reveals with its own choreography. Scrolling within a section does nothing.
 *
 * A section only gets the dramatic hidden→reveal the FIRST time; on the way back
 * it's already there and just gets a warp flash (hiding seen content would be
 * disorienting).
 */
const REVEAL_DELAY = 520; // ms — must land while the warp is still fast

export function initSectionTransitions() {
  const sections = Array.from(
    document.querySelectorAll<HTMLElement>("#site > section, #site > footer"),
  );
  const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>("#nav .nav-links a"));
  if (sections.length === 0) return;

  const opened = new Set<string>();
  const isHero = (s: HTMLElement) => s.id === "top";

  const setActiveNav = (id: string) => {
    navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`));
  };

  if (REDUCED) {
    sections.forEach((s) => {
      s.dataset.gate = "open";
      playSection(s.id);
    });
    return;
  }

  sections.forEach((s) => {
    if (!isHero(s)) s.dataset.gate = "closed";
  });

  const open = (s: HTMLElement, dramatic: boolean) => {
    if (isHero(s) || opened.has(s.id)) return;
    opened.add(s.id);
    const run = () => {
      s.dataset.gate = "open";
      playSection(s.id);
    };
    if (dramatic) window.setTimeout(run, REVEAL_DELAY);
    else run();
  };

  const indexAt = () => {
    const line = window.innerHeight * 0.5;
    let idx = 0;
    sections.forEach((s, i) => {
      if (s.getBoundingClientRect().top <= line) idx = i;
    });
    return idx;
  };

  let current = indexAt();
  for (let i = 0; i <= current; i++) open(sections[i]!, false);
  setActiveNav(sections[current]!.id);

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const idx = indexAt();
        if (idx === current) return;
        const forward = idx > current;
        const lo = Math.min(idx, current);
        const hi = Math.max(idx, current);
        for (let i = lo; i <= hi; i++) open(sections[i]!, forward && i === idx);
        current = idx;
        pulseWarp(1);
        setActiveNav(sections[idx]!.id);
      });
    },
    { passive: true },
  );
}
