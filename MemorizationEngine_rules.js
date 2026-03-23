/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║     SISTEMA DI MEMORIZZAZIONE KEYWORD — Metodo Eureka        ║
 * ║     Specifiche logiche per l'app                             ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * PRINCIPIO BASE
 * ──────────────
 * Il PAV (Parola → Azione → Visione) è SEMPRE al centro di ogni
 * strategia. Cambia solo il "contenitore" su cui si agganciano
 * le immagini PAV, in base al numero di keyword e alla scelta
 * dell'utente.
 *
 * CONTENITORE = struttura mentale stabile e già nota all'utente
 * su cui posizionare, in ordine, le immagini PAV di ogni keyword.
 */


// ═══════════════════════════════════════════════════════════════
//  1. SELEZIONE AUTOMATICA DELLA STRATEGIA
// ═══════════════════════════════════════════════════════════════

/**
 * L'app NON impone la strategia. La suggerisce in base al numero
 * di keyword e poi lascia scegliere all'utente.
 *
 * SOGLIE SUGGERITE:
 *
 *  ≤ 15 keyword  →  suggerisci STORIA DIRETTA
 *  16 – 30       →  suggerisci CORPO UMANO o STORIA FAMOSA
 *  31 – 60       →  suggerisci CASA MIA o STORIA FAMOSA
 *  61+           →  suggerisci CASA MIA (preferenziale)
 *
 * L'utente può sempre scegliere un'opzione diversa da quella
 * suggerita. La soglia orienta, non vincola.
 */

const STRATEGY_RULES = {
  thresholds: [
    { max: 15, suggested: 'storia_diretta' },
    { max: 30, suggested: 'corpo_umano',    alternative: 'storia_famosa' },
    { max: 60, suggested: 'casa_mia',       alternative: 'storia_famosa' },
    { max: Infinity, suggested: 'casa_mia' }
  ],

  // Tutte le opzioni sempre disponibili per l'utente
  allOptions: [
    'storia_diretta',
    'corpo_umano',
    'storia_famosa',
    'casa_mia',
  ]
};

function suggestStrategy(keywordCount) {
  for (const rule of STRATEGY_RULES.thresholds) {
    if (keywordCount <= rule.max) {
      return {
        suggested:   rule.suggested,
        alternative: rule.alternative || null,
        all:         STRATEGY_RULES.allOptions
      };
    }
  }
}


// ═══════════════════════════════════════════════════════════════
//  2. MESSAGGIO DI APERTURA ALL'UTENTE
// ═══════════════════════════════════════════════════════════════

/**
 * Dopo la generazione della mappa, l'app mostra questo messaggio
 * (personalizzato con il numero di keyword estratte).
 *
 * TESTO:
 * "Ottimo! Hai estratto {N} parole chiave dalla tua mappa.
 *  Ora voglio aiutarti a memorizzarle tutte in modo permanente.
 *  Per farlo ho bisogno di un 'contenitore mentale' — una struttura
 *  che già conosci bene — su cui agganciare ogni parola con
 *  un'immagine vivida.
 *
 *  Quale di questi contenitori preferisci usare?"
 *
 * OPZIONI MOSTRATE (con descrizione breve):
 *
 *  📖 Una storia
 *     "Creo una storia PAV che collega tutte le keyword in
 *      sequenza. Semplice e immediata."
 *     [consigliata se N ≤ 15]
 *
 *  🧍 Il tuo corpo
 *     "Usi le parti del tuo corpo come stazioni. Le conosci
 *      perfettamente, funziona sempre."
 *     [consigliata se N 16–30]
 *
 *  🏰 Una storia famosa
 *     "Scegli una storia che conosci a memoria: le scene
 *      diventano le stazioni su cui appoggiare le keyword."
 *     [sempre disponibile]
 *
 *  🏠 La tua casa
 *     "Usi i locali e gli oggetti della tua casa come percorso.
 *      Ti faccio alcune domande per costruirlo insieme."
 *     [consigliata se N 31+]
 */


