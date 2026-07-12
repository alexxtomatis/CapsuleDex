# CapsuleDex — Fase 3

Questa cartella contiene la versione **già compilata** di CapsuleDex, pronta per essere caricata su GitHub Pages.

## Novità della Fase 3

- Scheda completa apribile da ogni carta del Pokédex
- Nome, numero, tipi e artwork ufficiale
- Versione normale e shiny
- Descrizione in italiano quando disponibile
- Altezza, peso, categoria, generazione e habitat
- Abilità con descrizione e indicazione delle abilità nascoste
- Sei statistiche base, totale, barre e grafico radar
- Catena evolutiva con requisiti di evoluzione
- Gestione delle catene con più rami
- Varianti e forme alternative
- Navigazione tra Pokémon precedente e successivo
- Navigazione interna rapida tra panoramica, statistiche, evoluzioni e varianti
- Gestione di caricamento, errori e tentativo di ricarica

Le funzioni della Fase 2 restano disponibili: elenco, ricerca, filtri per regione e tipo e caricamento progressivo.

## Aggiornamento del repository GitHub

1. Scarica ed estrai lo ZIP.
2. Apri la cartella `CapsuleDex-Fase-3`.
3. Carica **tutto il contenuto interno** nella radice del repository `CapsuleDex`.
4. Sostituisci i file esistenti, soprattutto `index.html` e la cartella `assets`.
5. Premi **Commit changes**.
6. Non cambiare le impostazioni GitHub Pages:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/(root)`
7. Attendi alcuni minuti e ricarica il sito.

Indirizzo del progetto:

`https://alexxtomatis.github.io/CapsuleDex/`

Su Safari, in caso di versione precedente ancora visibile, chiudi la scheda e riaprila oppure svuota i dati del sito.

## File principali

- `index.html`: applicazione compilata che GitHub Pages deve aprire
- `assets/`: JavaScript, CSS, icone e marchio
- `.nojekyll`: impedisce elaborazioni indesiderate di GitHub Pages
- `source/`: codice React + TypeScript modificabile
- `ROADMAP.md`: stato delle fasi
- `CHANGELOG.md`: modifiche introdotte

## Sviluppo locale

Il codice sorgente si trova in `source/`.

```bash
cd source
npm install
npm run dev
```

Controllo TypeScript e build:

```bash
npm run lint
npm run build
```

La build viene creata in `source/dist/`.

## Dati e note legali

CapsuleDex è un progetto fan-made non ufficiale. I dati e le immagini vengono caricati tramite PokéAPI e il relativo repository di sprite. Pokémon e i relativi nomi appartengono ai rispettivi titolari.
