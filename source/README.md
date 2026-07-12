# CapsuleDex — Fase 7

Questa cartella contiene la versione **già compilata** di CapsuleDex, pronta per GitHub Pages. Il progetto React + TypeScript modificabile è incluso nella cartella `source/`.

## Novità della Fase 7 — Calcolatore tipi

- Nuova schermata **Calcolatore tipi** accessibile dalla Home e dalla barra inferiore
- Ricerca di un Pokémon per nome o numero Pokédex
- Caricamento automatico dei tipi del Pokémon scelto
- Selezione manuale di uno o due tipi
- Calcolo di:
  - debolezze ×4
  - debolezze ×2
  - resistenze ×0,5
  - resistenze ×0,25
  - immunità ×0
- Matrice completa dei 18 tipi con il moltiplicatore dei danni ricevuti
- Riepilogo immediato di debolezze, resistenze e immunità
- Collegamento diretto dalla scheda di ogni Pokémon
- Apertura della scheda Pokémon dal risultato del calcolatore
- Memorizzazione locale delle ultime analisi
- Tabella dei tipi integrata nell'app: il calcolo continua a funzionare anche senza richieste aggiuntive alla PokéAPI dopo aver selezionato i tipi

Il calcolo è basato esclusivamente sui tipi. Abilità, strumenti, Teracristal, mosse e condizioni di lotta possono modificare il risultato effettivo.

Tutte le funzioni delle Fasi 1–6 restano disponibili: Home, Pokédex, ricerca, filtri, schede dettagliate, shiny, statistiche, abilità, evoluzioni, varianti, Team Builder, Preferiti e Collezione personale.

## Aggiornamento su GitHub

1. Scarica ed estrai lo ZIP.
2. Apri la cartella `CapsuleDex-Fase-7`.
3. Carica **tutto il contenuto interno** nella radice del repository `CapsuleDex`.
4. Sostituisci i file esistenti, soprattutto `index.html`, `manifest.webmanifest` e la cartella `assets`.
5. Elimina dalla cartella `assets` del repository i vecchi file `index-*.js` e `index-*.css` che non sono presenti in questo pacchetto.
6. Premi **Commit changes**.
7. Lascia GitHub Pages impostato su:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/(root)`
8. Attendi alcuni minuti e apri:

`https://alexxtomatis.github.io/CapsuleDex/`

Se il browser mostra ancora la versione precedente, esegui un ricaricamento forzato oppure elimina i dati del sito per `alexxtomatis.github.io`.

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

Collezione, preferiti, squadre e ultime analisi dei tipi vengono salvati nel browser tramite `localStorage`. Non sono sincronizzati tra dispositivi o account diversi. La cancellazione dei dati del sito elimina anche i contenuti salvati.

## Dati e note legali

CapsuleDex è un progetto fan-made non ufficiale. I dati e le immagini vengono caricati tramite PokéAPI e il relativo repository di sprite. Pokémon e i relativi nomi appartengono ai rispettivi titolari.