// ═══════════════════════════════════════════════════════════════
//  3. STRATEGIA: STORIA DIRETTA
// ═══════════════════════════════════════════════════════════════

/**
 * QUANDO: ≤ 15 keyword (ideale), massimo 25.
 *
 * COME FUNZIONA:
 * L'AI genera una storia breve e assurda che collega tutte le
 * keyword in ordine. Ogni keyword è trasformata in un'immagine
 * PAV concreta, bizzarra e memorabile. La storia segue l'ordine
 * della mappa (lettura oraria dal ramo START).
 *
 * REGOLE PER LA GENERAZIONE AI:
 *  - Ogni keyword deve diventare un'immagine visiva concreta
 *  - L'immagine deve essere esagerata, assurda o comica
 *    (il cervello ricorda meglio ciò che stupisce)
 *  - Le immagini devono essere concatenate causalmente
 *    (una porta all'altra)
 *  - Usare azioni fisiche vivide (PAV: Parola → Azione → Visione)
 *  - Evitare termini astratti — tutto deve essere visibile
 *  - La storia deve potersi "ripercorrere" mentalmente
 *    come un film in sequenza
 *
 * PROMPT BASE PER L'AI:
 * "Trasforma queste {N} keyword in una storia PAV breve e assurda.
 *  Ogni keyword deve diventare un'immagine visiva concreta e
 *  bizzarra, collegata alla successiva da un'azione fisica.
 *  L'ordine delle keyword nella storia deve essere esattamente
 *  questo: {lista keyword in ordine}.
 *  Al termine elenca le keyword con la loro immagine PAV associata."
 */

const STORIA_DIRETTA = {
  maxKeywords: 25,
  generationType: 'ai_generated',
  pavRequired: true,
  orderMustMatch: true, // rispetta ordine mappa
  style: 'assurda_e_comica',
};


// ═══════════════════════════════════════════════════════════════
//  4. STRATEGIA: CORPO UMANO
// ═══════════════════════════════════════════════════════════════

/**
 * QUANDO: 16–55 keyword circa.
 *
 * STAZIONI PREDEFINITE (ordine testa→piedi, fronte):
 *  1. Cima della testa        11. Mano destra
 *  2. Fronte                  12. Mano sinistra
 *  3. Occhio destro           13. Dita destra (5 stazioni)
 *  4. Occhio sinistro         14. Dita sinistra (5 stazioni)
 *  5. Naso                    15. Addome
 *  6. Bocca                   16. Fianchi
 *  7. Orecchio destro         17. Ginocchio destro
 *  8. Orecchio sinistro       18. Ginocchio sinistro
 *  9. Collo                   19. Piede destro
 * 10. Spalle                  20. Piede sinistro
 *
 * ESPANSIONE (se keyword > 20): aggiungere stazioni retro:
 *  21. Nuca    22. Schiena alta    23. Schiena bassa
 *  24. Glutei  25. Polpaccio dx    26. Polpaccio sx
 *
 * COME FUNZIONA:
 * L'AI abbina ogni keyword a una stazione corporea e genera
 * un'immagine PAV che "si attacca" fisicamente a quella parte.
 * Es: keyword "REALIZZAZIONE" → bocca → "la bocca che morde
 * un mattone d'oro appena costruito"
 *
 * REGOLE PAV PER OGNI STAZIONE:
 *  - L'immagine deve interagire fisicamente con la parte del corpo
 *  - Più è sensoriale (dolore, calore, peso) più è memorabile
 *  - L'azione deve essere specifica e visivamente inequivocabile
 */

