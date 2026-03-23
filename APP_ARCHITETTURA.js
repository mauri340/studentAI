/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║   METODO EUREKA APP — ARCHITETTURA COMPLETA                      ║
 * ║   Indice di tutti i moduli e flusso di integrazione              ║
 * ║   Versione: 1.0                                                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * STRUTTURA DEI FILE:
 *
 *  /engines
 *    ├── MindMapEngine.js          → Genera mappe mentali SVG
 *    └── PAVEngine.js              → Logica memorizzazione PAV
 *
 *  /rules
 *    └── MemorizationEngine_rules.js → Regole sistema memorizzazione
 *
 *  /demo
 *    ├── MindMapEngine_demo.html   → Demo mappa mentale interattiva
 *    └── PAV_Engine_v3.html        → Demo memorizzazione PAV interattiva
 *
 *  /docs
 *    └── analisi_keyword_metodo_eureka.docx → Processo estrazione keyword
 */


// ═══════════════════════════════════════════════════════════════════
//  PIPELINE COMPLETA — 5 FASI IN SEQUENZA
// ═══════════════════════════════════════════════════════════════════

/**
 *
 *  ┌─────────────────────────────────────────────────────────────┐
 *  │  FASE 1 — INPUT TESTO                                       │
 *  │  L'utente carica un PDF o incolla un testo                  │
 *  └──────────────────────────┬──────────────────────────────────┘
 *                             │
 *  ┌──────────────────────────▼──────────────────────────────────┐
 *  │  FASE 2 — ESTRAZIONE KEYWORD                                 │
 *  │  AI analizza il testo e produce:                             │
 *  │   • Mappa logica in blocchi                                  │
 *  │   • Verifica copertura 5W (Chi/Cosa/Quando/Dove/Come)       │
 *  │   • Lista keyword ordinate con domanda/secondary/esempio     │
 *  └──────────────────────────┬──────────────────────────────────┘
 *                             │
 *  ┌──────────────────────────▼──────────────────────────────────┐
 *  │  FASE 3 — MAPPA MENTALE                                      │
 *  │  MindMapEngine.js genera la mappa SVG con:                   │
 *  │   • Spicchi uguali (360° / n primarie)                       │
 *  │   • Lettura oraria da ore 1 con badge START                  │
 *  │   • Rami bezier con testo sopra il ramo                      │
 *  │   • Max 3 livelli concentrici                                │
 *  │   • Nota: completare con visual creativi sopra le keyword    │
 *  └──────────────────────────┬──────────────────────────────────┘
 *                             │
 *  ┌──────────────────────────▼──────────────────────────────────┐
 *  │  FASE 4 — MEMORIZZAZIONE PAV                                 │
 *  │  PAVEngine.js gestisce:                                      │
 *  │   • Selezione contenitore (storia/corpo/storia famosa/casa)  │
 *  │   • Classificazione keyword (concreta/astratta)              │
 *  │   • Piano immagini (fonetica o significato — mai mescolare)  │
 *  │   • Ordine fonetico obbligatorio                             │
 *  │   • Generazione PAV via Claude API                           │
 *  │   • Sequenza connessa per zona con verifica connessioni      │
 *  └──────────────────────────┬──────────────────────────────────┘
 *                             │
 *  ┌──────────────────────────▼──────────────────────────────────┐
 *  │  FASE 5 — RIPASSO E TEST                                     │
 *  │   • Modalità APPRENDI: PAV card per card                     │
 *  │   • Modalità TEST: stazione → keyword                        │
 *  │   • Spaced repetition: keyword sbagliate tornano più spesso  │
 *  └─────────────────────────────────────────────────────────────┘
 */


// ═══════════════════════════════════════════════════════════════════
//  MODULO 1 — MindMapEngine.js
// ═══════════════════════════════════════════════════════════════════

