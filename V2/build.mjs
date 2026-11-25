import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const published = JSON.parse(readFileSync(join(root, 'site-text.json'), 'utf8'));
const { home, ui } = published;
const window = {};
runInNewContext(readFileSync(join(root, 'content.js'), 'utf8'), { window }, { filename: 'content.js' });
const { assets, previews, dimensions, projects } = window.PORTFOLIO_DATA;
const originalHomepage = readFileSync(join(root, 'index.html'), 'utf8');
const logo = originalHomepage.match(/<svg class="brand-mark"[\s\S]*?<\/svg>/)?.[0];
if (!logo) throw new Error('Не найден логотип портфолио');

const spreads = [
  [
    {
      key: 'selected', slug: 'imagination-flood', title: 'Imagination Flood',
      label: 'Личная сюжетная иллюстрация',
      note: 'Книжный магазин, где из раскрытых страниц выплёскивается море.',
      cover: ['imaginationFlood'], style: 'flood'
    },
    {
      key: 'bank', slug: 'sberprime', label: 'Иллюстрации для банковских карт',
      note: 'Две иллюстрации из пяти вышли на картах СберПрайм.',
      cover: ['bankNight', 'bankSpring'], style: 'bank'
    },
    {
      key: 'menus', slug: 'seasonal-menus', label: 'Обложки для J’PAN',
      note: 'Истории с сиба-ину на лицевой и оборотной стороне меню.',
      cover: ['winterFront'], style: 'menus'
    }
  ],
  [
    {
      key: 'panel', slug: 'interior-panel', label: 'Иллюстрация для ресторана J’PAN',
      note: 'Весенняя панорама, напечатанная для интерьера ресторана.',
      cover: ['panel'], style: 'panel'
    },
    {
      key: 'series', slug: 'world-cuisines', label: 'Иллюстрации в формате марок',
      note: 'Марки с иллюстрациями дарили гостям на мероприятии J’PAN.',
      cover: ['worldOne'], style: 'series'
    },
    {
      key: 'stickers', slug: 'stickers', label: 'Сезонные наборы для J’PAN',
      note: 'Стикеры к осени, Хэллоуину и 14 февраля.',
      cover: ['stickerOne'], style: 'stickers'
    }
  ],
  [
    {
      key: 'merch', slug: 'hanami', label: 'Принты для фестивального мерча',
      note: 'Два принта для футболок к фестивалю Ханами.',
      cover: ['merchOne', 'merchTwo'], style: 'merch'
    },
    {
      key: 'sailor', slug: 'sailor-moon', label: 'Серия иллюстраций для J’PAN',
      note: 'Четыре иллюстрации для промо, стикеров и флажков.',
      cover: ['restored63'], style: 'sailor'
    },
    {
      key: 'design', slug: 'graphic-design', label: 'Вёрстка и типографика',
      note: 'Меню J’PAN, буклет «Влаваше», макет Spaffy и карточка Ozon.',
      cover: ['vlavasheFront'], style: 'design'
    }
  ]
];

const works = spreads.flat();
const byKey = new Map(works.map(work => [work.key, work]));
const site = 'https://ralko333.github.io/portfolioIllustrator/';
const social = [
  ['Telegram', 'https://t.me/Enotosobaka'],
  ['Почта', 'mailto:bekaron3@gmail.com']
];

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);
const clean = value => String(value ?? '').replace(/\\n/g, '\n');
const arrow = (direction = 'diagonal') => `<span class="arrow arrow--${direction}" aria-hidden="true"></span>`;
const projectURL = (base, work) => `${base}projects/${work.slug}/`;
const titleOf = work => work.title || published.projects[work.key]?.title || projects[work.key].title;

function assetPath(key, original = false) {
  const path = (!original && previews[key]) || assets[key];
  if (!path || !existsSync(join(root, path))) throw new Error(`Не найден файл иллюстрации: ${key}`);
  return path;
}