const CORPO_UMANO = {
  stations: [
    'cima della testa','fronte','occhio destro','occhio sinistro',
    'naso','bocca','orecchio destro','orecchio sinistro','collo',
    'spalle','mano destra','mano sinistra',
    'pollice dx','indice dx','medio dx','anulare dx','mignolo dx',
    'pollice sx','indice sx','medio sx','anulare sx','mignolo sx',
    'addome','fianchi','ginocchio destro','ginocchio sinistro',
    'piede destro','piede sinistro',
    // retro (se servono)
    'nuca','schiena alta','schiena bassa','glutei',
    'polpaccio destro','polpaccio sinistro',
  ],
  maxKeywords: 34,
  generationType: 'ai_generated',
};


// ═══════════════════════════════════════════════════════════════
//  5. STRATEGIA: STORIA FAMOSA
// ═══════════════════════════════════════════════════════════════

/**
 * QUANDO: qualsiasi numero di keyword, ottima per 15–50.
 *
 * L'utente sceglie una storia che conosce perfettamente.
 * Le scene della storia diventano le stazioni.
 *
 * STORIE PRE-CARICATE NELL'APP (scene già mappate):
 *
 * ① CAPPUCCETTO ROSSO (12 scene)
 *    1. Casa di Cappuccetto (saluto della mamma)
 *    2. Il cestino con il cibo
 *    3. Il bosco (il sentiero)
 *    4. I fiori nel prato
 *    5. L'incontro con il lupo
 *    6. La conversazione col lupo
 *    7. Il lupo corre dalla nonna
 *    8. La casa della nonna
 *    9. Il lupo a letto travestito
 *   10. Le domande ("che occhi grandi hai...")
 *   11. Il lupo che ingoia Cappuccetto
 *   12. Il cacciatore che libera tutti
 *
 * ② I TRE PORCELLINI (10 scene)
 *    1. I tre porcellini lasciano casa
 *    2. Casa di paglia (primo porcellino)
 *    3. Casa di legno (secondo porcellino)
 *    4. Casa di mattoni (terzo porcellino)
 *    5. Il lupo soffia sulla paglia
 *    6. Il lupo soffia sul legno
 *    7. Il lupo non riesce sui mattoni
 *    8. Il lupo sul tetto
 *    9. Il lupo nel camino
 *   10. La pentola d'acqua bollente
 *
 * ③ PINOCCHIO (15 scene)
 *    1. Geppetto intaglia il legno
 *    2. Pinocchio prende vita
 *    3. Il Grillo Parlante
 *    4. Il Teatro dei Burattini
 *    5. Il Gatto e la Volpe
 *    6. Il Campo dei Miracoli
 *    7. Il Paese dei Balocchi
 *    8. Gli asini
 *    9. Il mare
 *   10. La Balena / il Pesce-cane
 *   11. Geppetto nella balena
 *   12. La fuga dalla balena
 *   13. La Fata Turchina
 *   14. Il naso che cresce
 *   15. Pinocchio diventa bambino vero
 *
 * ④ ALICE NEL PAESE DELLE MERAVIGLIE (14 scene)
 *    1. Alice annoiata sull'erba
 *    2. Il Bianconiglio col orologio
 *    3. La caduta nel buco
 *    4. La bottiglietta "Bevimi"
 *    5. La porta piccola
 *    6. Il Bruco sul fungo
 *    7. Lo Stregatto
 *    8. Il Cappellaio Matto al tavolo
 *    9. Il mazzo di carte
 *   10. La Regina di Cuori
 *   11. "Tagliate la testa!"
 *   12. Il campo da croquet
 *   13. Il processo
 *   14. Il risveglio di Alice
 *
 * COME FUNZIONA:
 * L'app assegna le keyword alle scene in ordine.
 * L'AI genera un'immagine PAV che "entra" nella scena.
 * Es: keyword "COATTIVA" → scena 5 Cappuccetto (incontro col lupo)
 * → "il lupo costringe con la forza Cappuccetto a dargli il cestino"
 *
 * Se le keyword sono più delle scene: si espandono le scene
 * principali in sotto-scene (es: "la casa della nonna" →
 * porta, letto, finestra, armadio).
 */

