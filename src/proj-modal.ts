import { gsap, REDUCED } from "./lib/anim.ts";
import type { Project } from "./content.ts";

/**
 * Project preview — an in-page overlay (like a PDF opening over the page), not a
 * separate route. Small centred panel, the page dimmed + blurred behind it, a
 * "← back" button (plus Esc / backdrop click) to return. While it's open the
 * deck ignores scroll/keys (documentElement.dataset.pm).
 */

let openFn: ((i: number) => void) | null = null;
export function openProjModal(i: number) {
  openFn?.(i);
}

export function initProjModal(projects: Project[]) {
  const modal = document.getElementById("proj-modal");
  const media = document.getElementById("pm-media");
  const titleEl = document.getElementById("pm-title");
  const blurbEl = document.getElementById("pm-blurb");
  const linksEl = document.getElementById("pm-links");
  if (!modal || !media || !titleEl || !blurbEl || !linksEl) return;
  const panel = modal.querySelector<HTMLElement>(".proj-modal-panel")!;
  const backBtn = modal.querySelector<HTMLButtonElement>(".proj-modal-back");
  let lastFocus: HTMLElement | null = null;

  const close = () => {
    if (modal.hidden) return;
    const finish = () => {
      modal.hidden = true;
      media.innerHTML = ""; // stop + unload the video
      delete document.documentElement.dataset.pm;
      lastFocus?.focus();
    };
    if (REDUCED) return finish();
    gsap.to(panel, { autoAlpha: 0, y: 14, duration: 0.18, ease: "power2.in" });
    gsap.to(modal, { autoAlpha: 0, duration: 0.24, onComplete: finish });
  };

  const open = (i: number) => {
    const p = projects[i];
    if (!p) return;
    lastFocus = document.activeElement as HTMLElement;
    document.querySelectorAll<HTMLVideoElement>(".proj-frame video").forEach((v) => v.pause());

    media.innerHTML = p.video
      ? `<video src="${p.video}" controls autoplay muted loop playsinline></video>`
      : `<div class="pm-media-ph">demo coming soon</div>`;
    titleEl.textContent = p.title;
    blurbEl.textContent = p.blurb;
    linksEl.innerHTML =
      p.href && p.href !== "#"
        ? `<a href="${p.href}" target="_blank" rel="noopener noreferrer">Open project ↗</a>`
        : "";

    document.documentElement.dataset.pm = "1";
    modal.hidden = false;
    backBtn?.focus();

    if (REDUCED) {
      gsap.set([modal, panel], { autoAlpha: 1, y: 0, scale: 1 });
      return;
    }
    gsap.fromTo(modal, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.24, ease: "power2.out" });
    gsap.fromTo(
      panel,
      { autoAlpha: 0, y: 22, scale: 0.97 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.32, ease: "power3.out" },
    );
  };
  openFn = open;

  modal.querySelectorAll("[data-pm-close]").forEach((el) => el.addEventListener("click", close));
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });
  modal.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const f = modal.querySelectorAll<HTMLElement>("button, a[href], video");
    if (f.length === 0) return;
    const first = f[0]!;
    const last = f[f.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}
