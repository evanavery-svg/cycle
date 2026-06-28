# 🌸 cycle

A gentle, private **period & cycle tracker** built as an installable Progressive Web App (PWA). Minimalist, beautifully animated, and designed to feel at home next to your favorite iOS apps.

**Sync your life to your cycle.** cycle's headline feature is **cycle syncing** — phase-by-phase guidance on how to eat, move, focus, and care for yourself as your hormones shift through the menstrual, follicular, ovulation, and luteal phases.

> **Not medical advice.** cycle is a wellness tool, not a doctor. Predictions are estimates and the PCOS self-check is an awareness tool, not a diagnosis. Always consult a healthcare professional for medical concerns.

## Features

- **🌙 Cycle syncing** — a phase-aware card on your home screen plus a full guide: what to eat, how to move, where to focus, and how to care for yourself in each of the four phases.
- **Smart calendar** — logged periods, predicted next cycle, fertile window, and your most fertile (ovulation) day at a glance, plus health-event markers.
- **Cycle phase ring** — know what phase you're in and what's coming next.
- **Log period** — record current *or* past periods, with start and end dates.
- **Daily log** — flow, ~20 symptoms, ~20 moods, intimacy & sex drive, vaginal discharge, digestion, and free-text notes.
- **Monthly & yearly review** — period days, cycle stats, top symptoms, mood breakdown, and a month-by-month overview.
- **🎨 Themes** — Blossom (pink, default), Underwater (calm ocean), and Cosmos (a dark, starry night). Switch anytime; your data is untouched.
- **🔔 Notifications you control** — gentle reminders with a one-tap master off switch, a **discreet mode** that hides the word "period," and granular toggles. Reminders are checked when you open the app.
- **💊 Medication reminders** — birth control, pain relief, supplements — with time and repeat schedule.
- **📌 Health timeline** — log milestones like getting an IUD or starting/stopping birth control; they appear on your calendar.
- **🍎 Apple Health** — import your Cycle Tracking data from an Apple Health export, and export an Apple Health–format file to bring back in (via the iOS *Import Health Data* Shortcut).
- **🩺 PCOS self-check** — a simple awareness checklist (clearly not a diagnosis).
- **Installable** — add it to your Home Screen for a full-screen, app-like experience. An in-app tip shows you how.
- **Always fresh** — the service worker uses a network-first strategy, so the app updates on every launch when online, while still working offline.
- **🔐 App lock** — optional PIN lock on launch (and when returning from the background), with **Face ID / Touch ID** unlock via WebAuthn where the device supports it. A screen lock, not full encryption — see `SECURITY.md`.
- **👋 Personal greeting** — cycle asks your name on first launch and greets you with a time-aware hello (good morning/afternoon/evening) every time you open it. Editable anytime in Settings.
- **🔒 Private by design** — a first-run privacy explainer makes the promise clear: all data is stored locally on your device (`localStorage`). No account, no cloud, no tracking, no ads, no selling. Export a backup or erase everything in one tap.

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

## Version

**v0.6** — The version is shown in the app footer and is set by the `APP_VERSION` constant in `js/app.js`. It is bumped on every release (along with the asset cache-busting query strings and the service-worker cache name).

© Avery LLC. All rights reserved.
