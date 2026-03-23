/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║   PAV ENGINE — Metodo Eureka                                     ║
 * ║   Modulo definitivo per la memorizzazione delle keyword          ║
 * ║   Versione: 1.0                                                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * RESPONSABILITÀ DI QUESTO MODULO:
 *  1. Ricevere le keyword estratte dalla mappa (struttura gerarchica)
 *  2. Classificare ogni keyword (concreta / astratta)
 *  3. Scegliere la strategia di memorizzazione in base al numero di keyword
 *  4. Chiedere all'utente il contenitore preferito
 *  5. Generare il piano delle immagini (fonetica o significato)
 *  6. Generare le immagini PAV rispettando tutte le regole
 *  7. Costruire la sequenza connessa per zona
 *  8. Esporre i dati per rendering e test
 *
 * ─────────────────────────────────────────────────────────────────
 *  REGOLE PAV — NON DEROGABILI
 * ─────────────────────────────────────────────────────────────────
 *
 *  REGOLA 1 — CLASSIFICA PRIMA
 *    Ogni keyword è CONCRETA (immagine diretta) o ASTRATTA (richiede trasformazione).
 *    Le concrete si usano direttamente nel PAV.
 *    Le astratte richiedono una delle due tecniche.
 *
 *  REGOLA 2 — TECNICA UNICA, MAI MESCOLARE
 *    Per ogni keyword astratta scegli UNA sola tecnica:
 *    - FONETICA:    scomponi il suono della parola in parti visive
 *    - SIGNIFICATO: visualizza il concetto della parola
 *
 *  REGOLA 3 — ORDINE FONETICO OBBLIGATORIO
 *    Le parti fonetiche devono apparire nella storia PAV
 *    NELLO STESSO ORDINE in cui compaiono nella parola originale.
 *    Leggendo la storia in sequenza devo ricostruire la parola.
 *    ESERCI/ZIO → prima l'ESERCITO marcia, POI lo ZIO emerge dall'esercito.
 *
 *  REGOLA 4 — ENTRAMBE LE PARTI DEVONO ESSERE EVIDENTI
 *    Ogni parte fonetica deve essere un elemento visivo distinto e riconoscibile.
 *    Non basta che ci sia — deve emergere chiaramente.
 *
 *  REGOLA 5 — PAV = Paradossale · Azione · Vivido
 *    P — PARADOSSALE: l'immagine è impossibile, strana, non accade mai nella realtà
 *    A — AZIONE:      qualcosa succede fisicamente, c'è sempre un verbo di movimento
 *    V — VIVIDO:      evoca emozione forte (paura, risata, macabro, violento nei limiti)
 *
 *  REGOLA 6 — STRUTTURA GERARCHICA = CATENA DI IMMAGINI
 *    Le secondarie escono dall'immagine della primaria.
 *    Le terziarie escono dall'immagine della secondaria.
 *    Non sono immagini indipendenti — sono una catena connessa.
 *    La sequenza si legge come un film.
 */


// ═══════════════════════════════════════════════════════════════════
//  SEZIONE 1 — SELEZIONE STRATEGIA
// ═══════════════════════════════════════════════════════════════════

/**
 * Soglie per la selezione automatica del contenitore.
 * L'app suggerisce ma l'utente può sempre scegliere diversamente.
 *
 * @param {number} count - numero totale di keyword nella mappa
 * @returns {{ suggested: string, alternative: string|null, all: string[] }}
 */
const STRATEGY_THRESHOLDS = [
  { max: 15, suggested: 'storia_diretta',  alternative: null },
  { max: 30, suggested: 'corpo_umano',     alternative: 'storia_famosa' },
  { max: 60, suggested: 'casa_mia',        alternative: 'storia_famosa' },
  { max: Infinity, suggested: 'casa_mia',  alternative: null },
];

const ALL_STRATEGIES = ['storia_diretta', 'corpo_umano', 'storia_famosa', 'casa_mia'];