function img(key, assetBase, { alt = '', eager = false, high = false } = {}) {
  const size = dimensions[key];
  return `<img src="${escape(assetBase + assetPath(key))}" alt="${escape(alt)}"${size ? ` width="${size[0]}" height="${size[1]}"` : ''} loading="${eager ? 'eager' : 'lazy'}" decoding="async"${high ? ' fetchpriority="high"' : ''}>`;
}

function header(base, isHome) {
  const homeURL = base || './';
  return `<a class="skip-link" href="#${isHome ? 'work' : 'case-content'}">К иллюстрациям</a>
  <header class="site-header shell" id="top">
    <a class="brand" href="${homeURL}" aria-label="Сергей Белик, главная">${logo}<span>Сергей Белик</span></a>
    <nav class="site-nav" aria-label="Основная навигация">
      <a href="${base}#work" class="nav-work"${isHome ? ' aria-current="page"' : ''}>Работы</a>
      <a href="${base}#about">Обо мне</a>
    </nav>
  </header>`;
}

function head({ base, title, description, path, image, isHome = false }) {
  const url = site + 'V2/' + path;
  return `<!doctype html>
<!-- Generated from build.mjs and the portfolio content. -->
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f2f3ef">
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${escape(site + assetPath(image))}">
  <link rel="icon" href="${base}../favicon.svg" type="image/svg+xml">
  ${isHome ? `<link rel="preload" href="${base}fonts/onest.woff2" as="font" type="font/woff2" crossorigin>` : ''}
  <link rel="stylesheet" href="${base}gallery.css">
  <script src="${base}gallery.js" defer></script>
</head>
<body${isHome ? ' class="gallery-page"' : ' class="case-page"'}>
  ${header(base, isHome)}`;
}

function card(work, row, column) {
  const { style, cover, label, note } = work;
  const pictures = cover.map((key, index) => img(key, '../', { eager: row === 0, high: row === 0 && column === 0 && index === 0 }));
  return `<article class="project project--${style}">
    <a class="tile" href="${projectURL('', work)}" aria-labelledby="title-${style}" aria-describedby="label-${style}" data-project="${work.slug}">
      <span class="tile-art tile-art--${style}">
        <span class="tile-picture">${pictures.join('')}</span>
        <span class="tile-note" aria-hidden="true">${escape(note)}</span>
        <span class="tile-pointer" aria-hidden="true">${arrow()}</span>
      </span>
      <span class="tile-caption">
        <span class="tile-title" id="title-${style}">${escape(titleOf(work))}</span>
        <span class="tile-label" id="label-${style}">${escape(label)}</span>
        ${arrow()}
      </span>
    </a>
  </article>`;
}

const contacts = () => social.map(([label, href]) => `<a href="${href}"${href.startsWith('https:') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label} ${arrow()}</a>`).join('');

function footer(isHome) {
  return `<footer class="site-footer">
    <div class="footer-inner shell">
      <div class="footer-identity"><p>Сергей Белик</p><p>Векторный иллюстратор</p></div>
      <div class="footer-links">${isHome ? '' : contacts()}<a href="#top">Наверх ${arrow('up')}</a></div>
    </div>
  </footer>`;
}

function about() {
  return `<section class="about" id="about" aria-labelledby="about-title">
    <div class="about-inner shell">
      <h2 id="about-title">Обо мне</h2>
      <div class="about-content">
        <p class="about-lead">${escape(home.aboutLead)}</p>
        <p>${escape(home.aboutIntro)}</p>
        <p>${escape(home.aboutExtra)}</p>
        <p>${escape(home.about3d)}</p>
        <p>${escape(home.aboutAI)}</p>
        <div class="about-contact" role="group" aria-label="Связаться со мной">${contacts()}</div>
      </div>
    </div>
  </section>`;
}

