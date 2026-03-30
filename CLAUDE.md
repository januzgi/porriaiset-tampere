# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static website concept for **Pörriäiset Lounaskahvila**, a family-run Finnish lunch cafe and bakery in Tampere. Bilingual (Finnish default, English secondary). Deployed to GitHub Pages at `januzgi.github.io/porriaiset-tampere`.

## Development

No build system, no package manager. Pure static HTML/CSS/JS served directly. Open `index.html` in a browser to develop locally:

```bash
open index.html          # macOS
# or use any local server:
python3 -m http.server 8000
```

External dependencies loaded via CDN (Google Fonts, Flatpickr). No linting or test setup.

## Deployment

GitHub Pages serves from `main` branch root. Push to `main` and the site updates within ~60 seconds.

```bash
git push origin main
```

## Architecture

### i18n System
- `js/translations.js` — all UI strings in `fi` and `en` as a nested object
- HTML elements use `data-i18n="key.path"` for text, `data-i18n-placeholder="key.path"` for placeholders
- `setLanguage('fi'|'en')` in `main.js` swaps all translated elements at runtime
- Language preference persisted in localStorage (`porriaiset-lang`)
- Reviews are embedded in the translations object (different text per language)

### Menu Management
- `data/menu.json` — weekly lunch menu (5 days, main + soup in FI/EN, dessert, price)
- `admin.html` — standalone admin page with inline styles/JS (not shared with main site CSS/JS)
- Admin publishes by committing `menu.json` to the repo via GitHub Contents API
- GitHub token stored in browser localStorage (`porriaiset-gh-token`), configured under "Asetukset" toggle at bottom of admin page
- Main site fetches `data/menu.json` on load; no localStorage fallback on the public side

### Cake Order Form
- Hidden behind "Avaa tilauslomake" toggle button to reduce noise
- Flatpickr date picker initialized lazily on first form reveal
- Dietary checkboxes have mutual exclusion logic ("Ei erityisruokavaliota" unchecks others)
- Honeypot field for bot detection (hidden `#cakeWebsite` input)
- Submission via `mailto:` link (concept demo; production would POST to API)

### CSS
- `css/style.css` — single file, CSS custom properties for theming
- Color palette: gold (`#C8962E`), dark brown (`#2B1810`), cream (`#FFFAF5`) — matches the cafe's storefront branding
- Responsive breakpoints at 1024px, 768px, 480px
- Mobile nav z-index hierarchy: overlay (999) < nav (1000) < nav-links (1002) < hamburger (1003). The overlay must stay below `site-nav` because `backdrop-filter` creates a containing block for fixed children inside the nav.

### Page Section Order
Hero → About → Food showcase → Lunch Menu → Reviews → Bakery → Cake Orders (collapsible) → Contact → Footer

## Key Files

| File | Purpose |
|---|---|
| `index.html` | Main public website |
| `admin.html` | Menu editor (self-contained, inline CSS/JS) |
| `js/translations.js` | All FI/EN strings including review content |
| `js/main.js` | App logic: i18n, menu render, form, nav, animations |
| `css/style.css` | All styles, CSS variables, responsive rules |
| `data/menu.json` | Weekly menu data (committed via admin or manually) |

## Conventions

- Finnish is the primary locale; all default text in HTML is Finnish
- The admin page is self-contained — it does not share JS/CSS with the main site
- Business info: card-only payment (no cash), Mon–Fri 7–15, lunch 10:30–14:00, phone +358 44 244 2434
