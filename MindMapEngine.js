/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║          MIND MAP ENGINE — Metodo Eureka                     ║
 * ║          Motore riutilizzabile per tutte le mappe mentali    ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * REGOLE IMPLEMENTATE:
 *  1. Lettura oraria da ore 1 (60°)
 *  2. Foglio diviso in spicchi uguali: 360° / n rami primari
 *  3. Max 3 livelli (4 rarissimi)
 *  4. Rami curvi bezier, spessore decrescente per livello
 *  5. Testo scritto SOPRA il ramo, ruotato, con halo bianco
 *  6. Rami secondari: ventaglio ±45° nello spicchio
 *  7. Rami terziari: ventaglio ±20° dal secondario genitore
 *  8. Rami partono dal bordo dell'ellisse centrale
 *  9. Nodo centrale disegnato per ULTIMO (sopra tutto)
 * 10. Badge START sul primo ramo primario
 * 11. Linee tratteggiate ai confini degli spicchi
 * 12. Nota finale: completare con visual creativi sopra le keyword
 *
 * ─────────────────────────────────────────────────────────────
 * UTILIZZO:
 *
 *   const engine = new MindMapEngine(containerElement, data, options);
 *   engine.render();
 *
 * DATA FORMAT:
 *   {
 *     center: { label: 'TITOLO\nSOTTOTITOLO', icon: 'scales'|'book'|'none' },
 *     branches: [
 *       {
 *         label: 'PRIMARIA',
 *         color: '#1A5276',
 *         children: [
 *           {
 *             label: 'SECONDARIA',
 *             children: [
 *               { label: 'TERZIARIA' }
 *             ]
 *           }
 *         ]
 *       }
 *     ]
 *   }
 */

class MindMapEngine {

  // ─── DEFAULTS ───────────────────────────────────────────────
  static DEFAULTS = {
    width:       1300,
    height:      1300,
    background:  '#FEFCF0',
    startAngle:  60,          // ore 1 = 60° in math convention
    radii:       [0, 210, 410, 580],
    strokeWidths:[0,   9,   5,  2.8],
    fontSizes:   [0,  16,  12, 10.5],
    ellipseRX:   95,
    ellipseRY:   65,
    centerFill:  '#2C0246',
    centerStroke:'#7D3C98',
    sliceFan:    45,          // ±deg per secondari nello spicchio
    leafFan:     20,          // ±deg per terziari
    labelOffset: 0.62,        // posizione label sul ramo (0=start, 1=end)
    haloWidth:   6,
    startColor:  '#F0A500',
  };

  constructor(container, data, opts = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    this.data = data;
    this.cfg  = { ...MindMapEngine.DEFAULTS, ...opts };
    this.NS   = 'http://www.w3.org/2000/svg';
    this._nodes = [];
    this._nodeMap = {};
  }

  // ─── PUBLIC ──────────────────────────────────────────────────
  render() {
    this.container.innerHTML = '';
    this.svg = this._el('svg', {
      viewBox: `0 0 ${this.cfg.width} ${this.cfg.height}`,
      xmlns:   this.NS,
      style:   'width:100%;height:auto;display:block;'
    });
    this.container.appendChild(this.svg);
    this.CX = this.cfg.width  / 2;
    this.CY = this.cfg.height / 2;

    this._buildNodes();
    this._drawBackground();
    this._drawSliceDividers();
    this._drawGuideRings();
    this._drawAllBranches();
    this._drawCenterNode();
    this._drawStartBadge();
    return this;
  }

  // ─── NODE BUILDER ────────────────────────────────────────────
  _buildNodes() {
    this._nodes   = [];
    this._nodeMap = {};
    const branches = this.data.branches;
    const n        = branches.length;
    const slice    = 360 / n;
    const start    = this.cfg.startAngle;

    branches.forEach((b, i) => {
      // Primary angle: start clockwise → subtract i*slice
      const angle = start - i * slice;
      const node  = this._addNode(null, b.label, angle, b.color, 1, null);
      node.isFirst = (i === 0);

      // Secondaries — fan within ±sliceFan of primary
      if (b.children?.length) {
        const secAngles = this._fanAngles(angle, b.children.length, this.cfg.sliceFan);
        b.children.forEach((c, j) => {
          const secNode = this._addNode(node.id, c.label, secAngles[j],
            c.color || this._lightenColor(b.color), 2, node.id);

          // Tertiaries — fan within ±leafFan of secondary
          if (c.children?.length) {
            const terAngles = this._fanAngles(secAngles[j], c.children.length, this.cfg.leafFan);
            c.children.forEach((t, k) => {
              this._addNode(secNode.id, t.label, terAngles[k],
                t.color || this._lightenColor(b.color, 2), 3, secNode.id);
            });
          }
        });
      }
    });
  }