function gallery() {
  return `${head({
    base: '', title: 'Сергей Белик — векторный иллюстратор', description: home.metaDescription,
    path: '', image: 'imaginationFlood', isHome: true
  })}
  <main>
    <section class="intro shell" aria-labelledby="intro-title">
      <h1 id="intro-title">Векторный иллюстратор</h1>
      <p>Рисую персонажей и сюжетные иллюстрации для брендов и печати.</p>
    </section>
    <section class="work shell" id="work" tabindex="-1" aria-label="Работы">
      ${spreads.map((spread, row) => `<div class="spread spread--${row + 1}">${spread.map((item, column) => card(item, row, column)).join('')}</div>`).join('\n      ')}
    </section>
    ${about()}
  </main>
  ${footer(true)}
</body>
</html>
`;
}

function getProject({ key }) {
  const source = projects[key];
  const override = published.projects[key] ?? {};
  const media = source.media.map(([asset, caption, ...rest], index) => [asset, override.captions?.[index] ?? caption, ...rest]);
  const proof = source.proof?.links?.map(([label, url], index) => [override.releaseContexts?.[index] ?? label, url]) ?? [];
  const related = source.related?.map(([target, label], index) => [target, override.relatedLabels?.[index] ?? label]) ?? [];
  return { ...source, ...override, media, proof, related };
}

function external(href, label) {
  return `<a class="text-action" href="${escape(href)}" target="_blank" rel="noopener noreferrer">${escape(label.replace(/\s*↗$/, ''))} ${arrow()}</a>`;
}

function getSections(project) {
  const starts = [...new Set([0, ...Object.keys(project.groups ?? {}).map(Number)])].sort((a, b) => a - b);
  return starts.map((start, index) => ({
    start, end: starts[index + 1] ?? project.media.length,
    anchor: project.groupAnchors?.[start] ?? String(start),
    title: project.groups?.[start]
  }));
}

function figure(work, project, index, base) {
  const [asset, text, release, publishedImage, wide] = project.media[index];
  const original = base + '../' + assetPath(asset, true);
  const preview = base + '../' + assetPath(asset);
  const caption = clean(text);
  const isBankFront = work.key === 'bank' && index < 5;
  const isWide = (wide && !publishedImage) || (work.key === 'panel' && index === 0);
  const releaseLink = release != null && project.proof[release];
  return `<figure class="case-figure${publishedImage ? ' case-figure--proof' : ''}${isWide ? ' case-figure--wide' : ''}${isBankFront ? ' case-figure--bank' : ''}">
    <a class="media-link" href="${escape(original)}" data-preview="${escape(preview)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(`Увеличить: ${caption}`)}">
      ${img(asset, base + '../', { alt: caption, eager: index < 2, high: index === 0 })}
      ${arrow()}
    </a>
    <figcaption><span>${escape(caption)}</span>${releaseLink ? external(releaseLink[1], ui.release) : ''}</figcaption>
  </figure>`;
}

function section(work, project, { start, end, anchor, title }, base) {
  let items = '';
  for (let index = start; index < end; index += 1) {
    const subtitle = project.subheadings?.[index];
    if (subtitle) items += `<h3 class="case-subtitle">${escape(subtitle)}</h3>`;
    items += figure(work, project, index, base);
  }
  const describe = project.groupDescriptions?.[start];
  const three = end - start === 3 && (work.key === 'stickers' || work.key === 'bank');
  const head = title && (work.key !== 'selected' || start !== 0);
  return `<section class="case-section" id="${escape(anchor)}">
    ${head ? `<h2>${escape(title)}</h2>` : ''}
    ${describe ? `<p class="group-description">${escape(clean(describe))}</p>` : ''}
    <div class="case-grid${three ? ' case-grid--three' : ''}">${items}</div>
  </section>`;
}

