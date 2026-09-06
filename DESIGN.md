# voidloop-dev — Design System

Not vibe-coded. Every choice below has a reason tied to **who looks at this** and
**what we need them to feel**.

## 1. Audience & intent

| | |
|---|---|
| **Who** | Technical recruiters, hiring managers, eng leads. They scan fast, judge credibility in ~seconds, and have seen hundreds of portfolios. |
| **They value** | Evidence of craft, clarity, restraint. Clutter and gimmicks read as *junior*. |
| **We need them to feel** | (1) *competent & trustworthy* — disciplined, high-contrast, nothing sloppy; (2) *this one is different* — one memorable idea (the interactive void + the loop motif), executed well, not ten effects. |
| **Brand read of the name** | `void` = depth, space, signal-in-emptiness. `loop` = iteration, code, persistence. Lets us use a restrained "deep-space / phosphor signal" identity without cheesy sci-fi. |

## 2. Colour

**Principles (from dark-UI research):**

- **No pure black.** `#000` causes halation (text glows/blurs) and leaves no room
  for elevation. Base is a very dark desaturated blue-black — "deep space," and
  the palette Linear / Vercel / Supabase-class tools use to read *technical* and
  *premium*.
- **Depth via tonal layers, not shadows** (shadows don't work on dark). Four
  surface steps, each with enough separation to be distinct.
- **Text is never pure white.** Three levels, all ≥ 4.5:1 (WCAG AA) on the base.
- **One accent, used for ≤ ~8% of the screen.** Restraint = premium. A second
  warm tone appears rarely (one word, one hover).

**Why teal, not the default violet:** violet ("innovation") is now everywhere —
Linear, Stripe, Twitch — so it reads generic. A **phosphor teal** fits
`voidloop` literally (terminal signal against the void), has the chroma to punch
on near-black, and is far less worn. A sparse **amber** adds warmth and a
"compile-succeeded" positive note.

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#0B0E14` | page — deep blue-black |
| `--surface` | `#121722` | cards, the loop box |
| `--raised` | `#1B2230` | hover / elevated |
| `--border` | `#28303F` | hairlines |
| `--text` | `#E6E9F0` | primary (soft blue-white, ~13:1) |
| `--text-2` | `#9AA4B8` | secondary (~6:1) |
| `--text-3` | `#5D6677` | metadata / disabled (~3.2:1, large only) |
| `--signal` | `#57D9C6` | **the** accent — links, progress, focus, one hero word |
| `--signal-dim` | `#2E7D74` | accent borders / trails |
| `--amber` | `#E4B363` | rare warm highlight |
| `--ok` | `#5FB88F` / `--warn` `#E5B567` / `--err` `#E5766B` | status, warm-adjusted |

Focus ring: 2px `--signal` at 3px offset, always visible.

## 3. Typography

Pro sites use **2–3 typefaces with strict roles**, not one font per section —
more than that looks amateur. "Different sections feel different" comes from
which role dominates, not new fonts.

| Role | Typeface | Why | Used for |
|---|---|---|---|
| **System / brand** | **Space Grotesk** | A proportional grotesk *derived from* Space Mono — technical/monospace DNA without true-mono fatigue. | `voidloop-dev` mark, nav, `iam` line, experience period (stroked) |
| **Editorial / human** | **Fraunces** (serif) | Deliberate role-reversal: the *person's* voice is a warm expressive serif against the cold system grotesk — this pairing (à la Chivo Mono + Fraunces) reads distinctive because the usual hierarchy is inverted. | the real name, section titles, project titles, social labels, footer email |
| **Body / UI** | **Inter** | Research-neutral workhorse: best small-size legibility, variable, huge coverage. Good body text *disappears*. | paragraphs, form inputs |
| **Code / data** | **JetBrains Mono** | Strongest all-round mono: tallest lowercase, very legible, no quirks. | the C++ loop, tech tags, eyebrows (UPPERCASE tracked), timeline years, phone, status lines |

Four families, but each has one unambiguous job. The serif↔grotesk split is the
main reason sections *feel* different without new fonts.

Section flavour, same 3 fonts:

- **Preloader / Hero** — Space Grotesk headline + JetBrains Mono metadata. Technical, sparse.
- **About** — Inter-forward, larger line-height (1.7), for actual reading.
- **Projects** — Space Grotesk titles, JetBrains Mono tech tags + numbers.
- **Skills / Experience** — JetBrains Mono labels, Inter descriptions.
- **Contact** — Inter, calm and plain.

Scale (1.25 / major-third), fluid via `clamp()`:
`--step--1 .8 · --step-0 1 · --step-1 1.25 · --step-2 1.6 · --step-3 2.1 · --step-4 2.75 · --step-5 3.8rem`

## 4. Space & layout

- 8px spacing scale (4 8 12 16 24 32 48 64 96 128).
- Content max-width 68rem; long-form text max 40rem (~72 chars).
- Generous vertical rhythm — whitespace is the main "premium" signal on dark.

## 5. Motion

- **Cursor-reactive void:** the background field parallaxes toward the pointer —
  layers move by depth, damped (not 1:1), easing back to a slow ambient drift
  when the pointer is still. Scroll adds a decaying push in the scroll direction.
- Frame-rate-independent easing everywhere (`1 - e^(-λ·dt)`).
- Section reveals: short (200–500ms), `power3.out`, translate + fade only.
- **`prefers-reduced-motion`** → no parallax, no drift, no reveal transforms;
  content just appears.

## 6. Sources

- [UI colour trends 2026 — Recursion](https://www.recursion.agency/blog/ui-color-trends-2026)
- [Dark-mode contrast / WCAG guide — ColorContrast](https://www.colorcontrast.org/blog/dark-mode-contrast-accessibility-guide/)
- [10 best practices for dark-mode UI — OneThing](https://www.onething.design/post/best-practices-for-dark-mode-ui-design)
- [Best colour palettes for developer portfolios — webportfolios.dev](https://www.webportfolios.dev/blog/best-color-palettes-for-developer-portfolio)
- [Pairing monospace with sans-serif — FontAlternatives](https://fontalternatives.com/blog/pairing-monospace-fonts-with-sans-serifs/)
- [Font pairing complete guide 2026 — MadeGood](https://madegooddesigns.com/font-pairing/)
- [JetBrains/Plex/Space Mono comparison — favtutor](https://favtutor.com/best-coding-fonts)
- [Colour psychology: violet in tech branding — Coloracci](https://coloracci.ai/blog/violet-color-psychology-design)
- [Cool-colour psychology (blue/green/purple) — Rhasko](https://rhaskodigital.com/color-psychology-guide-part-2-cool-colors-building-trust-blue-green-purple/)
- [Portfolio design trends 2026 — Envato](https://elements.envato.com/learn/portfolio-trends)
