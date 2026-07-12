# CapsuleDex — Fase 2

Questa cartella contiene una versione **già compilata** di CapsuleDex, pronta per GitHub Pages.

## Funzioni disponibili

- Home responsive in stile CapsuleDex
- Pokédex collegato a PokéAPI
- Ricerca per nome o numero
- Filtri per regione
- Filtri per tipo
- Artwork e tipi di ogni Pokémon
- Caricamento progressivo di 24 elementi
- Messaggi di errore e pulsante Riprova
- Layout ottimizzato per iPhone e desktop

## Aggiornamento del repository GitHub

1. Estrai lo ZIP.
2. Apri la cartella `CapsuleDex-Fase-2`.
3. Carica **il contenuto interno** nella radice del repository CapsuleDex.
4. Conferma la sostituzione di `index.html`, `manifest.webmanifest`, `README.md` e dei file già presenti.
5. Premi **Commit changes**.
6. Lascia GitHub Pages impostato su:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/(root)`
7. Attendi alcuni minuti e ricarica il sito.

L'indirizzo del progetto resta:

`https://alexxtomatis.github.io/CapsuleDex/`

## File principali

- `index.html`: pagina compilata che GitHub Pages deve aprire
- `assets/`: JavaScript, CSS, icone e marchio
- `.nojekyll`: impedisce elaborazioni indesiderate da parte di Jekyll
- `source/`: codice React + TypeScript modificabile
- `ROADMAP.md`: prossime fasi
- `CHANGELOG.md`: novità introdotte

## Sviluppo locale

Il codice sorgente si trova in `source/`.

```bash
cd source
npm install
npm run dev
```

Per generare una nuova build:

```bash
npm run build
```

La build verrà creata in `source/dist/`.

## Nota

CapsuleDex è un progetto fan-made non ufficiale. I dati vengono caricati da PokéAPI. Pokémon e i relativi nomi appartengono ai rispettivi titolari.
