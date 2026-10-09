const grid = document.querySelector('#project-grid');
const projectSection = grid?.closest('#proiecte');
const filters = document.querySelector('#project-filters') || document.createElement('div');
const groupFilters = document.createElement('div');
groupFilters.id = 'project-group-filters';
groupFilters.className = 'project-filters project-group-filters';
groupFilters.setAttribute('role', 'group');
groupFilters.setAttribute('aria-label', 'Filtrează proiectele după categorie');
const count = document.querySelector('#project-count') || document.createElement('p');
const toolList = document.querySelector('#tool-list');
const activityList = document.querySelector('#activity-list');
const tones = new Set(['progress', 'test', 'done', 'wip', 'plan']);
let projects = [];
let activeDomain = 'all';
let activeGroup = 'all';
let groups = [];

if (!document.querySelector('#project-filters')) {
  filters.id = 'project-filters';
  filters.className = 'project-filters';
  filters.setAttribute('role', 'group');
  filters.setAttribute('aria-label', 'Filtrează proiectele după domeniu');
  projectSection?.insertBefore(filters, grid);
}
projectSection?.insertBefore(groupFilters, filters);
if (!document.querySelector('#project-count')) {
  count.id = 'project-count';
  count.className = 'project-count';
  count.setAttribute('aria-live', 'polite');
  projectSection?.insertBefore(count, grid);
}

function safeUrl(value) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return null;
  try {
    const url = new URL(raw, document.baseURI);
    return ['http:', 'https:'].includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
}

function projectId(project) {
  if (project.id) return String(project.id);
  return String(project.title || 'proiect')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function addAction(actions, value, label, className = '') {
  const url = safeUrl(value);
  if (!url) return;
  const anchor = document.createElement('a');
  anchor.className = `project-link${className ? ` ${className}` : ''}`;
  anchor.href = url.href;
  anchor.textContent = label;
  if (url.origin !== window.location.origin) {
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
  } else if (/\.(exe|apk|zip|7z|msi|dmg|pdf)$/i.test(url.pathname)) {
    anchor.setAttribute('download', '');
  }
  actions.append(anchor);
}

function makeCard(project, index) {
  const article = document.createElement('article');
  const canOpenDetails = project.detailsPage === true;
  article.className = `project-card${index === 0 ? ' project-featured' : ''}${canOpenDetails ? ' project-card-openable' : ''}`;
  const detailsUrl = `project.html?id=${encodeURIComponent(projectId(project))}`;
  if (canOpenDetails) {
    article.tabIndex = 0;
    article.setAttribute('role', 'link');
    article.setAttribute('aria-label', `Deschide detaliile pentru ${project.title || 'proiect'}`);
    const openDetails = () => { window.location.href = detailsUrl; };
    article.addEventListener('click', (event) => {
      if (!event.target.closest('a, button')) openDetails();
    });
    article.addEventListener('keydown', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target === article) {
        event.preventDefault();
        openDetails();
      }
    });
  }

  const topline = document.createElement('div');
  topline.className = 'project-topline';
  const number = document.createElement('span');
  number.className = 'project-index';
  number.textContent = String(index + 1).padStart(2, '0');
  const badge = document.createElement('span');
  const tone = tones.has(project.tone) ? project.tone : 'plan';
  badge.className = `tag tag-${tone}`;
  badge.textContent = project.status || 'Stadiu neprecizat';
  topline.append(number, badge);

  const domain = document.createElement('p');
  domain.className = 'domain-label';
  domain.textContent = project.domain || 'Altele';
  const title = document.createElement('h3');
  title.textContent = project.title || 'Proiect fără titlu';
  const description = document.createElement('p');
  description.className = 'project-description';
  description.textContent = project.description || '';
  const chips = document.createElement('div');
  chips.className = 'chips';
  for (const tag of Array.isArray(project.tags) ? project.tags : []) {
    const chip = document.createElement('span');
    chip.textContent = tag;
    chips.append(chip);
  }
  article.append(topline, domain, title, description, chips);

  const images = Array.isArray(project.images) ? project.images : [];
  if (images.length) {
    const gallery = document.createElement('div');
    gallery.className = 'project-gallery';
    for (const item of images) {
      const url = safeUrl(item?.src);
      if (!url) continue;
      const link = document.createElement('a');
      link.className = 'gallery-item';
      link.href = url.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', item.alt || item.caption || 'Deschide imaginea proiectului');
      const image = document.createElement('img');
      image.src = url.href;
      image.alt = item.alt || item.caption || 'Imagine din proiect';
      image.loading = 'lazy';
      link.append(image);
      if (item.caption) {
        const caption = document.createElement('span');
        caption.textContent = item.caption;
        link.append(caption);
      }
      gallery.append(link);
    }
    if (gallery.childElementCount) article.append(gallery);
  }

  const actions = document.createElement('div');
  actions.className = 'project-actions';
  if (canOpenDetails) addAction(actions, detailsUrl, 'Deschide pagina proiectului', 'action-details');
  addAction(actions, project.demo, 'Deschide demo-ul', 'action-demo');
  addAction(actions, project.link, 'Vezi codul / repository-ul');
  for (const item of Array.isArray(project.downloads) ? project.downloads : []) {
    if (!item?.url) continue;
    const label = [item.label || 'Descarcă', item.platform].filter(Boolean).join(' · ');
    addAction(actions, item.url, label, 'action-download');
  }
  if (actions.childElementCount) article.append(actions);
  return article;
}

