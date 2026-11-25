'use strict';

const galleryTiles = [...document.querySelectorAll('.tile[data-project]')];
const motion = matchMedia('(prefers-reduced-motion: no-preference)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

function setUpPointer() {
  for (const tile of galleryTiles) {
    const art = tile.querySelector('.tile-art');
    let frame = 0;
    let point;

    function update() {
      const bounds = art.getBoundingClientRect();
      const x = point.clientX - bounds.left;
      const y = point.clientY - bounds.top;
      const left = x < bounds.width - 70 ? x + 16 : x - 61;
      const top = y < 68 ? y + 16 : y - 54;
      art.style.setProperty('--pointer-x', `${Math.min(bounds.width - 48, Math.max(4, left))}px`);
      art.style.setProperty('--pointer-y', `${Math.min(bounds.height - 48, Math.max(4, top))}px`);
      art.classList.add('has-pointer');
      frame = 0;
    }

    art.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' || !motion.matches || !finePointer.matches) return;
      point = event;
      if (!frame) frame = requestAnimationFrame(update);
    });
    art.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      frame = 0;
      art.classList.remove('has-pointer');
    });
  }
}

function setUpSectionNav() {
  const work = document.querySelector('.nav-work');
  const about = document.querySelector('.site-nav a[href="#about"]');

  function update() {
    const isAbout = location.hash === '#about';
    work.toggleAttribute('aria-current', !isAbout);
    about.toggleAttribute('aria-current', isAbout);
    (isAbout ? about : work).setAttribute('aria-current', 'location');
  }

  update();
  addEventListener('hashchange', update);
}

function setUpPageTransitions() {
  if (!('NavigationActivation' in window)) return;

  const casePage = document.querySelector('main.case');
  const matchingCovers = new Set(['imagination-flood', 'seasonal-menus', 'interior-panel', 'world-cuisines', 'sailor-moon']);
  const galleryPath = new URL(document.querySelector('.brand').href).pathname;
  const normalizePath = url => new URL(url).pathname.replace(/index\.html$/, '');

  function artworkFor(url) {
    const path = normalizePath(url);
    if (casePage && path === normalizePath(new URL(galleryPath, location.origin))) {
      if (matchingCovers.has(casePage.dataset.project)) return casePage.querySelector('.media-link img');
    }
    const tile = galleryTiles.find(item => normalizePath(item.href) === path);
    if (tile && matchingCovers.has(tile.dataset.project)) return tile.querySelector('.tile-picture img');
    return null;
  }

  function applyTransition(transition, otherURL) {
    if (!transition || !otherURL || !motion.matches) return;
    const artwork = artworkFor(otherURL);
    if (!artwork) return;
    const bounds = artwork.getBoundingClientRect();
    if (bounds.bottom < 0 || bounds.top > innerHeight) return;
    artwork.style.viewTransitionName = 'work-art';
    const clear = () => artwork.style.removeProperty('view-transition-name');
    transition.finished.then(clear, clear);
  }

  addEventListener('pageswap', event => applyTransition(event.viewTransition, event.activation?.entry?.url));
  addEventListener('pagereveal', event => applyTransition(event.viewTransition, navigation.activation?.from?.url));
}

function setUpViewer(dialog) {
  if (typeof dialog.showModal !== 'function') return;

  const links = [...document.querySelectorAll('.media-link')];
  const stage = dialog.querySelector('[data-stage]');
  const zoom = dialog.querySelector('[data-zoom]');
  const previous = dialog.querySelector('[data-previous]');
  const next = dialog.querySelector('[data-next]');
  const close = dialog.querySelector('[data-close]');
  const caption = dialog.querySelector('[data-caption]');
  const original = dialog.querySelector('[data-original]');
  const media = new Image();
  const count = document.createElement('span');
  let index = 0;
  let trigger;
  let zoomed = false;

  function setZoom(value) {
    zoomed = value;
    stage.classList.toggle('is-zoomed', value);
    zoom.setAttribute('aria-pressed', String(value));
    zoom.textContent = value ? 'Показать целиком' : 'Увеличить';
    if (value) {
      media.src = links[index].href;
    } else {
      media.src = links[index].dataset.preview;
      stage.scrollTo(0, 0);
    }
  }

  function update() {
    const link = links[index];
    const preview = link.querySelector('img');
    const label = preview.alt;
    const sourceWidth = Number(preview.getAttribute('width')) || 1600;
    const zoomWidth = Math.min(3200, Math.max(stage.clientWidth * 1.42, sourceWidth));
    media.alt = label;
    media.style.setProperty('--zoom-width', `${Math.round(zoomWidth)}px`);
    media.classList.toggle('is-bank', !!link.closest('.case-figure--bank'));
    count.textContent = `${index + 1} / ${links.length}`;
    caption.replaceChildren(count, ` · ${label}`);
    original.href = link.href;
    previous.disabled = index === 0;
    next.disabled = index === links.length - 1;
    setZoom(false);
  }

  function step(delta) {
    const target = index + delta;
    if (target < 0 || target >= links.length) return;
    index = target;
    update();
  }

  stage.append(media);
  for (const [position, link] of links.entries()) {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      trigger = link;
      index = position;
      dialog.showModal();
      update();
    });
  }

  previous.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  close.addEventListener('click', () => dialog.close());
  zoom.addEventListener('click', () => setZoom(!zoomed));
  media.addEventListener('click', () => setZoom(!zoomed));
  dialog.addEventListener('close', () => trigger?.focus({ preventScroll: true }));
  dialog.addEventListener('keydown', event => {
    if (zoomed || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    step(event.key === 'ArrowLeft' ? -1 : 1);
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const { left, right, top, bottom } = dialog.getBoundingClientRect();
    if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) dialog.close();
  });
}

if (galleryTiles.length) {
  setUpPointer();
  setUpSectionNav();
}
setUpPageTransitions();
const viewer = document.querySelector('#viewer');
if (viewer) setUpViewer(viewer);
