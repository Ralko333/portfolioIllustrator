import { createDrawer } from './v3/drawer.js?v=20261108-drawer-4';

const rootURL = new URL('./', document.baseURI);
const { assets, previews, dimensions, projects } = window.PORTFOLIO_DATA;
const order = ['menus', 'bank', 'design', 'panel', 'merch', 'stickers', 'series', 'sailor', 'selected'];
const compositions = {
  menus: ['winterFront', 'springFront'], bank: ['bankNight', 'bankSpring'],
  design: ['vlavasheFront', 'spaffyPost'], panel: ['panel', 'panel'],
  merch: ['merchOne', 'merchTwo'], stickers: ['stickerOne', 'stickerTwo', 'stickerThree'],
  series: ['worldOne', 'worldTwo', 'worldThree'], sailor: ['restored63', 'restored64'], selected: ['imaginationFlood']
};
const home = document.querySelector('#home-view');
const detail = document.querySelector('#case-view');
const grid = document.querySelector('#project-grid');
const dialog = document.querySelector('#lightbox');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const verticalShelf = matchMedia('(max-width: 700px)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const needsSecondTap = () => verticalShelf.matches || !finePointer.matches;
const bankAssets = new Set(projects.bank.media.slice(0, 5).map(([key]) => key));
let copy = { home: {}, ui: {} }, current = { key: null, anchor: '' }, currentHash = null;
let homeScroll = 0, lastProject = 'menus', routeToken = 0, activeTransition = null;
let lightboxIndex = 0, lightboxKey = null, zoomed = false;
let pulledProject = needsSecondTap() ? null : 'menus';
let keyboardInput = false;
let drawer;
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}
const assetURL = (key, original = false) => new URL((!original && previews[key]) || assets[key], rootURL).href;
function image(key, alt, eager = false) {
  const img = element('img');
  img.src = assetURL(key);
  img.alt = alt;
  img.loading = eager ? 'eager' : 'lazy';
  img.decoding = 'async';
  if (dimensions[key]) [img.width, img.height] = dimensions[key];
  if (bankAssets.has(key)) img.classList.add('bank-card');
  return img;
}
function link(text, href, className) {
  const a = element('a', className, text);
  a.href = href;
  return a;
}
function external(text, href, className) {
  const a = link(text, href, className);
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}
function publishedText(value) { return typeof value === 'string' ? value.replace(/\\n/g, '\n') : value; }
async function loadCopy() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(new URL('site-text.json', rootURL), { signal: controller.signal, cache: 'no-cache' });
    if (!response.ok) throw new Error('Text unavailable');
    copy = await response.json();
    for (const [key, override] of Object.entries(copy.projects || {})) {
      const p = projects[key];
      if (!p) continue;
      for (const field of ['title', 'label', 'cardLabel', 'description', 'client', 'role', 'format']) {
        if (typeof override[field] === 'string') p[field] = publishedText(override[field]);
      }
      for (const field of ['groups', 'subheadings', 'groupDescriptions']) {
        if (override[field]) p[field] = Object.fromEntries(Object.entries(override[field]).map(([i, value]) => [i, publishedText(value)]));
      }
      override.captions?.forEach((caption, i) => { if (p.media[i]) p.media[i][1] = publishedText(caption); });
      override.relatedLabels?.forEach((label, i) => { if (p.related?.[i]) p.related[i][1] = label; });
      override.releaseContexts?.forEach((label, i) => { if (p.proof?.links?.[i]) p.proof.links[i][0] = label; });
    }
  } catch {
    // The bundled content remains usable if the optional published text request fails.
  } finally { clearTimeout(timeout); }
  document.querySelectorAll('[data-copy]').forEach(node => {
    const text = copy.home?.[node.dataset.copy];
    if (typeof text === 'string') node.textContent = publishedText(text);
  });
  document.querySelectorAll('[data-copy-ui]').forEach(node => {
    const text = copy.ui?.[node.dataset.copyUi];
    if (typeof text === 'string') node.textContent = text;
  });
  if (copy.home?.metaDescription) document.querySelector('meta[name="description"]').content = copy.home.metaDescription;
}

