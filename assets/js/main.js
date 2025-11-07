import { ROSTER } from "./roster.js";

const SELECTORS = {
  navToggle: "[data-nav-toggle]",
  navList: "[data-nav-list]",
  navLink: "[data-nav-link]",
  featuredCard: "[data-featured-card]",
  featuredDivision: "[data-featured-division]",
  featuredName: "[data-featured-name]",
  featuredSummary: "[data-featured-summary]",
  featuredTags: "[data-featured-tags]",
  featuredLink: "[data-featured-link]",
  quickBrowseTrack: "[data-quick-browse]",
  divisionGrid: "[data-division-grid]",
  divisionEmpty: "[data-division-empty]",
  filterForm: "[data-filter-form]"
};

const KEY_CODES = {
  ESC: "Escape",
  TAB: "Tab"
};

document.documentElement.classList.remove("no-js");

initNavigation();
initFeaturedFighter();
initQuickBrowse();
initDivisionGrid();

function initNavigation() {
  const navToggle = document.querySelector(SELECTORS.navToggle);
  const navList = document.querySelector(SELECTORS.navList);
  if (!navToggle || !navList) return;

  navToggle.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    const nextState = !expanded;
    navToggle.setAttribute("aria-expanded", String(nextState));
    navList.parentElement?.setAttribute("data-open", String(nextState));
  });

  navList.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.matches("a")) {
      navToggle.setAttribute("aria-expanded", "false");
      navList.parentElement?.setAttribute("data-open", "false");
    }
  });

  const path = window.location.pathname;
  const pageKey = derivePageKey(path);
  const links = navList.querySelectorAll(SELECTORS.navLink);
  links.forEach((link) => {
    const linkEl = link;
    const key = linkEl.getAttribute("data-nav-link");
    const isActive = key === pageKey;
    linkEl.setAttribute("data-active", String(isActive));
    if (isActive) {
      linkEl.setAttribute("aria-current", "page");
    } else {
      linkEl.removeAttribute("aria-current");
    }
  });
}

function derivePageKey(pathname) {
  if (pathname.includes("/fighters/")) {
    return "divisions";
  }
  const file = pathname.split("/").pop() || "index.html";
  if (file === "" || file === "index.html") return "home";
  if (file.endsWith(".html")) {
    return file.replace(".html", "");
  }
  return "home";
}

function getAllFighters() {
  return ROSTER.divisions.flatMap((division) =>
    division.fighters.map((fighter) => ({
      fighter,
      division
    }))
  );
}

function initFeaturedFighter() {
  const featuredCard = document.querySelector(SELECTORS.featuredCard);
  if (!featuredCard) return;

  const fighters = getAllFighters();
  if (!fighters.length) return;
  const { fighter, division } = fighters[Math.floor(Math.random() * fighters.length)];

  const divisionEl = featuredCard.querySelector(SELECTORS.featuredDivision);
  const nameEl = featuredCard.querySelector(SELECTORS.featuredName);
  const summaryEl = featuredCard.querySelector(SELECTORS.featuredSummary);
  const tagsEl = featuredCard.querySelector(SELECTORS.featuredTags);
  const linkEl = featuredCard.querySelector(SELECTORS.featuredLink);
  const imgEl = featuredCard.querySelector("img");

  if (divisionEl) {
    divisionEl.textContent = `${division.name} · Rank #${fighter.rank}`;
  }
  if (nameEl) {
    nameEl.textContent = fighter.name;
  }
  if (summaryEl) {
    summaryEl.textContent = fighter.summary;
  }
  if (tagsEl) {
    tagsEl.innerHTML = "";
    const tags = [
      `Record ${fighter.record}`,
      fighter.stance,
      fighter.nationality,
      fighter.gym
    ];
    tags.slice(0, 4).forEach((tag) => {
      const li = document.createElement("li");
      li.textContent = tag;
      tagsEl.appendChild(li);
    });
  }
  if (linkEl) {
    linkEl.setAttribute("href", `fighters/${fighter.slug}.html`);
    linkEl.setAttribute("aria-label", `View the profile for ${fighter.name}`);
  }
  if (imgEl) {
    imgEl.src = fighter.img;
    imgEl.alt = fighter.imgAlt || `${fighter.name} promotional portrait`;
    imgEl.loading = "lazy";
  }
}

