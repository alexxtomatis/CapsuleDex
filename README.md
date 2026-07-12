# CapsuleDex — Fase 12

Questa cartella contiene la versione **già compilata** di CapsuleDex, pronta per GitHub Pages. Il progetto React + TypeScript modificabile è incluso nella cartella `source/` del pacchetto finale.

## Novità della Fase 12 — Evoluzioni avanzate

- Nuovo **Atlante evolutivo** accessibile dalla Home
- Ricerca di un Pokémon per nome o numero Pokédex
- Suggerimenti automatici durante la digitazione
- Albero evolutivo completo con:
  - stadi della famiglia
  - ramificazioni alternative
  - Baby Pokémon
  - nomi italiani quando disponibili
  - immagini ufficiali
- Requisiti dettagliati per:
  - livello
  - pietre e altri strumenti
  - strumenti tenuti
  - scambio e scambi speciali
  - felicità e affetto
  - giorno e notte
  - pioggia
  - mosse conosciute e tipi di mossa
  - luoghi specifici
  - Pokémon o tipi presenti in squadra
  - rapporto tra Attacco e Difesa
  - genere e condizioni speciali
- Filtro visuale per evidenziare un metodo evolutivo
- Indicazione dello strumento collegato ai Baby Pokémon
- Collegamenti diretti:
  - alle schede Pokémon
  - al Database strumenti
  - al Database mosse
- Apertura dell’Atlante direttamente da ogni scheda Pokémon
- Catene consigliate per provare subito le ramificazioni più interessanti
- Storico locale delle catene consultate
- Copia rapida del riepilogo evolutivo
- Cache in memoria delle catene già caricate

Tutte le funzioni delle Fasi 1–11 restano disponibili: Home, Pokédex, schede dettagliate, Team Builder, Preferiti, Collezione personale, Calcolatore tipi, Battle Dex e database di mosse, strumenti e abilità.

## Aggiornamento su GitHub

1. Scarica ed estrai lo ZIP.
2. Apri la cartella `CapsuleDex-Fase-12`.
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

Se compare ancora la versione precedente, esegui un ricaricamento forzato oppure elimina i dati del sito per `alexxtomatis.github.io`.

## File principali

- `index.html`: applicazione compilata
- `assets/`: JavaScript, CSS, icone e marchio
- `.nojekyll`: evita elaborazioni indesiderate di GitHub Pages
- `source/`: progetto React + TypeScript
- `source/src/components/EvolutionView.tsx`: Atlante evolutivo
- `source/src/services/pokeapi.ts`: caricamento e normalizzazione delle catene
- `source/src/data/moveIndex.ts`: indice locale delle mosse
- `source/src/data/itemIndex.ts`: indice locale degli strumenti
- `source/src/data/abilityIndex.ts`: indice locale delle abilità
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

Collezione, preferiti, squadre, ultime analisi dei tipi e catene evolutive recenti vengono salvati nel browser tramite `localStorage`. Non sono sincronizzati tra dispositivi o account diversi. La cancellazione dei dati del sito elimina anche i contenuti salvati.

## Dati e note legali

CapsuleDex è un progetto fan-made non ufficiale. Le catene e i requisiti evolutivi vengono caricati tramite PokéAPI; alcune condizioni possono variare tra giochi e generazioni. Pokémon e i relativi nomi appartengono ai rispettivi titolari.
