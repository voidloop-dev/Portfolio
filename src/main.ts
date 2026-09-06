import "./style.css";
import { gsap } from "gsap";
import { initVoid } from "./void-background.ts";
import { runPreloader } from "./preloader.ts";

const canvas = document.getElementById("void") as HTMLCanvasElement;
initVoid(canvas);

// lock scroll while the preloader is up
document.body.style.overflow = "hidden";

runPreloader(() => {
  const site = document.getElementById("site")!;
  site.hidden = false;
  document.body.style.overflow = "";

  const hero = site.querySelector(".hero")!;
  gsap.from(hero.children, {
    y: 24,
    opacity: 0,
    duration: 0.9,
    ease: "power3.out",
    stagger: 0.12,
  });
});
