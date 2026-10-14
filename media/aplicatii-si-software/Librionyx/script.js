'use strict';
/* UI prototype only. It does NOT analyze files, load GGUF, call APIs, or run OCR. */
const STORE='librionyx-app-demo-v040';
const SETTINGS_STORE='librionyx-settings-html-demo-v039';
const LOGO_PATHS={dark:'assets/Librionyx-Dark.png',light:'assets/Librionyx-Light.png'};
const SETTINGS_PALETTES={
 dark:{accent:'#55cde2',accent2:'#2787b4',bg:'#0b1322',panel:'#15243a',text:'#eff5ff',button:'#55cde2'},
 light:{accent:'#147f99',accent2:'#246e92',bg:'#f4f7fb',panel:'#ffffff',text:'#18263b',button:'#27afc9'}
};
const sample=()=>({categories:[
 {id:'general',name:'General'},
 {id:'education',name:'Educație fizică'},
 {id:'it',name:'IT'}],books:[
 {id:'book1',category:'education',name:'1. Aspecte generale',format:'PDF',source:'Exemplu',size:null},
 {id:'book2',category:'education',name:'2. Noțiuni teoretice',format:'PDF',source:'Exemplu',size:null},
 {id:'book3',category:'education',name:'3. Noțiuni terminologice',format:'PDF',source:'Exemplu',size:null},
 {id:'book4',category:'education',name:'4. Socializarea în Educația fizică',format:'PDF',source:'Exemplu',size:null},
 {id:'book5',category:'education',name:'5. Idealul Educației Fizice',format:'PDF',source:'Exemplu',size:null},
 {id:'book6',category:'it',name:'Rețele locale',format:'PDF',source:'Exemplu',size:null},
 {id:'book7',category:'it',name:'Sisteme de recunoaștere a formelor',format:'PDF',source:'Exemplu',size:null}],trash:[],reports:[],history:[]});
