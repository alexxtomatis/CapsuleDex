# CapsuleDex — Fase 5

Questa cartella contiene la versione **già compilata** di CapsuleDex, pronta per GitHub Pages. Il progetto React + TypeScript modificabile è incluso nella cartella `source/`.

## Novità della Fase 5 — Preferiti

- Pulsante a cuore nelle carte del Pokédex
- Aggiunta e rimozione dei preferiti dalle schede Pokémon
- Schermata **Preferiti** accessibile dalla barra inferiore e dalla Home
- Ricerca per nome o numero tra i Pokémon salvati
- Ordinamento per aggiunta recente, numero Pokédex o nome
- Conteggio aggiornato dei Pokémon preferiti
- Rimozione rapida di un singolo Pokémon
- Comando per svuotare l’intera lista con richiesta di conferma
- Stato vuoto con collegamento diretto al Pokédex
- Salvataggio automatico tramite `localStorage`
- Aggiornamento immediato dei cuori in tutte le schermate

Tutte le funzioni delle Fasi 1–4 restano disponibili: Home, Pokédex, ricerca, filtri, schede dettagliate, shiny, statistiche, abilità, evoluzioni, varianti e Team Builder.

## Aggiornamento su GitHub

1. Scarica ed estrai lo ZIP.
2. Apri la cartella `CapsuleDex-Fase-5`.
3. Carica **tutto il contenuto interno** nella radice del repository `CapsuleDex`.
4. Su GitHub sostituisci i file esistenti, soprattutto `index.html`, `manifest.webmanifest` e la cartella `assets`.
5. Elimina dal repository i vecchi file JavaScript e CSS con nomi differenti presenti in `assets`, oppure usa l’opzione di sincronizzazione del tuo client Git.
6. Premi **Commit changes**.
7. Lascia GitHub Pages impostato su:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/(root)`
8. Attendi alcuni minuti e apri:

`https://alexxtomatis.github.io/CapsuleDex/`

Se Safari mostra ancora la versione precedente, chiudi la scheda, riaprila e ricarica la pagina. In caso di cache persistente, elimina i dati del sito per `alexxtomatis.github.io`.

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

## Salvataggio locale

Preferiti e squadre vengono salvati nel browser tramite `localStorage`. Non sono ancora sincronizzati tra dispositivi o account diversi. La cancellazione dei dati del sito elimina anche i contenuti salvati.

## Dati e note legali

CapsuleDex è un progetto fan-made non ufficiale. I dati e le immagini vengono caricati tramite PokéAPI e il relativo repository di sprite. Pokémon e i relativi nomi appartengono ai rispettivi titolari.