function renderHome() {
  for (const [index, key] of order.entries()) {
    const p = projects[key];
    const card = element('article', 'project folder');
    card.dataset.project = key;
    const trigger = element('button', 'folder-trigger');
    trigger.type = 'button';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', `folder-art-${key}`);
    trigger.setAttribute('aria-describedby', `folder-hint-${key}`);
    const number = element('span', 'folder-number', String(index + 1).padStart(2, '0'));
    number.setAttribute('aria-hidden', 'true');
    const art = element('span', `project-art folder-art art-${key}`);
    art.id = `folder-art-${key}`;
    art.setAttribute('aria-hidden', 'true');
    compositions[key].forEach((asset, i) => {
      const img = image(asset, '', key === 'menus' || !verticalShelf.matches);
      if (key === 'menus' && i === 0) img.fetchPriority = 'high';
      art.append(img);
    });
    const meta = element('span', 'folder-meta');
    const hint = element('span', 'folder-hint');
    hint.id = `folder-hint-${key}`;
    meta.append(element('span', 'folder-title', p.title), element('span', 'folder-label', p.cardLabel || p.label), hint);
    const arrow = element('span', 'folder-arrow', '↗');
    arrow.setAttribute('aria-hidden', 'true');
    trigger.append(number, art, meta, arrow);
    card.append(trigger);
    grid.append(card);
  }
  grid.setAttribute('aria-busy', 'false');
  selectFolder(pulledProject, false);
}

function selectFolder(key, announce = true) {
  pulledProject = key;
  grid.classList.toggle('has-selection', !!key);
  for (const card of grid.querySelectorAll('.folder')) {
    const selected = card.dataset.project === key;
    const title = projects[card.dataset.project].title;
    card.classList.toggle('is-active', selected);
    const trigger = card.querySelector('.folder-trigger');
    if (needsSecondTap()) trigger.setAttribute('aria-expanded', String(selected));
    else trigger.removeAttribute('aria-expanded');
    trigger.setAttribute('aria-label', `${!needsSecondTap() || selected ? 'Открыть проект' : 'Выдвинуть папку'}: ${title}`);
    card.querySelector('.folder-hint').textContent = selected ? 'Открыть проект ↗' : '';
    if (selected) card.querySelectorAll('img').forEach(img => { img.loading = 'eager'; });
  }
  document.querySelector('#folder-current').textContent = key ? String(order.indexOf(key) + 1).padStart(2, '0') : '—';
  document.querySelector('#folder-instruction').textContent = 'Выберите проект';
  if (announce && key) document.querySelector('#announcement').textContent = `Выбран проект «${projects[key].title}».`;
}

function openFolder(key) {
  const hash = `#project-${key}`;
  document.querySelector('.mobile-nav').open = false;
  if (location.hash !== hash) history.pushState(null, '', hash);
  navigate(hash);
}

