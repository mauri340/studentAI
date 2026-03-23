# Student AI — Metodo Eureka App

Sistema AI per l'apprendimento rapido basato sul Metodo Eureka.

## Struttura

```
/engines
  ├── MindMapEngine.js          → Genera mappe mentali SVG (regole Metodo Eureka)
  └── PAVEngine.js              → Logica memorizzazione PAV completa

/rules
  └── MemorizationEngine_rules.js → Regole sistema memorizzazione

/demo
  ├── MindMapEngine_demo.html   → Demo mappa mentale interattiva
  └── PAV_Engine_v3.html        → Demo memorizzazione PAV interattiva

APP_ARCHITETTURA.js             → Indice, pipeline completa, guida integrazione
```

## Pipeline

```
INPUT TESTO → ESTRAZIONE KEYWORD → MAPPA MENTALE → MEMORIZZAZIONE PAV → RIPASSO E TEST
```

## Utilizzo MindMapEngine

```javascript
const engine = new MindMapEngine('#container', {
  center: { label: 'TITOLO\nSOTTOTITOLO', icon: 'book' },
  branches: [
    {
      label: 'PRIMARIA', color: '#1A5276',
      children: [
        { label: 'SECONDARIA', color: '#2471A3' }
      ]
    }
  ]
});
engine.render();
```

## Utilizzo PAVEngine

```javascript
// Seleziona strategia in base al numero di keyword
const strategy = selectStrategy(18);

// Costruisce prompt per Claude API
const prompt = buildPavPrompt(keywords, stations, strategy);

// Assegna stazioni corporee alle keyword
const zones = buildBodyZones(branches);
```

## Regole PAV

1. Classifica keyword: **concreta** (usa direttamente) vs **astratta** (trasforma)
2. Tecnica unica per keyword: **FONETICA** o **SIGNIFICATO** — mai mescolare
3. Ordine fonetico obbligatorio: le parti appaiono nella storia nell'ordine della parola
4. **PAV** = **P**aradossale · **A**zione · **V**ivido

## Tecnologie

- Vanilla JavaScript (no dipendenze)
- SVG per le mappe mentali
- Claude API (claude-sonnet-4-20250514) per estrazione keyword e generazione PAV
