# Alternative portfolio

The original site is served from the repository root. This separate design is served at `/v2/` and reuses the original assets, `content.js`, and published `site-text.json` without changing them.

No build step or external dependencies. Preview the repository with a static HTTP server. Project links use `#project-<key>` and optional group anchors, including `#project-design/menu-layout`.

The homepage is a dark, full-width shelf of nine illustrated project folders in the original section order. On desktop, pointer hover or keyboard focus pulls out a folder; clicking opens its case. Arrow keys, Home, and End move between folder controls. Each case retains the existing media, sections, publication links, image viewer, and matching previous/next navigation.

At widths up to 1000px, the same shelf runs vertically. It starts with every folder compact. The first tap pulls out a folder and displays “Нажмите ещё раз, чтобы открыть проект”; a second tap on that same folder opens the case. Tapping a different folder selects it instead. Touch devices use the same two-step opening even when the viewport is wider. The page scrolls vertically without capturing swipe gestures. Returning from a case keeps the selected folder and restores the gallery position.

Images retain their original colors. The original logo and all nine sections are preserved; bank artwork corners remain clipped in previews, cases, and the image viewer. `folders.css` provides the new shelf and dark theme above the reusable case styles. The public interface does not link to the original version.

Animations use CSS and the native View Transition API when available, with a fade fallback. System reduced-motion preferences disable animated transitions. The original site and this version can be compared by URL; neither redirects to the other.