const STORIE_FAMOSE = {
  cappuccetto_rosso: { name: 'Cappuccetto Rosso', scenes: 12, expandable: true },
  tre_porcellini:    { name: 'I Tre Porcellini',  scenes: 10, expandable: true },
  pinocchio:         { name: 'Pinocchio',          scenes: 15, expandable: true },
  alice:             { name: 'Alice nel Paese delle Meraviglie', scenes: 14, expandable: true },
};


// ═══════════════════════════════════════════════════════════════
//  6. STRATEGIA: CASA MIA
// ═══════════════════════════════════════════════════════════════

/**
 * QUANDO: 31+ keyword (preferenziale), oppure scelta dall'utente.
 *
 * L'app NON conosce la casa dell'utente.
 * Fa 3 domande per costruire il percorso personalizzato.
 *
 * DOMANDA 1:
 * "Quanti locali ha la tua casa o appartamento?
 *  (es: ingresso, cucina, soggiorno, corridoio, bagno,
 *   camera da letto, studio...)"
 * → L'utente elenca i locali in ordine di percorrenza
 *   partendo dalla porta d'ingresso.
 *
 * DOMANDA 2 (per ogni locale):
 * "Nel [LOCALE], quali sono i 3-5 oggetti più grandi o
 *  caratteristici che vedi appena entri?
 *  Elencali nell'ordine in cui li vedi girando lo sguardo
 *  da sinistra a destra."
 * → L'utente elenca gli oggetti.
 *
 * DOMANDA 3:
 * "C'è un giardino, balcone, cantina o garage?
 *  Se sì, aggiungili in fondo al percorso."
 *
 * RISULTATO:
 * L'app costruisce un percorso ordinato di stazioni:
 * [locale1_oggetto1, locale1_oggetto2, ... locale2_oggetto1, ...]
 *
 * Ogni stazione diventa un punto di ancoraggio PAV.
 *
 * REGOLE PAV PER LA CASA:
 *  - L'immagine PAV deve interagire con l'oggetto specifico
 *  - Usare posizione, dimensione, materiale dell'oggetto
 *  - Es: keyword su "divano" → immagine che si siede, affonda,
 *    rimbalza o rompe il divano in modo esagerato
 *
 * STIMA STAZIONI:
 *  5 locali × 4 oggetti = 20 stazioni base
 *  8 locali × 5 oggetti = 40 stazioni
 * 10 locali × 5 oggetti = 50 stazioni
 */

const CASA_MIA = {
  questions: [
    {
      id: 'locali',
      text: 'Elenca i locali della tua casa nell\'ordine in cui li percorreresti partendo dalla porta d\'ingresso.',
      example: 'es: ingresso, cucina, soggiorno, corridoio, bagno, camera da letto',
      type: 'list'
    },
    {
      id: 'oggetti_per_locale',
      text: 'Per ogni locale, elenca i 3-5 oggetti più grandi o caratteristici che vedi appena entri, da sinistra a destra.',
      type: 'list_per_room',
      min: 3,
      max: 5
    },
    {
      id: 'spazi_extra',
      text: 'Hai balcone, giardino, cantina o garage? Se sì, aggiungili.',
      type: 'optional_list'
    }
  ],
  generationType: 'ai_generated_from_user_input',
};


// ═══════════════════════════════════════════════════════════════
//  7. GENERAZIONE PAV — REGOLE UNIVERSALI
// ═══════════════════════════════════════════════════════════════

