// Page entry point. Wires:
//   - theme toggle (light / dark / auto, persisted in localStorage)
//   - architecture SVG inlined into the multi-path card
//   - repo grid built from REPOS
//   - the live counter demo (./demo)

import "./styles.css";
import archSvg from "./assets/architecture.svg?raw";
import { mountDemo } from "./demo";
import { REPOS, groupLabel, repoUrl } from "./data/repos";

const THEME_KEY = "goodnet-theme";
type Theme = "auto" | "dark" | "light";

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
}

function pickInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light" || saved === "auto") return saved;
  } catch {
    /* ignore */
  }
  return "auto";
}

function cycleTheme(current: Theme): Theme {
  if (current === "auto") return "dark";
  if (current === "dark") return "light";
  return "auto";
}

function themeIcon(theme: Theme): string {
  switch (theme) {
    case "auto":
      return "◐";
    case "dark":
      return "●";
    case "light":
      return "○";
  }
}

function setupTheme(): void {
  let current = pickInitialTheme();
  applyTheme(current);
  const btn = document.getElementById("theme-toggle");
  if (!(btn instanceof HTMLButtonElement)) return;
  const icon = btn.querySelector<HTMLElement>(".theme-icon");
  if (icon) icon.textContent = themeIcon(current);
  btn.addEventListener("click", () => {
    current = cycleTheme(current);
    applyTheme(current);
    try {
      localStorage.setItem(THEME_KEY, current);
    } catch {
      /* ignore */
    }
    if (icon) icon.textContent = themeIcon(current);
    btn.title = `Theme: ${current}`;
  });
}

function mountArchitectureDiagram(): void {
  const slot = document.getElementById("arch-diagram-slot");
  if (!slot) return;
  slot.innerHTML = archSvg;
}

function mountRepoGrid(): void {
  const grid = document.getElementById("repo-grid");
  if (!grid) return;
  // Build via DOM APIs to avoid HTML injection from the static catalogue.
  const fragment = document.createDocumentFragment();
  for (const repo of REPOS) {
    const card = document.createElement("a");
    card.className = "repo-card";
    card.href = repoUrl(repo.name);
    card.target = "_blank";
    card.rel = "noopener";

    const name = document.createElement("span");
    name.className = "repo-name";
    name.textContent = repo.name;

    const desc = document.createElement("span");
    desc.className = "repo-desc";
    desc.textContent = repo.description;

    const meta = document.createElement("span");
    meta.className = "repo-meta";
    meta.textContent = groupLabel(repo.group);

    card.append(name, desc, meta);
    fragment.append(card);
  }
  grid.replaceChildren(fragment);
}

document.addEventListener("DOMContentLoaded", () => {
  setupTheme();
  mountArchitectureDiagram();
  mountRepoGrid();
  mountDemo();
});
