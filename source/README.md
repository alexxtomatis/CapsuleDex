# CapsuleDex — Fase 9

Questa cartella contiene la versione **già compilata** di CapsuleDex, pronta per GitHub Pages. Il progetto React + TypeScript modificabile è incluso nella cartella `source/`.

## Novità della Fase 9 — Database mosse

- Archivio di **937 mosse** indicizzate localmente per una ricerca immediata
- Nomi italiani e inglesi
- Ricerca per nome italiano, nome inglese, identificatore API o numero della mossa
- Filtri per:
  - tipo
  - categoria fisica, speciale o di stato
  - generazione dalla I alla IX
- Ordinamento per numero, nome, potenza, precisione e PP
- Schede riepilogative con:
  - potenza
  - precisione
  - PP
  - tipo
  - categoria
  - generazione
- Scheda completa della mossa con:
  - descrizione
  - effetto in lotta
  - bersaglio
  - priorità
  - probabilità degli effetti secondari
  - problemi di stato
  - modifiche alle statistiche
  - colpi multipli e durata
  - cura, assorbimento e contraccolpo
  - elenco dei Pokémon compatibili
- Apertura delle schede Pokémon dall'elenco di compatibilità
- Collegamento alle mosse direttamente dalle schede Pokémon
- Copia rapida del riepilogo della mossa
- Caricamento progressivo per mantenere fluida l'interfaccia su smartphone
- Cache in memoria dei dettagli già consultati

Tutte le funzioni delle Fasi 1–8 restano disponibili: Home, Pokédex, schede dettagliate, Team Builder, Preferiti, Collezione personale, Calcolatore tipi e Battle Dex.

## Aggiornamento su GitHub

1. Scarica ed estrai lo ZIP.
2. Apri la cartella `CapsuleDex-Fase-9`.
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
- `source/src/data/moveIndex.ts`: indice locale delle mosse
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

CapsuleDex è un progetto fan-made non ufficiale. L'indice delle mosse deriva dai dati pubblici di PokéAPI; i dettagli e le immagini vengono caricati tramite PokéAPI e il relativo repository di sprite. Pokémon e i relativi nomi appartengono ai rispettivi titolari.
