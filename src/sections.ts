import { gsap, REDUCED, queueReveal, playReveals, scramble, magnetic } from "./lib/anim.ts";
import { profile, socials, skillGroups, projects, experience } from "./content.ts";

/** Per-section "play" fns for dynamic inner content — run when the section opens. */
const plays: Record<string, () => void> = {};

/* ---------------- headings + eyebrows ---------------- */
function initReveals() {
  document.querySelectorAll<HTMLElement>(".reveal-heading").forEach((el) => queueReveal(el, "heading"));
  document.querySelectorAll<HTMLElement>(".reveal-fade").forEach((el) => queueReveal(el, "fade"));
}

/* ---------------- 01 · intro ---------------- */
function initIntro() {
  const name = document.querySelector<HTMLElement>(".intro-name");
  const lines = document.querySelector(".intro-lines");
  const word = document.querySelector<HTMLElement>("#iam-word");
  if (lines) lines.innerHTML = profile.intro.map((l) => `<p>${l}</p>`).join("");
  if (word) word.textContent = profile.roles[0]!;
  // name text is set before queueReveal splits it — do it here, before initReveals
  if (name) name.textContent = profile.name;

  let rotorStarted = false;
  plays.about = () => {
    if (!word || REDUCED || rotorStarted) return;
    rotorStarted = true;
    const roles = profile.roles;
    let i = 0;
    const cycle = () => {
      i = (i + 1) % roles.length;
      gsap
        .timeline()
        .to(word, { yPercent: -110, opacity: 0, duration: 0.32, ease: "power2.in" })
        .add(() => (word.textContent = roles[i]!))
        .fromTo(
          word,
          { yPercent: 110, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.42, ease: "power3.out" },
        );
    };
    gsap.delayedCall(2.4, function loop() {
      cycle();
      gsap.delayedCall(2.8, loop);
    });
  };
}

/* ---------------- 02 · skills ---------------- */
function initSkills() {
  const wrap = document.querySelector<HTMLElement>("#skills-wrap");
  if (!wrap) return;
  wrap.innerHTML = skillGroups
    .map(
      (g) => `
      <div class="skill-group">
        <p class="skill-group-name">${g.name}</p>
        <ul class="skill-tags">
          ${g.items.map((s) => `<li class="skill-tag" data-skill="${s}">${s}</li>`).join("")}
        </ul>
      </div>`,
    )
    .join("");

  const tags = Array.from(wrap.querySelectorAll<HTMLElement>(".skill-tag"));
  if (!REDUCED) gsap.set(tags, { autoAlpha: 0, y: 14 });

  tags.forEach((tag) => {
    const label = tag.dataset.skill ?? tag.textContent ?? "";
    let busy = false;
    tag.addEventListener("pointerenter", () => {
      if (busy || REDUCED) return;
      busy = true;
      scramble(tag, label, 360);
      gsap.delayedCall(0.4, () => (busy = false));
    });
  });

  plays.skills = () => {
    if (REDUCED) {
      gsap.set(tags, { clearProps: "all" });
      return;
    }
    tags.forEach((tag, idx) => {
      const d = (idx % 6) * 0.05 + Math.floor(idx / 6) * 0.08;
      gsap.to(tag, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out", delay: d });
      gsap.delayedCall(d, () => scramble(tag, tag.dataset.skill ?? "", 520));
    });
  };
}

/* ---------------- 03 · work ---------------- */
function initWork() {
  const tl = document.querySelector<HTMLElement>("#work-timeline");
  const fill = document.querySelector<HTMLElement>("#work-fill");
  if (!tl || !fill) return;

  tl.insertAdjacentHTML(
    "beforeend",
    projects
      .map((p, i) => {
        const side = i % 2 === 0 ? "right" : "left";
        const frame = `
          <div class="proj-frame">
            ${
              p.video
                ? `<video src="${p.video}" muted loop playsinline preload="metadata"></video>`
                : `<div class="proj-frame-ph"><span>▶ demo</span></div>`
            }
            <span class="proj-year">${p.year}</span>
          </div>`;
        const body = `
          <div class="proj-body">
            <a class="proj-title" href="${p.href}">${p.title}</a>
            <p class="proj-blurb">${p.blurb}</p>
            <ul class="proj-tech">${p.tech.map((t) => `<li>${t}</li>`).join("")}</ul>
          </div>`;
        return `
          <article class="proj proj--${side}">
            <span class="proj-node"></span>
            ${side === "right" ? body + frame : frame + body}
          </article>`;
      })
      .join(""),
  );

  const cards = Array.from(tl.querySelectorAll<HTMLElement>(".proj"));
  if (!REDUCED) {
    cards.forEach((c) =>
      gsap.set(c, { autoAlpha: 0, x: c.classList.contains("proj--right") ? 48 : -48 }),
    );
  }

  // line fill, tied to how far you've scrolled through the (internally-scrolling) page
  const page = document.getElementById("work")!;
  const updateFill = () => {
    const max = page.scrollHeight - page.clientHeight;
    gsap.set(fill, { scaleY: max > 4 ? Math.min(page.scrollTop / max, 1) : 0 });
  };
  page.addEventListener("scroll", updateFill, { passive: true });
  window.addEventListener("resize", updateFill, { passive: true });

  // hover-play demo video
  tl.querySelectorAll<HTMLVideoElement>(".proj-frame video").forEach((v) => {
    const host = v.closest(".proj-frame")!;
    host.addEventListener("pointerenter", () => void v.play().catch(() => {}));
    host.addEventListener("pointerleave", () => v.pause());
  });

  plays.work = () => {
    if (REDUCED) {
      gsap.set(cards, { clearProps: "all" });
      return;
    }
    cards.forEach((c, i) =>
      gsap.to(c, { autoAlpha: 1, x: 0, duration: 0.75, ease: "power3.out", delay: i * 0.12 }),
    );
  };
}

/* ---------------- 04 · experience ---------------- */
function initExperience() {
  const list = document.querySelector<HTMLElement>("#xp-list");
  if (!list) return;
  list.innerHTML = experience
    .map(
      (x) => `
      <article class="xp">
        <span class="xp-period">${x.period}</span>
        <div class="xp-detail">
          <p class="xp-role">${x.role} <span class="xp-org">· ${x.org}</span></p>
          <ul class="xp-points">${x.points.map((p) => `<li>${p}</li>`).join("")}</ul>
        </div>
      </article>`,
    )
    .join("");

  const rows = Array.from(list.querySelectorAll<HTMLElement>(".xp"));
  if (!REDUCED) {
    rows.forEach((r) => {
      gsap.set(r.querySelector(".xp-period"), { autoAlpha: 0, x: -40 });
      gsap.set(r.querySelector(".xp-detail"), { autoAlpha: 0, x: 40 });
    });
  }

  plays.experience = () => {
    if (REDUCED) {
      rows.forEach((r) => gsap.set(r.children, { clearProps: "all" }));
      return;
    }
    rows.forEach((r, i) => {
      gsap.to(r.querySelector(".xp-period"), {
        autoAlpha: 1,
        x: 0,
        duration: 0.7,
        ease: "power3.out",
        delay: i * 0.12,
      });
      gsap.to(r.querySelector(".xp-detail"), {
        autoAlpha: 1,
        x: 0,
        duration: 0.7,
        ease: "power3.out",
        delay: i * 0.12 + 0.05,
      });
    });
  };
}

/* ---------------- 05 · connect ---------------- */
function initConnect() {
  const list = document.querySelector<HTMLElement>("#social-list");
  if (!list) return;
  list.innerHTML = socials
    .map(
      (s) => `
      <li class="social">
        <a href="${s.href}" ${s.href.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""}>
          <span class="social-label"><span>${s.label}</span><span>${s.label}</span></span>
          <span class="social-note">${s.note}</span>
          <span class="social-arrow">↗</span>
        </a>
      </li>`,
    )
    .join("");

  const items = Array.from(list.querySelectorAll<HTMLElement>(".social"));
  if (!REDUCED) gsap.set(items, { autoAlpha: 0, y: 24 });

  plays.connect = () => {
    if (REDUCED) {
      gsap.set(items, { clearProps: "all" });
      return;
    }
    gsap.to(items, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.08 });
  };
}