function selectStrategy(keywordCount) {
  for (const rule of STRATEGY_THRESHOLDS) {
    if (keywordCount <= rule.max) {
      return { suggested: rule.suggested, alternative: rule.alternative, all: ALL_STRATEGIES };
    }
  }
}

/**
 * Messaggio da mostrare all'utente per la scelta del contenitore.
 * Chiamata dopo la generazione della mappa, prima del PAV.
 *
 * @param {number} count - numero di keyword estratte
 * @returns {object} - testo e opzioni per il widget di scelta
 */
function buildStrategyMessage(count) {
  const strategy = selectStrategy(count);
  return {
    intro: `Hai estratto ${count} parole chiave dalla tua mappa. Ora voglio aiutarti a memorizzarle tutte in modo permanente. Ho bisogno di un "contenitore mentale" — una struttura che già conosci bene — su cui agganciare ogni parola con un'immagine vivida.`,
    question: 'Quale contenitore preferisci usare?',
    suggested: strategy.suggested,
    options: [
      {
        id: 'storia_diretta',
        icon: '📖',
        label: 'Una storia',
        desc: `Creo una storia PAV che collega tutte le keyword in sequenza. Consigliata per ${STRATEGY_THRESHOLDS[0].max} keyword o meno.`,
        recommended: strategy.suggested === 'storia_diretta',
      },
      {
        id: 'corpo_umano',
        icon: '🧍',
        label: 'Il tuo corpo',
        desc: 'Usi le parti del tuo corpo come stazioni. Le conosci perfettamente, funziona sempre.',
        recommended: strategy.suggested === 'corpo_umano',
      },
      {
        id: 'storia_famosa',
        icon: '🏰',
        label: 'Una storia famosa',
        desc: 'Scegli una storia che conosci a memoria: le sue scene diventano le stazioni su cui appoggiare le keyword.',
        recommended: false,
      },
      {
        id: 'casa_mia',
        icon: '🏠',
        label: 'La tua casa',
        desc: 'Usi i locali e gli oggetti della tua casa. Ti faccio alcune domande per costruire il percorso insieme.',
        recommended: strategy.suggested === 'casa_mia',
      },
    ],
  };
}


// ═══════════════════════════════════════════════════════════════════
//  SEZIONE 2 — CONTENITORI PRE-DEFINITI
// ═══════════════════════════════════════════════════════════════════

/**
 * CORPO UMANO — 34 stazioni in ordine testa→piedi (fronte + retro)
 * Universale: tutti conoscono il proprio corpo.
 * Le stazioni sono assegnate in ordine alle keyword della mappa
 * seguendo la sequenza gerarchica (primaria → secondarie → terziarie).
 */
const CORPO_UMANO_STATIONS = [
  // Fronte
  'Cima della testa', 'Fronte', 'Occhio destro', 'Occhio sinistro',
  'Naso', 'Bocca', 'Orecchio destro', 'Orecchio sinistro', 'Collo',
  'Spalla sinistra', 'Spalla destra', 'Sterno',
  'Polso sinistro', 'Polso destro',
  'Pollice destro', 'Indice destro', 'Medio destro', 'Anulare destro',
  'Coscia destra', 'Coscia sinistra',
  'Ginocchio destro', 'Ginocchio sinistro',
  'Tibia destra', 'Tibia sinistra',
  'Piede destro', 'Piede sinistro',
  // Retro (se le keyword superano 26)
  'Nuca', 'Schiena alta', 'Schiena bassa', 'Glutei',
  'Polpaccio destro', 'Polpaccio sinistro',
  'Tallone destro', 'Tallone sinistro',
];

/**
 * Assegna le stazioni corporee alle keyword in ordine gerarchico.
 * La primaria prende la prima stazione disponibile della sua zona.
 * Le secondarie prendono le stazioni successive nella stessa zona.
 *
 * @param {Array} keywords - keyword in ordine gerarchico (flat)
 * @returns {Array} - keyword con stazione assegnata
 */
