"use strict";

const TYPE_LABELS = {
  paper: "Paper", video: "Video", blog: "Blog", book: "Book", course: "Course", docs: "Docs", code: "Code",
};
const DAY = 864e5;

const state = { q: "", type: "all", coreOnly: false, data: null };

// Tiny DOM builder: h("a", {href: "#"}, "text", child)
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "style") el.style.cssText = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

const fmtDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
const fmtHours = (n) => (Math.round(n * 2) / 2).toString().replace(/\.0$/, "");

function isNew(added) {
  if (!added) return false;
  const age = (Date.now() - new Date(added + "T00:00:00").getTime()) / DAY;
  return age >= 0 && age <= (state.data.meta.newBadgeDays || 60);
}

function allWeeks(data) {
  return data.phases.flatMap((p) => p.weeksList.map((w) => ({ ...w, phase: p })));
}

// ---------- rendering ----------

function renderHero(data) {
  const { meta } = data;
  document.getElementById("title").textContent = meta.title;
  document.getElementById("subtitle").textContent = meta.subtitle;
  document.getElementById("assumes").textContent = meta.assumes;
  document.getElementById("lastUpdated").textContent = `Last updated ${fmtDate(meta.lastUpdated)}`;

  const weeks = allWeeks(data);
  const items = weeks.flatMap((w) => w.items);
  const coreHours = items.filter((i) => i.core).reduce((s, i) => s + (i.hours || 0), 0);
  const stats = [
    ["Weeks", weeks.length],
    ["Resources", items.length],
    ["Core hrs / wk", `~${Math.round(coreHours / weeks.length)}`],
    ["Cost", "Free"],
  ];
  document.getElementById("stats").replaceChildren(
    ...stats.map(([k, v]) => h("div", {}, h("dt", {}, k), h("dd", {}, v)))
  );

  document.getElementById("timeline").replaceChildren(
    ...weeks.map((w) =>
      h("a", {
        href: `#week-${w.n}`,
        style: `--phase: var(--${w.phase.id})`,
        title: `Week ${w.n}: ${w.title}`,
        "aria-label": `Week ${w.n}: ${w.title}`,
      }, w.n)
    )
  );
  document.getElementById("legend").replaceChildren(
    ...data.phases.map((p) => h("span", { style: `--phase: var(--${p.id})` }, p.title))
  );
}

function renderNews(data) {
  const [latest, ...older] = data.changelog;
  const el = document.getElementById("news");
  if (!latest) { el.hidden = true; return; }
  el.replaceChildren(...[
    h("h2", { id: "newsTitle" }, "What's new", h("span", { class: "date" }, `· ${fmtDate(latest.date)}`)),
    h("div", {}, h("strong", {}, latest.title)),
    h("ul", {}, latest.notes.map((n) => h("li", {}, n))),
    older.length
      ? h("details", {},
          h("summary", {}, `Earlier updates (${older.length})`),
          h("div", { class: "older" }, older.map((c) => [
            h("h3", {}, `${fmtDate(c.date)} · ${c.title}`),
            h("ul", {}, c.notes.map((n) => h("li", {}, n))),
          ])))
      : null,
  ].filter(Boolean));
}

function renderItem(item) {
  const optional = item.core === false;
  return h("li", { class: `item${optional ? " optional" : ""}`, style: `--type: var(--t-${item.type})` },
    h("span", { class: "bar", "aria-hidden": "true" }),
    h("div", {},
      h("a", { class: "title", href: item.url, target: "_blank", rel: "noopener" }, item.title),
      h("div", { class: "meta" },
        h("span", { class: "type" }, TYPE_LABELS[item.type] || item.type),
        item.by ? h("span", {}, item.by) : null,
        item.hours ? h("span", {}, `~${fmtHours(item.hours)} h`) : null,
        optional ? h("span", { class: "tag-opt" }, "Optional") : null,
        isNew(item.added) ? h("span", { class: "badge-new" }, "New") : null,
      ),
      item.note ? h("p", { class: "note" }, item.note) : null,
      item.links?.length
        ? h("p", { class: "extra" }, item.links.map((l) =>
            h("a", { href: l.url, target: "_blank", rel: "noopener" }, l.label)))
        : null,
    )
  );
}

function renderRoadmap(data) {
  const root = document.getElementById("roadmap");
  root.replaceChildren(
    ...data.phases.map((p) =>
      h("section", { class: "phase", id: p.id, style: `--phase: var(--${p.id})` },
        h("div", { class: "phase-head" },
          h("div", { class: "when" }, p.weeks),
          h("h2", {}, p.title),
          h("p", {}, p.summary),
        ),
        p.weeksList.map((w) => {
          const core = w.items.filter((i) => i.core).reduce((s, i) => s + (i.hours || 0), 0);
          const hasNew = isNew(w.added) || w.items.some((i) => isNew(i.added));
          return h("details", { class: "week card", id: `week-${w.n}`, "data-week": w.n },
            h("summary", {},
              h("span", { class: "num" }, w.n),
              h("div", {},
                h("h3", {}, w.title, hasNew ? [" ", h("span", { class: "badge-new" }, "New")] : null),
                h("div", { class: "sub" }, `~${fmtHours(core)} h core · ${w.items.length} resources`),
              ),
              h("svg", { class: "chev", viewBox: "0 0 24 24", "aria-hidden": "true" }),
            ),
            h("div", { class: "week-body" },
              h("p", { class: "goal" }, h("strong", {}, "Goal: "), w.goal),
              w.concepts?.length ? h("ul", { class: "concepts" }, w.concepts.map((c) => h("li", {}, c))) : null,
              h("ul", { class: "items" }, w.items.map(renderItem)),
              w.build ? h("div", { class: "build" }, h("strong", {}, "Optional build"), w.build) : null,
            ),
          );
        }),
      )
    )
  );
  // h() can't create SVG children, so fill the chevrons here.
  root.querySelectorAll(".chev").forEach((s) => (s.innerHTML = '<path d="m6 9 6 6 6-6"/>'));
}