/* ---------------- 06 · contact ---------------- */
function initContact() {
  const form = document.querySelector<HTMLFormElement>("#xmit");
  const status = document.querySelector<HTMLElement>("#xmit-status");
  if (!form || !status) return;

  const btn0 = form.querySelector<HTMLButtonElement>(".xmit-btn");
  if (btn0) magnetic(btn0, 0.4);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const btn = form.querySelector<HTMLButtonElement>(".xmit-btn")!;
    const label = btn.querySelector<HTMLElement>(".xmit-label")!;
    const sweep = btn.querySelector<HTMLElement>(".xmit-sweep")!;

    if (!form.checkValidity()) {
      status.textContent = "// fill every field before transmitting";
      status.dataset.state = "err";
      return;
    }

    btn.disabled = true;
    status.textContent = "";
    delete status.dataset.state;
    label.textContent = "transmitting…";

    if (REDUCED) {
      label.textContent = "signal sent ✓";
      status.textContent = "// demo — wire this to a form service next";
      status.dataset.state = "ok";
      return;
    }

    gsap
      .timeline({
        onComplete: () => {
          label.textContent = "signal sent ✓";
          status.textContent = "// demo — wire this to a form service next";
          status.dataset.state = "ok";
          gsap.delayedCall(3, () => {
            label.textContent = "Transmit signal";
            btn.disabled = false;
            form.reset();
          });
        },
      })
      .fromTo(sweep, { xPercent: -100 }, { xPercent: 0, duration: 0.8, ease: "power2.inOut" })
      .to(sweep, { xPercent: 100, duration: 0.5, ease: "power2.in" });
  });
}

/* ---------------- footer ---------------- */
function initFooter() {
  const mail = document.querySelector<HTMLAnchorElement>("#footer-mail");
  const phone = document.querySelector<HTMLAnchorElement>("#footer-phone");
  const year = document.querySelector<HTMLElement>("#footer-year");
  if (mail) {
    mail.textContent = profile.email;
    mail.href = `mailto:${profile.email}`;
  }
  if (phone) {
    phone.textContent = profile.phone;
    phone.href = `tel:${profile.phone.replace(/[^\d+]/g, "")}`;
  }
  if (year) year.textContent = `© ${new Date().getFullYear()} voidloop-dev`;
}

/** Run a section's reveals + dynamic content animation. Called by the transition controller. */
export function playSection(id: string) {
  playReveals(id);
  plays[id]?.();
}

export function initSections() {
  initIntro(); // sets .intro-name text first
  initReveals(); // then splits/queues it
  initSkills();
  initWork();
  initExperience();
  initConnect();
  initContact();
  initFooter();
}
