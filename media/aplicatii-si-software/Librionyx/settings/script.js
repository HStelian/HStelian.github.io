'use strict';
/* Librionyx settings UI concept: browser-only prototype. No Python, GGUF, OCR or API calls. */
const STORAGE_KEY = 'librionyx-settings-html-demo-v039';
const COLORS = ['accent', 'accent2', 'bg', 'panel', 'text', 'button'];
const PALETTES = {
  dark: { accent:'#55cde2', accent2:'#2787b4', bg:'#0b1322', panel:'#15243a', text:'#eff5ff', button:'#55cde2' },
  light: { accent:'#147f99', accent2:'#246e92', bg:'#f4f7fb', panel:'#ffffff', text:'#18263b', button:'#27afc9' }
};
const DEFAULT_MODELS = [
  'LFM2.5-1.2B-Thinking-Q4_K_M.gguf',
  'qwen2.5-0.5b-instruct-q4_k_m.gguf',
  'Qwen3-4B-Q4_K_M.gguf'
];
const DEFAULT = {
  scheme:'dark', preset:'modern', palette:structuredClone(PALETTES),
  form:{language:'Română', detail:'Normal', citations:true, retry:true, complexity:'Începător', provider:'GGUF local', ocrMode:'Auto', ocrLang:'ron+eng', ocrThreshold:'80', ocrPolicy:'Parțial'},
  models:[...DEFAULT_MODELS], activeModel:'Qwen3-4B-Q4_K_M.gguf',
  selectedModels:['Qwen3-4B-Q4_K_M.gguf'], strategy:'Serial', control:'Auto', parallel:1, resource:'safe', plugin:false
};
let state = structuredClone(DEFAULT);
let savedSnapshot = null;
let currentView = 'appearance';
let toastTimer;
const el = id => document.getElementById(id);
const copy = x => structuredClone(x);
const validHex = x => /^#[0-9a-fA-F]{6}$/.test(x);
const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);

