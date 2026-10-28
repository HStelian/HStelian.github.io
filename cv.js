// Upload the Word files to media/cv/ using the names in cv.html.
async function checkCv(card) {
  const actions = card.querySelector('.cv-actions');
  try {
    const url = new URL(card.dataset.cv, document.baseURI);
    const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    const contentType = response.headers.get('content-type') || '';
    if (response.status === 404) {
      const message = document.createElement('p');
      message.textContent = 'Documentul nu este adăugat încă.';
      actions.replaceChildren(message);
    } else if (!response.ok || contentType.includes('text/html')) {
      throw new Error('CV unavailable');
    } else {
      const link = document.createElement('a');
      link.className = 'button button-primary';
      link.href = url.href;
      link.download = url.pathname.split('/').pop();
      link.textContent = 'Descarcă CV-ul (Word)';
      actions.replaceChildren(link);
    }
  } catch {
    const message = document.createElement('p');
    message.textContent = 'Disponibilitatea documentului nu a putut fi verificată. Reîncarcă pagina.';
    actions.replaceChildren(message);
  } finally {
    actions.setAttribute('aria-busy', 'false');
  }
}
document.querySelectorAll('[data-cv]').forEach(checkCv);
import('./i18n.js').catch((error) => console.warn('Language selector unavailable:', error));
