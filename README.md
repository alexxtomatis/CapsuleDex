# CapsuleDex — Fase 11

Questa cartella contiene la versione **già compilata** di CapsuleDex, pronta per GitHub Pages. Il progetto React + TypeScript modificabile è incluso nella cartella `source/`.

## Novità della Fase 11 — Database abilità

- Archivio locale con **373 abilità** per una ricerca immediata
- **313 abilità della serie principale** e 60 provenienti da titoli secondari presenti nei dati
- Nomi italiani e inglesi
- Ricerca per nome, identificatore API o numero
- Filtri per:
  - generazione
  - serie principale
  - titoli secondari
- Ordinamento per numero, nome o generazione
- Carte riepilogative con generazione e provenienza
- Scheda completa dell'abilità con:
  - descrizione
  - effetto tecnico
  - lingua dell'effetto disponibile
  - generazione d'introduzione
  - appartenenza alla serie principale
  - modifiche dell'effetto nelle versioni precedenti
  - elenco dei Pokémon associati
  - distinzione tra abilità normale e nascosta
- Ricerca e filtro dei Pokémon nella scheda dell'abilità
- Collegamento diretto alle schede Pokémon
- Collegamento dalle schede Pokémon al Database abilità
- Navigazione tra abilità precedente e successiva
- Copia rapida del riepilogo
- Caricamento progressivo e cache in memoria dei dettagli consultati

Tutte le funzioni delle Fasi 1–10 restano disponibili: Home, Pokédex, schede dettagliate, Team Builder, Preferiti, Collezione personale, Calcolatore tipi, Battle Dex, Database mosse e Database strumenti.

## Aggiornamento su GitHub

1. Scarica ed estrai lo ZIP.
2. Apri la cartella `CapsuleDex-Fase-11`.
3. Carica **tutto il contenuto interno** nella radice del repository `CapsuleDex`.
4. Sostituisci i file esistenti, soprattutto `index.html`, `manifest.webmanifest` e la cartella `assets`.
5. Elimina dalla cartella `assets` del repository i vecchi file `index-*.js` e `index-*.css` non presenti nel nuovo pacchetto.
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
- `source/src/data/moveIndex.ts`: indice locale delle mosse
- `source/src/data/itemIndex.ts`: indice locale degli strumenti
- `source/src/data/abilityIndex.ts`: indice locale delle abilità
- `source/src/components/AbilityView.tsx`: elenco e schede delle abilità
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

CapsuleDex è un progetto fan-made non ufficiale. Gli indici derivano dai dati pubblici di PokéAPI; dettagli e immagini vengono caricati tramite PokéAPI e il relativo repository di sprite. Pokémon e i relativi nomi appartengono ai rispettivi titolari.
