# CapsuleDex — Fase 8

Questa cartella contiene la versione **già compilata** di CapsuleDex, pronta per GitHub Pages. Il progetto React + TypeScript modificabile è incluso nella cartella `source/`.

## Novità della Fase 8 — Battle Dex

- Nuova schermata **Battle Dex** accessibile dalla Home
- Ricerca indipendente di due Pokémon per nome o numero Pokédex
- Comando per scambiare rapidamente i due sfidanti
- Confronto affiancato di:
  - sei statistiche base
  - totale statistiche base (BST)
  - velocità
  - tipi e migliore efficacia offensiva STAB
  - abilità normali e nascoste
  - repertorio di mosse apprendibili
  - altezza e peso
- Punteggio comparativo basato sulle statistiche e sul vantaggio dei tipi
- Evidenziazione automatica del valore migliore per ogni parametro
- Apertura delle schede Pokémon direttamente dal confronto
- Pulsante **Confronta nel Battle Dex** aggiunto a ogni scheda Pokémon
- Interfaccia responsive pensata per smartphone
- Gestione di caricamento, errori e indisponibilità temporanea del catalogo

Il Battle Dex è uno strumento informativo: non simula una lotta reale. Livello, natura, EV, IV, strumenti, abilità, mosse selezionate e regole del formato possono cambiare completamente il risultato.

Tutte le funzioni delle Fasi 1–7 restano disponibili: Home, Pokédex, ricerca, filtri, schede dettagliate, shiny, statistiche, abilità, evoluzioni, varianti, Team Builder, Preferiti, Collezione personale e Calcolatore tipi.

## Aggiornamento su GitHub

1. Scarica ed estrai lo ZIP.
2. Apri la cartella `CapsuleDex-Fase-8`.
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
