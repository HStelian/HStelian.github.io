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

function makeField(labelText, value, onChange, type = 'input') {
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
    for (const [value, text] of toneOptions) {
      const option = document.createElement('option');
      option.value = value;
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
    card.append(makeField('Titlu', project.title, (value) => { project.title = value; }));
    card.append(makeField('Stadiu', project.status, (value) => { project.status = value; }));
    card.append(makeField('Culoarea etichetei', project.tone || 'plan', (value) => { project.tone = value; }, 'select'));
    card.append(makeField('Descriere', project.description, (value) => { project.description = value; }, 'textarea'));
    card.append(makeField('Etichete afișate pe card (separate prin virgulă)', (project.tags || []).join(', '), (value) => {
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
    status: String(item.status || ''),
    tone: toneOptions.some(([value]) => value === item.tone) ? item.tone : 'plan',
    description: String(item.description || ''),
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
  projects.push({ title: '', status: 'Prototip în lucru', tone: 'progress', description: '', tags: [], tools: [], activities: [] });
  render();
  const firstInput = list.lastElementChild?.querySelector('input');
  firstInput?.focus();
  setMessage('Proiect nou adăugat. Completează câmpurile, apoi descarcă lista.', 'success');
});

downloadButton.addEventListener('click', () => {
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

fetch('projects.json')
  .then((response) => {
    if (!response.ok) throw new Error('Selectează projects.json de pe calculator.');
    return response.json();
  })
  .then(loadData)
  .catch(() => {
    setMessage('Alege fișierul projects.json actual de pe calculator pentru a începe editarea.');
  });
