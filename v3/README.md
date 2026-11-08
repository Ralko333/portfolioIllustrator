# Portfolio drawer

Version 3 was copied from `/v2/` and is served at `/v3/`. It reuses the shared artwork, project data and published text from the repository root.

The gallery is inside an overhead-view drawer. Pull its handle right on desktop or down at widths up to 700px. Clicking the handle or pressing Enter/Space also opens and closes it. Arrow keys follow the same orientation. The existing nine-project accordion, two-tap mobile interaction, project pages, publication links and image viewer are retained. Every project has a full-height accent strip containing its number, with the caption aligned to that number's first digit.

`drawer.css` supplies the cabinet, handle, logo palette and responsive layout. `drawer.js` handles pointer capture, snapping, keyboard access, inert closed content and reduced motion. No build step or external dependencies are required.
