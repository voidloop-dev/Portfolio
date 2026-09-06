import "./style.css";
import { gsap } from "./lib/anim.ts";
import { initVoid } from "./void-background.ts";
import { runPreloader } from "./preloader.ts";
import { initNav } from "./nav.ts";
import { initSections } from "./sections.ts";
import { initDeck } from "./deck.ts";

initVoid(document.getElementById("void") as HTMLCanvasElement);

runPreloader(() => {
  const site = document.getElementById("site")!;
  site.hidden = false;

  initNav();
  initSections();
  initDeck();

  const hero = site.querySelector(".hero")!;
  gsap.from(hero.children, {
    y: 24,
    opacity: 0,
    duration: 0.9,
    ease: "power3.out",
    stagger: 0.12,
    delay: 0.15,
  });
});
