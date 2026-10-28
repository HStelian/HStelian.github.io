// Add earned credentials to certifications.json; keep [] until then.
const certificationList = document.querySelector('#certification-list');

function certificateUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim(), document.baseURI);
    return ['https:', 'http:'].includes(url.protocol) ? url : null;
  } catch { return null; }
}

function certificateLink(card, value, label) {
  const url = certificateUrl(value);
  if (!url) return;
  const link = document.createElement('a');
  link.className = 'project-link';
  link.href = url.href;
  link.textContent = label;
  if (url.origin !== location.origin) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
  card.append(link);
}

function renderCertificates(certificates) {
  certificationList.replaceChildren();
  if (!certificates.length) {
    const empty = document.createElement('section');
    empty.className = 'loading-note';
    const title = document.createElement('h2');
    title.textContent = 'Nu sunt adăugate încă certificări';
    const text = document.createElement('p');
    text.textContent = 'Voi adăuga aici certificările obținute, împreună cu detaliile și documentele de verificare disponibile.';
    text.style.margin = '14px 0 0';
    empty.append(title, text);
    certificationList.append(empty);
    return;
  }
  for (const certificate of certificates) {
    const card = document.createElement('article');
    card.className = 'project-card';
    const title = document.createElement('h2');
    title.textContent = certificate.title;
    title.style.fontSize = '22px';
    card.append(title);
    if (certificate.issuer) {
      const issuer = document.createElement('p');
      issuer.textContent = certificate.issuer;
      issuer.style.marginTop = '12px';
      card.append(issuer);
    }
    if (certificate.date) {
      const date = document.createElement('time');
      date.dateTime = certificate.date;
      date.textContent = certificate.date;
      card.append(date);
    }
    const actions = document.createElement('div');
    actions.className = 'project-actions';
    certificateLink(actions, certificate.credentialUrl, 'Verifică certificarea');
    certificateLink(actions, certificate.fileUrl, 'Deschide certificatul');
    if (actions.childElementCount) card.append(actions);
    certificationList.append(card);
  }
}

fetch(new URL('certifications.json', document.baseURI))
  .then((response) => {
    if (!response.ok) throw new Error('Certificate data unavailable');
    return response.json();
  })
  .then((data) => {
    if (!Array.isArray(data) || data.some((item) => !item || typeof item.title !== 'string' || !item.title.trim())) {
      throw new Error('Invalid certificate data');
    }
    renderCertificates(data);
  })
  .catch(() => {
    const message = document.createElement('p');
    message.className = 'loading-note';
    message.textContent = 'Lista certificărilor nu a putut fi încărcată. Încearcă din nou mai târziu.';
    certificationList.replaceChildren(message);
  })
  .finally(() => certificationList.setAttribute('aria-busy', 'false'));

import('./i18n.js').catch((error) => console.warn('Language selector unavailable:', error));