/**
 * RESPONSABILITÀ:
 *   Genera mappe mentali SVG conformi al Metodo Eureka
 *   a partire da un oggetto dati strutturato.
 *
 * UTILIZZO:
 *   const engine = new MindMapEngine(container, data, options);
 *   engine.render();
 *
 * INPUT — struttura dati:
 *   {
 *     center: { label: 'TITOLO\nSOTTOTITOLO', icon: 'scales'|'book'|'brain'|'none' },
 *     branches: [
 *       {
 *         label: 'KEYWORD PRIMARIA',
 *         color: '#HEX',
 *         children: [
 *           {
 *             label: 'KEYWORD SECONDARIA',
 *             children: [
 *               { label: 'KEYWORD TERZIARIA' }
 *             ]
 *           }
 *         ]
 *       }
 *     ]
 *   }
 *
 * OUTPUT: SVG renderizzato nel container DOM
 *
 * REGOLE APPLICATE AUTOMATICAMENTE:
 *   ✅ Spicchi uguali: 360° / numero rami primari
 *   ✅ Lettura oraria da ore 1 (60° in matematica)
 *   ✅ Badge START sul primo ramo primario
 *   ✅ Rami bezier curvi con spessore decrescente per livello
 *   ✅ Testo sopra il ramo, ruotato, con halo bianco
 *   ✅ Rami partono dal bordo dell'ellisse centrale
 *   ✅ Nodo centrale disegnato per ultimo (sopra tutto)
 *   ✅ Linee tratteggiate ai confini degli spicchi
 *   ✅ Cerchi guida concentrici (max 3 livelli)
 *
 * OPZIONI CONFIGURABILI:
 *   width, height, background, startAngle, radii,
 *   strokeWidths, fontSizes, ellipseRX, ellipseRY,
 *   centerFill, centerStroke, sliceFan, leafFan,
 *   labelOffset, haloWidth, startColor
 *
 * ICONE DISPONIBILI PER IL CENTRO:
 *   'scales' → bilancia (diritto)
 *   'book'   → libro (studio)
 *   'brain'  → cervello (memoria)
 *   'none'   → nessuna icona
 *
 * NOTA FINALE SEMPRE PRESENTE:
 *   "Completa la mappa con i visual: disegna un'immagine creativa
 *   personale sopra ogni keyword, direttamente sul ramo."
 */


// ═══════════════════════════════════════════════════════════════════
//  MODULO 2 — PAVEngine.js
// ═══════════════════════════════════════════════════════════════════

/**
 * RESPONSABILITÀ:
 *   Gestisce l'intera logica del sistema di memorizzazione PAV,
 *   dalla selezione del contenitore alla generazione delle immagini.
 *
 * FUNZIONI ESPORTATE:
 *
 *   selectStrategy(keywordCount)
 *     → Suggerisce il contenitore in base al numero di keyword
 *     → Soglie: ≤15 storia / ≤30 corpo / ≤60 casa / 60+ casa
 *
 *   buildStrategyMessage(count)
 *     → Costruisce il messaggio e le opzioni da mostrare all'utente
 *
 *   classifyKeyword(keyword)
 *     → Classifica: 'concreta' | 'astratta'
 *     → In produzione: delegare all'AI
 *
 *   buildPavPrompt(keywords, stations, strategy)
 *     → Genera il prompt completo per Claude API
 *     → Include tutte le regole PAV embedded nel prompt
 *     → L'AI restituisce JSON con piano immagini + PAV completo
 *
 *   buildBodyZones(branches)
 *     → Assegna stazioni corporee alle keyword
 *     → Rispetta la struttura gerarchica della mappa
 *
 *   buildCasaPercorso(locali, oggettiPerLocale, extraSpaces)
 *     → Costruisce il percorso personalizzato dalla casa dell'utente
 *
 *   flattenZone(zone)
 *     → Appiattisce zona in lista ordinata per la sequenza
 *
 *   buildVerifyConnections(seq)
 *     → Produce i check di connessione tra immagini consecutive
 *
 * CONTENITORI DISPONIBILI:
 *   CORPO_UMANO_STATIONS  → 34 stazioni testa→piedi
 *   STORIE_FAMOSE         → Cappuccetto Rosso, Tre Porcellini, Pinocchio, Alice
 *   CASA_MIA_QUESTIONS    → 3 domande per mappare la casa
 *
 * REGOLE PAV (embedded nel prompt AI):
 *   1. Classifica: concreta → usa direttamente / astratta → trasforma
 *   2. Tecnica unica per keyword: FONETICA o SIGNIFICATO, mai mescolare
 *   3. Ordine fonetico obbligatorio: le parti appaiono nella storia
 *      nell'IDENTICO ordine in cui compaiono nella parola originale
 *   4. Entrambe le parti fonetiche devono essere evidenti nella storia
 *   5. PAV = Paradossale · Azione · Vivido (emozione forte)
 *   6. Struttura gerarchica: secondarie escono dalla primaria,
 *      terziarie escono dalla secondaria — catena connessa
 */


// ═══════════════════════════════════════════════════════════════════
//  MODULO 3 — MemorizationEngine_rules.js
// ═══════════════════════════════════════════════════════════════════

/**
 * RESPONSABILITÀ:
 *   Definisce le regole di business del sistema di memorizzazione.
 *   Usato come riferimento da PAVEngine.js e dal prompt AI.
 *
 * CONTENUTO:
 *   STRATEGY_RULES        → soglie e opzioni disponibili
 *   STORIA_DIRETTA        → config storia diretta (max 25 kw)
 *   CORPO_UMANO           → stazioni e regole PAV corporeo
 *   STORIE_FAMOSE         → 4 storie con scene pre-mappate
 *   CASA_MIA              → 3 domande e logica costruzione percorso
 *   PAV_RULES             → regole universali PAV (concreta, bizzarra, dinamica, sensoriale)
 *   APP_FLOW              → 5 step del flusso completo
 */


