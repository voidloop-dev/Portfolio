import { gsap } from "./lib/anim.ts";

/** Fixed nav: fades in after load, hides on scroll-down, shows on scroll-up. */
export function initNav() {
  const nav = document.querySelector<HTMLElement>("#nav");
  if (!nav) return;
  nav.hidden = false;
  gsap.from(nav, { y: -20, opacity: 0, duration: 0.6, ease: "power3.out", delay: 0.2 });

  let last = window.scrollY;
  let hidden = false;
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      const goingDown = y > last && y > 120;
      if (goingDown !== hidden) {
        hidden = goingDown;
        gsap.to(nav, { yPercent: hidden ? -140 : 0, duration: 0.4, ease: "power2.out" });
      }
      nav.classList.toggle("nav--solid", y > 40);
      last = y;
    },
    { passive: true },
  );

  // smooth-scroll for in-page anchors
  nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href")!.slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}
