# CapsuleDex — Fase 4

Questa cartella contiene la versione **già compilata** di CapsuleDex, pronta per GitHub Pages. Il codice React + TypeScript modificabile è incluso nella cartella `source/`.

## Novità della Fase 4 — Team Builder

- Schermata **La mia squadra** ispirata al mockup di CapsuleDex
- Squadra attiva composta da un massimo di 6 Pokémon
- Ricerca per nome inglese o numero Pokédex
- Aggiunta e rimozione dei Pokémon
- Apertura della scheda completa direttamente dal team
- Creazione di più squadre
- Selezione rapida della squadra attiva
- Rinomina delle squadre
- Eliminazione delle squadre
- Conteggio di Pokémon, tipi diversi e slot liberi
- Pulsante **Aggiungi alla squadra** nelle schede Pokémon
- Salvataggio automatico tramite `localStorage`
- Squadra dimostrativa iniziale al primo avvio
- Nuova voce **Squadra** nella navigazione inferiore

Tutte le funzioni delle Fasi 1–3 restano disponibili: home, Pokédex, ricerca, filtri, schede dettagliate, shiny, statistiche, abilità, evoluzioni e varianti.

## Aggiornamento su GitHub

1. Scarica ed estrai lo ZIP.
2. Apri la cartella `CapsuleDex-Fase-4`.
3. Carica **tutto il contenuto interno** nella radice del repository `CapsuleDex`.
4. Su GitHub scegli di sostituire i file esistenti, soprattutto `index.html` e la cartella `assets`.
5. Premi **Commit changes**.
6. Lascia GitHub Pages impostato su:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/(root)`
7. Attendi alcuni minuti e apri:

`https://alexxtomatis.github.io/CapsuleDex/`

Se Safari mostra ancora la versione precedente, chiudi la scheda e riaprila oppure elimina i dati del sito.

## File principali

- `index.html`: applicazione compilata
- `assets/`: JavaScript, CSS, icone e marchio
- `.nojekyll`: evita elaborazioni indesiderate di GitHub Pages
- `source/`: progetto React + TypeScript
- `ROADMAP.md`: avanzamento delle fasi
- `CHANGELOG.md`: modifiche della versione

## Sviluppo locale

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

## Salvataggio delle squadre

Le squadre vengono salvate nel browser del dispositivo tramite `localStorage`. Non vengono ancora sincronizzate tra dispositivi o account diversi. La cancellazione dei dati del sito elimina anche le squadre salvate.

## Dati e note legali

CapsuleDex è un progetto fan-made non ufficiale. I dati e le immagini vengono caricati tramite PokéAPI e il relativo repository di sprite. Pokémon e i relativi nomi appartengono ai rispettivi titolari.
