import {
  gsap,
  ScrollTrigger,
  REDUCED,
  revealHeading,
  revealFade,
  scramble,
  onEnter,
  magnetic,
} from "./lib/anim.ts";
import { profile, socials, skillGroups, projects, experience } from "./content.ts";

/* ----------------------------------------------------------------
   headings + eyebrows: reveal on scroll
   ---------------------------------------------------------------- */
function initReveals() {
  document.querySelectorAll<HTMLElement>(".reveal-heading").forEach(revealHeading);
  document.querySelectorAll<HTMLElement>(".reveal-fade").forEach((el) => revealFade(el));
}

/* ----------------------------------------------------------------
   01 · intro — "I am <word>" rotator + slow curved ring
   ---------------------------------------------------------------- */
function initIntro() {
  const name = document.querySelector<HTMLElement>(".intro-name");
  if (name) name.textContent = profile.name;

  const lines = document.querySelector(".intro-lines");
  if (lines) lines.innerHTML = profile.intro.map((l) => `<p>${l}</p>`).join("");

  const word = document.querySelector<HTMLElement>("#iam-word");
  if (word) {
    const roles = profile.roles;
    word.textContent = roles[0]!;
    if (!REDUCED) {
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
      gsap.delayedCall(2.2, function loop() {
        cycle();
        gsap.delayedCall(2.6, loop);
      });
    }
  }
}

/* ----------------------------------------------------------------
   02 · skills — grid of tags that "decode" in, grouped by domain
   ---------------------------------------------------------------- */
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
  tags.forEach((tag, idx) => {
    const label = tag.dataset.skill ?? tag.textContent ?? "";
    onEnter(
      tag,
      () => {
        gsap.fromTo(
          tag,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", delay: (idx % 6) * 0.05 },
        );
        gsap.delayedCall((idx % 6) * 0.05, () => scramble(tag, label, 520));
      },
      "top 92%",
    );
    // re-decode on hover
    let busy = false;
    tag.addEventListener("pointerenter", () => {
      if (busy || REDUCED) return;
      busy = true;
      scramble(tag, label, 360);
      gsap.delayedCall(0.4, () => (busy = false));
    });
  });
}

/* ----------------------------------------------------------------
   03 · work — centre line that fills as you scroll; cards alternate
   ---------------------------------------------------------------- */
function initWork() {
  const tl = document.querySelector<HTMLElement>("#work-timeline");
  const fill = document.querySelector<HTMLElement>("#work-fill");
  if (!tl || !fill) return;

  const cards = projects
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
    .join("");
  tl.insertAdjacentHTML("beforeend", cards);

  // the line fill, scrubbed to section progress
  ScrollTrigger.create({
    trigger: tl,
    start: "top 55%",
    end: "bottom 75%",
    scrub: true,
    onUpdate: (self) => gsap.set(fill, { scaleY: self.progress }),
  });

  if (REDUCED) return;
  tl.querySelectorAll<HTMLElement>(".proj").forEach((card) => {
    const fromX = card.classList.contains("proj--right") ? 48 : -48;
    gsap.from(card, {
      x: fromX,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: { trigger: card, start: "top 80%", toggleActions: "play none none reverse" },
    });
  });

  // play the demo video on hover
  tl.querySelectorAll<HTMLVideoElement>(".proj-frame video").forEach((v) => {
    const host = v.closest(".proj-frame")!;
    host.addEventListener("pointerenter", () => void v.play().catch(() => {}));
    host.addEventListener("pointerleave", () => v.pause());
  });
}

/* ----------------------------------------------------------------
   04 · experience — big outlined period + details slide in
   ---------------------------------------------------------------- */
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

  if (REDUCED) return;
  list.querySelectorAll<HTMLElement>(".xp").forEach((row) => {
    gsap.from(row.querySelector(".xp-period"), {
      x: -40,
      opacity: 0,
      duration: 0.7,
      ease: "power3.out",
      scrollTrigger: { trigger: row, start: "top 82%", toggleActions: "play none none reverse" },
    });
    gsap.from(row.querySelector(".xp-detail"), {
      x: 40,
      opacity: 0,
      duration: 0.7,
      ease: "power3.out",
      scrollTrigger: { trigger: row, start: "top 82%", toggleActions: "play none none reverse" },
    });
  });
}

/* ----------------------------------------------------------------
   05 · connect — social links with a sliding-label hover
   ---------------------------------------------------------------- */
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

  if (REDUCED) return;
  gsap.from(list.querySelectorAll(".social"), {
    y: 24,
    opacity: 0,
    duration: 0.6,
    ease: "power3.out",
    stagger: 0.08,
    scrollTrigger: { trigger: list, start: "top 85%", toggleActions: "play none none reverse" },
  });
}

/* ----------------------------------------------------------------
   06 · contact — animated fields + a "transmit" button sequence
   ---------------------------------------------------------------- */
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

/* ----------------------------------------------------------------
   footer — fill contact details from content
   ---------------------------------------------------------------- */
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

export function initSections() {
  initReveals();
  initIntro();
  initSkills();
  initWork();
  initExperience();
  initConnect();
  initContact();
  initFooter();
  ScrollTrigger.refresh();
}
