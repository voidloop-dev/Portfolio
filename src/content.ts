/**
 * All copy in one place — swap these for the real thing later, no markup changes.
 * "demo" / placeholder values are intentional for this first pass.
 */

export const profile = {
  handle: "voidloop-dev",
  name: "Your Name", // ← your real name goes here
  // the word after "I am" cycles through these
  roles: ["a builder", "an engineer", "a problem-solver", "relentless", "voidloop"],
  intro: [
    "demo — a couple of lines about who you are and what you build. Keep it plain and specific.",
    "demo — the kind of problems you like, how you work, what you're going deep on right now.",
  ],
  email: "you@example.com",
  phone: "+92 300 0000000",
  location: "Pakistan · working across time zones",
};

export const socials = [
  { label: "Résumé", href: "/resume.pdf", note: "PDF" },
  { label: "GitHub", href: "https://github.com/voidloop-dev", note: "@voidloop-dev" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/your-handle", note: "in/your-handle" },
  { label: "Instagram", href: "https://instagram.com/your-handle", note: "@your-handle" },
];

export const skillGroups = [
  { name: "Languages", items: ["TypeScript", "Python", "C++", "Go", "SQL", "Rust"] },
  { name: "Frontend", items: ["React", "Next.js", "Vite", "GSAP", "Three.js", "Tailwind"] },
  { name: "Backend", items: ["Node.js", "FastAPI", "PostgreSQL", "Redis", "GraphQL", "WebSockets"] },
  { name: "AI / ML", items: ["PyTorch", "LangChain", "RAG", "Embeddings", "Fine-tuning", "Evals"] },
  { name: "Infra", items: ["Docker", "AWS", "Vercel", "CI/CD", "Linux", "Terraform"] },
];

export type Project = {
  title: string;
  year: string;
  blurb: string;
  tech: string[];
  href: string;
  video?: string; // mp4 path; empty = placeholder frame
};

export const projects: Project[] = [
  {
    title: "Project One",
    year: "2026",
    blurb:
      "demo — one or two sentences on what it does, the hard part you solved, and the outcome. Numbers help.",
    tech: ["TypeScript", "React", "WebGL"],
    href: "#",
  },
  {
    title: "Project Two",
    year: "2025",
    blurb:
      "demo — what it does and why it mattered. Mention scale, users, or a measurable result if you have one.",
    tech: ["Python", "FastAPI", "Postgres"],
    href: "#",
  },
  {
    title: "Project Three",
    year: "2025",
    blurb: "demo — short, concrete, no fluff. Link to the repo or a live demo.",
    tech: ["Next.js", "LangChain", "Redis"],
    href: "#",
  },
  {
    title: "Project Four",
    year: "2024",
    blurb: "demo — the one you're proudest of, or the one that taught you the most.",
    tech: ["Go", "gRPC", "Docker"],
    href: "#",
  },
];

export type Experience = {
  period: string;
  role: string;
  org: string;
  points: string[];
};

export const experience: Experience[] = [
  {
    period: "2025 — now",
    role: "Full-Stack Engineer",
    org: "Company / Freelance",
    points: [
      "demo — a shipped thing and its impact.",
      "demo — a responsibility or a system you own.",
    ],
  },
  {
    period: "2024 — 2025",
    role: "Software Engineer Intern",
    org: "Company",
    points: ["demo — what you built.", "demo — what you learned or improved."],
  },
  {
    period: "2023 — 2024",
    role: "Open Source / Projects",
    org: "Self-directed",
    points: ["demo — a contribution or a project with traction."],
  },
];
