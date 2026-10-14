# Librionyx — demo interactiv al interfeței principale

**Prototip vizual pentru aprobare. Nu este versiunea aplicației Windows.**

## Pornire
- Rapid: deschide `Librionyx-Demo-App-Interactiv.html` (fișier separat, autonom) într-un browser modern.
- Proiect editabil: dezarhivează `Librionyx-v0.4.0-Demo-HTML.zip` și deschide `Librionyx-v0.4.0/index.html`.
- În arhivă, butonul **Setări** deschide demo-ul de Setări aprobat anterior (în folderul `settings/`). În HTML-ul autonom, Setările sunt integrate în aceeași pagină.

## Funcționalități efectiv interactive
- Comutare categorii și secțiuni: Bibliotecă, Analize, Activitate, Coș.
- Categorii noi, selectare multiplă, redenumire cărți, mutare între categorii, mutare în coș și restaurare (numai în catalogul HTML demonstrativ).
- Alegere de fișiere locale — sunt citite **numai numele, extensia și dimensiunea**, fără încărcarea sau procesarea documentelor.
- Căutare, sortare, mod listă/grilă.
- Analiză simulată cu progres, anulare, raport demonstrativ, istoric și export TXT marcat DEMO.
- Chat demonstrativ: primește întrebările și afișează răspuns de interfață clar marcat, nu rezumat real.
- Moduri Începător/Avansat/God, temă Dark/Light, logo-urile oficiale.
- Setări aprobate v0.3.9, inclusiv culori personalizate (unde browserul permite păstrarea locală).

## Limitări
- Nu rulează Python, GGUF, OCR, API-uri, căutare semantică sau inferență AI.
- Exemplele de cărți reprezintă **date de interfață**, nu PDF-uri accesibile din demo.
- Operațiile asupra fișierelor reale **nu** șterg/mută nimic pe disc.
- Metadata și preferințele sunt păstrate numai în storage-ul browserului; disponibilitatea salvării cu `file://` variază între browsere. Nu modifică `%LOCALAPPDATA%\Librionyx`.
- Progresul analizelor este **simulat**, pentru a evalua designul înainte de aprobarea implementării native.

## Structura proiectului
```
Librionyx-v0.4.0/
├── index.html
├── styles.css
├── script.js
├── assets/
│   ├── Librionyx-Dark.png
│   └── Librionyx-Light.png
├── settings/
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   └── assets/
│       ├── Librionyx-Dark.png
│       └── Librionyx-Light.png
└── README.md
```
