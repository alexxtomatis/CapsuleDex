# CapsuleDex — Fase 13

Questa cartella contiene la versione **già compilata** di CapsuleDex, pronta per GitHub Pages. Il progetto React + TypeScript modificabile è incluso nella cartella `source/` del pacchetto finale.

## Novità della Fase 13 — Modalità offline

- Nuova schermata **Modalità offline** accessibile dalla Home
- Service worker dedicato per:
  - avvio dell’app senza connessione dopo il primo caricamento
  - cache automatica delle pagine e risorse visitate
  - cache persistente delle risposte PokéAPI
  - cache delle immagini e degli artwork Pokémon
  - fallback alla Home quando la rete non è disponibile
- Indicatore globale quando CapsuleDex perde la connessione
- Download manuale dei dati di ricerca:
  - catalogo nazionale
  - filtri dei 18 tipi
- Download manuale dei Pokémon personali presenti in:
  - squadre
  - preferiti
  - collezione
- Pacchetto iniziale di Pokémon iconici quando non sono presenti dati personali
- Preparazione offline di schede, specie, abilità, evoluzioni e immagini
- Pannello con numero di risorse, dati PokéAPI, immagini e spazio utilizzato
- Pulizia della cache senza cancellare squadre, preferiti o collezione
- Esportazione dei salvataggi in un file JSON
- Importazione e ripristino di un backup CapsuleDex
- Installazione come PWA dal browser o dalla schermata Home
- Gestione degli aggiornamenti del service worker

Tutte le funzioni delle Fasi 1–12 restano disponibili: Home, Pokédex, schede dettagliate, Team Builder, Preferiti, Collezione personale, Calcolatore tipi, Battle Dex e database di mosse, strumenti, abilità ed evoluzioni.

## Limiti reali della modalità offline

CapsuleDex **non scarica automaticamente l’intero database Pokémon**. Senza connessione funzionano:

- l’app e la sua interfaccia;
- squadre, preferiti, collezione e cronologie locali;
- dati e immagini già consultati;
- pacchetti preparati manualmente nella schermata Offline.

Una pagina mai aperta o mai preparata richiederà internet. Alcuni browser possono inoltre eliminare la cache quando lo spazio sul dispositivo è insufficiente.

## Aggiornamento su GitHub

1. Scarica ed estrai lo ZIP.
2. Apri la cartella `CapsuleDex-Fase-13`.
3. Nella cartella `assets` del repository elimina i vecchi file `index-*.js` e `index-*.css`.
4. Carica **tutto il contenuto interno** nella radice del repository `CapsuleDex`.
5. Assicurati di caricare anche il nuovo file `sw.js`.
6. Sostituisci i file esistenti e premi **Commit changes**.
7. Lascia GitHub Pages impostato su:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/(root)`
8. Attendi alcuni minuti e apri:

`https://alexxtomatis.github.io/CapsuleDex/`

Dopo l’aggiornamento, ricarica la pagina. Se il browser mostra ancora la Fase 12, chiudi e riapri CapsuleDex oppure esegui un aggiornamento forzato. Non cancellare i dati del sito senza prima esportare un backup, perché verrebbero rimossi anche i salvataggi personali.

## File principali

- `index.html`: applicazione compilata
- `sw.js`: service worker per app shell, dati API e immagini offline
- `manifest.webmanifest`: configurazione dell’app installabile
- `assets/`: JavaScript, CSS, icone e marchio
- `.nojekyll`: evita elaborazioni indesiderate di GitHub Pages
- `source/`: progetto React + TypeScript
- `source/src/components/OfflineView.tsx`: pannello della modalità offline
- `source/src/services/offline.ts`: installazione, cache, download e backup
- `source/public/sw.js`: sorgente del service worker
- `source/src/services/pokeapi.ts`: accesso e normalizzazione dei dati PokéAPI
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

Il service worker funziona su `localhost` oppure tramite HTTPS. Non viene eseguito aprendo direttamente `index.html` dal file system.

## Salvataggi e privacy

I dati personali dell’app restano nel browser tramite `localStorage`. Il backup esportato contiene solo dati di CapsuleDex presenti sul dispositivo. Non esiste sincronizzazione automatica tra account o dispositivi.

## Dati e note legali

CapsuleDex è un progetto fan-made non ufficiale. Dati e immagini vengono caricati tramite PokéAPI e il relativo archivio sprite. Pokémon e i relativi nomi appartengono ai rispettivi titolari.
