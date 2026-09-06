# voidloop-dev — portfolio

Fresh build. Currently: the preloader.

- `voidloop-dev` wordmark
- a C++ `for` loop with a live `i` counter running to 100
- `loading` + percentage
- a progress bar (empty → violet/cyan gradient)
- the **void** background — a layered particle field + nebula that parallaxes off
  scroll in any direction, behind the whole page

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

## Stack

Vite + vanilla TypeScript + GSAP + a 2D canvas. No framework.

## Layout

```
index.html            markup for the preloader + placeholder hero
src/main.ts            entry — wires the void + preloader
src/preloader.ts       progress simulation, counter, bar, fade-out
src/void-background.ts  the scroll-reactive canvas field
src/style.css          theme tokens + all styles
```
