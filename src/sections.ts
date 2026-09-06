import {
  gsap,
  REDUCED,
  queueReveal,
  playReveals,
  prepWordsDim,
  playWordsDim,
  dimWords,
  scramble,
  magnetic,
} from "./lib/anim.ts";
import { profile, socials, skillGroups, projects, experience } from "./content.ts";
import { initProjModal, openProjModal } from "./proj-modal.ts";

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
  const lines = document.querySelector<HTMLElement>(".intro-lines");
  const word = document.querySelector<HTMLElement>("#iam-word");
  if (word) word.textContent = profile.roles[0]!;
  // name text is set before queueReveal splits it — do it here, before initReveals
  if (name) name.textContent = profile.name;

  // intro paragraphs — word-by-word reveal, registered under the "about" section
  const introLines: HTMLElement[] = [];
  if (lines) {
    lines.innerHTML = profile.intro.map((l) => `<p>${l}</p>`).join("");
    lines.querySelectorAll<HTMLElement>("p").forEach((p) => {
      prepWordsDim(p);
      introLines.push(p);
    });
  }

  let rotorStarted = false;
  plays.about = () => {
    introLines.forEach((p, i) => playWordsDim(p, 0.3 + i * 0.7, 0.08));
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
      <div class="skill-group" tabindex="0">
        <p class="skill-group-name" data-label="${g.name}">${g.name}</p>
        <ul class="skill-tags">
          ${g.items
            .map((s, i) => `<li class="skill-tag" style="--i:${i}"><span>${s}</span></li>`)
            .join("")}
        </ul>
      </div>`,
    )
    .join("");

  // rows are dull with just their (boxed) heads; hovering a head lights the row
  // and its tags rise in — CSS. JS: stagger the heads in on open + decode each
  // head's letters (the earlier scramble effect), and re-decode on hover.
  const groups = Array.from(wrap.querySelectorAll<HTMLElement>(".skill-group"));
  const heads = Array.from(wrap.querySelectorAll<HTMLElement>(".skill-group-name"));
  if (!REDUCED) gsap.set(groups, { autoAlpha: 0, y: 18 });

  heads.forEach((h) => {
    const label = h.dataset.label ?? h.textContent ?? "";
    let busy = false;
    const grp = h.closest(".skill-group")!;
    grp.addEventListener("pointerenter", () => {
      if (busy || REDUCED) return;
      busy = true;
      scramble(h, label, 340);
      gsap.delayedCall(0.4, () => (busy = false));
    });
  });

  plays.skills = () => {
    if (REDUCED) {
      gsap.set(groups, { clearProps: "all" });
      return;
    }
    gsap.to(groups, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.07 });
    heads.forEach((h, i) =>
      gsap.delayedCall(0.15 + i * 0.07, () => scramble(h, h.dataset.label ?? "", 460)),
    );
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
          <button class="proj-frame" type="button" data-proj="${i}" aria-label="Preview ${p.title}">
            ${
              p.video
                ? `<video src="${p.video}" muted loop playsinline preload="metadata"></video>`
                : `<div class="proj-frame-ph"><span>▶ demo</span></div>`
            }
            <span class="proj-year">${p.year}</span>
          </button>`;
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
  // project descriptions — word-by-word dim→bright, played per card
  const blurbs = cards.map((c) => {
    const b = c.querySelector<HTMLElement>(".proj-blurb");
    if (b) prepWordsDim(b);
    return b;
  });

  const page = document.getElementById("work")!;

  // line fill, tied to how far you've scrolled through the (internally-scrolling) page
  const updateFill = () => {
    const max = page.scrollHeight - page.clientHeight;
    gsap.set(fill, { scaleY: max > 4 ? Math.min(page.scrollTop / max, 1) : 0 });
  };
  page.addEventListener("scroll", updateFill, { passive: true });
  window.addEventListener("resize", updateFill, { passive: true });

  // each project's description does its dim→bright word reveal when THAT project
  // scrolls into view; scroll away and back and it replays.
  const shown = new Set<HTMLElement>();
  const checkBlurbs = () => {
    if (REDUCED || !page.classList.contains("slide--active")) return;
    const vh = page.clientHeight;
    for (const b of blurbs) {
      if (!b) continue;
      const top = b.getBoundingClientRect().top - page.getBoundingClientRect().top;
      const inView = top < vh * 0.82 && top > vh * 0.05;
      if (inView && !shown.has(b)) {
        shown.add(b);
        playWordsDim(b, 0, 0.055, 0.72);
      } else if (!inView && shown.has(b)) {
        shown.delete(b);
        dimWords(b);
      }
    }
  };
  page.addEventListener("scroll", checkBlurbs, { passive: true });

  // click a frame → in-page preview overlay
  initProjModal(projects);
  tl.querySelectorAll<HTMLElement>(".proj-frame").forEach((f) => {
    f.addEventListener("click", () => openProjModal(Number(f.dataset.proj)));
  });

  // hover-play demo video
  tl.querySelectorAll<HTMLVideoElement>(".proj-frame video").forEach((v) => {
    const host = v.closest(".proj-frame")!;
    host.addEventListener("pointerenter", () => void v.play().catch(() => {}));
    host.addEventListener("pointerleave", () => v.pause());
  });

  plays.work = () => {
    if (REDUCED) {
      gsap.set(cards, { clearProps: "all" });
      blurbs.forEach((b) => b && gsap.set(b.querySelectorAll(".w-inner"), { clearProps: "all" }));
      return;
    }
    shown.clear();
    blurbs.forEach((b) => b && dimWords(b));
    cards.forEach((c, i) => {
      const d = Math.min(i, 5) * 0.12;
      gsap.to(c, { autoAlpha: 1, x: 0, duration: 0.75, ease: "power3.out", delay: d });
    });
    // reveal whatever's already in view once the page is up
    gsap.delayedCall(0.35, checkBlurbs);
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
      const d = Math.min(i, 6) * 0.12;
      gsap.to(r.querySelector(".xp-period"), {
        autoAlpha: 1,
        x: 0,
        duration: 0.7,
        ease: "power3.out",
        delay: d,
      });
      gsap.to(r.querySelector(".xp-detail"), {
        autoAlpha: 1,
        x: 0,
        duration: 0.7,
        ease: "power3.out",
        delay: d + 0.05,
      });
    });
  };
}