function assignBodyStations(keywords) {
  return keywords.map((kw, i) => ({
    ...kw,
    station: CORPO_UMANO_STATIONS[i] || `Stazione ${i + 1}`,
  }));
}

/**
 * STORIE FAMOSE — scene pre-mappate
 * L'utente sceglie la storia che conosce meglio.
 * Le scene sono già definite: l'app le assegna alle keyword in ordine.
 */
const STORIE_FAMOSE = {
  cappuccetto_rosso: {
    name: 'Cappuccetto Rosso',
    scenes: [
      'Casa di Cappuccetto — la mamma saluta',
      'Il cestino con il cibo preparato',
      'Il sentiero nel bosco',
      'I fiori nel prato',
      'L\'incontro con il lupo',
      'La conversazione col lupo',
      'Il lupo corre dalla nonna',
      'La casa della nonna — porta',
      'Il lupo a letto travestito da nonna',
      'Le domande ("che occhi grandi hai...")',
      'Il lupo che ingoia Cappuccetto',
      'Il cacciatore che libera tutti',
    ],
  },
  tre_porcellini: {
    name: 'I Tre Porcellini',
    scenes: [
      'I tre porcellini lasciano casa',
      'Casa di paglia — primo porcellino',
      'Casa di legno — secondo porcellino',
      'Casa di mattoni — terzo porcellino',
      'Il lupo soffia sulla paglia — crolla',
      'Il lupo soffia sul legno — crolla',
      'Il lupo sul tetto di mattoni',
      'Il lupo nel camino',
      'La pentola bollente',
      'La fuga del lupo',
    ],
  },
  pinocchio: {
    name: 'Pinocchio',
    scenes: [
      'Geppetto intaglia il legno',
      'Pinocchio prende vita',
      'Il Grillo Parlante',
      'Il Teatro dei Burattini — Mangiafuoco',
      'Il Gatto e la Volpe',
      'Il Campo dei Miracoli',
      'Il Paese dei Balocchi',
      'Pinocchio diventa asino',
      'Il mare in tempesta',
      'La Balena che ingoia tutto',
      'Geppetto dentro la balena',
      'La fuga dalla balena',
      'La Fata Turchina',
      'Il naso che cresce',
      'Pinocchio diventa bambino vero',
    ],
  },
  alice: {
    name: 'Alice nel Paese delle Meraviglie',
    scenes: [
      'Alice annoiata sull\'erba',
      'Il Bianconiglio con l\'orologio',
      'La caduta nel buco',
      'La bottiglietta "Bevimi"',
      'La porta piccola nel giardino',
      'Il Bruco sul fungo',
      'Lo Stregatto sull\'albero',
      'Il Cappellaio Matto al tavolo del tè',
      'Il mazzo di carte che dipinge le rose',
      'La Regina di Cuori',
      '"Tagliate la testa!"',
      'Il campo da croquet con i fenicotteri',
      'Il processo',
      'Il risveglio di Alice',
    ],
  },
};

/**
 * CASA MIA — domande per costruire il percorso personalizzato
 * L'app fa 3 domande per mappare la casa senza conoscerla in anticipo.
 */
const CASA_MIA_QUESTIONS = [
  {
    id: 'locali',
    step: 1,
    text: 'Elenca i locali della tua casa nell\'ordine in cui li percorreresti partendo dalla porta d\'ingresso.',
    placeholder: 'es: ingresso, cucina, soggiorno, corridoio, bagno, camera da letto...',
    type: 'list',
    min: 3,
  },
  {
    id: 'oggetti_per_locale',
    step: 2,
    text: 'Per ogni locale, elenca i 3-5 oggetti più grandi o caratteristici che vedi appena entri, guardando da sinistra a destra.',
    placeholder: 'es: cucina → frigorifero, tavolo, lavello, microonde',
    type: 'list_per_room',
    objPerRoom: { min: 3, max: 5 },
  },
  {
    id: 'spazi_extra',
    step: 3,
    text: 'Hai balcone, giardino, cantina o garage? Se sì, aggiungili in fondo al percorso.',
    placeholder: 'es: balcone, garage (opzionale)',
    type: 'optional_list',
  },
];

