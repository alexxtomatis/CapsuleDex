# CapsuleDex 1.1 — Fase 15

Questa cartella contiene la **release compilata e pronta per GitHub Pages** di CapsuleDex. Il progetto React + TypeScript modificabile è incluso in `source/`.

## Novità dell’aggiornamento 1.1

### Luoghi Pokémon

- Ricerca per nome inglese o numero Pokédex
- Luoghi raggruppati per versione del gioco
- Metodi d’incontro, livelli, probabilità e condizioni
- Collegamento diretto dalla scheda di ogni Pokémon
- Filtri rapidi tra le versioni disponibili
- Cache offline dei dati già consultati

I luoghi dipendono dalla copertura dell’endpoint incontri di PokéAPI. Doni, eventi, raid, scambi interni e alcune aree recenti possono non essere presenti.

### Capipalestra

- Archivio cronologico dei giochi principali da Rosso/Blu fino a Scarlatto/Violetto
- Versioni separate quando cambiano i Capipalestra o le squadre
- Circuiti di Johto e Kanto in Oro/Argento/Cristallo e HeartGold/SoulSilver
- Modalità Normale e Sfida per Nero 2/Bianco 2
- Prove e Kahuna di Alola
- Squadre complete con livelli, abilità, strumenti e Teratipo quando disponibili
- Collegamenti alle schede dei Pokémon
- Schede esplicative per i titoli senza Palestre tradizionali, come Leggende Pokémon: Arceus e Leggende Pokémon: Z-A

Le squadre mostrate sono quelle della **prima sfida nella storia principale**. Rivincite, Tornei, DLC e post-game non sono inclusi.

## Funzioni già presenti

Pokédex, schede dettagliate, Team Builder, Preferiti, Collezione, Calcolatore tipi, Battle Dex, database di mosse, strumenti e abilità, Atlante evolutivo, PWA installabile, cache offline, backup, tema chiaro/scuro e impostazioni di accessibilità.

## Aggiornamento su GitHub

1. Scarica ed estrai lo ZIP.
2. Apri la cartella `CapsuleDex-Fase-15`.
3. Nel repository GitHub elimina i vecchi file presenti dentro `assets/`.
4. Carica **tutto il contenuto interno** della nuova cartella nella radice del repository.
5. Sostituisci `index.html`, `404.html`, `manifest.webmanifest`, `sw.js` e la cartella `source/`.
6. Premi **Commit changes**.
7. Lascia GitHub Pages su branch `main` e cartella `/(root)`.
8. Apri `https://alexxtomatis.github.io/CapsuleDex/` e premi **Aggiorna** quando compare il banner della nuova versione.

Squadre, preferiti e collezione restano memorizzati nel browser.

## Sviluppo locale

```bash
cd source
npm install
npm run dev
```

Controlli:

```bash
npm run lint
npm run build
```

## Note legali e dati

CapsuleDex è un progetto fan-made non ufficiale. Dati Pokémon, incontri e immagini vengono caricati tramite PokéAPI e il relativo archivio sprite. L’archivio delle squadre dei Capipalestra è incluso localmente a scopo informativo. Pokémon e i relativi nomi appartengono ai rispettivi titolari.