function uniqueValues(field) {
  const values = projects.flatMap((project) => Array.isArray(project[field]) ? project[field] : []);
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
}

function renderSummary(target, values, emptyText, className) {
  target.replaceChildren();
  if (values.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = emptyText;
    target.append(empty);
    return;
  }
  for (const value of values) {
    const item = document.createElement(className === 'tool-chip' ? 'span' : 'li');
    if (className === 'tool-chip') item.className = className;
    item.textContent = value;
    target.append(item);
  }
}

function renderProjects() {
  let visibleCount = 0;
  const configuredGroups = groups.length ? groups : [
    { id: 'eu', name: 'EU', logo: 'media/logos/eu/logo.png' },
    { id: 'eu-ai', name: 'EU + AI', logo: 'media/logos/eu-ai/logo.png', mark: 'AI' }
  ];
  const host = document.createElement('div');
  host.className = `project-groups-list${activeGroup === 'all' && configuredGroups.length > 1 ? ' is-all-groups' : ' is-single-group'}`;

  for (const group of configuredGroups) {
    if (activeGroup !== 'all' && activeGroup !== group.id) continue;
    const groupProjects = projects.filter((project) => (project.group || 'eu') === group.id)
      .filter((project) => activeDomain === 'all' || (project.domain || 'Altele') === activeDomain);
    const section = document.createElement('section');
    section.className = 'project-group';
    section.setAttribute('aria-label', group.name || group.id);

    const heading = document.createElement('div');
    heading.className = 'project-group-heading';
    const logoBox = document.createElement('div');
    logoBox.className = 'project-group-logo';
    const fallback = document.createElement('span');
    fallback.className = 'project-group-logo-fallback';
    fallback.textContent = group.name || group.id;
    logoBox.append(fallback);
    const logoUrl = safeUrl(group.logo);
    if (logoUrl) {
      const logo = document.createElement('img');
      logo.src = logoUrl.href;
      logo.alt = group.name ? `Logo ${group.name}` : 'Logo categorie';
      logo.loading = 'lazy';
      logo.addEventListener('load', () => { fallback.hidden = true; });
      logo.addEventListener('error', () => logo.remove());
      logoBox.append(logo);
    }
    const titleWrap = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = group.name || group.id;
    titleWrap.append(title);
    if (group.description) {
      const note = document.createElement('p');
      note.textContent = group.description;
      titleWrap.append(note);
    }
    heading.append(logoBox, titleWrap);
    section.append(heading);

    const groupGrid = document.createElement('div');
    groupGrid.className = 'project-grid';
    groupProjects.forEach((project, index) => groupGrid.append(makeCard(project, index)));
    if (!groupProjects.length) {
      const empty = document.createElement('p');
      empty.className = 'loading-note';
      empty.textContent = 'Nu există proiecte în această categorie pentru filtrul selectat.';
      groupGrid.append(empty);
    } else {
      visibleCount += groupProjects.length;
    }
    section.append(groupGrid);
    host.append(section);
  }
  grid.replaceChildren(host);
  if (!host.childElementCount) {
    const empty = document.createElement('p');
    empty.className = 'loading-note';
    empty.textContent = 'Nu există categorii configurate. Verifică fișierul groups.json.';
    grid.replaceChildren(empty);
  }
  count.textContent = `${visibleCount} ${visibleCount === 1 ? 'proiect' : 'proiecte'} afișate`;
}

