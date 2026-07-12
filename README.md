# CapsuleDex — Fase 1 (correzione GitHub Pages)

Questa versione è già compilata e può essere pubblicata direttamente da GitHub Pages, senza GitHub Actions.

## Pubblicazione

1. Nel repository GitHub elimina i vecchi file oppure sostituiscili con tutti i file di questo pacchetto.
2. I file `index.html`, `manifest.webmanifest` e la cartella `assets` devono trovarsi nella radice del repository.
3. Apri **Settings → Pages**.
4. In **Build and deployment**, scegli **Deploy from a branch**.
5. Seleziona il branch **main** e la cartella **/(root)**, quindi premi **Save**.
6. Attendi uno o due minuti e ricarica la pagina.

Il file `.nojekyll` evita che GitHub Pages modifichi o ignori file necessari al sito.

## Codice sorgente

Il progetto React/TypeScript modificabile si trova nella cartella `source`.
Per lavorare localmente:

```bash
cd source
npm install
npm run dev
```

La cartella principale contiene invece la versione già compilata da pubblicare.