grid.addEventListener('pointerover', event => {
  const card = event.target.closest('.folder');
  if (card && !needsSecondTap() && event.pointerType !== 'touch' && pulledProject !== card.dataset.project) selectFolder(card.dataset.project, false);
});
grid.addEventListener('pointerdown', () => { keyboardInput = false; });
grid.addEventListener('focusin', event => {
  const card = event.target.closest('.folder');
  if (card && keyboardInput && !needsSecondTap()) selectFolder(card.dataset.project, false);
});
grid.addEventListener('click', event => {
  const trigger = event.target.closest('.folder-trigger');
  if (!trigger) return;
  const key = trigger.closest('.folder').dataset.project;
  const headerTap = event.target.closest('.folder-number, .folder-meta') && !event.target.closest('.folder-hint');
  if (needsSecondTap() && pulledProject === key && headerTap) {
    selectFolder(null, false);
    document.querySelector('#announcement').textContent = `Проект «${projects[key].title}» свёрнут.`;
    return;
  }
  if (needsSecondTap() && pulledProject !== key) {
    selectFolder(key);
    return;
  }
  selectFolder(key, false);
  openFolder(key);
});
grid.addEventListener('keydown', event => {
  const trigger = event.target.closest('.folder-trigger');
  if (!trigger) return;
  const previous = verticalShelf.matches ? 'ArrowUp' : 'ArrowLeft';
  const next = verticalShelf.matches ? 'ArrowDown' : 'ArrowRight';
  if (![previous, next, 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  keyboardInput = true;
  const index = order.indexOf(trigger.closest('.folder').dataset.project);
  const target = event.key === 'Home' ? 0 : event.key === 'End' ? order.length - 1 : (index + (event.key === next ? 1 : -1) + order.length) % order.length;
  grid.querySelector(`[data-project="${order[target]}"] .folder-trigger`).focus();
});
document.addEventListener('keydown', event => { if (event.key === 'Tab') keyboardInput = true; });
verticalShelf.addEventListener('change', () => selectFolder(needsSecondTap() ? null : pulledProject || lastProject, false));
finePointer.addEventListener('change', () => selectFolder(needsSecondTap() ? null : pulledProject || lastProject, false));
grid.addEventListener('transitionend', event => {
  if (!verticalShelf.matches || event.propertyName !== 'height' || current.key) return;
  const active = grid.querySelector('.folder.is-active');
  if (event.target === active && active.getBoundingClientRect().top < 12) {
    active.scrollIntoView({ block: 'start', behavior: reduced.matches ? 'instant' : 'smooth' });
  }
});

const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  entries.forEach(({ target, isIntersecting }) => {
    if (!isIntersecting) return;
    target.classList.add('is-visible');
    revealObserver.unobserve(target);
  });
}, { rootMargin: '0px 0px 40px 0px', threshold: .04 }) : null;
function observeReveals(scope) {
  scope.querySelectorAll('.reveal').forEach(node => {
    const rect = node.getBoundingClientRect();
    if (reduced.matches || !revealObserver || rect.top < innerHeight + 40) node.classList.add('is-visible');
    else revealObserver.observe(node);
  });
}

function figure(key, p, index, classes = '') {
  const [asset, caption, releaseIndex, published, wide] = p.media[index];
  const fig = element('figure', `case-figure ${classes}`.trim());
  if (wide || (key === 'panel' && index === 0)) fig.classList.add('full');
  const button = element('button', 'image-button');
  button.type = 'button';
  button.dataset.media = index;
  button.setAttribute('aria-label', `${copy.ui?.zoom || 'Увеличить'}: ${caption}`);
  if (bankAssets.has(asset)) button.classList.add('bank-image');
  if (published) button.classList.add('proof-image');
  if (wide || (key === 'panel' && index === 0)) button.classList.add('wide-image');
  button.append(image(asset, caption, index < 2));
  fig.append(button);
  const cap = element('figcaption');
  cap.append(element('span', '', caption));
  const release = p.proof?.links?.[releaseIndex];
  if (releaseIndex != null && release) cap.append(external(`${copy.ui?.release || 'Ссылка на релиз'} ↗`, release[1], 'release-link'));
  fig.append(cap);
  return fig;
}