/**
 * Costruisce il percorso casa dall'input dell'utente.
 * Output: lista di stazioni nel formato { locale, oggetto }
 *
 * @param {string[]} locali - lista locali in ordine
 * @param {Object} oggettiPerLocale - { nomLocale: [oggetto1, oggetto2, ...] }
 * @param {string[]} extraSpaces - eventuali spazi aggiuntivi
 * @returns {Array} - stazioni ordinate
 */
function buildCasaPercorso(locali, oggettiPerLocale, extraSpaces = []) {
  const stazioni = [];
  for (const locale of locali) {
    const oggetti = oggettiPerLocale[locale] || [];
    for (const oggetto of oggetti) {
      stazioni.push({ locale, oggetto, label: `${locale} — ${oggetto}` });
    }
  }
  for (const extra of extraSpaces) {
    stazioni.push({ locale: extra, oggetto: extra, label: extra });
  }
  return stazioni;
}


// ═══════════════════════════════════════════════════════════════════
//  SEZIONE 3 — CLASSIFICAZIONE KEYWORD
// ═══════════════════════════════════════════════════════════════════

/**
 * Classifica una keyword come CONCRETA o ASTRATTA.
 *
 * CONCRETA: ha già un'immagine visiva diretta e immediata.
 *   Esempi: fuoco, mela, cane, martello, scala, finestra.
 *
 * ASTRATTA: non ha immagine visiva diretta.
 *   Esempi: giustizia, obbligo, differenza, esercizio, realizzazione.
 *   Richiede tecnica FONETICA o SIGNIFICATO per creare l'immagine.
 *
 * NOTA: In testi giuridici, economici e accademici quasi tutte le keyword
 * sono astratte. In testi descrittivi o narrativi possono esserci concrete.
 *
 * @param {string} keyword
 * @returns {'concreta' | 'astratta'}
 */
function classifyKeyword(keyword) {
  // Lista di indicatori di concretezza (oggetti fisici comuni)
  const CONCRETE_INDICATORS = [
    'casa', 'porta', 'finestra', 'tavolo', 'sedia', 'libro', 'mano', 'occhio',
    'acqua', 'fuoco', 'terra', 'albero', 'animale', 'corpo', 'testa', 'piede',
    'cane', 'gatto', 'fiore', 'pietra', 'metallo', 'vetro', 'carta', 'cibo',
  ];
  const lower = keyword.toLowerCase();
  for (const indicator of CONCRETE_INDICATORS) {
    if (lower.includes(indicator)) return 'concreta';
  }
  return 'astratta';
  // NOTA: in produzione questo viene fatto dall'AI con un prompt specifico.
}

/**
 * Sceglie la tecnica per le keyword astratte.
 * Questa logica è eseguita dall'AI — qui definiamo le regole che l'AI deve seguire.
 *
 * QUANDO usare FONETICA:
 *  - La parola ha almeno 2 sillabe chiaramente scomponibili
 *  - Almeno una parte sonetica richiama qualcosa di visivo e concreto
 *  - Esempio: ESERCI/ZIO → esercito + zio
 *
 * QUANDO usare SIGNIFICATO:
 *  - La parola ha un concetto facilmente visualizzabile
 *  - La scomposizione fonetica non produce immagini chiare
 *  - Esempio: DIFFERENZA → due opposti che si scontrano
 *
 * MAI MESCOLARE:
 *  - Una keyword usa SOLO una delle due tecniche
 *  - Non aggiungere elementi di significato a una keyword fonetica
 *  - Non aggiungere suoni a una keyword di significato
 */