// ═══════════════════════════════════════════════════════════════════
//  INTEGRAZIONE CON CLAUDE API
// ═══════════════════════════════════════════════════════════════════

/**
 * Il PAVEngine usa Claude API per due chiamate principali:
 *
 * CHIAMATA 1 — Estrazione keyword dal testo:
 *   Model: claude-sonnet-4-20250514
 *   Input: testo dell'utente (PDF estratto o testo incollato)
 *   Output JSON:
 *   {
 *     "blocks": [...],              // blocchi logici del testo
 *     "5w_coverage": {...},         // copertura delle 5 domande
 *     "keywords": [
 *       {
 *         "keyword": "...",
 *         "domanda": "Cosa|Chi|Quando|Dove|Come",
 *         "secondary": "...",
 *         "esempio": "...",
 *         "level": "primaria|secondaria|terziaria",
 *         "parent": "keyword_genitore|null",
 *         "color": "#HEX"
 *       }
 *     ]
 *   }
 *
 * CHIAMATA 2 — Generazione piano immagini + PAV:
 *   Model: claude-sonnet-4-20250514
 *   Input: buildPavPrompt(keywords, stations, strategy)
 *   Output JSON: struttura zones con piano + PAV completo
 *   (vedi PAVEngine.js → buildPavPrompt per il formato esatto)
 *
 * ESEMPIO CHIAMATA API:
 *
 *   async function generatePAV(keywords, stations, strategy) {
 *     const response = await fetch('https://api.anthropic.com/v1/messages', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({
 *         model: 'claude-sonnet-4-20250514',
 *         max_tokens: 4000,
 *         messages: [{
 *           role: 'user',
 *           content: buildPavPrompt(keywords, stations, strategy)
 *         }]
 *       })
 *     });
 *     const data = await response.json();
 *     const text = data.content.map(i => i.text || '').join('');
 *     const clean = text.replace(/```json|```/g, '').trim();
 *     return JSON.parse(clean);
 *   }
 */


// ═══════════════════════════════════════════════════════════════════
//  DIPENDENZE TRA MODULI
// ═══════════════════════════════════════════════════════════════════

/**
 *
 *  INPUT TESTO
 *       │
 *       ▼
 *  Claude API ──────────────────────────► ESTRAZIONE KEYWORD
 *       │                                 (domanda, secondary, esempio,
 *       │                                  livello, genitore, colore)
 *       │
 *       ▼
 *  MindMapEngine.js ────────────────────► MAPPA SVG
 *  (usa keywords come branches)           (spicchi, bezier, START)
 *       │
 *       ▼
 *  PAVEngine.js
 *    │
 *    ├── selectStrategy()   ─────────────► SCELTA CONTENITORE (UI)
 *    │
 *    ├── buildBodyZones()   ─────────────► ASSEGNAZIONE STAZIONI
 *    │   buildCasaPercorso()
 *    │
 *    ├── buildPavPrompt()   ─────────────► Claude API
 *    │                                      │
 *    │                                      ▼
 *    │                                    JSON: piano + PAV
 *    │
 *    ├── flattenZone()      ─────────────► SEQUENZA ORDINATA
 *    ├── buildVerifyConnections()          VERIFICA CONNESSIONI
 *    │
 *    └── [UI rendering]    ─────────────► APPRENDI + TEST
 *                                          SPACED REPETITION
 */


// ═══════════════════════════════════════════════════════════════════
//  CHECKLIST INTEGRAZIONE
// ═══════════════════════════════════════════════════════════════════

/**
 * Per integrare questi moduli nell'app React:
 *
 * ☐ 1. Importa MindMapEngine.js nel componente MindMap
 * ☐ 2. Importa PAVEngine.js nel componente Memorizzazione
 * ☐ 3. Configura la chiamata Claude API per l'estrazione keyword
 * ☐ 4. Configura la chiamata Claude API per la generazione PAV
 * ☐ 5. Costruisci il widget scelta contenitore (buildStrategyMessage)
 * ☐ 6. Costruisci il flusso domande per CASA MIA (CASA_MIA_QUESTIONS)
 * ☐ 7. Costruisci il rendering zone (piano + ordine + PAV + sequenza)
 * ☐ 8. Costruisci la modalità APPRENDI (card per card)
 * ☐ 9. Costruisci la modalità TEST (stazione → keyword)
 * ☐ 10. Implementa lo spaced repetition
 */
