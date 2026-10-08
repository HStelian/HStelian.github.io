const grid = document.querySelector('#project-grid');
const toolList = document.querySelector('#tool-list');
const activityList = document.querySelector('#activity-list');
const tones = new Set(['progress', 'test', 'done', 'wip', 'plan']);

function makeCard(project, index) {
  const article = document.createElement('article');
  article.className = `project-card${index === 0 ? ' project-featured' : ''}`;

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

  const title = document.createElement('h3');
  title.textContent = project.title || 'Proiect fără titlu';
  const description = document.createElement('p');
  description.textContent = project.description || '';
  const chips = document.createElement('div');
  chips.className = 'chips';
  for (const tag of Array.isArray(project.tags) ? project.tags : []) {
    const chip = document.createElement('span');
    chip.textContent = tag;
    chips.append(chip);
  }
  article.append(topline, title, description, chips);
  const link = typeof project.link === 'string' ? project.link.trim() : '';
  if (link) {
    try {
      const url = new URL(link);
      if (url.protocol === 'https:' || url.protocol === 'http:') {
        const anchor = document.createElement('a');
        anchor.className = 'project-link';
        anchor.href = url.href;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        anchor.textContent = 'Vezi proiectul';
        article.append(anchor);
      }
    } catch {
      // Ignore malformed or unsafe links; the project card remains visible.
    }
  }
  return article;
}

function uniqueValues(projects, field) {
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
    if (className === 'tool-chip') {
      item.className = className;
      item.textContent = value;
    } else {
      item.textContent = value;
    }
    target.append(item);
  }
}

fetch('projects.json')
  .then((response) => {
    if (!response.ok) throw new Error('Nu s-a putut citi projects.json.');
    return response.json();
  })
  .then((projects) => {
    if (!Array.isArray(projects)) throw new Error('Formatul projects.json nu este o listă de proiecte.');
    grid.replaceChildren();
    projects.forEach((project, index) => grid.append(makeCard(project, index)));
    if (projects.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'loading-note';
      empty.textContent = 'Nu sunt proiecte adăugate încă.';
      grid.append(empty);
    }
    renderSummary(toolList, uniqueValues(projects, 'tools'), 'Nu sunt instrumente listate încă.', 'tool-chip');
    renderSummary(activityList, uniqueValues(projects, 'activities'), 'Nu sunt activități listate încă.', '');
  })
  .catch(() => {
    const message = document.createElement('p');
    message.className = 'loading-note';
    message.textContent = 'Lista nu s-a încărcat. Verifică dacă projects.json este lângă index.html și publică din nou site-ul.';
    grid.replaceChildren(message);
    renderSummary(toolList, [], 'Lista de proiecte nu s-a încărcat.', 'tool-chip');
    renderSummary(activityList, [], 'Lista de proiecte nu s-a încărcat.', '');
  });
