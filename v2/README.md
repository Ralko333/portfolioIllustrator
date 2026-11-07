# Alternative portfolio

The original site is served from the repository root. This separate design is served at `/v2/` and reuses the original assets, `content.js`, and published `site-text.json` without changing them.

No build step or external dependencies. Preview the repository with a static HTTP server. Project links use `#project-<key>` and optional group anchors, including `#project-design/menu-layout`.

The homepage follows the approved dark file-shelf reference: one horizontal accordion of nine illustrated folders, all visible at once, with one expanded folder and the remaining illustrated spines. Desktop folders overlap by 8px. Each following folder stays above the previous one; expansion reveals the selected folder from underneath the next folder without changing that layer order. The compact heading and “Мои работы” share a line, the shelf spans the page width, and the counter sits below it. Hover or keyboard focus pulls out a folder; clicking opens its existing case. Case media, publication links, image viewer, and previous/next navigation are preserved.

At widths up to 700px, the same accordion runs vertically. Compact folders overlap by 18px, with each following folder above the previous one. A folder expands vertically from underneath the next folder, keeping its horizontal position and width. The covered area is reserved below its caption so titles, artwork strips, and the second-tap hint remain visible. The first tap pulls out a folder and reveals a compact “Открыть проект ↗” action inside it; the second tap opens the case. There is no visible instruction banner or text explaining the two taps. Selecting another folder expands it instead. Vertical scrolling is not intercepted. Returning from a case restores the selected folder and gallery position.

Images retain their original colors. The original logo and all nine sections are preserved; bank artwork corners remain clipped in previews, cases, and the image viewer. `folders.css` provides the new shelf and dark theme above the reusable case styles. The public interface does not link to the original version.

Animations use CSS and the native View Transition API when available, with a fade fallback. System reduced-motion preferences disable animated transitions. The original site and this version can be compared by URL; neither redirects to the other.