function renderChips(data) {
  const present = new Set(allWeeks(data).flatMap((w) => w.items.map((i) => i.type)));
  const types = ["all", ...Object.keys(TYPE_LABELS).filter((t) => present.has(t))];
  const wrap = document.getElementById("typeChips");
  wrap.replaceChildren(
    ...types.map((t) =>
      h("button", {
        class: "chip", type: "button", "aria-pressed": String(state.type === t),
        onclick: () => { state.type = t; renderChips(data); applyFilters(); },
      }, t === "all" ? "All" : TYPE_LABELS[t] + "s")
    )
  );
}

function renderWhereNext(data, active = 0) {
  document.getElementById("goalTabs").replaceChildren(
    ...data.whereNext.map((g, i) =>
      h("button", {
        class: "chip", type: "button", role: "tab", "aria-selected": String(i === active),
        onclick: () => renderWhereNext(data, i),
      }, g.goal)
    )
  );
  document.getElementById("goalItems").replaceChildren(...data.whereNext[active].items.map(renderItem));
}

function renderKeepUp(data) {
  document.getElementById("keepUp").replaceChildren(...data.keepUp.map(renderItem));
}

// ---------- filtering ----------

function applyFilters() {
  const q = state.q.trim().toLowerCase();
  const filtering = q || state.type !== "all" || state.coreOnly;
  let anyVisible = false;

  for (const week of allWeeks(state.data)) {
    const el = document.getElementById(`week-${week.n}`);
    const weekText = [week.title, week.goal, ...(week.concepts || [])].join(" ").toLowerCase();
    const weekMatches = q && weekText.includes(q);
    let shown = 0;
    el.querySelectorAll(".item").forEach((li, idx) => {
      const it = week.items[idx];
      const text = [it.title, it.by, it.note].join(" ").toLowerCase();
      const ok = (!q || weekMatches || text.includes(q)) &&
        (state.type === "all" || it.type === state.type) &&
        (!state.coreOnly || it.core);
      li.hidden = !ok;
      if (ok) shown++;
    });
    el.hidden = shown === 0;
    if (shown) anyVisible = true;
    if (q || state.type !== "all") el.open = shown > 0;
  }
  document.querySelectorAll(".phase").forEach((p) => {
    p.hidden = !p.querySelector(".week:not([hidden])");
  });
  document.getElementById("empty").hidden = anyVisible;
  document.querySelectorAll(".build").forEach((b) => (b.hidden = !!filtering && state.type !== "all"));
}

function openFromHash() {
  const m = location.hash.match(/^#week-(\d+)$/);
  if (!m) return;
  const el = document.getElementById(`week-${m[1]}`);
  if (el) { el.open = true; el.scrollIntoView({ block: "start" }); }
}

// ---------- PWA bits ----------

function setupInstall() {
  const btn = document.getElementById("installBtn");
  let deferred = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e;
    btn.hidden = false;
  });
  btn.addEventListener("click", async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    deferred = null;
    btn.hidden = true;
  });
  window.addEventListener("appinstalled", () => (btn.hidden = true));

  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  document.getElementById("iosHint").hidden = !(ios && !standalone);

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").then(() => {
      document.getElementById("offlineNote").textContent = "Works offline once loaded.";
    }).catch(() => {});
  }
}

// ---------- boot ----------

async function boot() {
  setupInstall();
  try {
    const res = await fetch("data/roadmap.json", { cache: "no-cache" });
    state.data = await res.json();
  } catch (err) {
    document.getElementById("roadmap").replaceChildren(
      h("p", { class: "empty" }, "Couldn't load the roadmap. Check your connection and refresh.")
    );
    return;
  }
  const data = state.data;
  document.title = data.meta.title;
  renderHero(data);
  renderNews(data);
  renderChips(data);
  renderRoadmap(data);
  renderWhereNext(data);
  renderKeepUp(data);

  document.getElementById("q").addEventListener("input", (e) => {
    const had = state.q;
    state.q = e.target.value;
    applyFilters();
    // Collapse weeks again when a search is cleared.
    if (had && !state.q && state.type === "all") {
      document.querySelectorAll(".week").forEach((w) => (w.open = false));
    }
  });
  document.getElementById("coreOnly").addEventListener("change", (e) => {
    state.coreOnly = e.target.checked;
    applyFilters();
  });
  window.addEventListener("hashchange", openFromHash);
  // The week elements only exist after render, so do the hash jump ourselves
  // and stop the browser restoring an older scroll position over it.
  if (location.hash) history.scrollRestoration = "manual";
  requestAnimationFrame(openFromHash);
}

boot();