function renderGroupFilters() {
  groupFilters.replaceChildren();
  const choices = [
    { id: 'all', name: 'Toate categoriile', description: 'Vezi toate proiectele', mark: '✦' },
    ...groups
  ];

  for (const group of choices) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'category-filter-button';
    button.setAttribute('aria-pressed', String(activeGroup === group.id));

    const emblem = document.createElement('span');
    emblem.className = 'category-filter-logo';
    const fallback = document.createElement('span');
    fallback.className = 'category-filter-fallback';
    fallback.textContent = group.mark || group.name || group.id;
    emblem.append(fallback);
    if (group.logo && group.id !== 'all') {
      const logoUrl = safeUrl(group.logo);
      if (logoUrl) {
        const logo = document.createElement('img');
        logo.src = logoUrl.href;
        logo.alt = '';
        logo.setAttribute('aria-hidden', 'true');
        logo.loading = 'lazy';
        logo.addEventListener('load', () => { fallback.hidden = true; });
        logo.addEventListener('error', () => logo.remove());
        emblem.append(logo);
      }
    }

    const copy = document.createElement('span');
    copy.className = 'category-filter-copy';
    const title = document.createElement('strong');
    title.textContent = group.name || group.id;
    const note = document.createElement('small');
    note.textContent = group.description || '';
    copy.append(title, note);
    button.append(emblem, copy);
    button.addEventListener('click', () => {
      activeGroup = group.id;
      groupFilters.querySelectorAll('button').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      renderProjects();
    });
    groupFilters.append(button);
  }
}

function renderDomains() {
  const panel = document.querySelector('.hero-card[aria-label="Domenii de interes"]');
  const list = panel?.querySelector('ul');
  if (!panel || !list) return;

  const domains = [...new Set(projects.map((project) => String(project.domain || 'Altele').trim()).filter(Boolean))];
  list.replaceChildren();
  domains.forEach((domain, index) => {
    const item = document.createElement('li');
    const number = document.createElement('span');
    number.textContent = String(index + 1).padStart(2, '0');
    item.append(number, document.createTextNode(domain));
    list.append(item);
  });

  const badge = panel.querySelector('.card-orbit span');
  if (badge) badge.textContent = String(domains.length).padStart(2, '0');
  panel.setAttribute('aria-label', `${domains.length} domenii de interes`);
}

function renderFilters() {
  filters.replaceChildren();
  const domains = [...new Set(projects.map((project) => project.domain || 'Altele'))];
  const choices = [['all', 'Toate domeniile'], ...domains.map((domain) => [domain, domain])];
  for (const [value, label] of choices) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter-button';
    button.textContent = label;
    button.setAttribute('aria-pressed', String(activeDomain === value));
    button.addEventListener('click', () => {
      activeDomain = value;
      filters.querySelectorAll('button').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      renderProjects();
    });
    filters.append(button);
  }
}

Promise.all([
  fetch(new URL('projects.json', document.baseURI)).then((response) => {
    if (!response.ok) throw new Error(`projects.json nu a putut fi încărcat (HTTP ${response.status}).`);
    return response.json();
  }),
  fetch(new URL('groups.json', document.baseURI)).then((response) => {
    if (!response.ok) throw new Error(`groups.json nu a putut fi încărcat (HTTP ${response.status}).`);
    return response.json();
  })
])
  .then(([projectData, groupData]) => {
    if (!Array.isArray(projectData)) throw new Error('projects.json trebuie să conțină o listă de proiecte.');
    if (!Array.isArray(groupData)) throw new Error('groups.json trebuie să conțină o listă de categorii.');
    projects = projectData;
    groups = groupData.filter((group) => group && group.id && group.name);
    renderDomains();
    renderGroupFilters();
    renderFilters();
    renderProjects();
    renderSummary(toolList, uniqueValues('tools'), 'Nu sunt instrumente listate încă.', 'tool-chip');
    renderSummary(activityList, uniqueValues('activities'), 'Nu sunt activități listate încă.', '');
  })
  .catch((error) => {
    const message = document.createElement('p');
    message.className = 'loading-note';
    message.textContent = `Lista de proiecte nu s-a încărcat. ${error.message}`;
    grid.replaceChildren(message);
    filters.replaceChildren();
    groupFilters.replaceChildren();
    count.textContent = '';
    renderSummary(toolList, [], 'Lista de proiecte nu s-a încărcat.', 'tool-chip');
    renderSummary(activityList, [], 'Lista de proiecte nu s-a încărcat.', '');
  });
