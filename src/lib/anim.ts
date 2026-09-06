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

/** Split, then hide each word ready to rise. Returns the inner spans. */
export function prepWords(el: HTMLElement): HTMLElement[] {
  const inners = splitWords(el);
  if (!REDUCED) gsap.set(inners, { yPercent: 115, opacity: 0 });
  return inners;
}

/** Reset, then stagger the words of a prepped element up into view (replays every call). */
export function playWords(el: HTMLElement, delay = 0, speed = 0.03) {
  const inners = el.querySelectorAll(".w-inner");
  if (REDUCED) {
    gsap.set(inners, { clearProps: "all" });
    return;
  }
  gsap.set(inners, { yPercent: 115, opacity: 0 });
  gsap.to(inners, {
    yPercent: 0,
    opacity: 1,
    duration: 0.62,
    ease: "power3.out",
    stagger: speed,
    delay,
  });
}

/* --- reveal registry: reveals grouped by section, played when the deck opens it --- */
type RevealKind = "heading" | "text" | "fade";
const revealRegistry = new Map<string, { el: HTMLElement; kind: RevealKind }[]>();

function sectionIdOf(el: Element): string {
  return el.closest("section, footer")?.id || "_";
}

/** Register an element to be revealed when its section opens. Hides it now. */
export function queueReveal(el: HTMLElement, kind: RevealKind) {
  if (kind === "heading" || kind === "text") prepWords(el);
  const id = sectionIdOf(el);
  const arr = revealRegistry.get(id) ?? [];
  arr.push({ el, kind });
  revealRegistry.set(id, arr);
  if (REDUCED || kind === "heading" || kind === "text") return;
  gsap.set(el, { autoAlpha: 0, y: 24 });
}

/** Play (or replay — resets first) the reveals for one section. */
export function playReveals(sectionId: string) {
  const arr = revealRegistry.get(sectionId);
  if (!arr) return;
  arr.forEach(({ el, kind }, i) => {
    if (REDUCED) {
      if (kind === "heading" || kind === "text")
        gsap.set(el.querySelectorAll(".w-inner"), { clearProps: "all" });
      else gsap.set(el, { clearProps: "all" });
      return;
    }
    if (kind === "heading") playWords(el, 0.04 + i * 0.04, 0.05);
    else if (kind === "text") playWords(el, 0.1 + i * 0.06, 0.02);
    else {
      gsap.set(el, { autoAlpha: 0, y: 24 });
      gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out", delay: 0.04 + i * 0.05 });
    }
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