const TECHNIQUE_RULES = {
  fonetica: {
    quando: 'La parola si scompone in parti che suonano come qualcosa di visivo e concreto',
    come: 'Dividi la parola in sillabe o gruppi fonetici. Ogni gruppo deve richiamare un\'immagine concreta. Le immagini compaiono nella storia NELLO STESSO ORDINE delle parti nella parola.',
    esempio: 'ESERCIZIO → ESERCI (esercito) + ZIO (lo zio): prima l\'esercito marcia, poi dallo stesso esercito emerge lo zio',
    errore: 'NON invertire l\'ordine. NON aggiungere elementi di significato alla storia fonetica.',
  },
  significato: {
    quando: 'Il concetto della parola è facilmente visualizzabile oppure la fonetica non produce immagini chiare',
    come: 'Visualizza il concetto con l\'immagine più concreta, bizzarra e immediata possibile.',
    esempio: 'DIFFERENZA → un camion di fuoco e un camion di ghiaccio che si scontrano frontalmente',
    errore: 'NON usare metafore astratte. NON descrivere il concetto — MOSTRALO visivamente.',
  },
};


// ═══════════════════════════════════════════════════════════════════
//  SEZIONE 4 — PROMPT AI PER GENERAZIONE PAV
// ═══════════════════════════════════════════════════════════════════

/**
 * Prompt base per la generazione AI del piano immagini e del PAV.
 * Da usare con Claude API (claude-sonnet-4-20250514).
 *
 * Il prompt viene costruito dinamicamente con:
 *  - La lista di keyword dalla mappa (in ordine gerarchico)
 *  - Le stazioni del contenitore scelto
 *  - Le regole PAV
 */

function buildPavPrompt(keywords, stations, strategy) {
  const kwList = keywords.map((kw, i) =>
    `${i + 1}. [${kw.level.toUpperCase()}] "${kw.keyword}" → stazione: "${stations[i]?.label || stations[i] || 'stazione ' + (i+1)}"`
  ).join('\n');

  return `Sei un esperto del Metodo Eureka di memorizzazione PAV. Devi generare il piano delle immagini e le storie PAV per le seguenti keyword.

KEYWORD DA MEMORIZZARE (in ordine gerarchico — rispetta questo ordine):
${kwList}

REGOLE OBBLIGATORIE — NON DEROGABILI:

1. CLASSIFICA ogni keyword come CONCRETA (immagine diretta) o ASTRATTA.
   - CONCRETA: usa l'immagine direttamente nel PAV
   - ASTRATTA: applica UNA sola tecnica (FONETICA o SIGNIFICATO)

2. TECNICA UNICA — mai mescolare per la stessa keyword.
   - FONETICA: scomponi il suono in parti (es. ESERCI/ZIO → esercito + zio)
   - SIGNIFICATO: visualizza il concetto (es. DOVERE → macigno che schiaccia)

3. ORDINE FONETICO OBBLIGATORIO:
   Le parti fonetiche devono apparire nella storia PAV NELLO STESSO ORDINE
   in cui compaiono nella parola originale.
   Se la parola è ESERCI/ZIO → nella storia: prima appare l'ESERCITO, POI lo ZIO.
   MAI invertire l'ordine.

4. PAV = Paradossale · Azione · Vivido:
   - P (Paradossale): l'immagine è impossibile, strana, non accade nella realtà
   - A (Azione): qualcosa succede fisicamente — sempre un verbo di movimento
   - V (Vivido): evoca emozione forte (paura, risata, macabro)

5. STRUTTURA GERARCHICA — catena di immagini:
   - Le keyword SECONDARIE devono uscire dall'immagine della loro PRIMARIA
   - Le keyword TERZIARIE devono uscire dall'immagine della loro SECONDARIA
   - Ogni immagine genera la successiva — non sono indipendenti

6. La storia di ogni zona deve essere leggibile in sequenza come un film.

OUTPUT RICHIESTO — rispondi SOLO con questo JSON, nessun testo aggiuntivo:
{
  "zones": [
    {
      "primary": {
        "keyword": "...",
        "station": "...",
        "tipo": "fon" | "sig",
        "parts": ["PARTE1 →", "PARTE2 →"],
        "img": "descrizione immagine base",
        "order": "1° appare X · 2° poi Y (solo per fon)",
        "P": "elemento paradossale",
        "A": "azione fisica",
        "V": "dettaglio vivido emozionale",
        "pav": "immagine PAV completa in una frase",
        "children": [
          {
            "keyword": "...",
            "station": "...",
            "tipo": "fon" | "sig",
            "parts": [...],
            "img": "...",
            "order": "...",
            "connect": "come questa immagine esce dalla primaria",
            "P": "...", "A": "...", "V": "...",
            "pav": "...",
            "children": [ /* stessa struttura per terziarie */ ]
          }
        ]
      }
    }
  ]
}`;
}