function initQuickBrowse() {
  const track = document.querySelector(SELECTORS.quickBrowseTrack);
  if (!track) return;

  ROSTER.divisions.forEach((division) => {
    const item = document.createElement("article");
    item.className = "quick-browse__item";
    item.setAttribute("role", "listitem");

    const trigger = document.createElement("button");
    trigger.className = "quick-browse__trigger";
    trigger.type = "button";
    trigger.textContent = division.name;
    const dialogId = `qb-dialog-${division.id}`;
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-controls", dialogId);

    const weight = document.createElement("span");
    weight.className = "division-card__weight";
    weight.textContent = division.weight;
    weight.setAttribute("aria-hidden", "true");

    const dialog = document.createElement("dialog");
    dialog.className = "quick-browse__dialog";
    dialog.id = dialogId;

    const title = document.createElement("h3");
    title.textContent = division.name;
    dialog.appendChild(title);

    const closeBtn = document.createElement("button");
    closeBtn.className = "dialog-close";
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close quick browse dialog");
    closeBtn.innerHTML = "&times;";
    dialog.appendChild(closeBtn);

    const list = document.createElement("div");
    list.className = "quick-browse__list";

    division.fighters.forEach((fighter) => {
      const link = document.createElement("a");
      link.href = `fighters/${fighter.slug}.html`;
      link.className = "button button--ghost";
      link.textContent = fighter.name;

      const rank = document.createElement("span");
      rank.className = "badge badge--secondary";
      rank.textContent = `Rank #${fighter.rank}`;
      link.appendChild(rank);

      list.appendChild(link);
    });

    dialog.appendChild(list);

    item.append(trigger, weight, dialog);
    track.appendChild(item);

    setupDialog(trigger, dialog, closeBtn);
  });
}

function setupDialog(trigger, dialog, closeBtn) {
  if (!(dialog instanceof HTMLDialogElement)) return;

  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "textarea:not([disabled])",
    "select:not([disabled])"
  ];

  let previousFocusEl = null;

  const trapFocus = (event) => {
    if (event.key !== KEY_CODES.TAB) return;
    const focusable = Array.from(dialog.querySelectorAll(focusableSelectors.join(","))).filter(
      (el) => el instanceof HTMLElement && el.offsetParent !== null
    );
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const openDialog = () => {
    previousFocusEl = document.activeElement;
    dialog.showModal();
    const firstFocusable = dialog.querySelector(focusableSelectors.join(","));
    if (firstFocusable instanceof HTMLElement) {
      firstFocusable.focus();
    }
    dialog.addEventListener("keydown", trapFocus);
  };

  const closeDialog = () => {
    dialog.close();
    dialog.removeEventListener("keydown", trapFocus);
    if (previousFocusEl instanceof HTMLElement) {
      previousFocusEl.focus();
    } else if (trigger instanceof HTMLElement) {
      trigger.focus();
    }
  };

  trigger.addEventListener("click", openDialog);
  closeBtn.addEventListener("click", closeDialog);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog();
  });
  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    const isInDialog =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!isInDialog) {
      closeDialog();
    }
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === KEY_CODES.ESC) {
      event.preventDefault();
      closeDialog();
    }
  });
}

