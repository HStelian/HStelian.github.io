function safeUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim(), document.baseURI);
    return ['http:', 'https:'].includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
}

function slugify(value) {
  return String(value || 'proiect')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function addLink(container, value, label, className = '') {
  const url = safeUrl(value);
  if (!url) return;
  const link = document.createElement('a');
  link.className = `button project-detail-link ${className}`;
  link.href = url.href;
  link.textContent = label;
  if (url.origin !== location.origin) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  } else if (/\.(exe|apk|zip|7z|msi|dmg|pdf)$/i.test(url.pathname)) {
    link.setAttribute('download', '');
  }
  container.append(link);
}

function addListSection(page, heading, values) {
  if (!Array.isArray(values) || !values.length) return;
  const section = document.createElement('section');
  section.className = 'project-detail-section';
  const title = document.createElement('h2');
  title.textContent = heading;
  const list = document.createElement('ul');
  list.className = 'project-detail-list';
  for (const value of values) {
    const item = document.createElement('li');
    item.textContent = value;
    list.append(item);
  }
  section.append(title, list);
  page.append(section);
}

function renderProject(project) {
  const page = document.querySelector('#project-detail');
  page.replaceChildren();

  if (project.detailsPage !== true) {
    const message = document.createElement('section');
    message.className = 'detail-message';
    const heading = document.createElement('h1');
    heading.textContent = 'Pagina de detalii nu este activată';
    const text = document.createElement('p');
    text.textContent = 'Pentru acest proiect este afișat doar cardul din portofoliu.';
    const back = document.createElement('a');
    back.href = 'index.html#proiecte';
    back.className = 'button button-primary';
    back.textContent = 'Înapoi la proiecte';
    message.append(heading, text, back);
    page.append(message);
    return;
  }

  const back = document.createElement('a');
  back.className = 'detail-back';
  back.href = 'index.html#proiecte';
  back.textContent = '← Toate proiectele';
  page.append(back);

  const header = document.createElement('header');
  header.className = 'project-detail-header';
  const domain = document.createElement('p');
  domain.className = 'domain-label';
  domain.textContent = project.domain || 'Altele';
  const title = document.createElement('h1');
  title.textContent = project.title || 'Proiect fără titlu';
  const status = document.createElement('span');
  const tone = ['progress', 'test', 'done', 'wip', 'plan'].includes(project.tone) ? project.tone : 'plan';
  status.className = `tag tag-${tone}`;
  status.textContent = project.status || 'Stadiu neprecizat';
  const description = document.createElement('p');
  description.className = 'project-detail-description';
  description.textContent = project.description || '';
  header.append(domain, title, status, description);

  const actions = document.createElement('div');
  actions.className = 'project-actions project-detail-actions';
  addLink(actions, project.demo, 'Deschide demo-ul', 'action-demo');
  addLink(actions, project.link, 'Vezi repository-ul');
  for (const download of Array.isArray(project.downloads) ? project.downloads : []) {
    const label = [download.label || 'Descarcă', download.platform].filter(Boolean).join(' · ');
    addLink(actions, download.url, label, 'action-download');
  }
  if (actions.childElementCount) header.append(actions);
  page.append(header);

  const images = (Array.isArray(project.images) ? project.images : []).filter((image) => safeUrl(image?.src));
  if (images.length) {
    const section = document.createElement('section');
    section.className = 'project-detail-section';
    const heading = document.createElement('h2');
    heading.textContent = 'Imagini și interfață';
    const gallery = document.createElement('div');
    gallery.className = 'detail-gallery';
    for (const item of images) {
      const url = safeUrl(item.src);
      const figure = document.createElement('figure');
      const link = document.createElement('a');
      link.href = url.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      const image = document.createElement('img');
      image.src = url.href;
      image.alt = item.alt || item.caption || 'Imagine din proiect';
      image.loading = 'lazy';
      link.append(image);
      figure.append(link);
      if (item.caption) {
        const caption = document.createElement('figcaption');
        caption.textContent = item.caption;
        figure.append(caption);
      }
      gallery.append(figure);
    }
    section.append(heading, gallery);
    page.append(section);
  }

  addListSection(page, 'Etichete', project.tags);
  addListSection(page, 'Instrumente folosite', project.tools);
  addListSection(page, 'Activități', project.activities);

  document.title = `${project.title || 'Proiect'} | Portofoliu personal`;
}

const projectId = new URLSearchParams(location.search).get('id');
fetch(new URL('projects.json', document.baseURI))
  .then((response) => {
    if (!response.ok) throw new Error(`projects.json nu a putut fi încărcat (HTTP ${response.status}).`);
    return response.json();
  })
  .then((projects) => {
    if (!Array.isArray(projects)) throw new Error('Lista de proiecte are un format incorect.');
    const project = projects.find((item) => String(item.id || slugify(item.title)) === projectId);
    if (!project) throw new Error('Proiectul cerut nu a fost găsit.');
    renderProject(project);
  })
  .catch((error) => {
    const page = document.querySelector('#project-detail');
    const message = document.createElement('p');
    message.className = 'loading-note';
    message.textContent = error.message;
    page.replaceChildren(message);
  });