  _addNode(parentId, label, angle, color, lv, pid) {
    const id  = `n_${this._nodes.length}`;
    const r   = this.cfg.radii[lv];
    const pos = this._pt(r, angle);
    const node = { id, label, angle, color, lv, parentId: pid, x: pos.x, y: pos.y };
    this._nodes.push(node);
    this._nodeMap[id] = node;
    return node;
  }

  // ─── DRAW: BACKGROUND ────────────────────────────────────────
  _drawBackground() {
    this._el('rect', {
      width:  this.cfg.width,
      height: this.cfg.height,
      fill:   this.cfg.background
    });
  }

  // ─── DRAW: SLICE DIVIDERS ────────────────────────────────────
  _drawSliceDividers() {
    const n     = this.data.branches.length;
    const slice = 360 / n;
    const start = this.cfg.startAngle;
    const far   = this.cfg.radii[3] + 90;

    for (let i = 0; i < n; i++) {
      const boundAngle = start - i * slice + slice / 2;
      const p = this._pt(far, boundAngle);
      this._el('line', {
        x1: this.CX, y1: this.CY,
        x2: p.x.toFixed(1), y2: p.y.toFixed(1),
        stroke: '#ccc', 'stroke-width': '1',
        'stroke-dasharray': '8,6', opacity: '0.5'
      });
    }
  }

  // ─── DRAW: GUIDE RINGS ───────────────────────────────────────
  _drawGuideRings() {
    for (let lv = 1; lv <= 3; lv++) {
      this._el('circle', {
        cx: this.CX, cy: this.CY, r: this.cfg.radii[lv],
        fill: 'none', stroke: '#ddd',
        'stroke-width': '0.9', 'stroke-dasharray': '6,5'
      });
    }
  }

  // ─── DRAW: ALL BRANCHES ──────────────────────────────────────
  _drawAllBranches() {
    // Draw from outermost inward so thicker branches render on top
    [3, 2, 1].forEach(lv => {
      this._nodes
        .filter(n => n.lv === lv)
        .forEach(n => {
          let x1, y1;
          if (lv === 1) {
            // Start from ellipse edge
            const ep = this._ellipsePt(n.angle);
            x1 = ep.x; y1 = ep.y;
          } else {
            const parent = this._nodeMap[n.parentId];
            x1 = parent.x; y1 = parent.y;
          }
          this._drawBranch(x1, y1, n.x, n.y, n.color, this.cfg.strokeWidths[lv]);
          this._drawLabel(x1, y1, n.x, n.y, n.label, n.color, this.cfg.fontSizes[lv]);
        });
    });
  }

  // ─── DRAW: BRANCH CURVE ──────────────────────────────────────
  _drawBranch(x1, y1, x2, y2, color, sw) {
    const c = this._qCtrl(x1, y1, x2, y2);
    this._el('path', {
      d: `M${x1.toFixed(1)},${y1.toFixed(1)} Q${c.cx.toFixed(1)},${c.cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`,
      stroke: color, 'stroke-width': sw,
      fill: 'none', 'stroke-linecap': 'round'
    });
  }

  // ─── DRAW: LABEL ON BRANCH ───────────────────────────────────
  _drawLabel(x1, y1, x2, y2, label, color, fs) {
    const m = this._bezPt(x1, y1, x2, y2, this.cfg.labelOffset);
    let   a = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    if (a > 90 || a < -90) a += 180;

    const g = this._el('g', {
      transform: `translate(${m.x.toFixed(1)},${m.y.toFixed(1)}) rotate(${a.toFixed(1)})`
    });

    // Halo (white outline)
    this._txt(label, {
      x: '0', y: '0', dy: '-7', 'text-anchor': 'middle',
      'font-family': "'Trebuchet MS', Arial, sans-serif",
      'font-size': fs, 'font-weight': 'bold',
      fill: 'none', stroke: this.cfg.background,
      'stroke-width': this.cfg.haloWidth, 'stroke-linejoin': 'round',
      'letter-spacing': '0.8'
    }, g);

    // Actual text
    this._txt(label, {
      x: '0', y: '0', dy: '-7', 'text-anchor': 'middle',
      'font-family': "'Trebuchet MS', Arial, sans-serif",
      'font-size': fs, 'font-weight': 'bold',
      fill: color, 'letter-spacing': '0.8'
    }, g);
  }

