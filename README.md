# Portofoliu personal

Site static pentru proiecte personale din domenii diferite: software, AI, automatizare, jocuri și 3D, audio, proiectare și alte activități tehnice. Fiecare proiect poate avea separat un demo, un repository, descărcări și capturi de ecran.

## Adaugă sau modifică proiecte

1. Deschide pagina **Editează proiectele** din meniul de jos. Lista se încarcă automat. Dacă ai descărcat site-ul, alege `projects.json` de pe calculator.
2. Completează domeniul proiectului. Poți scrie un domeniu nou; site-ul creează automat un filtru pentru el.
3. Completează doar câmpurile pe care le ai. Demo-ul, repository-ul, aplicațiile descărcabile și imaginile sunt opționale.
4. Apasă **Descarcă projects.json**.
5. Încarcă fișierul descărcat în repository în locul celui vechi și publică schimbarea.

## Adaugă imagini sau aplicații

Urcă fișierul în repository, de exemplu:

- `images/numele-proiectului/ecran-principal.png`
- `downloads/numele-proiectului/app.apk`
- `downloads/numele-proiectului/app-windows.exe`

Apoi scrie calea în editor. Pentru fiecare imagine folosește câte un rând în formatul `cale | descriere | text alternativ`. Pentru o aplicație descărcabilă folosește `nume | platformă | cale sau link`. Fișierele mari pot fi puse în **GitHub Releases**, iar acolo se adaugă linkul descărcării.

Pentru un demo de interfață poți adăuga o pagină web publicată sau calea către o pagină din repository, de exemplu `demos/proiect/index.html`. Demo-urile locale trebuie să aibă toate fișierele lor în repository.

## Datele proiectelor

Lista este în `projects.json`. Domeniul determină filtrul de pe pagina principală. Dacă nu completezi o adresă pentru demo, repository, imagine sau descărcare, acel buton ori element nu apare.

## Previzualizare locală pe Windows

Deschide Command Prompt în folderul site-ului și rulează:

```text
py -m http.server 8000
```

Apoi deschide `http://localhost:8000`.

## Publicare prin GitHub Pages

Repository-ul publică pagina pe site-ul GitHub Pages. Adresa exactă apare în **Settings → Pages**. Setează **Deploy from a branch**, ramura `main` și folderul `/(root)`.

## Fișiere principale

- `index.html` — portofoliul public
- `projects.json` — datele proiectelor și linkurile către materiale
- `editor.html` și `editor.js` — editorul din browser
- `styles.css` și `editor.css` — aspectul site-ului și al editorului
- `main.js` — filtre, carduri și afișarea materialelor
