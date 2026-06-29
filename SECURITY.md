# Security audit — cycle

_Last reviewed: 2026-06-28 (v0.5)_

## Does security matter if all the data is on the device?

**Yes — arguably more, not less.** "On-device" changes the threat model; it doesn't remove it. Reasons it still matters:

1. **The data is unusually sensitive.** Period, intimacy, and medication history is among the most personal data there is. The whole promise of the app is "your data, your choice," so a breach of that promise is the worst failure the app can have.
2. **The browser is a shared, hostile runtime.** Even with no server, the app still parses **untrusted input**: free-text you type, and — more importantly — **files you import** (a JSON backup or an Apple Health export). A malicious file could carry a script payload. If that script runs in the app's origin, it can read *everything* in `localStorage` and quietly exfiltrate it to the internet — defeating the on-device guarantee entirely.
3. **Same-origin = full access.** Any script that executes in the page can read all stored health data, the user's name, etc. There is no server-side permission boundary to save you.

So the realistic risks for a local-first app are: **XSS** (script injection via typed or imported data), **untrusted file parsing**, and the **physical/at-rest** exposure of plaintext data. This audit addresses all three.

## Findings & fixes

### 1. Stored XSS via `innerHTML` — **fixed** (was the real issue)
User- and import-controlled values were interpolated into `innerHTML` without encoding:
- medication name / type / frequency (`renderMeds`)
- health-event type / note (`renderEvents`)
- symptom/mood/etc. labels in the review charts (`barList`) — reachable via a crafted **imported JSON** file

**Fix:** added an `esc()` HTML-encoder and applied it at every sink. The personal greeting already used `textContent` (safe). Verified with an `<img onerror>` / `<script>` payload — it is now rendered inert.

### 2. Defense-in-depth: Content-Security-Policy — **added**
A strict CSP (`default-src 'self'`, `script-src 'self'`, `connect-src 'self'`, `object-src 'none'`, `base-uri 'none'`, …) is set via `<meta>`. Even if an injection slipped through, the CSP blocks inline/remote script execution and any network exfiltration to other origins. The inline service-worker registration was moved to `js/sw-register.js` so no inline script is needed.

> Note: `frame-ancestors` and HSTS can only be delivered as **HTTP headers**, not via `<meta>`. If you host this (e.g. behind a CDN), also send `X-Frame-Options: DENY` / `frame-ancestors 'none'` and `Strict-Transport-Security`.

### 3. Untrusted file import — **mitigated**
- JSON import shows a confirmation, then only copies known fields; all values are HTML-encoded at render (finding #1).
- Apple Health import uses `DOMParser` (no HTML execution) and only extracts dates and a fixed set of enum values; it never injects free text into the DOM.

## App lock (PIN) — added in v0.6

- An optional **PIN lock** gates the app on launch and when it returns from the background. The PIN is never stored: only a salted **SHA-256 hash** is kept, in a device-local key (`cycle.lock`) that is excluded from data export/import.
- **Important — it is a screen lock, not encryption.** It stops someone who picks up your unlocked phone from opening the app (the realistic mobile threat). It does **not** encrypt the data: on a desktop browser, someone with devtools/`localStorage` access could still read the stored JSON. True at-rest protection requires deriving an encryption key from the PIN and encrypting the store (see below).

> A WebAuthn-based Face ID / Touch ID unlock was trialled in v0.6 and **removed in v0.7** — platform-authenticator behavior was unreliable across PWA installs. The PIN is the supported lock.

## Residual risks (by design, documented for the user)

- **At-rest plaintext.** Data lives in `localStorage`, unencrypted. The PIN lock is an access gate, not encryption — anyone with raw access to the browser profile (e.g. desktop devtools) can still read it. *Possible future hardening:* derive a key from the PIN via PBKDF2 and encrypt the store with AES-GCM (WebCrypto), so the data is unreadable without the PIN. Trade-off: forgetting the PIN means the data is unrecoverable.
- **Exported files are plaintext.** TXT/JSON/Apple-Health exports contain sensitive data by design; treat them like any private document.
- **No background-process risk, no secrets, no third-party code, no network calls, no analytics/trackers.** This is the strongest part of the model.

## Things that are *not* problems
- No server, auth, cookies, or sessions to attack.
- No dependencies / supply chain (zero npm packages ship to users).
- Service worker caches only same-origin GETs (network-first); no cache-poisoning surface beyond the origin itself.
