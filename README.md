# CapsuleDex 1.0 — Fase 14

Questa cartella contiene la **release finale già compilata** di CapsuleDex, pronta per GitHub Pages. Il progetto React + TypeScript modificabile è incluso in `source/`.

## Novità della Fase 14 — Rifinitura e pubblicazione

- Release stabile **1.0.0** e roadmap completata `14 / 14`
- Nuovo pannello **Impostazioni** accessibile dall’icona a ingranaggio
- Tema:
  - automatico in base al sistema
  - scuro
  - chiaro
- Opzione per ridurre animazioni e transizioni
- Layout compatto per mostrare più contenuti
- Preferenze salvate localmente sul dispositivo
- Caricamento differito delle sezioni principali per ridurre il JavaScript iniziale
- Archivio di strumenti, mosse e abilità separato in pacchetti caricati solo quando serve
- Eliminata la dipendenza dal font remoto: avvio più rapido e affidabile offline
- Nuova schermata di caricamento delle sezioni
- Gestione degli errori imprevisti con possibilità di ricaricare l’app
- Collegamento “Vai al contenuto” per navigazione da tastiera
- Contrasto, focus visibile e supporto a `prefers-reduced-motion`
- Banner persistente per gli aggiornamenti PWA
- Service worker aggiornato: la nuova versione viene installata solo dopo la conferma dell’utente
- Manifest PWA rifinito con identificatore, categorie, orientamento e icone maskable
- Metadati migliorati per iPhone/iPad e browser con tema chiaro/scuro

Tutte le funzioni delle Fasi 1–13 restano disponibili: Pokédex, schede Pokémon, Team Builder, Preferiti, Collezione, Calcolatore tipi, Battle Dex, database di mosse, strumenti e abilità, Atlante evolutivo, installazione PWA, cache offline e backup.

## Aggiornamento su GitHub

1. Scarica ed estrai lo ZIP.
2. Apri la cartella `CapsuleDex-Fase-14`.
3. Nel repository GitHub elimina i vecchi file presenti dentro `assets/`.
4. Carica **tutto il contenuto interno** della nuova cartella nella radice del repository.
5. Sostituisci i file esistenti, compresi `index.html`, `manifest.webmanifest` e `sw.js`.
6. Premi **Commit changes**.
7. Lascia GitHub Pages configurato così:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/(root)`
8. Attendi alcuni minuti e apri:

`https://alexxtomatis.github.io/CapsuleDex/`

La prima apertura dopo l’aggiornamento può ancora mostrare la versione precedente. Quando compare **Aggiornamento pronto**, premi **Aggiorna**. I salvataggi locali non vengono cancellati.

## File principali

- `index.html`: release compilata
- `assets/`: JavaScript suddiviso in moduli, CSS, icone e marchio
- `sw.js`: service worker della release 1.0
- `manifest.webmanifest`: configurazione PWA
- `.nojekyll`: compatibilità con GitHub Pages
- `source/`: progetto React + TypeScript modificabile
- `ROADMAP.md`: tutte le fasi completate
- `CHANGELOG.md`: cronologia delle versioni
- `RELEASE_CHECKLIST.md`: controlli eseguiti e verifiche consigliate

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

## Salvataggi e privacy

Squadre, preferiti, collezione e impostazioni restano nel browser tramite `localStorage`. Non vengono inviati a un server e non esiste sincronizzazione automatica tra dispositivi. Prima di cancellare i dati del sito, esporta un backup dalla sezione **Modalità offline**.

## Note legali

CapsuleDex è un progetto fan-made non ufficiale. Dati e immagini vengono caricati tramite PokéAPI e il relativo archivio sprite. Pokémon e i relativi nomi appartengono ai rispettivi titolari.
