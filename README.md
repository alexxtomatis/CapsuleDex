# CapsuleDex — Fase 6

Questa cartella contiene la versione **già compilata** di CapsuleDex, pronta per GitHub Pages. Il progetto React + TypeScript modificabile è incluso nella cartella `source/`.

## Novità della Fase 6 — Collezione personale

- Schermata **Collezione** accessibile dalla Home e dalla barra inferiore
- Registrazione dei Pokémon catturati per nome o numero
- Aggiunta rapida anche dal Pokédex e dalla scheda dettagliata
- Categorie personalizzabili: **Shiny, Alpha, Gigamax, Paradox e Leggendario**
- Riepilogo con totale catturati, percentuale del Pokédex nazionale e conteggi speciali
- Ricerca interna e filtri per categoria
- Ordinamento per modifica recente, numero Pokédex o nome
- Apertura diretta della scheda Pokémon dalla collezione
- Rimozione singola e svuotamento completo con conferma
- Salvataggio automatico nel browser tramite `localStorage`

Tutte le funzioni delle Fasi 1–5 restano disponibili: Home, Pokédex, ricerca, filtri, schede dettagliate, shiny, statistiche, abilità, evoluzioni, varianti, Team Builder e Preferiti.

## Aggiornamento su GitHub

1. Scarica ed estrai lo ZIP.
2. Apri la cartella `CapsuleDex-Fase-6`.
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

Se Safari mostra la versione precedente, chiudi la scheda, riaprila e ricarica la pagina. In caso di cache persistente, elimina i dati del sito per `alexxtomatis.github.io`.

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

Collezione, preferiti e squadre vengono salvati nel browser tramite `localStorage`. Non sono sincronizzati tra dispositivi o account diversi. La cancellazione dei dati del sito elimina anche i contenuti salvati.

## Dati e note legali

CapsuleDex è un progetto fan-made non ufficiale. I dati e le immagini vengono caricati tramite PokéAPI e il relativo repository di sprite. Pokémon e i relativi nomi appartengono ai rispettivi titolari.