function renderCase(key) {
  detail.replaceChildren();
  const p = projects[key];
  const back = link('← Ко всем проектам', '#work', 'case-back');
  back.dataset.return = '';
  detail.append(back);
  const head = element('header', 'case-head');
  const title = element('div');
  title.append(element('p', 'eyebrow', p.label), element('h1', '', p.title));
  const body = element('div');
  body.append(element('p', 'case-description', publishedText(p.description)));
  const meta = element('dl', 'case-meta');
  [['client', p.client], ['role', p.role], ['format', p.format]].forEach(([field, value]) => {
    if (!value) return;
    const column = element('div');
    const labels = { client: p.mixed ? 'Проект' : 'Клиент', role: 'Моя работа', format: 'Носитель' };
    const label = field === 'client' && p.mixed ? (copy.ui?.personal || 'Проект') : (copy.ui?.[field] || labels[field]);
    column.append(element('dt', '', label), element('dd', '', value));
    meta.append(column);
  });
  body.append(meta);
  head.append(title, body);
  detail.append(head);
  if (p.related?.length) {
    const related = element('nav', 'case-related');
    related.setAttribute('aria-label', 'Связанные работы');
    p.related.forEach(([destination, label]) => related.append(link(label, `#project-${destination}`)));
    detail.append(related);
  }
  const starts = Object.keys(p.groups || {}).map(Number).sort((a, b) => a - b);
  if (!starts.includes(0)) starts.unshift(0);
  const groups = starts.map((start, i) => ({ start, end: starts[i + 1] ?? p.media.length, anchor: p.groupAnchors?.[start] ?? String(start), title: p.groups?.[start] }));
  if (groups.length > 2) {
    const nav = element('nav', 'case-nav');
    nav.setAttribute('aria-label', 'Разделы проекта');
    groups.forEach(group => { if (group.title) nav.append(link(group.title, `#project-${key}/${group.anchor}`)); });
    detail.append(nav);
  }
  const content = element('div', 'case-content');
  for (const { start, end, anchor, title: groupTitle } of groups) {
    const section = element('section', 'case-section');
    section.dataset.anchor = anchor;
    section.id = `case-${key}-${anchor}`;
    if (groupTitle) section.append(element('h2', '', groupTitle));
    if (p.groupDescriptions?.[start]) section.append(element('p', 'group-description', publishedText(p.groupDescriptions[start])));
    const gallery = element('div', 'case-gallery');
    const threeColumns = (key === 'bank' && start === 2) || (key === 'stickers' && end - start === 3);
    if (threeColumns) gallery.classList.add('three-columns');
    for (let i = start; i < end; i++) {
      if (p.subheadings?.[i]) gallery.append(element('h3', 'subheading', p.subheadings[i]));
      const fig = figure(key, p, i);
      if (i === 0) fig.querySelector('.image-button').classList.add('case-lead');
      const lastInOddRow = !threeColumns && i === end - 1 &&
        [...gallery.querySelectorAll('.case-figure')].filter(n => !n.classList.contains('full')).length % 2 === 0;
      if (lastInOddRow && !fig.classList.contains('full')) fig.classList.add('centered');
      gallery.append(fig);
    }
    section.append(gallery);
    content.append(section);
  }
  detail.append(content);
  const usedLinks = new Set(p.media.map(m => m[2]).filter(i => i != null));
  const extraLinks = (p.proof?.links || []).filter((_, i) => !usedLinks.has(i));
  if (extraLinks.length) {
    const publications = element('section', 'publications');
    publications.append(element('h2', '', copy.ui?.publications || 'Публикации J’PAN'));
    const list = element('div', 'publication-list');
    extraLinks.forEach(([label, url]) => list.append(external(`${label} ↗`, url, 'release-link')));
    publications.append(list);
    detail.append(publications);
  }
  const projectIndex = order.indexOf(key);
  const pagination = element('nav', 'project-pagination');
  pagination.setAttribute('aria-label', 'Навигация по проектам');
  for (const [direction, step, label] of [['previous', -1, 'Предыдущий проект'], ['next', 1, 'Следующий проект']]) {
    const targetKey = order[(projectIndex + step + order.length) % order.length];
    const target = link('', `#project-${targetKey}`, 'project-pagination-link');
    target.dataset.direction = direction;
    target.setAttribute('aria-label', `${label}: ${projects[targetKey].title}`);
    const title = step < 0 ? `← ${projects[targetKey].title}` : `${projects[targetKey].title} →`;
    target.append(element('span', 'pagination-label', label), element('span', 'pagination-title', title));
    pagination.append(target);
  }
  detail.append(pagination);
}

