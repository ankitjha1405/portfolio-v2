# Ankit Jha — Portfolio

Personal portfolio site for Ankit Jha, Associate Product Manager.

Plain HTML, CSS, and JavaScript — no framework, no build step. Open `index.html`
and it runs.

## How it works

```
 ┌──────────────────────────── index.html (one page) ────────────────────────────┐
 │  [Nav pill] ──► #featured-work · #about · #contact                             │
 │                                                                                │
 │  ┌ Hero ┐ → ┌ Intro ┐ → ┌ Projects panel ───────────────────────┐             │
 │  │ eyes │   │ links │   │  Some of my works  (cards → modal)    │             │
 │  └──────┘   └───────┘   │  My AI projects    (video cards → live│→ live sites │
 │                         │                     site in new tab)  │             │
 │                         └───────────────────────────────────────┘             │
 │        → ┌ What can I bring ┐ → ┌ About ┐ → ┌ Contact form ┐                    │
 └────────────────────────────────────────────────────────────────────────────────┘
   assets/js/home.js: reveals, eyes, project modal, plays AI videos only on screen
   reelforge/: separate page served on the reelforge subdomain (vercel.json)
```

## Local development

The site is fully static, so any static server works. This repo includes one
that sends no-cache headers, which keeps you from chasing stale assets while
editing:

```bash
python3 scripts/serve.py
```

Then open http://localhost:4090.

## Layout

```
index.html            all markup — single page
assets/css/           home.css holds the bulk of the layout and theming
assets/js/            home.js drives the eyes, parallax, and project modal
assets/img/           project thumbnails, favicons, photos
assets/video/         12 s product videos + posters for the AI projects section
assets/lottie/        animation data
scripts/serve.py      no-cache local dev server
```

## Notes

- The brand color is a single CSS custom property (`--brand` in `home.css`), so
  the whole palette can be re-themed from one place.
- Section boundaries use a stacked `z-index` + rounded-corner scheme; the
  comments in `home.css` explain which section is meant to cut into which.
- The googly eyes track the cursor and are clamped so they never overlap the
  floating nav on scroll.
