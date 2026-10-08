const fileInput = document.querySelector('#file-input');
const addButton = document.querySelector('#add-project');
const downloadButton = document.querySelector('#download');
const list = document.querySelector('#project-list');
const message = document.querySelector('#message');
const toneOptions = [
  ['progress', 'Prototip în lucru'],
  ['test', 'Testat / experiment'],
  ['done', 'Configurare și verificare'],
  ['wip', 'Instalare neterminată'],
  ['plan', 'Faza de proiectare']
];
let projects = [];
let loaded = false;

function setMessage(text, kind = '') {
  message.textContent = text;
  message.className = `message${kind ? ` ${kind}` : ''}`;
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function assetFolder(project) {
  const domain = slugify(project.domain) || 'alte-domenii';
  const projectId = slugify(project.id || project.title) || 'proiect-nou';
  return `media/${domain}/${projectId}/`;
}

function listText(items, fields) {
  return (Array.isArray(items) ? items : []).map((item) => fields.map((field) => item?.[field] || '').join(' | ')).join('\n');
}

function parseLines(value, fields) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const parts = line.split('|').map((part) => part.trim());
    return Object.fromEntries(fields.map((field, index) => [field, parts[index] || '']));
  }).filter((item) => item[fields.at(-1)]);
}

function makeField(labelText, value, onChange, type = 'input', hint = '') {
  const wrapper = document.createElement('label');
  wrapper.className = 'field';
  const label = document.createElement('span');
  label.textContent = labelText;
  let control;
  if (type === 'textarea') {
    control = document.createElement('textarea');
    control.rows = 4;
  } else if (type === 'select') {
    control = document.createElement('select');
    for (const [optionValue, text] of toneOptions) {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = text;
      control.append(option);
    }
  } else {
    control = document.createElement('input');
    control.type = 'text';
  }
  control.value = value || '';
  control.addEventListener('input', () => onChange(control.value));
  control.addEventListener('change', () => onChange(control.value));
  wrapper.append(label, control);
  if (hint) {
    const note = document.createElement('small');
    note.textContent = hint;
    wrapper.append(note);
  }
  return wrapper;
}

function makeToggle(labelText, checked, onChange) {
  const wrapper = document.createElement('label');
  wrapper.className = 'toggle-field';
  const control = document.createElement('input');
  control.type = 'checkbox';
  control.checked = checked === true;
  control.addEventListener('change', () => onChange(control.checked));
  const text = document.createElement('span');
  text.textContent = labelText;
  wrapper.append(control, text);
  return wrapper;
}

function render() {
  list.replaceChildren();
  projects.forEach((project, index) => {
    const card = document.createElement('article');
    card.className = 'edit-card';
    const heading = document.createElement('div');
    heading.className = 'card-heading';
    const title = document.createElement('h2');
    title.textContent = `Proiectul ${index + 1}`;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'delete-button';
    remove.textContent = 'Șterge';
    remove.setAttribute('aria-label', `Șterge proiectul ${index + 1}`);
    remove.addEventListener('click', () => {
      projects.splice(index, 1);
      render();
      setMessage('Proiectul a fost scos din listă. Descarcă fișierul ca să păstrezi schimbarea.', 'success');
    });
    heading.append(title, remove);
    card.append(heading);
    card.append(makeField('Titlu', project.title, (value) => {
      project.title = value;
      if (!project.id) project.id = slugify(value);
      folderHint.textContent = `Folder pentru fișierele acestui proiect: ${assetFolder(project)}`;
    }));
    const folderHint = document.createElement('p');
    folderHint.className = 'asset-folder-hint';
    folderHint.textContent = `Folder pentru fișierele acestui proiect: ${assetFolder(project)}`;
    card.append(makeField('Domeniu', project.domain, (value) => {
      project.domain = value.trim() || 'Altele';
      folderHint.textContent = `Folder pentru fișierele acestui proiect: ${assetFolder(project)}`;
    }, 'input', 'Scrie orice domeniu dorești. Site-ul îl adaugă automat ca filtru.'));
    card.append(folderHint);
    card.append(makeField('Stadiu', project.status, (value) => { project.status = value; }));
    card.append(makeField('Culoarea etichetei', project.tone || 'plan', (value) => { project.tone = value; }, 'select'));
    card.append(makeField('Descriere', project.description, (value) => { project.description = value; }, 'textarea'));
    card.append(makeToggle('Deschide o pagină detaliată când se apasă pe acest proiect', project.detailsPage, (value) => {
      project.detailsPage = value;
    }));
    card.append(makeField('Demo de interfață sau aplicație web (opțional)', project.demo, (value) => { project.demo = value.trim(); }, 'input', 'Poți pune o pagină web publicată, un demo live sau o pagină locală din repository.'));
    card.append(makeField('Repository / pagină cu detalii (opțional)', project.link, (value) => { project.link = value.trim(); }));
    card.append(makeField('Descărcări (câte una pe rând)', listText(project.downloads, ['label', 'platform', 'url']), (value) => {
      project.downloads = parseLines(value, ['label', 'platform', 'url']);
    }, 'textarea', 'Format: Nume fișier | Windows / Android / ZIP | cale sau link. În repository: folderul afișat mai sus + numele fișierului.'));
    card.append(makeField('Imagini / capturi (câte una pe rând)', listText(project.images, ['src', 'caption', 'alt']), (value) => {
      project.images = parseLines(value, ['src', 'caption', 'alt']);
    }, 'textarea', 'Format: cale sau link | descriere scurtă | text alternativ. Urcă poza în folderul afișat mai sus, apoi scrie calea ei aici.'));
    card.append(makeField('Etichete (separate prin virgulă)', (project.tags || []).join(', '), (value) => {
      project.tags = value.split(',').map((item) => item.trim()).filter(Boolean);
    }));
    card.append(makeField('Instrumente pentru lista automată (separate prin virgulă)', (project.tools || []).join(', '), (value) => {
      project.tools = value.split(',').map((item) => item.trim()).filter(Boolean);
    }));
    card.append(makeField('Activități tehnice pentru lista automată (separate prin virgulă)', (project.activities || []).join(', '), (value) => {
      project.activities = value.split(',').map((item) => item.trim()).filter(Boolean);
    }));
    list.append(card);
  });
  addButton.disabled = !loaded;
  downloadButton.disabled = !loaded;
}