/**
 * Queste regole si applicano a TUTTE le strategie.
 * Il PAV è sempre il meccanismo centrale.
 *
 * PAV = Parola → Azione → Visione
 *
 * REGOLE PER LA GENERAZIONE AI:
 *
 *  P — PAROLA
 *  La keyword viene trasformata in un oggetto o personaggio
 *  fisico e concreto. Se è astratta, si materializza:
 *  es: "REALIZZAZIONE" → un mattone d'oro appena fabbricato
 *  es: "COATTIVA"      → una mano gigante che stringe
 *  es: "DOMINANTE"     → un leone su un trono
 *
 *  A — AZIONE
 *  L'oggetto compie un'azione fisica, esagerata, dinamica.
 *  Mai statica. Deve essere un verbo d'azione vivido.
 *  es: sfonda, esplode, rotola, morde, schiaccia, vola, urla
 *
 *  V — VISIONE
 *  L'immagine finale deve essere:
 *  - Visivamente nitida (si deve "vedere" come un fotogramma)
 *  - Bizzarra o comica (il cervello ricorda l'insolito)
 *  - Collegata alla stazione (interagisce con essa)
 *  - Sensoriale se possibile (suono, odore, sensazione fisica)
 *
 * ESEMPIO COMPLETO:
 *  Keyword:   NEMINEM LAEDIT
 *  Stazione:  naso (corpo umano)
 *  PAV:       Un cavaliere medievale in armatura (P) galloppa
 *             sul tuo naso (A) senza toccare nulla, rimbalzando
 *             nell'aria come se fosse di gomma (V)
 *
 * PROMPT UNIVERSALE PER L'AI:
 * "Per ogni keyword nella lista, genera un'immagine PAV
 *  (Parola→Azione→Visione) da abbinare alla stazione indicata.
 *  L'immagine deve essere: concreta, bizzarra, fisicamente
 *  interattiva con la stazione, sensorialmente ricca.
 *  Formato output: keyword | stazione | immagine PAV (1-2 frasi)"
 */

const PAV_RULES = {
  concreta:     true,  // niente astrazioni
  bizzarra:     true,  // più è assurda, meglio
  dinamica:     true,  // sempre un'azione fisica
  sensoriale:   true,  // suono, tatto, odore se possibile
  interattiva:  true,  // deve toccare/modificare la stazione
  maxLength:    2,     // massimo 2 frasi per immagine PAV
};


// ═══════════════════════════════════════════════════════════════
//  8. FLUSSO COMPLETO NELL'APP
// ═══════════════════════════════════════════════════════════════

/**
 * STEP 1 — Fine generazione mappa
 *   → Conta keyword totali
 *   → Calcola strategia suggerita
 *
 * STEP 2 — Mostra messaggio all'utente
 *   → "Ho estratto N keyword. Quale contenitore vuoi usare?"
 *   → Mostra opzioni (con quella suggerita evidenziata)
 *
 * STEP 3a — Se sceglie STORIA o CORPO o STORIA FAMOSA
 *   → (Se storia famosa: chiedi quale storia)
 *   → Genera immagini PAV automaticamente
 *   → Mostra la lista: keyword | stazione | immagine PAV
 *
 * STEP 3b — Se sceglie CASA MIA
 *   → Avvia flusso domande (3 step)
 *   → Costruisce percorso personalizzato
 *   → Genera immagini PAV sulle stazioni della casa
 *   → Mostra la lista: keyword | stanza/oggetto | immagine PAV
 *
 * STEP 4 — Ripasso guidato
 *   → L'app mostra keyword una alla volta
 *   → L'utente deve ricordare l'immagine PAV
 *   → Feedback: ricordato / non ricordato
 *   → Algoritmo di ripasso (spaced repetition)
 *
 * STEP 5 — Test finale
 *   → Mostra solo la stazione
 *   → L'utente deve ricordare la keyword corrispondente
 */

const APP_FLOW = {
  steps: ['conta_keyword','suggerisci_strategia','scelta_utente',
          'raccolta_dati','genera_pav','ripasso','test_finale'],
  spacedRepetition: true,
  pavFeedback: true,
};


module.exports = {
  STRATEGY_RULES,
  suggestStrategy,
  STORIA_DIRETTA,
  CORPO_UMANO,
  STORIE_FAMOSE,
  CASA_MIA,
  PAV_RULES,
  APP_FLOW,
};