const $=id=>document.getElementById(id);
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>`demo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
const stamp=()=>new Date().toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
let data=sample(),activeCat='education',selected=new Set(),route='library',tab='books',mode='list',busy=false,runToken=0,reportByCategory={},eventLines=[],toastTimer=null;
const maybeStorage=(op,key,value)=>{try{return op==='get'?localStorage.getItem(key):localStorage.setItem(key,value)}catch{return null}};
function initData(){
 const raw=maybeStorage('get',STORE);if(!raw)return;
 try{const s=JSON.parse(raw);if(!Array.isArray(s.categories)||!Array.isArray(s.books)||!Array.isArray(s.trash))return;
  data={categories:s.categories.filter(c=>c&&typeof c.id==='string'&&typeof c.name==='string').slice(0,200),books:s.books.filter(b=>b&&typeof b.id==='string'&&typeof b.name==='string').slice(0,1000),trash:s.trash.slice(0,1000),reports:Array.isArray(s.reports)?s.reports.slice(-50):[],history:Array.isArray(s.history)?s.history.slice(-100):[]};
  activeCat=data.categories.some(c=>c.id===s.activeCat)?s.activeCat:data.categories[0]?.id||'';
 }catch{}
}
function save(){maybeStorage('set',STORE,JSON.stringify({...data,activeCat}));}
function eventLog(msg){data.history.push({time:stamp(),msg:String(msg)});data.history=data.history.slice(-100);save();renderHistory();}
function live(msg,percent=null){eventLines.push({time:stamp(),msg});eventLines=eventLines.slice(-100);renderLive();$('activity-preview').textContent=msg;$('activity-indicator').textContent=busy?'În lucru':'Inactiv';if(percent!==null)$('activity-bar').style.width=`${percent}%`;if(route==='history')eventLog(msg);}
function toast(msg){const x=$('toast');x.textContent=msg;x.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>x.classList.remove('visible'),3200);$('footer-message').textContent=msg;}
function catName(id){return data.categories.find(c=>c.id===id)?.name||'Categorie necunoscută';}
function booksInCat(){return data.books.filter(b=>b.category===activeCat);}
function escapeText(s){return escapeHtml(s||'');}
function computeAppearance(){
 let options=null;try{options=JSON.parse(maybeStorage('get',SETTINGS_STORE)||'null');}catch{}
 const scheme=['light','dark'].includes(options?.scheme)?options.scheme:(maybeStorage('get','librionyx-app-scheme')||'dark');
 const preset=['modern','minimalist','classic'].includes(options?.preset)?options.preset:'modern';
 const schemePalette={...SETTINGS_PALETTES[scheme],...(options?.palette?.[scheme]||{})};
 const validHex=x=>/^#[0-9a-f]{6}$/i.test(x||'');
 const c={};for(const k of ['accent','accent2','bg','panel','text','button'])c[k]=validHex(schemePalette[k])?schemePalette[k]:SETTINGS_PALETTES[scheme][k];
 const h2rgb=x=>[1,3,5].map(i=>parseInt(x.slice(i,i+2),16));
 const blend=(a,b,p)=>'#'+h2rgb(a).map((v,i)=>Math.round(v*(1-p)+h2rgb(b)[i]*p).toString(16).padStart(2,'0')).join('');
 const luminance=x=>h2rgb(x).map(v=>v/255).reduce((a,v,i)=>a+[.2126,.7152,.0722][i]*(v<=.04045?v/12.92:((v+.055)/1.055)**2.4),0);
 const root=document.documentElement;root.style.colorScheme=scheme;for(const [k,v]of Object.entries(c))root.style.setProperty('--'+k,v);
 root.style.setProperty('--muted',blend(c.text,c.panel,.43));root.style.setProperty('--border',blend(c.panel,c.text,scheme==='dark'?.105:.15));
 root.style.setProperty('--surface',blend(c.bg,c.panel,scheme==='dark'?.44:.52));root.style.setProperty('--inner',blend(c.bg,c.panel,scheme==='dark'?.23:.20));root.style.setProperty('--input',blend(c.bg,c.panel,scheme==='dark'?.33:.28));root.style.setProperty('--button-text',luminance(c.button)>.42?'#091522':'#fff');
 document.body.className=`preset-${preset}`;
 $('brand-logo').src=LOGO_PATHS[scheme];
 $('quick-theme').dataset.scheme=scheme;
 const complex=options?.form?.complexity;if(['Începător','Avansat','God'].includes(complex))$('complexity').value=complex;
 const detail=options?.form?.detail;if(['Simplu','Normal','Complex'].includes(detail))$('analysis-detail').value=detail;
 syncComplexity();
}
function syncComplexity(){const value=$('complexity').value;document.body.dataset.complexity=value;
 document.querySelectorAll('.advanced-option').forEach(el=>{el.style.display=value==='Începător'?'none':''});
 if(value==='God'){$('analysis-strategy').parentNode.style.display='flex'}
}
function renderCategories(){const host=$('category-tree');host.replaceChildren();
 for(const c of data.categories){const btn=document.createElement('button');btn.type='button';btn.className='cat-item'+(c.id===activeCat?' active':'');btn.innerHTML='<svg class="icon"><use href="#i-folder"/></svg><span></span><span class="cat-count"></span>';
 btn.children[1].textContent=c.name;btn.children[2].textContent=data.books.filter(b=>b.category===c.id).length;
 btn.onclick=()=>{activeCat=c.id;selected.clear();route='library';tab='books';$('book-search').value='';$('global-search').value='';save();render();};host.appendChild(btn)}
 $('nav-book-count').textContent=data.books.length;$('nav-report-count').textContent=data.reports.length;$('nav-trash-count').textContent=data.trash.length;
}
function render(){renderCategories();document.querySelectorAll('.route-panel').forEach(p=>p.classList.toggle('active',p.id===route+'-route'));
 document.querySelectorAll('.side-nav').forEach(b=>b.classList.toggle('active',b.dataset.route===route));
 $('page-title').textContent=catName(activeCat);
 const n=booksInCat().length;$('summary-books').textContent=n;$('tab-books-count').textContent=n;
 $('summary-books-meta').textContent=n===1?'1 document în bibliotecă':`${n} documente în bibliotecă`;
 $('summary-reports').textContent=data.reports.filter(r=>r.category===activeCat).length;
 $('chat-category-label').textContent=`Categoria: ${catName(activeCat)}`;
 document.querySelectorAll('.tab').forEach(b=>{const is=b.dataset.tab===tab;b.classList.toggle('active',is);b.setAttribute('aria-selected',String(is))});
 document.querySelectorAll('.tab-content').forEach(e=>e.classList.toggle('active',e.id==='tab-'+tab));
 renderBooks();renderReports();renderTrash();renderHistory();renderLive();
}
function filteredBooks(){let list=booksInCat();const q=$('book-search').value.trim().toLocaleLowerCase('ro');const glob=$('global-search').value.trim().toLocaleLowerCase('ro');
 const search=glob||q;if(search)list=list.filter(b=>b.name.toLocaleLowerCase('ro').includes(search)||b.format.toLocaleLowerCase('ro').includes(search));
 const sort=$('sort-books').value;return list.slice().sort((a,b)=>sort==='added'?String(b.id).localeCompare(String(a.id)):sort==='type'?a.format.localeCompare(b.format)||a.name.localeCompare(b.name):a.name.localeCompare(b.name,'ro'));
}
function bookRow(b){const div=document.createElement('div');div.className='book-row'+(selected.has(b.id)?' selected':'');div.dataset.id=b.id;
 div.innerHTML=`<input class="book-checkbox" type="checkbox" aria-label="Selectează carte" ${selected.has(b.id)?'checked':''}><div class="book-title-cell"><span class="book-type"><svg class="icon"><use href="#i-file"/></svg></span><div><strong>${escapeText(b.name)}</strong><small>${escapeText(b.format)} · ${escapeText(b.source||'Exemplu')} · ${b.size?sizeLabel(b.size):'metadate demo'}</small></div></div><div class="book-meta-cell">${escapeText(b.format)}<small>Local · demo</small></div><span class="status-tag ready">În catalog</span><button type="button" class="book-more" title="Acțiuni carte" aria-label="Acțiuni carte"><svg class="icon"><use href="#i-more"/></svg></button>`;
 div.addEventListener('click',ev=>{if(ev.target.closest('.book-more'))return;const checked=ev.target.closest('input')?.checked;if(ev.target.closest('input')){if(checked)selected.add(b.id);else selected.delete(b.id);}else{selected.has(b.id)?selected.delete(b.id):selected.add(b.id);}renderBooks();});
 div.querySelector('.book-more').onclick=ev=>{ev.stopPropagation();openBookActions(b.id)};
 return div;
}
function sizeLabel(bytes){if(!bytes)return '—';return bytes<1024*1024?`${Math.max(1,Math.round(bytes/1024))} KB`:`${(bytes/(1024*1024)).toFixed(1)} MB`}
function renderBooks(){const host=$('books-host'),list=filteredBooks();host.replaceChildren();host.classList.toggle('grid-mode',mode==='grid');host.classList.toggle('list-mode',mode==='list');
 if(mode==='list'&&list.length){const hd=document.createElement('div');hd.className='book-table-head';hd.innerHTML='<span></span><span>DOCUMENT</span><span>FORMAT</span><span>STARE</span><span></span>';host.append(hd)}
 list.forEach(b=>host.append(bookRow(b)));
 if(!list.length){const emp=document.createElement('div');emp.className='empty-state';emp.innerHTML='<svg class="icon"><use href="#i-books"/></svg><h3>Nu există cărți în această listă</h3><p>Adaugă documente sau modifică termenii căutării. Fișierele adăugate sunt afișate doar ca metadate în demo.</p><button class="btn btn-secondary" type="button">Adaugă cărți</button>';emp.querySelector('button').onclick=()=>$('file-picker').click();host.append(emp)}
 $('books-footer').textContent=`${list.length} afișate din ${booksInCat().length} · Nu sunt încărcate conținuturile PDF`;
 $('selection-status').textContent=selected.size?`${selected.size} selectate`:'Selectează toate';$('select-all').checked=!!list.length&&list.every(b=>selected.has(b.id));$('select-all').indeterminate=selected.size>0&&!$('select-all').checked;
 $('remove-selection').disabled=selected.size===0;$('move-selection').disabled=selected.size===0;
}
function setTab(next){tab=next;route='library';render();}
function showRoute(next){route=next;render();}
function showModal({eyebrow='BIBLIOTECĂ',title,body,confirm='Salvează',onSubmit}){const m=$('main-modal');$('modal-eyebrow').textContent=eyebrow;$('modal-title').textContent=title;$('modal-body').replaceChildren();$('modal-body').append(body);$('confirm-modal').textContent=confirm;
 m.onsubmit=e=>{e.preventDefault();if(onSubmit()!==false)m.close()};m.showModal();}
function modalNode(html){const el=document.createElement('div');el.innerHTML=html;return el}
function newCategory(){const node=modalNode('<p>Creează o categorie pentru organizarea documentelor tale.</p><label class="modal-field">Numele categoriei<input id="new-cat-name" type="text" maxlength="100" placeholder="Ex.: Cărți științifice" required></label>');showModal({title:'Categorie nouă',body:node,confirm:'Creează categoria',onSubmit:()=>{const v=node.querySelector('input').value.trim();if(!v){node.querySelector('input').focus();return false;}if(data.categories.some(c=>c.name.toLowerCase()===v.toLowerCase())){toast('Există deja o categorie cu acest nume.');return false;}const id=uid();data.categories.push({id,name:v});activeCat=id;selected.clear();eventLog(`Categorie creată: ${v}`);save();render();toast('Categoria a fost creată în demo.');}});setTimeout(()=>node.querySelector('input')?.focus(),20);}
function addFiles(files){if(!files.length)return;let count=0;for(const file of files){const name=file.name||'';if(!/\.(pdf|epub|txt|md|docx|mobi|azw|azw3|cbz|cbr|png|jpe?g)$/i.test(name))continue;
 data.books.push({id:uid(),category:activeCat,name:name.replace(/\.[^.]+$/,''),format:name.split('.').pop().toUpperCase(),source:'Selectat local · metadate',size:file.size||null});count++}
 $('file-picker').value='';eventLog(`${count} fișier(e) selectate în ${catName(activeCat)} — doar metadate demo`);save();render();toast(count?`${count} fișier(e) adăugate în catalogul demo. Conținutul NU a fost citit.`:'Niciun fișier din formatele acceptate.');}
function removeSelected(ids=[...selected]){if(!ids.length)return;const n=ids.length;const node=modalNode(`<p>Muți ${n} carte/cărți în coșul demonstrativ?</p><p>În acest prototip nu este șters și nu este modificat niciun fișier de pe calculator.</p>`);
 showModal({eyebrow:'CONFIRMARE',title:'Mută în Coș Librionyx',body:node,confirm:'Mută în coș',onSubmit:()=>{const all=new Set(ids);const removed=data.books.filter(x=>all.has(x.id));data.books=data.books.filter(x=>!all.has(x.id));data.trash.push(...removed);selected.clear();eventLog(`${removed.length} carte/cărți mutate în coșul demo`);save();render();toast('Cărțile au fost mutate în Coș (doar în demo).')}})}
function openBookActions(id){const b=data.books.find(x=>x.id===id);if(!b)return;const node=modalNode(`<p><strong>${escapeText(b.name)}</strong></p><p>Acest dialog arată informații despre carte și oferă administrare în catalogul demonstrativ.</p><label class="modal-field">Denumirea cărții<input id="book-new-name" maxlength="240" value="${escapeText(b.name)}"></label>`);
 showModal({title:'Detalii carte',body:node,confirm:'Salvează denumirea',onSubmit:()=>{const value=node.querySelector('input').value.trim();if(!value)return false;b.name=value;eventLog(`Nume actualizat: ${value}`);save();render();toast('Denumirea a fost actualizată în demo.')}})}
function moveSelected(){const ids=[...selected];if(!ids.length)return;const choices=data.categories.filter(x=>x.id!==activeCat);if(!choices.length)return toast('Creează o altă categorie pentru a muta cărțile.');const node=modalNode(`<p>Alege categoria în care vei muta cele ${ids.length} cărți selectate.</p><label class="modal-field">Categorie destinație<select id="move-target">${choices.map(c=>`<option value="${escapeText(c.id)}">${escapeText(c.name)}</option>`).join('')}</select></label>`);
 showModal({title:'Mută cărți',body:node,confirm:'Mută selecția',onSubmit:()=>{const newCat=node.querySelector('select').value;data.books.filter(b=>ids.includes(b.id)).forEach(b=>b.category=newCat);selected.clear();eventLog(`${ids.length} carte/cărți mutate în ${catName(newCat)}`);save();render();toast('Cărțile au fost mutate în altă categorie (demo).')}})}
function renderTrash(){const host=$('trash-list');host.replaceChildren();if(!data.trash.length){host.innerHTML='<div class="empty-state"><svg class="icon"><use href="#i-trash"/></svg><h3>Coșul este gol</h3><p>Nicio carte nu a fost eliminată din catalogul demonstrativ.</p></div>';return}
 for(const b of [...data.trash].reverse()){const c=document.createElement('div');c.className='route-card';c.innerHTML=`<div><h3>${escapeText(b.name)}</h3><p>${escapeText(b.format)} · Categoria inițială: ${escapeText(catName(b.category))}</p></div><button type="button" class="btn btn-secondary btn-small">Restaurează</button>`;c.querySelector('button').onclick=()=>{data.trash=data.trash.filter(x=>x.id!==b.id);if(!data.categories.some(x=>x.id===b.category))b.category=data.categories[0]?.id||'';data.books.push(b);eventLog(`Restaurată: ${b.name}`);save();render();toast('Cartea a fost restaurată în catalogul demo.')};host.append(c)}
}
function renderHistory(){const host=$('history-list');host.replaceChildren();if(!data.history.length){host.innerHTML='<div class="empty-state"><h3>Nu există activități</h3><p>Adaugă o carte, creează o categorie sau pornește o analiză demonstrativă.</p></div>';return}
 for(const e of [...data.history].reverse()){const div=document.createElement('div');div.className='route-card';div.innerHTML=`<div><h3>${escapeText(e.msg)}</h3><p>Activitate demonstrativă · ${escapeText(e.time)}</p></div>`;host.append(div)}
}
function renderReports(){const host=$('analyses-list');host.replaceChildren();if(!data.reports.length){host.innerHTML='<div class="empty-state"><svg class="icon"><use href="#i-chart"/></svg><h3>Nu există analize</h3><p>Pornește o analiză din Bibliotecă pentru a vedea cum arată un raport demonstrativ.</p></div>';return}
 for(const r of [...data.reports].reverse()){const div=document.createElement('div');div.className='route-card';div.innerHTML=`<div><h3>${escapeText(r.categoryName)}</h3><p>${r.count} document(e) · ${escapeText(r.detail)} · ${escapeText(r.time)} · <strong>Simulare</strong></p></div><button type="button" class="btn btn-secondary btn-small">Vezi raportul</button>`;div.querySelector('button').onclick=()=>{activeCat=r.category;reportByCategory[activeCat]=r;setTab('report')};host.append(div)}
 const current=reportByCategory[activeCat]||[...data.reports].reverse().find(r=>r.category===activeCat);$('report-subtitle').textContent=current?`Raport demonstrativ · ${current.time} · ${current.count} cărți`:'Selectează o categorie și pornește analiza demonstrativă.';
 const out=$('report-content');if(!current){out.className='report-content empty-report';out.innerHTML='<div class="empty-graphic"><svg class="icon"><use href="#i-chart"/></svg></div><h3>Niciun raport pentru această categorie</h3><p>Pornește o analiză pentru a vedea un raport de interfață. Nu este rulat un model real.</p>';return}
 out.className='report-content';out.innerHTML=`<div class="demo-banner"><strong>PROTOTIP — RAPORT SIMULAT</strong><div>Nu au fost citite sau analizate paginile documentelor. Această prezentare verifică doar fluxul interfeței, nu calitatea AI.</div></div><h3>Categoria: ${escapeText(current.categoryName)}</h3><p><strong>${current.count} carte/cărți</strong> · Nivel: ${escapeText(current.detail)} · Mod: ${escapeText(current.strategy)}</p><div class="report-section"><h3>Documente incluse în demonstrație</h3><ul>${current.titles.map(t=>`<li>${escapeText(t)} — <em>conținutul nu a fost procesat</em></li>`).join('')}</ul></div><div class="report-section"><h3>Stadiu al sistemului</h3><p>Interfața prezintă pașii de analiză, jurnalul și exportul. Pentru concluzii și citări reale este necesară integrarea motorului GGUF/API, extragerea PDF și verificarea surselor.</p></div>`;
}
function renderLive(){const host=$('main-activity');host.replaceChildren();if(!eventLines.length){host.innerHTML='<p>În așteptarea primei analize...</p>';return}for(const e of eventLines){const p=document.createElement('p');p.innerHTML=`<time>${escapeText(e.time)}</time> · ${escapeText(e.msg)}`;host.append(p)}host.scrollTop=host.scrollHeight;}
const wait=ms=>new Promise(done=>setTimeout(done,ms));
async function runAnalysis(){if(busy)return;const entries=booksInCat();if(!entries.length){toast('Categoria nu are cărți de analizat.');return}
 busy=true;const token=++runToken;const category=activeCat;const title=catName(category),detail=$('analysis-detail').value,strategy=$('analysis-strategy').value;
 $('run-analysis').disabled=true;$('new-analysis').disabled=true;$('cancel-run').hidden=false;$('activity-indicator').textContent='În lucru';$('run-status').innerHTML='<span class="muted-icon"><svg class="icon"><use href="#i-clock"/></svg></span><span>Simulare în curs...</span>';
 tab='activity';render();live('Pornesc simularea analizei (nu rulez modele AI).',5);eventLog('Analiză demonstrativă începută: '+title);
 const steps=[{text:`Pregătesc categoria „${title}”`,percent:13},...entries.map((b,i)=>({text:`[${i+1}/${entries.length}] Etapă demo: ${b.name}`,percent:15+(i+1)/(entries.length+1)*65})),{text:'Simulez structurarea raportului și comparația.',percent:90}];
 for(const s of steps){await wait(440);if(token!==runToken){busy=false;return}live(s.text,s.percent)}
 await wait(430);if(token!==runToken){busy=false;return}
 const report={id:uid(),category,categoryName:title,count:entries.length,titles:entries.map(x=>x.name),detail,strategy:($('complexity').value==='Începător'?'Serial':strategy),time:stamp()};
 data.reports.push(report);data.reports=data.reports.slice(-50);reportByCategory[category]=report;busy=false;live('Simularea este finalizată; nu s-a executat inferență AI.',100);eventLog('Raport demonstrativ creat: '+title);$('run-analysis').disabled=false;$('new-analysis').disabled=false;$('cancel-run').hidden=true;$('run-status').innerHTML='<span class="muted-icon"><svg class="icon"><use href="#i-check"/></svg></span><span>Simulare finalizată</span>';
 save();tab='report';render();$('tab-report-badge').hidden=false;toast('Raportul DEMO a fost generat. Nu conține analize reale.');
}
function cancelAnalysis(){if(!busy)return;runToken++;busy=false;$('run-analysis').disabled=false;$('new-analysis').disabled=false;$('cancel-run').hidden=true;$('activity-indicator').textContent='Oprit';live('Simularea analizei a fost oprită.',0);$('run-status').textContent='Anulată';eventLog('Simulare anulată');toast('Simularea a fost oprită.');}
function addChatMessage(kind,message,demo=false){const m=document.createElement('div');m.className='message '+kind;const label=document.createElement('div');label.className='message-label';label.textContent=kind==='user'?'Tu':'Librionyx AI · demo';const body=document.createElement('div');body.className='message-body';if(demo){const note=document.createElement('span');note.className='msg-note';note.textContent='RĂSPUNS DEMONSTRATIV';body.append(note)}body.append(document.createTextNode(message));m.append(label,body);$('chat-messages').append(m);$('chat-messages').scrollTop=$('chat-messages').scrollHeight;}
async function sendChat(value){const text=String(value||$('chat-input').value).trim();if(!text)return;addChatMessage('user',text);$('chat-input').value='';$('activity-indicator').textContent='Simulare';$('activity-preview').textContent='Simulez afișarea răspunsului în chat...';$('activity-bar').style.width='24%';eventLog('Întrebare introdusă în chat (fără AI): '+text.slice(0,60));await wait(600);
 const names=booksInCat().map(b=>b.name);const message=names.length?`Am primit întrebarea despre categoria „${catName(activeCat)}” (${names.length} documente).\n\nÎn acest prototip sunt disponibile doar titlurile și metadatele, nu și conținutul cărților. De aceea nu pot oferi un rezumat real. În aplicația Windows, analiza va folosi textul extras din documente și referințele la pagini.`:'Categoria este goală. Adaugă cărți pentru a pregăti o analiză în aplicația Windows.';
 addChatMessage('assistant',message,true);$('activity-indicator').textContent='Inactiv';$('activity-preview').textContent='Interacțiune chat completată (simulare).';$('activity-bar').style.width='100%';}
function exportReport(){const r=reportByCategory[activeCat]||[...data.reports].reverse().find(x=>x.category===activeCat);if(!r){toast('Nu există raport pentru export.');return}
 const text=['LIBRIONYX — RAPORT DEMONSTRATIV','NU CONȚINE ANALIZĂ AI SAU EXTRAGERE REALĂ DIN PDF','',`Categorie: ${r.categoryName}`,`Nivel: ${r.detail}`,`Strategie: ${r.strategy}`,'','Titluri înregistrate:',...r.titles.map(t=>'- '+t),'','Pentru un raport real este necesar motorul AI și accesul la conținutul documentelor.'].join('\n');const blob=new Blob([text],{type:'text/plain;charset=utf-8'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='Librionyx-Raport-DEMO.txt';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1500);toast('Raport DEMO exportat în TXT.');}
function openSettings(){if(window.LIBRIONYX_EMBEDDED_SETTINGS){const wrap=document.createElement('div');wrap.id='settings-overlay';wrap.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:100;display:flex;flex-direction:column;padding:12px';const close=document.createElement('button');close.textContent='Închide Setările și aplică tema';close.className='btn btn-primary';close.style.cssText='align-self:end;margin:0 0 8px';const frame=document.createElement('iframe');frame.title='Setări Librionyx';frame.style.cssText='width:100%;flex:1;border:1px solid var(--border);border-radius:10px;background:var(--bg)';frame.srcdoc=window.LIBRIONYX_EMBEDDED_SETTINGS;close.onclick=()=>{wrap.remove();computeAppearance();toast('Aspectul a fost actualizat din Setări.');};wrap.append(close,frame);document.body.append(wrap);}else{window.open('settings/index.html','_blank','noopener');toast('Setările aprobate se deschid într-un tab separat.')}}
function hook(){
 document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>showRoute(b.dataset.route));
 document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{mode=b.dataset.view;document.querySelectorAll('[data-view]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});renderBooks()});
 $('complexity').onchange=()=>{syncComplexity();toast(`Interfață: ${$('complexity').value}`)};
 $('quick-theme').onclick=()=>{const next=$('quick-theme').dataset.scheme==='dark'?'light':'dark';maybeStorage('set','librionyx-app-scheme',next);let options;try{options=JSON.parse(maybeStorage('get',SETTINGS_STORE)||'null')}catch{}if(options){options.scheme=next;maybeStorage('set',SETTINGS_STORE,JSON.stringify(options))}computeAppearance()};
 $('open-settings').onclick=openSettings;
 window.addEventListener('focus',()=>computeAppearance());
 window.addEventListener('storage',e=>{if(e.key===SETTINGS_STORE)computeAppearance()});
 window.addEventListener('message',e=>{if(e.data?.type!=='librionyx-embedded-settings-saved')return;const iframe=document.querySelector('#settings-overlay iframe');if(!iframe||e.source!==iframe.contentWindow)return;try{maybeStorage('set',SETTINGS_STORE,JSON.stringify(e.data.settings));computeAppearance();toast('Culorile și stilul au fost aplicate în interfața demo.')}catch{}});
 $('new-category-icon').onclick=newCategory;$('add-category').onclick=newCategory;
 $('add-books').onclick=$('book-add-inline').onclick=()=>$('file-picker').click();$('file-picker').onchange=e=>addFiles([...e.target.files]);
 $('book-search').oninput=()=>renderBooks();$('global-search').oninput=()=>{route='library';render()};$('sort-books').onchange=renderBooks;
 $('select-all').onchange=e=>{filteredBooks().forEach(b=>e.target.checked?selected.add(b.id):selected.delete(b.id));renderBooks()};
 $('remove-selection').onclick=()=>removeSelected();$('move-selection').onclick=moveSelected;
 $('new-analysis').onclick=$('run-analysis').onclick=runAnalysis;$('cancel-run').onclick=cancelAnalysis;
 $('export-report').onclick=exportReport;$('clear-activity').onclick=()=>{eventLines=[];renderLive();toast('Jurnalul live a fost golit.')};
 $('send-chat').onclick=()=>sendChat();$('chat-input').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat()}});
 $('quick-questions').querySelectorAll('[data-prompt]').forEach(b=>b.onclick=()=>sendChat(b.dataset.prompt));$('clear-chat').onclick=()=>{showWelcome();toast('Conversația demo a fost curățată.')};
 $('close-modal').onclick=$('cancel-modal').onclick=()=>$('main-modal').close();
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('global-search').focus()}});
}
function showWelcome(){$('chat-messages').innerHTML='<div class="chat-welcome"><div class="welcome-emblem"><svg class="icon"><use href="#i-spark"/></svg></div><h3>Ce vrei să afli din cărțile tale?</h3><p>Adresează o întrebare, cere un rezumat sau compară documentele. În demo vei vedea fluxul de conversație, fără analiză reală.</p></div>'}
function initialize(){initData();hook();computeAppearance();render();showWelcome();$('footer-message').textContent='Prototip HTML · documentele afișate sunt exemple sau metadate selectate de utilizator';$('clock-display').textContent='v0.4.0 · propunere';}
initialize();