  // ─── DRAW: CENTER NODE ───────────────────────────────────────
  _drawCenterNode() {
    const { CX: cx, CY: cy } = this;
    const rx = this.cfg.ellipseRX, ry = this.cfg.ellipseRY;

    // Glow
    this._el('ellipse', { cx, cy, rx: rx + 5, ry: ry + 5,
      fill: this.cfg.centerFill, opacity: '0.18' });
    // Body
    this._el('ellipse', { cx, cy, rx, ry,
      fill: this.cfg.centerFill, stroke: this.cfg.centerStroke, 'stroke-width': '3' });
    // Inner ring
    this._el('ellipse', { cx, cy, rx: rx - 9, ry: ry - 9,
      fill: 'none', stroke: '#9B59B6', 'stroke-width': '1.1', opacity: '0.4' });

    // Icon
    const icon = this.data.center.icon || 'book';
    this._drawIcon(icon, cx, cy);

    // Labels
    const lines = (this.data.center.label || '').split('\n');
    const startY = cy + 8 + (lines.length - 1) * -9;
    lines.forEach((line, i) => {
      this._txt(line, {
        x: cx, y: startY + i * 18,
        'text-anchor': 'middle',
        'font-family': "'Trebuchet MS', Arial, sans-serif",
        'font-size': '13', 'font-weight': 'bold',
        fill: 'white', 'letter-spacing': '2.5'
      });
    });
  }

  _drawIcon(type, cx, cy) {
    if (type === 'scales') {
      this._el('line', { x1: cx, y1: cy-42, x2: cx, y2: cy+2, stroke:'#D7BDE2','stroke-width':'2' });
      this._el('line', { x1: cx-30, y1: cy-27, x2: cx+30, y2: cy-27, stroke:'#D7BDE2','stroke-width':'2' });
      this._el('path', { d:`M${cx-30},${cy-27} l-11,17 l22,0 Z`, fill:'none', stroke:'#D7BDE2','stroke-width':'1.5' });
      this._el('path', { d:`M${cx+30},${cy-27} l-11,17 l22,0 Z`, fill:'none', stroke:'#D7BDE2','stroke-width':'1.5' });
    } else if (type === 'book') {
      this._el('rect', { x: cx-18, y: cy-40, width: 36, height: 28, rx: 3,
        fill: 'none', stroke: '#D7BDE2', 'stroke-width': '1.8' });
      this._el('line', { x1: cx, y1: cy-40, x2: cx, y2: cy-12, stroke:'#D7BDE2','stroke-width':'1.2' });
      [cy-33, cy-26, cy-20].forEach(y => {
        this._el('line', { x1: cx-14, y1: y, x2: cx-3, y2: y, stroke:'#D7BDE2','stroke-width':'0.9' });
        this._el('line', { x1: cx+3,  y1: y, x2: cx+14,y2: y, stroke:'#D7BDE2','stroke-width':'0.9' });
      });
    } else if (type === 'brain') {
      this._el('ellipse', { cx: cx-8, cy: cy-28, rx: 12, ry: 10,
        fill: 'none', stroke: '#D7BDE2', 'stroke-width': '1.5' });
      this._el('ellipse', { cx: cx+8, cy: cy-28, rx: 12, ry: 10,
        fill: 'none', stroke: '#D7BDE2', 'stroke-width': '1.5' });
      this._el('line', { x1: cx, y1: cy-38, x2: cx, y2: cy-18, stroke:'#D7BDE2','stroke-width':'1.2' });
    }
    // 'none' → no icon
  }