function detailMeta(work, project) {
  const data = work.key === 'selected' ? [['Проект', work.label], ['Моя работа', 'Иллюстрация']] : [
    [project.mixed ? ui.personal : ui.client, project.client],
    [ui.role, project.role], [ui.format, project.format]
  ];
  return `<dl class="case-facts">${data.filter(([, value]) => value).map(([label, value]) =>
    `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>`;
}

function relatedLinks(related, base) {
  if (!related.length) return '';
  return `<nav class="related-links" aria-label="Связанные работы">${related.map(([route, label]) => {
    const [key, anchor] = route.split('/');
    return `<a class="text-action" href="${projectURL(base, byKey.get(key))}${anchor ? `#${escape(anchor)}` : ''}">${escape(label.replace(/\s*↗$/, ''))} ${arrow()}</a>`;
  }).join('')}</nav>`;
}

function publicationLinks(project) {
  const used = new Set(project.media.map(item => item[2]));
  const links = project.proof.filter((_, index) => !used.has(index));
  if (!links.length) return '';
  return `<section class="publications"><h2>${escape(ui.publications)}</h2><div>${links.map(([label, url]) => external(url, label)).join('')}</div></section>`;
}

function pagination(work, base) {
  const index = works.indexOf(work);
  const neighbors = [works[(index + works.length - 1) % works.length], works[(index + 1) % works.length]];
  return `<nav class="case-pagination" aria-label="Другие проекты">${neighbors.map((neighbor, idx) => {
    const previous = idx === 0;
    return `<a href="${projectURL(base, neighbor)}">
      ${arrow(previous ? 'left' : 'right')}
      <span><small>${previous ? 'Предыдущий проект' : 'Следующий проект'}</small><strong>${escape(titleOf(neighbor))}</strong></span>
    </a>`;
  }).join('')}</nav>`;
}

function viewer() {
  return `<dialog class="viewer" id="viewer" aria-label="Просмотр иллюстрации">
    <div class="viewer-top">
      <button type="button" data-zoom aria-pressed="false">Увеличить</button>
      <a data-original target="_blank" rel="noopener noreferrer">Оригинал ${arrow()}</a>
      <button type="button" data-close autofocus>Закрыть</button>
    </div>
    <div class="viewer-stage" data-stage></div>
    <div class="viewer-bottom">
      <button type="button" data-previous aria-label="Предыдущее изображение">${arrow('left')}</button>
      <p class="viewer-caption" data-caption aria-live="polite"></p>
      <button type="button" data-next aria-label="Следующее изображение">${arrow('right')}</button>
    </div>
  </dialog>`;
}

function detail(work) {
  const base = '../../';
  const project = getProject(work);
  const sections = getSections(project);
  const title = titleOf(work);
  const description = work.key === 'selected'
    ? 'Личная иллюстрация о книжном магазине, где книги оживают, а из раскрытых страниц выплёскивается море.'
    : clean(project.description);
  const showSectionLinks = sections.filter(item => item.title).length > 2;
  return `${head({
    base, title: `${title} — Сергей Белик`, description,
    path: `projects/${work.slug}/`, image: work.cover[0]
  })}
  <main class="case shell" data-project="${work.slug}">
    <a class="case-back text-action" href="${base}#work">${arrow('left')} Все работы</a>
    <header class="case-title">
      <h1>${escape(title)}</h1>
      <p>${escape(description)}</p>
    </header>
    ${detailMeta(work, project)}
    ${relatedLinks(project.related, base)}
    ${showSectionLinks ? `<nav class="section-links" aria-label="Разделы проекта">${sections.filter(item => item.title).map(item => `<a href="#${escape(item.anchor)}">${escape(item.title)}</a>`).join('')}</nav>` : ''}
    <div class="case-content" id="case-content" tabindex="-1">${sections.map(group => section(work, project, group, base)).join('')}</div>
    ${publicationLinks(project)}
    ${pagination(work, base)}
  </main>
  ${footer(false)}
  ${viewer()}
</body>
</html>
`;
}

function writeHTML(path, content) {
  writeFileSync(path, content.replace(/[ \t]+$/gm, ''));
}

writeHTML(join(here, 'index.html'), gallery());
for (const work of works) {
  const path = join(here, 'projects', work.slug);
  mkdirSync(path, { recursive: true });
  writeHTML(join(path, 'index.html'), detail(work));
}