/* ---------------- 05 · contact (find me + form + direct line, one page) ---------------- */
function initContact() {
  // -- social links
  const list = document.querySelector<HTMLElement>("#social-list");
  let items: HTMLElement[] = [];
  if (list) {
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
    items = Array.from(list.querySelectorAll<HTMLElement>(".social"));
    if (!REDUCED) gsap.set(items, { autoAlpha: 0, y: 24 });
  }

  // -- direct line
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

  const foot = document.querySelector<HTMLElement>(".contact-foot");
  const fields = Array.from(document.querySelectorAll<HTMLElement>("#xmit .field"));
  if (!REDUCED) {
    if (foot) gsap.set(foot, { autoAlpha: 0, y: 24 });
    gsap.set(fields, { autoAlpha: 0, y: 18 });
  }

  plays.contact = () => {
    if (REDUCED) {
      const all: HTMLElement[] = [...items, ...fields];
      if (foot) all.push(foot);
      gsap.set(all, { clearProps: "all" });
      return;
    }
    if (items.length)
      gsap.fromTo(
        items,
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.55, ease: "power3.out", stagger: 0.07, delay: 0.1 },
      );
    gsap.fromTo(
      fields,
      { autoAlpha: 0, y: 18 },
      { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.06, delay: 0.35 },
    );
    if (foot)
      gsap.fromTo(
        foot,
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out", delay: 0.55 },
      );
  };

  // -- the form itself
  const form = document.querySelector<HTMLFormElement>("#xmit");
  const status = document.querySelector<HTMLElement>("#xmit-status");
  if (!form || !status) return;

  const btn0 = form.querySelector<HTMLButtonElement>(".xmit-btn");
  if (btn0) magnetic(btn0, 0.4);

  const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY as string | undefined;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector<HTMLButtonElement>(".xmit-btn")!;
    const label = btn.querySelector<HTMLElement>(".xmit-label")!;
    const sweep = btn.querySelector<HTMLElement>(".xmit-sweep")!;
    const say = (msg: string, state: "ok" | "err") => {
      status.textContent = msg;
      status.dataset.state = state;
    };
    const reset = (delay = 4) =>
      gsap.delayedCall(delay, () => {
        label.textContent = "Transmit signal";
        btn.disabled = false;
        gsap.set(sweep, { xPercent: -100 });
      });

    if (!form.checkValidity()) {
      say("// fill every field before transmitting", "err");
      return;
    }
    // honeypot — bots tick it, humans never see it
    if ((form.querySelector('[name="botcheck"]') as HTMLInputElement | null)?.checked) return;

    btn.disabled = true;
    status.textContent = "";
    delete status.dataset.state;
    label.textContent = "transmitting…";
    const sending = REDUCED
      ? null
      : gsap.fromTo(sweep, { xPercent: -100 }, { xPercent: 0, duration: 1.4, ease: "none" });

    try {
      if (!WEB3FORMS_KEY) throw new Error("no-key");
      const body = new FormData(form);
      body.append("access_key", WEB3FORMS_KEY);
      body.append("subject", "voidloop-dev — new signal");
      body.append("from_name", "voidloop-dev portfolio");
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { Accept: "application/json" },
        body,
      });
      const json = (await res.json()) as { success?: boolean; message?: string };
      sending?.kill();
      if (!json.success) throw new Error(json.message || "failed");
      if (!REDUCED) gsap.to(sweep, { xPercent: 100, duration: 0.4, ease: "power2.in" });
      label.textContent = "signal sent ✓";
      say("// received — I'll get back to you", "ok");
      form.reset();
      reset(4);
    } catch (err) {
      sending?.kill();
      gsap.set(sweep, { xPercent: -100 });
      label.textContent = "Transmit signal";
      btn.disabled = false;
      say(
        (err as Error).message === "no-key"
          ? `// form not wired yet — email me at ${profile.email}`
          : `// transmission failed — email me at ${profile.email}`,
        "err",
      );
    }
  });
}

/** Run a section's reveals + dynamic content animation. Called by the deck. */
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
  initContact();
}
