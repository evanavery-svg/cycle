# 🌸 cycle

A gentle, private **period & cycle tracker** built as an installable Progressive Web App (PWA). Pink, minimalist, and designed to feel at home next to your favorite iOS apps.

> **Not medical advice.** cycle is an app, not a doctor. Predictions are estimates and the PCOS self-check is an awareness tool, not a diagnosis. Always consult a healthcare professional for medical concerns.

## Features

- **Smart calendar** — see logged periods, predicted next cycle, your fertile window, and your most fertile (ovulation) day at a glance.
- **Cycle phase ring** — know what phase you're in (menstrual, follicular, ovulation, luteal) and what's coming next.
- **Log period** — record current *or* past periods, with start and end dates.
- **Daily log** — flow, ~20 symptoms, ~20 moods, intimacy & sex drive, vaginal discharge, digestion, and free-text notes.
- **Monthly & yearly review** — period days, cycle stats, top symptoms, mood breakdown, and a month-by-month overview.
- **Learn** — phase-by-phase exercise guidance, foods that feel good on your period, and a PCOS self-assessment checklist.
- **Installable** — add it to your Home Screen for a full-screen, app-like experience. An in-app tip shows you how.
- **Always fresh** — the service worker uses a network-first strategy, so the app updates on every launch when online, while still working offline.
- **Private by design** — all data is stored locally on your device (`localStorage`). Nothing is sent anywhere.

## Run locally

It's a static site — no build step. Serve the folder with any static server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

A server (rather than opening the file directly) is needed so the service worker and manifest load correctly.

## Deploy

Works on any static host. For **GitHub Pages**, enable Pages for this branch/repo and the app is live — all asset paths are relative.

## Project structure

```
index.html              app shell + service-worker registration
css/styles.css          pink, minimalist, animated styling
js/app.js               all app logic (calendar, predictions, logging, reviews)
manifest.webmanifest    PWA manifest
sw.js                   service worker (network-first, offline fallback)
icons/                  app icons (192, 512, maskable, apple-touch)
```

## Tech

Plain HTML, CSS, and JavaScript. No frameworks, no dependencies, no tracking.
