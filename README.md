# Ankit Jha — Portfolio

Personal portfolio site for Ankit Jha, Associate Product Manager.

Plain HTML, CSS, and JavaScript — no framework, no build step. Open `index.html`
and it runs.

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