function loadData(data) {
  if (!Array.isArray(data) || data.some((item) => !item || typeof item !== 'object')) {
    throw new Error('Fișierul trebuie să conțină o listă de proiecte în format JSON.');
  }
  projects = data.map((item) => ({
    title: String(item.title || ''),
    id: String(item.id || ''),
    domain: String(item.domain || 'Altele'),
    status: String(item.status || ''),
    tone: toneOptions.some(([value]) => value === item.tone) ? item.tone : 'plan',
    description: String(item.description || ''),
    detailsPage: item.detailsPage === true,
    demo: String(item.demo || ''),
    link: String(item.link || ''),
    downloads: Array.isArray(item.downloads) ? item.downloads.map((entry) => ({ label: String(entry.label || ''), platform: String(entry.platform || ''), url: String(entry.url || '') })) : [],
    images: Array.isArray(item.images) ? item.images.map((entry) => ({ src: String(entry.src || ''), caption: String(entry.caption || ''), alt: String(entry.alt || '') })) : [],
    tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
    tools: Array.isArray(item.tools) ? item.tools.map(String) : [],
    activities: Array.isArray(item.activities) ? item.activities.map(String) : []
  }));
  loaded = true;
  render();
  setMessage(`${projects.length} proiecte încărcate. Editează câmpurile și descarcă fișierul actualizat.`, 'success');
}

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      loadData(JSON.parse(String(reader.result)));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nu am putut citi fișierul.', 'error');
    }
  };
  reader.onerror = () => setMessage('Nu am putut citi fișierul ales.', 'error');
  reader.readAsText(file);
});

addButton.addEventListener('click', () => {
  projects.push({ title: '', id: '', domain: 'Altele', status: 'Prototip în lucru', tone: 'progress', description: '', detailsPage: false, demo: '', link: '', downloads: [], images: [], tags: [], tools: [], activities: [] });
  render();
  list.lastElementChild?.querySelector('input')?.focus();
  setMessage('Proiect nou adăugat. Completează câmpurile și descarcă lista.', 'success');
});

downloadButton.addEventListener('click', () => {
  const usedIds = new Set();
  for (const project of projects) {
    const base = slugify(project.id || project.title) || 'proiect';
    let candidate = base;
    let suffix = 2;
    while (usedIds.has(candidate)) candidate = `${base}-${suffix++}`;
    project.id = candidate;
    usedIds.add(candidate);
  }
  const blob = new Blob([`${JSON.stringify(projects, null, 2)}\n`], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'projects.json';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  setMessage('Fișierul projects.json a fost descărcat. Încarcă-l în repository ca să publici schimbările.', 'success');
});

fetch(new URL('projects.json', document.baseURI))
  .then((response) => {
    if (!response.ok) throw new Error('Selectează projects.json de pe calculator.');
    return response.json();
  })
  .then(loadData)
  .catch(() => setMessage('Alege fișierul projects.json actual de pe calculator pentru a începe editarea.'));