// ═══════════════════════════════════════════════════════════════════
//  SEZIONE 5 — COSTRUZIONE ZONE CORPO UMANO
// ═══════════════════════════════════════════════════════════════════

/**
 * Divide le keyword in zone corporee per il contenitore CORPO UMANO.
 * Le primarie definiscono le zone — ognuna prende una area corporea distante.
 *
 * Con 3 primarie:
 *   ZONA 1 (Testa):  primaria + sue secondarie/terziarie
 *   ZONA 2 (Petto):  primaria + sue secondarie/terziarie
 *   ZONA 3 (Gambe):  primaria + sue secondarie/terziarie
 *
 * Con 4+ primarie: il corpo viene diviso in più zone.
 *
 * @param {Array} branches - rami dalla mappa (struttura gerarchica)
 * @returns {Array} - zone con stazioni assegnate
 */
function buildBodyZones(branches) {
  // Dividi il corpo in n zone uguali per n primarie
  const n = branches.length;
  const stationsPerZone = Math.floor(CORPO_UMANO_STATIONS.length / n);

  return branches.map((branch, i) => {
    const zoneStart  = i * stationsPerZone;
    const zoneStations = CORPO_UMANO_STATIONS.slice(zoneStart, zoneStart + stationsPerZone);

    // Assegna stazione alla primaria e alle secondarie/terziarie
    let stationIndex = 0;
    function assignStation(node) {
      const station = zoneStations[stationIndex] || `Stazione ${zoneStart + stationIndex + 1}`;
      stationIndex++;
      const assigned = { ...node, station };
      if (node.children?.length) {
        assigned.children = node.children.map(assignStation);
      }
      return assigned;
    }

    return {
      id: i,
      zoneLabel: `ZONA ${i + 1}`,
      color: branch.color,
      primary: assignStation(branch),
    };
  });
}


// ═══════════════════════════════════════════════════════════════════
//  SEZIONE 6 — SEQUENZA E VERIFICA
// ═══════════════════════════════════════════════════════════════════

/**
 * Appiattisce una zona in una lista ordinata di keyword per la sequenza.
 * Ordine: primaria → secondaria1 → terziarie di sec1 → secondaria2 → ...
 *
 * @param {Object} zone - zona con struttura gerarchica
 * @returns {Array} - keyword in ordine sequenziale
 */
function flattenZone(zone) {
  const seq = [];
  function walk(node, level) {
    seq.push({ keyword: node.keyword, station: node.station, color: node.color, pav: node.pav, level });
    for (const child of node.children || []) walk(child, level === 'PRIMARIA' ? 'SECONDARIA' : 'TERZIARIA');
  }
  walk(zone.primary, 'PRIMARIA');
  return seq;
}

/**
 * Verifica che le connessioni nella sequenza siano coerenti.
 * Ogni immagine deve "contenere o generare" quella successiva.
 * Questa verifica è mostrata all'utente nella sezione SEQUENZA COMPLETA.
 *
 * @param {Array} seq - sequenza flat della zona
 * @returns {Array} - coppie con descrizione della connessione attesa
 */