function readSaved() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!value || typeof value !== 'object' || !['dark','light'].includes(value.scheme)) return null;
    const restored = copy(DEFAULT);
    if (['minimalist','modern','classic'].includes(value.preset)) restored.preset = value.preset;
    restored.scheme = value.scheme;
    for (const scheme of ['dark','light']) for (const key of COLORS) {
      if (validHex(value.palette?.[scheme]?.[key])) restored.palette[scheme][key] = value.palette[scheme][key].toLowerCase();
    }
    for (const key of Object.keys(DEFAULT.form)) if (typeof value.form?.[key] === typeof DEFAULT.form[key]) restored.form[key] = value.form[key];
    if (Array.isArray(value.models)) restored.models = [...new Set(value.models.filter(x => typeof x === 'string' && x.length < 260))].slice(0, 100);
    if (typeof value.activeModel === 'string' && restored.models.includes(value.activeModel)) restored.activeModel = value.activeModel;
    else restored.activeModel = restored.models[0] || '';
    if (Array.isArray(value.selectedModels)) restored.selectedModels = value.selectedModels.filter(x=>restored.models.includes(x));
    if (['Serial','Paralel','Hibrid'].includes(value.strategy)) restored.strategy = value.strategy;
    if (['Auto','Manual'].includes(value.control)) restored.control = value.control;
    if (Number.isFinite(+value.parallel)) restored.parallel = clamp(Math.trunc(+value.parallel),1,16);
    if (['safe','balanced','performance'].includes(value.resource)) restored.resource = value.resource;
    restored.plugin = Boolean(value.plugin);
    return restored;
  } catch { return null; }
}
function showToast(message) {
  const toast = el('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3600);
}
function status(message) { el('status-text').textContent = message; }
function markChanged() { status('Modificări nesalvate · Salvează pentru a le păstra în acest browser'); }

function hexRgb(hex) { const n=parseInt(hex.substring(1),16); return [(n>>16)&255,(n>>8)&255,n&255]; }
function rgbHex(rgb) { return '#'+rgb.map(x=>Math.round(x).toString(16).padStart(2,'0')).join(''); }
function blend(a,b,percent) {
  const ar=hexRgb(a),br=hexRgb(b); return rgbHex(ar.map((v,i)=>v*(1-percent)+br[i]*percent));
}
function luminance(hex) {
  const rgb=hexRgb(hex).map(v=>{ v/=255; return v<=0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); });
  return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;
}
function applyAppearance() {
  const c=state.palette[state.scheme], root=document.documentElement;
  root.style.colorScheme=state.scheme;
  for (const key of COLORS) root.style.setProperty('--'+key,c[key]);
  root.style.setProperty('--button-text', luminance(c.button)>0.42?'#091522':'#ffffff');
  root.style.setProperty('--muted',blend(c.text,c.panel,0.43));
  root.style.setProperty('--border',blend(c.panel,c.text,state.scheme==='dark'?0.105:0.15));
  root.style.setProperty('--surface',blend(c.bg,c.panel,state.scheme==='dark'?0.44:0.52));
  root.style.setProperty('--inner',blend(c.bg,c.panel,state.scheme==='dark'?0.23:0.20));
  root.style.setProperty('--input',blend(c.bg,c.panel,state.scheme==='dark'?0.33:0.28));
  document.body.classList.remove('preset-minimalist','preset-modern','preset-classic');
  document.body.classList.add('preset-'+state.preset);
  document.documentElement.dataset.scheme=state.scheme;
  el('brand-logo').src=state.scheme==='dark'?'assets/Librionyx-Dark.png':'assets/Librionyx-Light.png';
  document.querySelectorAll('[data-preset]').forEach(button=>{
    const active=button.dataset.preset===state.preset;
    button.classList.toggle('selected',active);
    button.setAttribute('aria-pressed',String(active));
  });
  document.querySelectorAll('[data-scheme]').forEach(button=>{
    const active=button.dataset.scheme===state.scheme;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  document.querySelectorAll('.color-field').forEach(field=>{
    const value=c[field.dataset.colorKey];
    field.querySelector('input[type=color]').value=value;
    const text=field.querySelector('.hex-input');text.value=value.toUpperCase(); text.classList.remove('invalid');
  });
}
function navigate(page) {
  if (!document.getElementById('page-'+page)) return;
  currentView=page;
  document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id==='page-'+page));
  document.querySelectorAll('.nav-item').forEach(button=>{
    const active=button.dataset.view===page;
    button.classList.toggle('active',active);
    button.setAttribute('aria-current',active?'page':'false');
  });
  window.scrollTo({top:0,behavior:'instant'});
}
function syncFields() {
  document.querySelectorAll('[data-setting]').forEach(input=>{
    const value=state.form[input.dataset.setting];
    if (input.type==='checkbox') input.checked=Boolean(value);
    else input.value=value ?? '';
  });
  el('parallel-limit').value=state.parallel;
  el('resource-policy').value=state.resource;
  el('demo-plugin').checked=state.plugin;
  updateMultiControls();
  renderModels();
}
function renderModels() {
  const modelSelect=el('active-model-select');modelSelect.replaceChildren();
  state.models.forEach(name=>{
    const option=document.createElement('option');option.value=name;option.textContent=name;
    modelSelect.appendChild(option);
  });
  modelSelect.value=state.activeModel;
  el('model-count').textContent=state.models.length+' modele';
  const list=el('model-list');list.replaceChildren();
  const multiList=el('multi-models-list');multiList.replaceChildren();
  if (!state.models.length) {
    const p=document.createElement('p');p.className='inline-notice';p.textContent='Nu ai adăugat modele în acest demo.';list.appendChild(p);
  }
  state.models.forEach(name=>{
    const row=document.createElement('label');row.className='model-row'+(name===state.activeModel?' active':'');
    const radio=document.createElement('input');radio.type='radio';radio.name='selectedModel';radio.checked=name===state.activeModel;
    radio.addEventListener('change',()=>{state.activeModel=name;renderModels();markChanged();});
    const content=document.createElement('div');const title=document.createElement('strong');title.textContent=name;
    const sub=document.createElement('small');sub.textContent=name===state.activeModel?'Activ în demo · nu este încărcat în memorie':'Disponibil în lista demonstrativă';
    content.append(title,sub);row.append(radio,content);list.appendChild(row);
    const mrow=document.createElement('label');mrow.className='model-row';
    const check=document.createElement('input');check.type='checkbox';check.checked=state.selectedModels.includes(name);
    check.addEventListener('change',()=>{
      state.selectedModels=check.checked?[...new Set([...state.selectedModels,name])]:state.selectedModels.filter(v=>v!==name);
      updateMultiSummary();markChanged();
    });
    const mcontent=document.createElement('div');const mt=document.createElement('strong');mt.textContent=name;
    mcontent.appendChild(mt);mrow.append(check,mcontent);multiList.appendChild(mrow);
  });
  updateMultiSummary();
}
function updateMultiControls() {
  document.querySelectorAll('[data-strategy]').forEach(b=>{
    b.classList.toggle('selected',b.dataset.strategy===state.strategy);
    b.setAttribute('aria-pressed',String(b.dataset.strategy===state.strategy));
  });
  document.querySelectorAll('[data-control]').forEach(b=>{
    b.classList.toggle('active',b.dataset.control===state.control);
    b.setAttribute('aria-pressed',String(b.dataset.control===state.control));
  });
  el('parallel-limit').disabled=state.control==='Auto';
  el('resource-policy').disabled=state.control==='Auto';
  updateMultiSummary();
}
function updateMultiSummary() {
  el('selected-models-count').textContent=state.selectedModels.length+' selectate';
  const count=state.selectedModels.length;
  const parallel=state.control==='Auto'?'limita calculată automat (în aplicația Windows)':'limita '+state.parallel;
  el('multi-summary').textContent=`Configurație demo: ${state.strategy} · ${state.control} · ${count} model${count===1?'':'e'} · ${parallel}. Nu pornește modele AI și nu detectează resurse reale.`;
}
function save() {
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state));savedSnapshot=copy(state);status('Preferințe salvate local în browser · fără modificări Windows');showToast('Preferințele demo au fost salvate în browser.'); }
  catch { savedSnapshot=copy(state);showToast('Preferințele sunt salvate doar în această sesiune.'); }
}
function restore() {
  state=copy(savedSnapshot||DEFAULT);applyAppearance();syncFields();status('Restaurat din ultima salvare');showToast('Schimbările nesalvate au fost anulate.');
}
function exportTheme() {
  const data={ format:'librionyx-theme-demo', version:1, preset:state.preset, scheme:state.scheme, palette:copy(state.palette) };
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='Librionyx-tema.json';document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
  showToast('Tema a fost exportată ca JSON.');
}
async function importTheme(file) {
  if (!file) return;
  try {
    if (file.size>100000) throw new Error('Fișierul JSON este prea mare pentru o temă.');
    const data=JSON.parse(await file.text());
    if (data.format!=='librionyx-theme-demo' || !data.palette) throw new Error('Formatul temei nu este acceptat.');
    for (const scheme of ['dark','light']) for(const key of COLORS) if(!validHex(data.palette?.[scheme]?.[key])) throw new Error(`Culoare invalidă: ${scheme}/${key}`);
    for (const scheme of ['dark','light']) for(const key of COLORS) state.palette[scheme][key]=data.palette[scheme][key].toLowerCase();
    if(['minimalist','modern','classic'].includes(data.preset)) state.preset=data.preset;
    if(['dark','light'].includes(data.scheme)) state.scheme=data.scheme;
    applyAppearance();markChanged();showToast('Tema a fost importată în demo. Salvează pentru a o păstra.');
  } catch(e) { showToast('Import eșuat: '+e.message); }
}
function initEvents() {
  document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.view)));
  document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{state.preset=b.dataset.preset;applyAppearance();markChanged();}));
  document.querySelectorAll('[data-scheme]').forEach(b=>b.addEventListener('click',()=>{state.scheme=b.dataset.scheme;applyAppearance();markChanged();}));
  el('quick-theme').addEventListener('click',()=>{state.scheme=state.scheme==='dark'?'light':'dark';applyAppearance();markChanged();});
  document.querySelectorAll('.color-field').forEach(field=>{
    const key=field.dataset.colorKey,color=field.querySelector('input[type=color]'),text=field.querySelector('.hex-input');
    color.addEventListener('input',()=>{state.palette[state.scheme][key]=color.value;applyAppearance();markChanged();});
    text.addEventListener('input',()=>{
      const value=text.value.trim();const normalized=value.startsWith('#')?value:'#'+value;
      text.classList.toggle('invalid',!validHex(normalized));
      if(validHex(normalized)){state.palette[state.scheme][key]=normalized.toLowerCase();applyAppearance();markChanged();}
    });
    text.addEventListener('blur',()=>{text.classList.remove('invalid');text.value=state.palette[state.scheme][key].toUpperCase();});
  });
  el('reset-palette').addEventListener('click',()=>{state.palette[state.scheme]=copy(PALETTES[state.scheme]);applyAppearance();markChanged();showToast('Culorile modului curent au fost resetate.');});
  document.querySelectorAll('[data-setting]').forEach(input=>input.addEventListener('change',()=>{state.form[input.dataset.setting]=input.type==='checkbox'?input.checked:input.value;markChanged();}));
  el('active-model-select').addEventListener('change',e=>{state.activeModel=e.target.value;renderModels();markChanged();});
  el('models-upload').addEventListener('change',e=>{
    const items=[...e.target.files].filter(f=>f.name.toLowerCase().endsWith('.gguf')).map(f=>f.name);
    for (const name of items) if (!state.models.includes(name)) state.models.push(name);
    if(items.length&&!state.activeModel) state.activeModel=items[0];
    renderModels();if(items.length)markChanged();showToast(`${items.length} fișier(e) selectate în demo. Nu se încarcă modelul AI.`);e.target.value='';
  });
  el('remove-model').addEventListener('click',()=>{
    if(!state.activeModel) return showToast('Nu există model selectat.');
    const name=state.activeModel;
    if(!window.confirm(`Elimini „${name}” din lista acestui demo? Fișierul original nu va fi șters.`)) return;
    state.models=state.models.filter(x=>x!==name);state.selectedModels=state.selectedModels.filter(x=>x!==name);state.activeModel=state.models[0]||'';renderModels();markChanged();
  });
  document.querySelectorAll('[data-strategy]').forEach(b=>b.addEventListener('click',()=>{state.strategy=b.dataset.strategy;updateMultiControls();markChanged();}));
  document.querySelectorAll('[data-control]').forEach(b=>b.addEventListener('click',()=>{state.control=b.dataset.control;updateMultiControls();markChanged();}));
  el('parallel-limit').addEventListener('change',e=>{state.parallel=clamp(Number(e.target.value)||1,1,16);e.target.value=state.parallel;updateMultiSummary();markChanged();});
  el('resource-policy').addEventListener('change',e=>{state.resource=e.target.value;markChanged();});
  el('ocr-check').addEventListener('click',()=>{el('ocr-note').textContent=`Previzualizare: mod ${state.form.ocrMode}, limbi ${state.form.ocrLang}. Procesarea PDF reală va fi în aplicația Windows.`;showToast('Demo HTML: OCR-ul nu a fost rulat.');});
  el('dependencies-check').addEventListener('click',()=>{el('ocr-note').textContent='Demo HTML: verificarea/instalarea PyMuPDF, Tesseract și GGUF necesită aplicația Windows.';showToast('Nu au fost instalate sau modificate componente pe calculator.');});
  el('plugin-info').addEventListener('click',()=>showToast('În demo, instalarea de pluginuri este reprezentată vizual, fără execuție.'));
  el('demo-plugin').addEventListener('change',e=>{state.plugin=e.target.checked;markChanged();showToast('Stare plugin simulată; nu se execută cod.');});
  el('preview-primary').addEventListener('click',()=>showToast('Previzualizare: buton principal. Nu pornește analiza.'));
  el('preview-secondary').addEventListener('click',()=>showToast('Previzualizare: buton secundar. Nu exportă rapoarte.'));
  el('save-settings').addEventListener('click',save);
  el('discard-changes').addEventListener('click',restore);
  el('export-theme').addEventListener('click',exportTheme);
  el('import-theme').addEventListener('click',()=>el('theme-file').click());
  el('theme-file').addEventListener('change',async e=>{await importTheme(e.target.files[0]);e.target.value='';});
}
function init() {
  const loaded=readSaved();
  if(loaded) state=loaded;
  savedSnapshot=copy(state);
  applyAppearance();syncFields();initEvents();navigate('appearance');
  status('Mod demo · modificările nu afectează aplicația Windows');
}
init();
