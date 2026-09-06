import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
export { gsap, ScrollTrigger };

export const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Wrap each word in a clip-masked span so it can rise into view. Returns the inners. */
export function splitWords(el: HTMLElement): HTMLElement[] {
  const raw = el.textContent ?? "";
  el.textContent = "";
  const frag = document.createDocumentFragment();
  for (const chunk of raw.split(/(\s+)/)) {
    if (chunk.trim() === "") {
      frag.append(chunk);
      continue;
    }
    const outer = document.createElement("span");
    outer.className = "w-outer";
    const inner = document.createElement("span");
    inner.className = "w-inner";
    inner.textContent = chunk;
    outer.append(inner);
    frag.append(outer);
  }
  el.append(frag);
  return Array.from(el.querySelectorAll<HTMLElement>(".w-inner"));
}

/** Heading word-reveal on scroll-in. Reversible. */
export function revealHeading(el: HTMLElement) {
  const words = splitWords(el);
  if (REDUCED) return;
  gsap.from(words, {
    yPercent: 120,
    opacity: 0,
    duration: 0.7,
    ease: "power3.out",
    stagger: 0.05,
    scrollTrigger: { trigger: el, start: "top 82%", toggleActions: "play none none reverse" },
  });
}

/** Generic fade-up-on-scroll for an element. */
export function revealFade(el: Element, extra: gsap.TweenVars = {}) {
  if (REDUCED) return;
  gsap.from(el, {
    y: 26,
    opacity: 0,
    duration: 0.7,
    ease: "power3.out",
    ...extra,
    scrollTrigger: { trigger: el, start: "top 86%", toggleActions: "play none none reverse" },
  });
}

const GLYPHS = "!<>-_\\/[]{}=+*^?#________01x";

/** "Decode" a string in place: scrambled glyphs resolve left-to-right. */
export function scramble(el: HTMLElement, finalText: string, duration = 640) {
  if (REDUCED) {
    el.textContent = finalText;
    return;
  }
  const start = performance.now();
  const step = (now: number) => {
    const p = Math.min((now - start) / duration, 1);
    const revealed = Math.floor(p * finalText.length);
    let out = "";
    for (let i = 0; i < finalText.length; i++) {
      const ch = finalText[i]!;
      if (i < revealed || ch === " ") out += ch;
      else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = finalText;
  };
  requestAnimationFrame(step);
}

/** Run `fn` once when `el` first scrolls into view. */
export function onEnter(el: Element, fn: () => void, start = "top 85%") {
  ScrollTrigger.create({ trigger: el, start, once: true, onEnter: fn });
}

/** Element drifts toward the cursor while hovered, springs back on leave. */
export function magnetic(el: HTMLElement, strength = 0.35) {
  if (REDUCED) return;
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    gsap.to(el, {
      x: (e.clientX - (r.left + r.width / 2)) * strength,
      y: (e.clientY - (r.top + r.height / 2)) * strength,
      duration: 0.4,
      ease: "power3.out",
    });
  });
  el.addEventListener("pointerleave", () => {
    gsap.to(el, { x: 0, y: 0, duration: 0.55, ease: "elastic.out(1, 0.45)" });
  });
}
