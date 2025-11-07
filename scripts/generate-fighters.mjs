#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const fightersDir = path.join(rootDir, "fighters");
const rosterPath = path.join(rootDir, "assets/js/roster.js");

async function loadRoster() {
  const source = await fs.readFile(rosterPath, "utf8");
  const match = source.match(/export const ROSTER\s*=\s*(\{[\s\S]*\});?\s*$/);
  if (!match) {
    throw new Error("Unable to parse ROSTER export from roster.js");
  }
  const factory = new Function(`"use strict"; return (${match[1]});`);
  return factory();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildSocialLinks(socials = {}) {
  const entries = Object.entries(socials).filter(([, url]) => Boolean(url));
  if (!entries.length) return "";

  const labels = {
    ig: "Instagram",
    tw: "Twitter / X",
    yt: "YouTube"
  };

  const links = entries
    .map(([key, url]) => {
      const label = labels[key] || key.toUpperCase();
      return `<a class="button button--ghost fighter-social" href="${escapeHtml(
        url
      )}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`;
    })
    .join("");

  return `<div class="fighter-socials" aria-label="Fighter social media">${links}</div>`;
}

function renderGalleryItems(fighter) {
  const images = [
    { src: fighter.img, alt: fighter.imgAlt || `${fighter.name} promotional portrait` }
  ];

  return images
    .map(
      (image) => `<figure class="fighter-gallery__item">
  <img src="../${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}" loading="lazy" width="320" height="360" />
  <figcaption>${escapeHtml(fighter.name)}</figcaption>
</figure>`
    )
    .join("");
}

function buildMetaDescription(fighter, divisionName) {
  const base = `${fighter.name} — rank #${fighter.rank} ${divisionName}. ${fighter.summary}`;
  return base.length > 155 ? `${base.slice(0, 152)}…` : base;
}

function buildStatsList(fighter) {
  const stats = [
    { label: "Record", value: fighter.record },
    { label: "Stance", value: fighter.stance },
    { label: "Height", value: fighter.height },
    { label: "Reach", value: fighter.reach },
    { label: "Nationality", value: fighter.nationality },
    { label: "Gym", value: fighter.gym }
  ];

  return stats
    .map(
      (stat) => `<div class="fighter-stat">
  <span class="fighter-stat__label">${escapeHtml(stat.label)}</span>
  <span class="fighter-stat__value">${escapeHtml(stat.value)}</span>
</div>`
    )
    .join("");
}

function buildNotableFights(fighter) {
  if (!Array.isArray(fighter.notableFights) || fighter.notableFights.length === 0) {
    return "<p>No notable fights listed yet.</p>";
  }

  return `<ul class="fighter-fights">
${fighter.notableFights
  .map((fight) => `  <li>${escapeHtml(fight)}</li>`)
  .join("\n")}
</ul>`;
}

function buildBreadcrumb(fighter) {
  return `<nav class="breadcrumb" aria-label="Breadcrumb">
  <ol>
    <li><a href="../index.html">Home</a></li>
    <li><a href="../divisions.html">Divisions</a></li>
    <li aria-current="page">${escapeHtml(fighter.name)}</li>
  </ol>
</nav>`;
}

function buildFighterHtml(fighter, division) {
  const title = `${fighter.name} | ${division.name} | UFC: Two Per Division`;
  const metaDesc = buildMetaDescription(fighter, division.name);
  const heroBanner = `../assets/img/divisions/${division.id}.webp`;

  return `<!DOCTYPE html>
<html lang="en" class="no-js">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${escapeHtml(metaDesc)}" />
    <title>${escapeHtml(title)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="preload"
      as="style"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Poppins:wght@600;700&display=swap"
      onload="this.onload=null;this.rel='stylesheet'"
    />
    <noscript>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Poppins:wght@600;700&display=swap"
      />
    </noscript>
    <link rel="stylesheet" href="../assets/css/styles.min.css" />
  </head>
  <body data-page="fighter">
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header">
      <div class="container nav-wrapper">
        <a class="brand" href="../index.html" aria-label="UFC: Two Per Division home">
          <span aria-hidden="true">UFC</span>
          <small>Two Per Division</small>
        </a>
        <nav class="site-nav" aria-label="Primary navigation">
          <button
            class="nav-toggle"
            type="button"
            aria-expanded="false"
            aria-controls="nav-list"
            data-nav-toggle
          >
            <span class="nav-toggle__line" aria-hidden="true"></span>
            <span class="nav-toggle__line" aria-hidden="true"></span>
            <span class="nav-toggle__line" aria-hidden="true"></span>
            <span class="sr-only">Menu</span>
          </button>
          <ul class="nav-list" id="nav-list" data-nav-list>
            <li><a href="../index.html" data-nav-link="home">Home</a></li>
            <li><a href="../divisions.html" data-nav-link="divisions">Divisions</a></li>
            <li><a href="../about.html" data-nav-link="about">About</a></li>
          </ul>
        </nav>
      </div>
    </header>

    <main id="main">
      <section
        class="fighter-hero"
        style="background-image: url('${escapeHtml(heroBanner)}');"
        aria-labelledby="fighter-hero-title"
      >
        <div class="fighter-hero__overlay"></div>
        <div class="container fighter-hero__content">
          ${buildBreadcrumb(fighter)}
          <div class="fighter-hero__grid">
            <div class="fighter-hero__meta">
              <p class="eyebrow">${escapeHtml(division.name)}</p>
              <h1 id="fighter-hero-title">${escapeHtml(fighter.name)}</h1>
              <p class="fighter-hero__rank">Rank #${escapeHtml(fighter.rank)}</p>
              <p class="fighter-hero__summary">${escapeHtml(fighter.summary)}</p>
              <div class="fighter-hero__links">
                <a class="button button--secondary" href="../divisions.html">Back to Divisions</a>
                ${buildSocialLinks(fighter.socials)}
              </div>
            </div>
            <div class="fighter-hero__portrait">
              <img
                src="../${escapeHtml(fighter.img)}"
                alt="${escapeHtml(fighter.imgAlt || fighter.name)}"
                width="420"
                height="520"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      <section class="fighter-overview" aria-labelledby="overview-title">
        <div class="container fighter-overview__grid">
          <article>
            <h2 id="overview-title">Overview</h2>
            <p>${escapeHtml(fighter.summary)}</p>
          </article>
          <article aria-labelledby="stats-title">
            <h2 id="stats-title">Stats</h2>
            <div class="fighter-stats">
              ${buildStatsList(fighter)}
            </div>
          </article>
          <article aria-labelledby="notable-title">
            <h2 id="notable-title">Notable fights</h2>
            ${buildNotableFights(fighter)}
          </article>
        </div>
      </section>

      <section class="fighter-gallery" aria-labelledby="gallery-title">
        <div class="container">
          <div class="section-header section-header--compact">
            <p class="eyebrow">Gallery</p>
            <h2 id="gallery-title">Moments &amp; highlights</h2>
            <p class="section-subtitle">
              A quick visual snapshot of ${escapeHtml(fighter.name)} in action.
            </p>
          </div>
          <div class="fighter-gallery__grid">
            ${renderGalleryItems(fighter)}
          </div>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="container">
        <div class="footer__top">
          <div class="footer__brand">
            <a class="brand brand--inverse" href="../index.html">
              <span aria-hidden="true">UFC</span>
              <small>Two Per Division</small>
            </a>
            <p class="footer__tagline">
              Curated snapshots of the UFC landscape, two contenders at a time.
            </p>
          </div>
          <div class="footer__links" aria-label="Social links">
            <a
              class="footer__icon-link"
              href="https://www.linkedin.com/in/<MY-USERNAME>/"
              target="_blank"
              rel="noopener"
            >
              <span class="sr-only">LinkedIn</span>
              <img src="../assets/img/icons/linkedin.svg" alt="" aria-hidden="true" />
            </a>
            <a
              class="footer__icon-link"
              href="https://github.com/<MY-USERNAME>"
              target="_blank"
              rel="noopener"
            >
              <span class="sr-only">GitHub</span>
              <img src="../assets/img/icons/github.svg" alt="" aria-hidden="true" />
            </a>
            <a
              class="footer__icon-link"
              href="https://www.instagram.com/<MY-USERNAME>/"
              target="_blank"
              rel="noopener"
            >
              <span class="sr-only">Instagram</span>
              <img src="../assets/img/icons/instagram.svg" alt="" aria-hidden="true" />
            </a>
          </div>
        </div>
        <div class="footer__bottom">
          <p class="footer__disclaimer">
            Unofficial fan site for educational purposes. All rights belong to their respective owners.
          </p>
        </div>
      </div>
    </footer>

    <script type="module" src="../assets/js/main.min.js" defer></script>
  </body>
</html>`;
}

async function ensureDirectory(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function generate() {
  const roster = await loadRoster();
  await ensureDirectory(fightersDir);

  const tasks = roster.divisions.flatMap((division) =>
    division.fighters.map(async (fighter) => {
      const html = buildFighterHtml(fighter, division);
      const outPath = path.join(fightersDir, `${fighter.slug}.html`);
      await fs.writeFile(outPath, html, "utf8");
      return outPath;
    })
  );

  const outputs = await Promise.all(tasks);
  console.log(`Generated ${outputs.length} fighter pages.`);
}

generate().catch((error) => {
  console.error("Failed to generate fighter pages:", error);
  process.exitCode = 1;
});