function buildVerifyConnections(seq) {
  return seq.slice(0, -1).map((item, i) => ({
    from:    item.keyword,
    to:      seq[i + 1].keyword,
    fromColor: item.color,
    toColor:   seq[i + 1].color,
    check: `L'immagine di "${item.keyword}" deve generare o contenere l'immagine di "${seq[i + 1].keyword}"`,
  }));
}


// ═══════════════════════════════════════════════════════════════════
//  SEZIONE 7 — FLUSSO COMPLETO NELL'APP
// ═══════════════════════════════════════════════════════════════════

/**
 * STEP 1 — Fine generazione mappa
 *   Input:  keywords estratte dalla mappa (struttura gerarchica)
 *   Output: count totale, strategia suggerita, messaggio per l'utente
 *
 * STEP 2 — Scelta contenitore (UI)
 *   L'app mostra le opzioni. L'utente sceglie.
 *   Se sceglie CASA MIA → avvia il flusso domande (3 step)
 *   Se sceglie STORIA FAMOSA → mostra lista storie, l'utente sceglie una
 *
 * STEP 3 — Generazione PAV (AI)
 *   L'app chiama Claude API con buildPavPrompt()
 *   Claude restituisce il JSON con il piano immagini + PAV completo
 *
 * STEP 4 — Rendering
 *   L'app renderizza zone, piano, ordine fonetico, PAV, sequenza
 *
 * STEP 5 — Ripasso guidato
 *   Modalità APPRENDI: scorri le keyword una alla volta con il PAV
 *   Modalità TEST:     vedi solo la stazione, ricorda la keyword
 *
 * STEP 6 — Spaced Repetition
 *   Le keyword sbagliate tornano nel ciclo di ripasso con frequenza maggiore
 */

const APP_FLOW_STEPS = [
  { step: 1, id: 'count_and_suggest',   desc: 'Conta keyword e suggerisce strategia' },
  { step: 2, id: 'user_choice',         desc: 'L\'utente sceglie il contenitore' },
  { step: 2.1, id: 'casa_questions',    desc: 'Se casa mia: 3 domande per mappare i locali' },
  { step: 2.2, id: 'storia_choice',     desc: 'Se storia famosa: scelta della storia' },
  { step: 3, id: 'ai_generation',       desc: 'AI genera piano immagini + PAV con buildPavPrompt()' },
  { step: 4, id: 'render',              desc: 'Rendering zone, sequenze, verifica connessioni' },
  { step: 5, id: 'learn_mode',          desc: 'Modalità apprendi: PAV card per card' },
  { step: 5.1, id: 'test_mode',         desc: 'Modalità test: stazione → keyword' },
  { step: 6, id: 'spaced_repetition',   desc: 'Algoritmo ripasso: keyword sbagliate tornano più spesso' },
];


// ═══════════════════════════════════════════════════════════════════
//  EXPORT
// ═══════════════════════════════════════════════════════════════════

// Per uso come modulo ES6 in React/app moderna:
// export { ... }

// Per uso come script browser (compatibilità):
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Strategia
    selectStrategy,
    buildStrategyMessage,
    ALL_STRATEGIES,
    STRATEGY_THRESHOLDS,
    // Contenitori
    CORPO_UMANO_STATIONS,
    STORIE_FAMOSE,
    CASA_MIA_QUESTIONS,
    buildCasaPercorso,
    // Classificazione
    classifyKeyword,
    TECHNIQUE_RULES,
    // Prompt AI
    buildPavPrompt,
    // Costruzione zone
    buildBodyZones,
    assignBodyStations,
    // Sequenza e verifica
    flattenZone,
    buildVerifyConnections,
    // Flusso app
    APP_FLOW_STEPS,
  };
}