function initDivisionGrid() {
  const grid = document.querySelector(SELECTORS.divisionGrid);
  if (!grid) return;

  const state = {
    minWeight: 115,
    maxWeight: 265,
    groups: new Set(["mens", "womens"]),
    query: ""
  };

  const form = document.querySelector(SELECTORS.filterForm);
  const emptyMessage = document.querySelector(SELECTORS.divisionEmpty);

  const render = () => {
    grid.innerHTML = "";
    const filtered = filterDivisions(ROSTER.divisions, state);
    if (!filtered.length) {
      if (emptyMessage) emptyMessage.hidden = false;
      return;
    }
    if (emptyMessage) emptyMessage.hidden = true;

    filtered.forEach((division) => {
      const card = document.createElement("article");
      card.className = "division-card";

      const header = document.createElement("div");
      header.className = "division-card__header";
      const title = document.createElement("h2");
      title.textContent = division.name;
      const weight = document.createElement("span");
      weight.className = "division-card__weight";
      weight.textContent = division.weight;

      header.append(title, weight);
      card.appendChild(header);

      const list = document.createElement("div");
      list.className = "fighter-mini-list";

      division.fighters.forEach((fighter) => {
        const link = document.createElement("a");
        link.className = "fighter-mini-card";
        link.href = `fighters/${fighter.slug}.html`;
        link.setAttribute("aria-label", `${fighter.name}, rank ${fighter.rank} in ${division.name}`);

        const img = document.createElement("img");
        img.className = "fighter-mini-card__img";
        img.src = fighter.img;
        img.alt = fighter.imgAlt || `${fighter.name} profile photo`;
        img.loading = "lazy";
        img.width = 72;
        img.height = 72;

        const meta = document.createElement("div");
        meta.className = "fighter-mini-card__meta";
        const name = document.createElement("p");
        name.textContent = fighter.name;
        name.style.margin = "0";

        const rank = document.createElement("span");
        rank.className = "badge";
        rank.textContent = `Rank #${fighter.rank}`;

        const record = document.createElement("span");
        record.className = "badge badge--secondary";
        record.textContent = fighter.record;

        meta.append(name, rank, record);
        link.append(img, meta);
        list.appendChild(link);
      });

      card.appendChild(list);
      grid.appendChild(card);
    });
  };

  render();

  if (!form) return;

  form.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.name === "query") {
      state.query = target.value.trim().toLowerCase();
    } else if (target.name === "minWeight") {
      state.minWeight = Number(target.value) || state.minWeight;
    } else if (target.name === "maxWeight") {
      state.maxWeight = Number(target.value) || state.maxWeight;
    } else if (target.name === "group") {
      if (target.checked) {
        state.groups.add(target.value);
      } else {
        state.groups.delete(target.value);
      }
      if (state.groups.size === 0) {
        // prevent filtering everything out with zero groups
        state.groups.add(target.value);
        target.checked = true;
      }
    }
    render();
  });

  form.addEventListener("reset", (event) => {
    event.preventDefault();
    form.reset();
    state.minWeight = 115;
    state.maxWeight = 265;
    state.groups = new Set(["mens", "womens"]);
    state.query = "";
    Array.from(form.elements).forEach((el) => {
      if (el instanceof HTMLInputElement && el.name === "group") {
        el.checked = true;
      }
      if (el instanceof HTMLInputElement && el.name === "minWeight") {
        el.value = "115";
      }
      if (el instanceof HTMLInputElement && el.name === "maxWeight") {
        el.value = "265";
      }
      if (el instanceof HTMLInputElement && el.name === "query") {
        el.value = "";
      }
    });
    render();
  });
}

function filterDivisions(divisions, state) {
  return divisions
    .filter((division) => {
      const isMens = division.id.startsWith("mens-");
      const isWomens = division.id.startsWith("womens-");
      if (isMens && !state.groups.has("mens")) return false;
      if (isWomens && !state.groups.has("womens")) return false;

      const weightValue = parseInt(division.weight, 10);
      if (Number.isFinite(weightValue)) {
        if (weightValue < state.minWeight || weightValue > state.maxWeight) {
          return false;
        }
      }

      if (!state.query) return true;
      return division.fighters.some((fighter) =>
        fighter.name.toLowerCase().includes(state.query)
      );
    })
    .sort((a, b) => parseInt(a.weight, 10) - parseInt(b.weight, 10));
}