function readRoute(hash) {
  const match = /^#project-([^/]+)(?:\/(.*))?$/.exec(hash);
  if (!match) return { key: null, anchor: hash.replace('#', '') };
  let [, key, anchor = ''] = match;
  const aliases = { 'menu-layout': ['design', 'menu-layout'], vlavashe: ['design', 'vlavashe'], spaffy: ['design', 'spaffy'], 'imagination-flood': ['selected', '0'], halloween: ['menus', '10'] };
  if (aliases[key]) [key, anchor] = aliases[key];
  return { key: projects[key] ? key : null, anchor };
}
function scrollInstant(top) { window.scrollTo({ top, left: 0, behavior: 'instant' }); }
function scrollToAnchor(route) {
  const target = route.key
    ? [...detail.querySelectorAll('[data-anchor]')].find(n => n.dataset.anchor === route.anchor)
    : document.getElementById(route.anchor);
  if (target) scrollInstant(target.getBoundingClientRect().top + scrollY - 26);
}
function clearTransitionNames() {
  document.querySelectorAll('[style*="view-transition-name"]').forEach(n => n.style.removeProperty('view-transition-name'));
}
async function navigate(hash, { initial = false, restoreHome = false } = {}) {
  if (hash === currentHash && !initial) {
    if (!current.key) scrollToAnchor(current);
    return;
  }
  currentHash = hash;
  const token = ++routeToken;
  const destination = readRoute(hash);
  if (dialog.open) dialog.close();
  if (activeTransition) {
    activeTransition.skipTransition();
    try { await activeTransition.updateCallbackDone; } catch { /* Superseded transition. */ }
  }
  if (token !== routeToken) return;
  if (destination.key === current.key) {
    current = destination;
    if (destination.anchor) scrollToAnchor(destination);
    else if (!destination.key) scrollInstant(0);
    return;
  }
  const previous = current;
  if (!previous.key) homeScroll = scrollY;
  if (destination.key) {
    lastProject = destination.key;
    selectFolder(destination.key, false);
  }
  const card = grid.querySelector(`[data-project="${destination.key || lastProject}"]`);
  clearTransitionNames();
  let source = !previous.key ? card?.querySelector('.project-art') : detail.querySelector('.case-lead');
  const sourceRect = source?.getBoundingClientRect();
  const canShare = sourceRect && sourceRect.bottom > 0 && sourceRect.top < innerHeight;
  if (canShare) source.style.viewTransitionName = 'project-preview';
  const update = () => {
    if (token !== routeToken) return;
    clearTransitionNames();
    if (destination.key) renderCase(destination.key);
    home.hidden = !!destination.key;
    detail.hidden = !destination.key;
    current = destination;
    document.title = destination.key ? `${projects[destination.key].title} — Сергей Белик` : (copy.home?.siteTitle || 'Сергей Белик — иллюстрация и графический дизайн');
    if (destination.key) {
      scrollInstant(0);
      if (destination.anchor) scrollToAnchor(destination);
    } else {
      if (previous.key) drawer?.open(true);
      scrollInstant(restoreHome ? homeScroll : 0);
      if (!restoreHome && destination.anchor) scrollToAnchor(destination);
      observeReveals(home);
    }
    const target = destination.key ? detail.querySelector('.case-lead') : card?.querySelector('.project-art');
    if (canShare && (!destination.anchor || (!destination.key && restoreHome)) && target) target.style.viewTransitionName = 'project-preview';
    document.querySelector('#announcement').textContent = destination.key ? projects[destination.key].title : 'Все проекты';
  };
  const animate = !initial && !reduced.matches;
  if (animate && document.startViewTransition) {
    const transition = document.startViewTransition(update);
    activeTransition = transition;
    try { await transition.finished; } catch { /* The DOM update still runs when an animation is skipped. */ }
    if (activeTransition === transition) activeTransition = null;
  } else {
    update();
    if (animate) {
      const view = destination.key ? detail : home;
      view.classList.remove('view-enter');
      void view.offsetWidth;
      view.classList.add('view-enter');
    }
  }
  if (token !== routeToken) return;
  clearTransitionNames();
  if (!initial && destination.key) detail.focus({ preventScroll: true });
  else if (!initial && restoreHome) card?.querySelector('.folder-trigger')?.focus({ preventScroll: true });
}

