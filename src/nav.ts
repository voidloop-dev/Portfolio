import { gsap, magnetic } from "./lib/anim.ts";

/** Fixed nav: fades in after load. Active state + clicks are handled by the deck. */
export function initNav() {
  const nav = document.querySelector<HTMLElement>("#nav");
  if (!nav) return;
  nav.hidden = false;
  nav.classList.add("nav--solid");
  gsap.from(nav, { y: -20, opacity: 0, duration: 0.6, ease: "power3.out", delay: 0.25 });

  const mark = nav.querySelector<HTMLElement>(".nav-mark");
  if (mark) magnetic(mark, 0.25);
}
