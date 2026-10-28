# Materiale pentru certificări

Pagina publică este `certifications.html`. Lista `certifications.json` rămâne `[]` până la obținerea unei certificări.

Pentru fiecare certificare obținută, adaugă în listă un obiect cu:
- `title`: numele exact al certificării;
- `issuer`: emitentul (opțional);
- `date`: data obținerii, de exemplu în format YYYY-MM-DD (opțional);
- `credentialUrl`: adresa oficială de verificare (opțional);
- `fileUrl`: calea către document, de exemplu media/certificari/nume-certificat.pdf (opțional).

Documentele pot fi încărcate în acest folder. Numele și emitentul se afișează exact cum sunt introduse. Pentru texte diferite în engleză, adaugă perechile română–engleză în `translations.en.json`.