function openLightbox(index) {
  lightboxKey = current.key;
  lightboxIndex = index;
  updateLightbox();
  if (!dialog.open) dialog.showModal();
}
function updateLightbox() {
  const p = projects[lightboxKey];
  const [key, caption] = p.media[lightboxIndex];
  const img = dialog.querySelector('img');
  const stage = dialog.querySelector('.lightbox-stage');
  zoomed = false;
  stage.classList.remove('is-zoomed');
  stage.scrollTo(0, 0);
  img.src = assetURL(key);
  img.alt = caption;
  img.classList.toggle('bank-card', bankAssets.has(key));
  img.style.setProperty('--image-width', `${dimensions[key]?.[0] || 1600}px`);
  document.querySelector('#lightbox-caption').textContent = `${lightboxIndex + 1} / ${p.media.length} · ${caption}`;
  dialog.querySelector('[data-original]').href = assetURL(key, true);
  dialog.querySelector('[data-zoom]').textContent = copy.ui?.zoom || 'Увеличить';
  dialog.querySelector('[data-zoom]').setAttribute('aria-pressed', 'false');
  dialog.querySelector('[data-previous]').disabled = lightboxIndex === 0;
  dialog.querySelector('[data-next]').disabled = lightboxIndex === p.media.length - 1;
}
function stepLightbox(delta) {
  const next = lightboxIndex + delta;
  if (next < 0 || next >= projects[lightboxKey].media.length) return;
  lightboxIndex = next;
  updateLightbox();
}
dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
dialog.querySelector('[data-previous]').addEventListener('click', () => stepLightbox(-1));
dialog.querySelector('[data-next]').addEventListener('click', () => stepLightbox(1));
dialog.querySelector('[data-zoom]').addEventListener('click', event => {
  zoomed = !zoomed;
  const stage = dialog.querySelector('.lightbox-stage');
  stage.classList.toggle('is-zoomed', zoomed);
  if (zoomed) dialog.querySelector('img').src = assetURL(projects[lightboxKey].media[lightboxIndex][0], true);
  else stage.scrollTo(0, 0);
  event.currentTarget.textContent = zoomed ? (copy.ui?.fit || 'Показать целиком') : (copy.ui?.zoom || 'Увеличить');
  event.currentTarget.setAttribute('aria-pressed', String(zoomed));
});
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    stepLightbox(event.key === 'ArrowLeft' ? -1 : 1);
  }
});
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
detail.addEventListener('click', event => {
  const button = event.target.closest('[data-media]');
  if (button) openLightbox(Number(button.dataset.media));
});
document.addEventListener('click', event => {
  const a = event.target.closest('a');
  if (!a || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || a.target === '_blank') return;
  const url = new URL(a.href);
  if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
  if (!url.hash && a.getAttribute('href') !== '#') return;
  event.preventDefault();
  document.querySelector('.mobile-nav').open = false;
  const hash = url.hash;
  if (hash !== location.hash) history.pushState(null, '', hash || `${location.pathname}${location.search}`);
  navigate(hash, { restoreHome: a.hasAttribute('data-return') });
});
function historyNavigation() {
  navigate(location.hash, { restoreHome: !!current.key && !readRoute(location.hash).key });
}
addEventListener('popstate', historyNavigation);
addEventListener('hashchange', historyNavigation);

await loadCopy();
renderHome();
drawer = createDrawer({ verticalShelf, reduced });
document.documentElement.classList.add('reveal-ready');
await navigate(location.hash, { initial: true });
observeReveals(home);
if (!reduced.matches) document.fonts.ready.then(() => {
  document.querySelector('.brand-corner').addEventListener('animationend', () => document.documentElement.classList.remove('motion-ready'), { once: true });
  document.documentElement.classList.add('motion-ready');
});
