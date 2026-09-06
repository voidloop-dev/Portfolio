import { pulseWarp } from "./void-background.ts";

/**
 * Watches which section is under the viewport's midline. When it changes —
 * i.e. you cross from one section into the next — it fires ONE warp burst and
 * updates the active nav link. Scrolling within a section does nothing to the
 * background, so text stays readable.
 */
export function initSectionObserver() {
  const sections = Array.from(
    document.querySelectorAll<HTMLElement>("#site > section, #site > footer"),
  );
  const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>("#nav .nav-links a"));
  if (sections.length === 0) return;

  let active = "";
  let first = true;

  const setActive = (id: string) => {
    if (id === active) return;
    active = id;
    navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`));
    if (first) {
      first = false; // don't burst on the initial paint
      return;
    }
    pulseWarp(1);
  };

  const io = new IntersectionObserver(
    (entries) => {
      // pick the most-visible section crossing the midline band
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.5, 1] },
  );

  sections.forEach((s) => io.observe(s));
}
