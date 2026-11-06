# Alternative portfolio

The original site is served from the repository root. This separate design is served at `/v2/` and reuses the original assets, `content.js`, and published `site-text.json` without changing them.

No build step or external dependencies. Preview the repository with a static HTTP server. Project links use `#project-<key>` and optional group anchors, including `#project-design/menu-layout`.

The layout has a fixed two-column grid, wide menu/panorama previews, and a centered final project. Below 520px, it uses one column. Images retain their original colors and proportions. Bank artwork corners are clipped consistently in previews, projects, and the image viewer.

The page background uses an abstract ribbon pattern based on the logo's curves and orange corner. The panorama and its caption share a patterned navy background spanning the page width; the artwork stays aligned with the other projects. Each case has matching previous/next project links. The public interface does not link to the original version.

Animations use CSS and the native View Transition API when available, with a fade fallback. System reduced-motion preferences disable animated transitions. The original site and this version can be compared by URL; neither redirects to the other.
