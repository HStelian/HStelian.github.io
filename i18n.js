// Shared RO/EN localisation. Source content stays in Romanian.
// English copy is maintained in translations.en.json.
// Keep the CV page accessible from all public navigation menus.
const cvNav = document.querySelector('.site-header nav');
if (cvNav && !cvNav.querySelector('a[href*="cv.html"]')) {
  const link = document.createElement('a');
  link.href = 'cv.html';
  link.textContent = 'CV';
  cvNav.insertBefore(link, cvNav.querySelector('a[href*="certifications.html"], .nav-contact'));
}
(async () => {
  let dictionary;
  try {
    const response = await fetch(new URL('translations.en.json', document.baseURI));
    if (!response.ok) throw new Error('Translation file could not be loaded.');
    dictionary = await response.json();
  } catch (error) {
    console.warn('Portfolio translations unavailable:', error);
    return;
  }
  let stored = 'ro';
  try { stored = localStorage.getItem('portfolio-language') || 'ro'; } catch {}
  const requested = new URL(location.href).searchParams.get('lang');
  let language = ['ro', 'en'].includes(requested) ? requested : stored === 'en' ? 'en' : 'ro';
  const textRecords = new WeakMap();
  const attrRecords = new WeakMap();

  function translate(source) {
    if (language === 'ro') return source;
    const value = source.trim();
    let result = dictionary[value];
    if (result === undefined) {
      let match;
      if ((match = value.match(/^(\d+) (proiect|proiecte) afișate$/))) result = match[1] + (match[1] === '1' ? ' project shown' : ' projects shown');
      else if ((match = value.match(/^(\d+) domenii de interes$/))) result = match[1] + ' areas of interest';
      else if (value.startsWith('Deschide detaliile pentru ')) result = 'Open details for ' + translate(value.slice('Deschide detaliile pentru '.length));
      else if (value.startsWith('Logo ')) result = 'Logo ' + translate(value.slice(5));
      else if (value.includes(' | ')) result = value.split(' | ').map(translate).join(' | ');
      else if (value.includes(' · ')) result = value.split(' · ').map(translate).join(' · ');
      else if ((match = value.match(/^(projects|groups)\.json nu a putut fi încărcat \(HTTP (\d+)\)\.$/))) result = match[1] + '.json could not be loaded (HTTP ' + match[2] + ').';
      else if (value.startsWith('Lista de proiecte nu s-a încărcat. ')) result = 'The project list could not be loaded. ' + translate(value.slice('Lista de proiecte nu s-a încărcat. '.length));
      else return source;
    }
    return source.slice(0, source.indexOf(value)) + result + source.slice(source.indexOf(value) + value.length);
  }

  const picker = document.createElement('div');
  picker.id = 'portfolio-language';
  picker.setAttribute('role', 'group');
  const buttons = ['ro', 'en'].map((code) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = code.toUpperCase();
    button.lang = code;
    button.addEventListener('click', () => {
      language = code;
      try { localStorage.setItem('portfolio-language', code); } catch {}
      const url = new URL(location.href);
      url.searchParams.set('lang', code);
      history.replaceState(null, '', url);
      refresh();
    });
    picker.append(button);
    return button;
  });
  const style = document.createElement('style');
  style.textContent = '#portfolio-language{display:inline-flex;gap:3px;padding:4px;border:1px solid #dce5ef;border-radius:12px;background:#fff;flex-shrink:0}#portfolio-language button{border:0;border-radius:8px;padding:7px 10px;background:transparent;color:#152238;font:700 12px system-ui;cursor:pointer}#portfolio-language button[aria-pressed="true"]{background:#152238;color:#fff}#portfolio-language button:focus-visible{outline:3px solid #f2a900;outline-offset:2px}@media(max-width:760px){.nav-wrap{flex-wrap:wrap;padding-block:10px;gap:12px}.nav-wrap nav{flex-wrap:wrap;gap:14px}}';
  document.head.append(style);
  (document.querySelector('.nav-wrap') || document.body).append(picker);

  function excluded(element) {
    return !element || element.closest('script,style,code,pre,textarea,#portfolio-language');
  }
  function syncText(node) {
    if (excluded(node.parentElement)) return;
    let record = textRecords.get(node);
    if (!record || node.nodeValue !== record.last) record = { source: node.nodeValue, last: node.nodeValue };
    const next = translate(record.source);
    if (node.nodeValue !== next) node.nodeValue = next;
    record.last = next;
    textRecords.set(node, record);
  }
  let observer;
  function refresh() {
    observer?.disconnect();
    document.documentElement.lang = language;
    picker.setAttribute('aria-label', language === 'en' ? 'Language' : 'Limba');
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.lang === language)));
    const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) syncText(node);
    document.querySelectorAll('[aria-label],[alt],meta[name="description"]').forEach((element) => {
      if (excluded(element)) return;
      let records = attrRecords.get(element);
      if (!records) { records = {}; attrRecords.set(element, records); }
      const attrs = element.matches('meta') ? ['content'] : ['aria-label', 'alt'];
      for (const attr of attrs) {
        if (!element.hasAttribute(attr)) continue;
        const current = element.getAttribute(attr);
        let record = records[attr];
        if (!record || current !== record.last) record = { source: current, last: current };
        const next = translate(record.source);
        if (current !== next) element.setAttribute(attr, next);
        record.last = next;
        records[attr] = record;
      }
    });
    document.querySelectorAll('a[href]').forEach((anchor) => {
      const url = new URL(anchor.getAttribute('href'), document.baseURI);
      if (url.origin === location.origin && /\/(index|project|certifications|cv)\.html$/.test(url.pathname)) {
        url.searchParams.set('lang', language);
        anchor.href = url.href;
      }
    });
    observer?.observe(document.documentElement, { subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['aria-label','alt','content','href'] });
  }
  observer = new MutationObserver(refresh);
  refresh();
})();
