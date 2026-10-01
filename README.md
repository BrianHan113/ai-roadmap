# AI Foundations Roadmap

A 16-week, theory-first roadmap of free resources for building a solid foundation in AI: classical ML, deep learning, transformers & LLMs, applied AI/agents, plus vision, RL, ML systems, and safety & interpretability.

It's a static site hosted on GitHub Pages that installs on your phone like an app and works offline.

## Publish to GitHub Pages (one-time)

1. Create an **empty** public repo on GitHub named `ai-roadmap` (no README or licence): https://github.com/new
2. Push this folder:
   ```bash
   git remote add origin https://github.com/BrianHan113/ai-roadmap.git
   git push -u origin main
   ```
3. In the repo, open **Settings → Pages**. Under *Build and deployment*, set **Source: Deploy from a branch**, **Branch: `main` / `(root)`**, then click Save.
4. After about a minute the site is live at **https://brianhan113.github.io/ai-roadmap/**.

## Install on your phone

- **Android (Chrome):** open the site, then tap **Install app** in the header (or ⋮ → *Add to Home screen*).
- **iPhone (Safari):** open the site, then tap **Share → Add to Home Screen**.

Once installed it opens full-screen and works offline. Whenever you're online it picks up the latest version automatically.

## Updating

Ask Claude in this folder something like *"update the roadmap with the latest SOTA"* or *"add X to the roadmap"*.
All content lives in `data/roadmap.json`. Changes get logged in the "What's new" section, and new items show a **New** badge.
See `CLAUDE.md` for the full update procedure. Run `python scripts/check_links.py` to check every link.
