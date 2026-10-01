# AI Foundations Roadmap: notes for Claude

A static GitHub Pages site (installable PWA). It is a 16-week, theory-first roadmap of **free** resources for ML / DL / LLMs / applied AI.
The user returns periodically and asks for it to be updated with new SOTA work.

## Who it's for (requirements agreed 2026-10-02)
- Starts from zero ML, but assumes multivariable calculus + linear algebra.
- ~10 hrs/week, **mainly theory** (builds are optional extras). 3–4 month timeline.
- Goals: ML/AI engineer jobs, research masters prep, applied AI/agents, general literacy.
- Dedicated coverage: computer vision, RL, MLOps/systems, safety & interpretability.
- **Strictly free resources only.** No paid books or courses.
- No progress tracking (no checkboxes or localStorage state).
- Updates are shown via the changelog ("What's new") plus "New" badges.

## Layout
- `data/roadmap.json`: **all content**. Most updates only touch this file.
- `index.html`, `assets/app.js`, `assets/styles.css`: rendering. `app.js` reads the JSON.
- `sw.js`: network-first service worker (offline support). Bump `CACHE` only if the list of shell files changes.
- `scripts/check_links.py`: link checker. `scripts/make_icons.py`: regenerates icons.

## How to do an update ("add new SOTA stuff")
1. Research what's genuinely important and new (web search). Prefer primary sources (arXiv, official blogs) and strong explainers. Free only.
2. Decide where it goes:
   - It fits an existing week's topic: add it to that week's `items`. Usually `"core": false`, unless it supersedes a core item; then swap it and keep the week's core hours at ~10 h or less.
   - It's a big new area: add it as an optional item in the closest week, or propose a new week to the user before restructuring.
   - Something is outdated: demote it to optional or remove it, and say so in the changelog.
3. Give every new item `"added": "YYYY-MM-DD"` (today). This drives the "New" badge (shown for `meta.newBadgeDays` days).
4. Prepend an entry to `changelog` (newest first) listing what was added, changed or removed. Update `meta.lastUpdated`.
5. Run `python scripts/check_links.py` and fix any BROKEN links. BLOCKED? (403) usually means a site blocks bots; check by hand if unsure.
6. Commit and push (`git push` deploys via GitHub Pages).

Item schema: `{ type: paper|video|blog|book|course|docs|code, title, by, url, hours, core, note, added?, links?: [{label,url}] }`.
Weeks: `{ n, title, goal, concepts[], items[], build, added? }`.

## Preview locally
`python -m http.server 8765` (or the `site` config in `.claude/launch.json`), then open http://localhost:8765.
