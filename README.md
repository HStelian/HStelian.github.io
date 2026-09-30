# Portofoliu tehnic pentru GitHub Pages

Site static în HTML, CSS și JavaScript, fără servicii externe. Proiectele sunt ținute separat în `projects.json`. Pagina `editor.html` oferă un formular simplu pentru editare, adăugare și ștergere.

## Editează proiectele

1. Deschide `editor.html` în browser. Dacă o deschizi de pe site-ul publicat, lista se încarcă automat. Dacă o deschizi din folderul descărcat, apasă **Încarcă projects.json** și alege fișierul din același folder.
2. Modifică titlul, stadiul, descrierea, linkul opțional, etichetele, instrumentele și activitățile tehnice. Linkurile se lasă goale când proiectul nu are o pagină publică. Folosește butonul **Adaugă proiect** pentru unul nou ori **Șterge** pentru a-l elimina.
3. Apasă **Descarcă projects.json**.
4. În repository-ul GitHub, deschide `projects.json`, apasă butonul de editare, înlocuiește conținutul cu cel din fișierul descărcat și salvează schimbarea.
5. Pagina se actualizează după publicarea modificării de către GitHub Pages.

Editorul nu salvează direct în GitHub și nu cere parolă sau token. Modificările devin publice doar după ce încarci fișierul actualizat în repository.

### Rezumatul instrumentelor și activităților

Pagina principală adună automat instrumentele și activitățile din toate proiectele: completează aceste două câmpuri în editor pentru fiecare proiect. Elementele repetate apar o singură dată. Linkul fiecărui proiect este opțional și apare pe card doar dacă este completat cu o adresă web `http://` sau `https://`. Dacă ștergi un proiect sau scoți un instrument din listă, acesta dispare automat din rezumat după publicarea noului fișier.

## Stadiile disponibile

Alege stadiul care descrie corect fiecare proiect: prototip în lucru, testat/experiment, configurare și verificare, instalare neterminată sau faza de proiectare.

## Înainte de publicare

În `index.html`, înlocuiește numele afișat, adresa de e-mail și utilizatorul GitHub. Actualizează și valorile din linkurile `mailto:` și `https://github.com/NUMEUTILIZATOR`. Verifică descrierile ca să reflecte exact contribuția și stadiul fiecărui proiect.

GitHub Pages publică site-ul pe internet. Nu pune informații personale pe care nu vrei să le vadă oricine.

## Publicare pe GitHub Pages

### Varianta pentru un site personal

1. Creează un repository numit exact `NUMEUTILIZATOR.github.io`, înlocuind `NUMEUTILIZATOR` cu numele tău GitHub.
2. Încarcă în rădăcina repository-ului toate fișierele din acest pachet.
3. În repository, deschide **Settings → Pages**.
4. La **Build and deployment**, alege **Deploy from a branch**, ramura `main` și folderul `/(root)`.
5. Salvează. După publicare, pagina va fi la `https://NUMEUTILIZATOR.github.io`.

## Previzualizare locală pe Windows

Pentru ca lista de proiecte să se încarce, deschide Command Prompt în folderul site-ului și rulează:

```text
py -m http.server 8000
```

Apoi deschide `http://localhost:8000`. Editorul poate fi deschis direct ca fișier HTML.

## Fișiere principale

- `index.html` — pagina portofoliului
- `projects.json` — lista editabilă de proiecte
- `editor.html` — formularul de administrare
- `styles.css` și `editor.css` — aspectul paginilor
- `main.js` și `editor.js` — încărcarea și editarea proiectelor