  // ─── DRAW: START BADGE ───────────────────────────────────────
  _drawStartBadge() {
    const firstNode = this._nodes.find(n => n.lv === 1 && n.isFirst);
    if (!firstNode) return;
    // Position badge: midpoint between ellipse edge and R1 node, slightly offset
    const ep     = this._ellipsePt(firstNode.angle);
    const midPt  = this._bezPt(ep.x, ep.y, firstNode.x, firstNode.y, 0.35);
    const offset = this._pt(28, firstNode.angle + 28); // offset perpendicular-ish
    const bx = offset.x + (midPt.x - this.CX) * 0.1;
    const by = offset.y + (midPt.y - this.CY) * 0.1;

    this._el('circle', { cx: bx.toFixed(1), cy: by.toFixed(1), r: '24',
      fill: this.cfg.startColor, opacity: '0.92' });
    this._txt('START', {
      x: bx.toFixed(1), y: (by - 5).toFixed(1),
      'text-anchor': 'middle',
      'font-family': "'Trebuchet MS', Arial, sans-serif",
      'font-size': '11', 'font-weight': 'bold',
      fill: 'white', 'letter-spacing': '1.2'
    });
    this._txt('►', {
      x: bx.toFixed(1), y: (by + 10).toFixed(1),
      'text-anchor': 'middle', 'font-size': '11', fill: 'white'
    });
  }

  // ─── GEOMETRY HELPERS ────────────────────────────────────────
  _pt(r, deg) {
    const rad = deg * Math.PI / 180;
    return { x: this.CX + r * Math.cos(rad), y: this.CY - r * Math.sin(rad) };
  }
  _ellipsePt(deg) {
    const rad = deg * Math.PI / 180;
    return {
      x: this.CX + this.cfg.ellipseRX * Math.cos(rad),
      y: this.CY - this.cfg.ellipseRY * Math.sin(rad)
    };
  }
  _qCtrl(x1, y1, x2, y2) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = this.CX - mx,  dy = this.CY - my;
    return { cx: mx + dx * 0.2, cy: my + dy * 0.2 };
  }
  _bezPt(x1, y1, x2, y2, t) {
    const { cx, cy } = this._qCtrl(x1, y1, x2, y2);
    return {
      x: (1-t)*(1-t)*x1 + 2*(1-t)*t*cx + t*t*x2,
      y: (1-t)*(1-t)*y1 + 2*(1-t)*t*cy + t*t*y2
    };
  }
  _fanAngles(center, n, spread) {
    if (n === 1) return [center];
    return Array.from({ length: n }, (_, i) =>
      center + spread - i * (2 * spread / (n - 1))
    );
  }
  _lightenColor(hex, level = 1) {
    // Simple: return same color — app can override with palette
    return hex;
  }

  // ─── SVG HELPERS ─────────────────────────────────────────────
  _el(tag, attrs, parent) {
    const e = document.createElementNS(this.NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
    (parent || this.svg).appendChild(e);
    return e;
  }
  _txt(str, attrs, parent) {
    const e = this._el('text', attrs, parent);
    e.textContent = str;
    return e;
  }
}


// ═══════════════════════════════════════════════════════════════
//  DEMO — Mappa "Diritto Soggettivo" (18 keyword)
// ═══════════════════════════════════════════════════════════════
const DEMO_DATA = {
  center: {
    label: 'DIRITTO\nSOGGETTIVO',
    icon: 'scales'
  },
  branches: [
    {
      label: 'ESERCIZIO',
      color: '#1A5276',
      children: [
        { label: 'REALIZZAZIONE', color: '#2471A3' },
        { label: 'DIFFERENZA',    color: '#2471A3' },
        { label: 'COATTIVA',      color: '#2471A3' },
        { label: 'NEMINEM LAEDIT',color: '#2471A3' },
      ]
    },
    {
      label: 'ABUSO',
      color: '#922B21',
      children: [
        { label: 'BUONA FEDE',    color: '#CB4335' },
        { label: 'EXCEPTIO DOLI', color: '#CB4335' },
        { label: 'DIPENDENZA',    color: '#CB4335' },
        { label: 'DOMINANTE',     color: '#CB4335' },
      ]
    },
    {
      label: 'CATEGORIE',
      color: '#1D6A39',
      children: [
        {
          label: 'ASSOLUTI', color: '#1E8449',
          children: [
            { label: 'REALI',       color: '#239B56' },
            { label: 'PERSONALITÀ', color: '#239B56' },
            { label: 'DOVERE',      color: '#239B56' },
          ]
        },
        {
          label: 'RELATIVI', color: '#1E8449',
          children: [
            { label: 'OBBLIGO',     color: '#239B56' },
          ]
        },
        {
          label: 'POTESTATIVI', color: '#1E8449',
          children: [
            { label: 'SOGGEZIONE',  color: '#239B56' },
          ]
        },
      ]
    },
  ]
};
