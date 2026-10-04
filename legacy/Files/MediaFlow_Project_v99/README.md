# MediaFlow v99 — Project Structure

This project is the same MediaFlow v99 application reorganized from one monolithic HTML file into separate source files.

## Run

Open `index.html` in a browser. The app remains a classic browser app; no build step is required.

For hosted/PWA behavior, serve the folder over HTTP/HTTPS (for example GitHub Pages or a local static server).

## Structure

- `index.html` — HTML shell and app mount point
- `css/app.css` — all original CSS, preserved in original order
- `js/app.js` — all original application JavaScript, preserved in original order
- `manifest.json` — web app manifest already referenced by MediaFlow
- `sw.js` — minimal pass-through service worker expected by the existing app
- `assets/` — reserved for local images/icons/assets

## Compatibility

The app JavaScript was deliberately kept in one ordered `app.js` file for this first structural conversion. MediaFlow has many historical overrides and shared globals; arbitrarily splitting that code into ES modules could change execution order or scope and break behavior. This layout separates HTML/CSS/JS safely first while keeping the current runtime model intact.
