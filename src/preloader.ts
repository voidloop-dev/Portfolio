import { gsap } from "gsap";

/**
 * The preloader: the C++ `for` loop with a live counter, "loading" + %, and the
 * progress bar. Progress is a smooth simulated fill gated on the real
 * window `load` event and a minimum on-screen time so it never just flashes.
 */
export function runPreloader(onDone: () => void) {
  const root = document.getElementById("preloader")!;
  const iEl = document.getElementById("pl-i")!;
  const pctEl = document.getElementById("pl-pct")!;
  const fillEl = document.getElementById("pl-fill") as HTMLElement;
  const bar = root.querySelector(".pl-bar") as HTMLElement;

  const MIN_MS = 1900;
  const started = performance.now();
  let pageLoaded = document.readyState === "complete";
  window.addEventListener("load", () => (pageLoaded = true), { once: true });

  const state = { p: 0 };

  const render = () => {
    const n = Math.round(state.p);
    iEl.textContent = String(n);
    pctEl.textContent = String(n);
    fillEl.style.width = `${state.p}%`;
    bar.setAttribute("aria-valuenow", String(n));
  };

  const finish = () => {
    gsap.to(state, {
      p: 100,
      duration: 0.45,
      ease: "power2.out",
      onUpdate: render,
      onComplete: () => {
        root.classList.add("done");
        gsap.delayedCall(0.55, () => {
          root.remove();
          onDone();
        });
      },
    });
  };

  // crawl to ~92% while we "load", then hand off to finish()
  gsap.to(state, {
    p: 92,
    duration: 2.1,
    ease: "power1.inOut",
    onUpdate: render,
    onComplete: () => {
      const wait = () => {
        if (pageLoaded && performance.now() - started >= MIN_MS) finish();
        else requestAnimationFrame(wait);
      };
      wait();
    },
  });
}
