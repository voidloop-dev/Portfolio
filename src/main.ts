import "./style.css";
import { gsap } from "./lib/anim.ts";
import { initVoid } from "./void-background.ts";
import { runPreloader } from "./preloader.ts";
import { initNav } from "./nav.ts";
import { initSections } from "./sections.ts";

initVoid(document.getElementById("void") as HTMLCanvasElement);

document.body.style.overflow = "hidden";

runPreloader(() => {
  const site = document.getElementById("site")!;
  site.hidden = false;
  document.body.style.overflow = "";

  initNav();
  initSections();

  const hero = site.querySelector(".hero")!;
  gsap.from(hero.children, {
    y: 24,
    opacity: 0,
    duration: 0.9,
    ease: "power3.out",
    stagger: 0.12,
  });
});
