/* ARTINOS Slider — portable continuous instrument.
 *
 * copy → paste → import → use.
 * Requires React 17+ (hooks). ReactDOM is optional: when present the precision HUD
 * portals to <body> so it escapes clipped / blurred panels.
 *
 * In a module project, replace the IIFE wrapper with:
 *   import React, { useRef, useState, useEffect, useLayoutEffect, memo } from 'react';
 *   import ReactDOM from 'react-dom';
 *   export { ArtinosSlider, RollingValue, formatValue };
 *
 * Theming: reads ARTINOS role tokens (--bg-well, --text-*, --sig-live, --e0-well,
 * --focus-ring) when present and falls back to literals. Override any --as-* var on
 * an ancestor to restyle without touching this file.
 *
 * Materials: optical · frost · clear · smoked · metal · soft · reference   (material prop; material + stepped variants)
 * Family:   ArtinosSwitch · ArtinosToggleGroup · ArtinosSegmented · ArtinosColor · ArtinosSelect
 * Variants: material · stepped · gradient · ruler · curve · wave
 * Layouts:  integrated (label inside the capsule) · paired (label outside)
 */
(function () {
  const { useRef, useState, useEffect, useLayoutEffect, memo } = React;
  const RD = typeof ReactDOM !== 'undefined' ? ReactDOM : null;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const EASE = 'cubic-bezier(.2,.7,.2,1)';
  const EXIT = 'cubic-bezier(.4,0,1,1)';
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const C = {
    trough: 'var(--as-trough, var(--bg-well, rgba(0,0,0,.34)))',
    well: 'var(--as-well, var(--e0-well, inset 0 1px 2px rgba(0,0,0,.6), inset 0 0 0 1px rgba(255,255,255,.06)))',
    rim: 'var(--as-rim, 0 0 0 1px rgba(255,255,255,.07), 0 1px 0 rgba(255,255,255,.06))',
    ink: 'var(--as-ink, var(--text-mid, #bfbfbf))',
    inkHi: 'var(--as-ink-hi, var(--text-hi, #f4f4f4))',
    inkLow: 'var(--as-ink-low, var(--text-faint, #686868))',
    tick: 'var(--as-tick, var(--tick, rgba(255,255,255,.2)))',
    tickMajor: 'var(--as-tick-major, var(--text-low, #919191))',
    insert: 'var(--as-insert, linear-gradient(180deg, rgba(240,238,234,.95) 0%, rgba(216,213,207,.92) 52%, rgba(198,194,188,.9) 100%))',
    insertInk: 'var(--as-insert-ink, #161616)',
    insertShadow: 'var(--as-insert-shadow, inset 0 1px 0 rgba(255,255,255,.8), inset 0 -1px 0 rgba(0,0,0,.12), 0 1px 2px rgba(0,0,0,.38), 0 0 0 .5px rgba(0,0,0,.28))',
    cell: 'var(--as-cell, rgba(255,255,255,.035))',
    signal: 'var(--as-signal, var(--sig-live, #2fb39c))',
    signalHi: 'var(--as-signal-hi, var(--sig-live-hi, #7fe3d4))',
    signalLine: 'var(--as-signal-line, var(--sig-live-line, rgba(47,179,156,.5)))',
    focus: 'var(--as-focus, var(--focus-ring, 0 0 0 1px #7fe3d4, 0 0 0 3px rgba(127,227,212,.16)))',
    mono: "var(--as-mono, 'Chivo Mono', ui-monospace, SFMono-Regular, monospace)",
  };

  const GLASS = {
    trough: 'var(--as-glass-trough, color-mix(in srgb, var(--bg-app, #090909) 34%, transparent))',
    well: 'var(--as-glass-well, inset 0 1px 3px rgba(0,0,0,.5), inset 0 0 0 1px rgba(255,255,255,.07), 0 1px 0 rgba(255,255,255,.07))',
    troughBackdrop: 'blur(18px) saturate(1.1)',
    baseInk: 'var(--as-glass-ink, color-mix(in srgb, var(--text-hi, #f4f4f4) 88%, transparent))', baseInkHi: 'var(--text-hi, #f4f4f4)',
    baseShadow: '0 1px 2px color-mix(in srgb, var(--bg-app, #090909) 70%, transparent)',
    textShadow: '0 1px 2px color-mix(in srgb, var(--bg-app, #090909) 60%, transparent)',
    lw: 500, vw: 500, radius: 8, inset: 2, insertRadius: 6,
  };

  /* ---------- insert materials ----------
     optical  polished translucent insert, dark ink (the canonical ARTINOS look)
     frost    frosted glass: milky, blurred, grain-broken; light ink on dark themes
     clear    clear glass: almost no body, all edge — highlight rim and refraction line */
  const MATS = {
    optical: {
      insert: C.insert, shadow: C.insertShadow, ink: C.insertInk, unitInk: 'rgba(0,0,0,.5)',
      seam: 'rgba(0,0,0,.44)', seamHover: 'rgba(0,0,0,.66)', seamEdge: '1px 0 0 rgba(255,255,255,.5)', backdrop: 'none',
    },
    /* Glass family shares one well: a theme-aware dark (or light) recess so text on
       the trough keeps ≥4.5:1 over any canvas, and a halo text-shadow that follows the
       app ground (dark halo on graphite, light halo on paper). */
    frost: {
      ...GLASS,
      insert: 'var(--as-frost-grain, var(--frost-grain, linear-gradient(transparent, transparent))), var(--as-frost-insert, linear-gradient(180deg, rgba(255,255,255,.7) 0%, rgba(246,247,248,.5) 48%, rgba(236,238,240,.44) 52%, rgba(255,255,255,.58) 100%))',
      shadow: 'var(--as-frost-shadow, inset 0 1px 0 rgba(255,255,255,.95), inset 0 -1px 0 rgba(0,0,0,.05), inset 0 0 0 .5px rgba(255,255,255,.6), 0 1px 3px rgba(0,0,0,.26), 0 0 0 .5px rgba(0,0,0,.16))',
      ink: '#141414', unitInk: 'rgba(20,20,20,.58)', textShadow: '0 .5px 0 rgba(255,255,255,.55)',
      seam: 'rgba(0,0,0,.46)', seamHover: 'rgba(0,0,0,.72)', seamEdge: '1px 0 0 rgba(255,255,255,.7)',
      backdrop: 'blur(16px) saturate(1.25) brightness(1.1)',
    },
    clear: {
      ...GLASS,
      insert: 'var(--as-clear-insert, linear-gradient(180deg, rgba(255,255,255,.34) 0%, rgba(255,255,255,.13) 38%, rgba(255,255,255,.06) 60%, rgba(255,255,255,.08) 82%, rgba(255,255,255,.18) 100%))',
      shadow: 'var(--as-clear-shadow, inset 0 1px 0 rgba(255,255,255,.8), inset 0 -1px 0 rgba(255,255,255,.22), inset 1px 0 0 rgba(255,255,255,.26), inset -1px 0 0 rgba(255,255,255,.26), inset 0 2px 5px -2px rgba(255,255,255,.28), 0 1px 2px rgba(0,0,0,.38), 0 0 0 .5px rgba(0,0,0,.3))',
      ink: 'var(--as-clear-ink, var(--text-hi, #f4f4f4))', unitInk: 'var(--as-clear-unit, var(--text-mid, #bfbfbf))',
      seam: 'var(--as-clear-seam, color-mix(in srgb, var(--text-hi, #f4f4f4) 82%, transparent))', seamHover: 'var(--as-clear-seam-hover, var(--text-hi, #f4f4f4))', seamEdge: '0 0 0 .5px rgba(0,0,0,.3)',
      backdrop: 'blur(1.5px) saturate(1.7) brightness(1.2) contrast(1.06)',
    },
  };

  /* Reference family — the ARTINOS Figma source, recreated literally: recessed
     blurred well (inset 0 4 4 .43), 2px #C3C3C3-rimmed polished bar, double-line
     handle with a -1/-1/3 drop shadow, Roboto Mono 700. */
  const REF_BAR = 'linear-gradient(181.66deg, rgba(212,212,212,.99) 1.18%, rgba(237,237,237,.99) 18.25%, rgba(204,202,202,.7326) 43.84%, rgba(255,255,255,.7326) 91.43%)';
  const REF_COMMON = {
    font: "'Roboto Mono', var(--as-mono, 'Chivo Mono', ui-monospace, monospace)", lw: 700, vw: 700, ls: '0', upSize: true,
    trough: 'rgba(0,0,0,.01)', well: 'inset 0 4px 4px rgba(0,0,0,.43)', troughBackdrop: 'blur(30px)', inset: 1, radius: 7, insertRadius: 6,
    seamKind: 'double', seamDrop: 'drop-shadow(-1px -1px 3px rgba(0,0,0,.39))', seamActive: '#1ADFB8', seamEdge: 'none', backdrop: 'none',
    baseInk: '#BBBCC4', baseInkHi: '#E6E7EC',
    cell: 'linear-gradient(181.66deg, rgba(194,194,194,.2871) 1.18%, rgba(237,237,237,.1485) 18.25%, rgba(204,202,202,.0198) 43.84%, rgba(31,31,31,.2178) 91.43%)',
    cellShadow: 'inset 0 0 0 1px rgba(184,184,184,.3), inset 0 6px 11.3px rgba(0,0,0,.31)',
    cellInsertShadow: 'inset 0 0 0 1px #C3C3C3, inset 0 6px 11.3px rgba(0,0,0,.31)', cellRadius: 5,
    gradWell: 'inset 0 4px 4px rgba(0,0,0,.43)', gradSeam: '#262626', darkInk: '#222222', lightInk: '#D7D7D7', rulerInk: '#BBBCC4',
    gradients: {
      temperature: [[0, '#002F8E'], [0.1154, '#1979A5'], [0.2837, '#6BCFF1'], [0.4904, '#EDF7FF'], [0.6923, '#FDC94F'], [0.8413, '#FF7600'], [1, '#FF1500']],
      hue: [[0, '#FF1500'], [0.1587, '#FF7600'], [0.3077, '#FDC94F'], [0.4423, '#30D952'], [0.6106, '#1979A5'], [0.7788, '#002F8E'], [1, '#9917BA']],
      saturate: [[0, '#5A5A5A'], [1, '#00FF91']],
      exposure: [[0, '#000000'], [0.5481, '#6E6E6E'], [0.9856, '#FFFFFF'], [1, '#FFFFFF']],
    },
  };
  Object.assign(MATS, {
    smoked: {
      ...GLASS,
      insert: 'var(--as-smoked-insert, linear-gradient(180deg, rgba(62,62,66,.74) 0%, rgba(22,22,24,.7) 50%, rgba(12,12,14,.72) 52%, rgba(38,38,42,.72) 100%))',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.3), inset 0 0 0 1px rgba(255,255,255,.12), inset 0 -1px 0 rgba(0,0,0,.45), 0 1px 3px rgba(0,0,0,.5)',
      ink: '#FFFFFF', unitInk: 'rgba(255,255,255,.62)', textShadow: '0 1px 1px rgba(0,0,0,.6)', seam: 'rgba(255,255,255,.6)', seamHover: 'rgba(255,255,255,.9)', seamEdge: '1px 0 0 rgba(0,0,0,.45)',
      backdrop: 'blur(8px) saturate(1.1) brightness(.78)',
    },
    metal: {
      insert: 'repeating-linear-gradient(90deg, rgba(255,255,255,.06) 0 1px, rgba(0,0,0,.035) 1px 2px), linear-gradient(180deg, #E6E7E9 0%, #BDBFC2 46%, #9C9EA2 54%, #CFD1D4 100%)',
      shadow: 'inset 0 1px 0 rgba(255,255,255,.9), inset 0 -1px 0 rgba(0,0,0,.25), inset 0 0 0 .5px rgba(0,0,0,.3), 0 1px 2px rgba(0,0,0,.45)',
      ink: '#141414', unitInk: 'rgba(0,0,0,.55)', seam: 'rgba(0,0,0,.55)', seamHover: 'rgba(0,0,0,.8)', seamEdge: '1px 0 0 rgba(255,255,255,.65)', backdrop: 'none',
    },
    soft: {
      ...REF_COMMON, insert: REF_BAR, blend: 'soft-light', shadow: 'inset 0 0 0 1px #C3C3C3',
      ink: '#BBBCC4', unitInk: '#BBBCC4', textShadow: '1px 1px 0 rgba(51,51,51,.78)',
      seam: '#BBBCC4', seamHover: '#E6E7EC',
    },
    reference: {
      ...REF_COMMON, insert: REF_BAR, shadow: 'inset 0 0 0 2px #C3C3C3, inset 0 6px 11.3px rgba(0,0,0,.31)',
      ink: '#222222', unitInk: 'rgba(34,34,34,.7)', seam: '#262626', seamHover: '#0E0E0E',
    },
  });

  /* ---------- mapping: semantic value stays exact, only geometry changes ---------- */
  const MAPS = {
    linear: { to: (v, a, b) => (v - a) / (b - a), from: (t, a, b) => a + t * (b - a) },
    log: { to: (v, a, b) => Math.log(v / a) / Math.log(b / a), from: (t, a, b) => a * Math.pow(b / a, t) },
    exp: { to: (v, a, b) => Math.sqrt(Math.max(0, (v - a) / (b - a))), from: (t, a, b) => a + (b - a) * t * t },
    power: { to: (v, a, b) => Math.cbrt((v - a) / (b - a)), from: (t, a, b) => a + (b - a) * t * t * t },
  };
  const DENSITY = { dense: 24, standard: 26, comfort: 30 };
  const TYPE = { dense: [9.5, 11], standard: [10, 11.5], comfort: [10.5, 12.5] };

  /* ---------- colour helpers (gradient tracks + swatch) ---------- */
  const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const toHex = a => '#' + a.map(x => Math.round(x).toString(16).padStart(2, '0')).join('').toUpperCase();
  function hslHex(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return toHex([f(0) * 255, f(8) * 255, f(4) * 255]);
  }
  function sampleStops(stops, t) {
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        const [p0, c0] = stops[i - 1], [p1, c1] = stops[i], k = (t - p0) / ((p1 - p0) || 1);
        const a = hexRgb(c0), b = hexRgb(c1);
        return toHex(a.map((x, j) => x + (b[j] - x) * k));
      }
    }
    return stops[stops.length - 1][1].toUpperCase();
  }
  const lum = hex => {
    const [r, g, b] = hexRgb(hex).map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const inkOn = hex => (lum(hex) > 0.2 ? '#141414' : '#f4f4f4');

  const GRADIENTS = {
    temperature: { stops: [[0, '#3D6FE0'], [0.22, '#93B2EF'], [0.44, '#FFFFFF'], [0.7, '#FFE55C'], [1, '#FF5A2E']], describe: t => (t < 0.3 ? 'COOL' : t < 0.55 ? 'NEUTRAL' : t < 0.8 ? 'WARM' : 'HOT') },
    saturate: { stops: [[0, '#B9BCB9'], [0.55, '#A2E4A8'], [1, '#3FE0A0']] },
    exposure: { stops: [[0, '#3A3530'], [0.5, '#9A8F84'], [1, '#FFF8EE']] },
    hue: { stops: [0, 1, 2, 3, 4, 5, 6].map(i => [i / 6, hslHex(i * 60, 95, 55)]), sample: t => hslHex(t * 360, 95, 55), describe: (t, col) => col },
  };

  /* ---------- formatting belongs to the parameter ---------- */
  const minus = s => s.replace('-', '\u2212');
  function formatValue(v, format, decimals, extra, unit) {
    const d = decimals + (extra || 0);
    switch (format) {
      case 'percent': return { text: minus((v * 100).toFixed(d)), unit: '%' };
      case 'db': return v <= -96 ? { text: '\u2212\u221E', unit: 'dB' } : { text: minus(v.toFixed(d)), unit: 'dB' };
      case 'angle': return { text: minus(v.toFixed(d)), unit: '\u00B0' };
      case 'hz': return v >= 1000 ? { text: (v / 1000).toFixed((v >= 10000 ? 0 : 1) + (extra || 0)), unit: 'kHz' } : { text: v.toFixed(d), unit: 'Hz' };
      case 'time': return { text: v.toFixed(d), unit: 's' };
      default: return { text: minus(v.toFixed(d)), unit: unit || '' };
    }
  }
  const ratioLabel = r => (r >= 1 ? '1\u00D7' : r >= 0.1 ? '0.1\u00D7' : '0.01\u00D7');

  /* ---------- rolling readout: only changed digits move, direction-aware ---------- */
  /* Odometer drum. Every digit slot is a vertical strip 0-9 repeated three times,
     one text node. A change rolls the drum through the intermediate digits in the
     direction of change (up = increasing), ease-out quint, duration scaled by travel.
     An interrupted roll resumes from the drum's live position; on finish the strip
     re-normalises to the middle repeat so it never runs out. */
  const ROLL = 'cubic-bezier(.22,1,.36,1)';
  const MASK = 'linear-gradient(180deg, transparent 0%, #000 22%, #000 78%, transparent 100%)';
  const CELL = 1.3; // em — matches the readout line-height
  const STRIP = Array.from({ length: 30 }, (_, i) => i % 10).join('\n');
  const isDigit = c => c >= '0' && c <= '9';
  const offsetY = el => { const m = getComputedStyle(el).transform; if (!m || m === 'none') return 0; const v = m.match(/matrix.*\((.+)\)/); if (!v) return 0; const a = v[1].split(',').map(Number); return a.length === 6 ? a[5] : a[13] || 0; };
  const Slot = memo(function Slot({ ch, dir, dur, delay, grow }) {
    const host = useRef(null), strip = useRef(null), prev = useRef(ch), anim = useRef(null);
    const pos = useRef(isDigit(ch) ? +ch + 10 : 10);
    const place = i => { if (strip.current) strip.current.style.transform = `translateY(${-i * CELL}em)`; };
    const mask = on => { const h = host.current; if (!h) return; h.style.webkitMaskImage = on ? MASK : ''; h.style.maskImage = on ? MASK : ''; };
    useLayoutEffect(() => {
      if (grow && !reduced && host.current) host.current.animate([{ width: '0ch', opacity: 0, filter: 'blur(1px)' }, { width: '1ch', opacity: 1, filter: 'blur(0)' }], { duration: 260, easing: ROLL });
      return () => anim.current && anim.current.cancel();
    }, []);
    useLayoutEffect(() => {
      const p = prev.current; prev.current = ch;
      if (p === ch || !isDigit(ch)) return;
      const s = strip.current; if (!s) return;
      const target = +ch;
      if (!isDigit(p) || reduced || !dur) { if (anim.current) anim.current.cancel(); anim.current = null; mask(false); pos.current = target + 10; place(pos.current); return; }
      const H = host.current.getBoundingClientRect().height || 14;
      let cur = pos.current;
      if (anim.current) { cur = -offsetY(s) / H; anim.current.cancel(); anim.current = null; }
      const from = ((Math.round(pos.current) % 10) + 10) % 10;
      const delta = dir >= 0 ? (target - from + 10) % 10 : -((from - target + 10) % 10);
      let tgt = pos.current + delta;
      const shift = -10 * Math.floor(Math.min(cur, tgt) / 10);
      cur += shift; tgt += shift;
      pos.current = tgt;
      const travel = Math.abs(tgt - cur);
      const T = dur + Math.min(travel, 9) * (dur >= 200 ? 30 : 10);
      place(tgt);
      mask(true);
      const a = s.animate([
        { transform: `translateY(${-cur * CELL}em)`, filter: travel > 1.5 ? 'blur(.6px)' : 'blur(.25px)' },
        { transform: `translateY(${-tgt * CELL}em)`, filter: 'blur(0)' },
      ], { duration: T, delay, easing: ROLL, fill: 'backwards' });
      anim.current = a;
      a.onfinish = () => { if (anim.current !== a) return; anim.current = null; mask(false); pos.current = (((tgt % 10) + 10) % 10) + 10; place(pos.current); };
    }, [ch]);
    return (
      <span ref={host} style={{ position: 'relative', display: 'inline-block', width: '1ch', height: CELL + 'em', overflow: 'hidden', textAlign: 'center', verticalAlign: 'top' }}>
        {isDigit(ch) ? (
          <span ref={strip} aria-hidden="true" style={{ display: 'block', whiteSpace: 'pre', lineHeight: CELL + 'em', transform: `translateY(${-pos.current * CELL}em)`, willChange: 'transform' }}>{STRIP}</span>
        ) : (
          <span style={{ display: 'block', lineHeight: CELL + 'em' }}>{ch}</span>
        )}
      </span>
    );
  });

  function RollingValue({ text, unit, dir = 1, fast = false, base = 2, unitColor }) {
    const prev = useRef(text);
    const chars = Array.from(text), pc = Array.from(prev.current);
    const di = chars.indexOf('.') < 0 ? chars.length : chars.indexOf('.');
    const pdi = pc.indexOf('.') < 0 ? pc.length : pc.indexOf('.');
    let rc = null; // rightmost changed position — carries resolve right-to-left as one motion
    chars.forEach((c, i) => { const pos = i - di; if (pc[pdi + pos] !== c && (rc === null || pos > rc)) rc = pos; });
    useEffect(() => { prev.current = text; });
    const dur = reduced ? 0 : fast ? 170 : 360, st = fast ? 14 : 34;
    return (
      <span aria-label={text + (unit ? ' ' + unit : '')} style={{ display: 'inline-flex', alignItems: 'baseline', whiteSpace: 'pre', fontVariantNumeric: 'tabular-nums' }}>
        {chars.map((c, i) => {
          const pos = i - di;
          return <Slot key={pos} ch={c} dir={dir} dur={dur} delay={rc === null ? 0 : Math.max(0, rc - pos) * st} grow={pos > base} />;
        })}
        {unit ? <span style={{ marginLeft: unit === '\u00B0' || unit === '%' ? '.12em' : '.45em', fontSize: '.8em', color: unitColor }}>{unit}</span> : null}
      </span>
    );
  }

  /* ---------- precision HUD: local, quiet, temporary ---------- */
  const pill = { position: 'absolute', display: 'flex', alignItems: 'center', gap: 8, padding: '3px 7px', borderRadius: 5, whiteSpace: 'nowrap', background: 'rgba(18,18,18,.8)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.1), 0 8px 20px -8px rgba(0,0,0,.6)', fontFamily: C.mono };
  function Hud({ h, text, ratio, levels }) {
    const ref = useRef(null);
    useLayoutEffect(() => { if (ref.current && !reduced) ref.current.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 130, easing: EASE }); }, []);
    let body = null;
    if (h.kind === 'scrub') {
      const dx = h.px - h.ox, dy = h.py - h.oy, dist = Math.hypot(dx, dy), k = Math.max(0, 1 - 9 / Math.max(dist, 9));
      const ex = h.ox + dx * k, ey = h.oy + dy * k, ang = (Math.atan2(dy, dx) * 180) / Math.PI;
      const zones = levels >= 3 ? [26, 78] : [26];
      body = (
        <React.Fragment>
          <svg style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible' }}>
            {zones.map(z => (
              <g key={z} stroke="#7FE3D4" strokeOpacity={Math.abs(dy) >= z ? 0.55 : 0.22} strokeWidth="1">
                <line x1={h.ox - 7} x2={h.ox + 7} y1={h.oy + z} y2={h.oy + z}></line>
                <line x1={h.ox - 7} x2={h.ox + 7} y1={h.oy - z} y2={h.oy - z}></line>
              </g>
            ))}
            <circle cx={h.ox} cy={h.oy} r="2.25" fill="#7FE3D4"></circle>
            {dist > 14 ? <line x1={h.ox} y1={h.oy} x2={ex} y2={ey} stroke="#7FE3D4" strokeOpacity=".8" strokeWidth="1" strokeDasharray="2 3"></line> : null}
            {dist > 14 ? <path d="M-1,-3.2 L5,0 L-1,3.2 Z" transform={`translate(${ex},${ey}) rotate(${ang})`} fill="#7FE3D4"></path> : null}
          </svg>
          <div style={{ ...pill, left: h.px + 14, top: h.py + 12 }}>
            <span style={{ fontSize: 11, fontWeight: 300, color: '#F4F4F4' }}>{text}</span>
            <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: '.08em', color: ratio < 1 ? '#7FE3D4' : '#919191' }}>{ratioLabel(ratio)}</span>
          </div>
        </React.Fragment>
      );
    } else if (h.kind === 'swatch') {
      body = (
        <div style={{ ...pill, left: h.sx + 6, top: h.sy + 7, padding: '3px 8px 3px 3px', gap: 7 }}>
          <i style={{ width: 14, height: 14, borderRadius: 4, background: h.color, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.22)' }}></i>
          <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '.1em', color: '#F4F4F4' }}>{h.caption}</span>
        </div>
      );
    }
    const layer = (
      <div ref={ref} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2147483000, opacity: h.leaving ? 0 : 1, transition: `opacity 110ms ${EXIT}` }}>{body}</div>
    );
    return RD && RD.createPortal && typeof document !== 'undefined' ? RD.createPortal(layer, document.body) : layer;
  }

  /* ---------- ruler helpers ---------- */
  const niceUnit = x => { const e = Math.pow(10, Math.floor(Math.log10(x))), f = x / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e; };
  const majorEvery = u => { const m = Math.round(u / Math.pow(10, Math.floor(Math.log10(u) + 1e-9))); return m === 5 ? 2 : 5; };
  const CURVES = {
    sigmoid: x => { const s = v => 1 / (1 + Math.exp(-9 * (v - 0.5))); return (s(x) - s(0)) / (s(1) - s(0)); },
    smooth: x => x * x * (3 - 2 * x),
    gamma: x => Math.pow(x, 0.45),
  };

  /* ================================================================== */
  function ArtinosSlider(props) {
    const {
      label, value: valueProp, defaultValue, onChange, onCommit,
      min = 0, max = 1, step, steps, detents, mapping = 'linear',
      format = 'number', decimals = 2, unit, formatter,
      variant = 'material', gradient = 'temperature', layout = 'integrated', density = 'standard',
      enabled: enabledProp, defaultEnabled = true, onEnabledChange, toggleable = false, indicator,
      material = 'optical', precision = 3, span, marks, snapStep, curve = 'sigmoid', samples, describe, labelWidth = 106, style,
    } = props;

    const tall = variant === 'curve' || variant === 'wave';
    const H = tall ? 58 : variant === 'ruler' ? 30 : DENSITY[density] || 26;
    const [fsL, fsV] = TYPE[density] || TYPE.standard;
    const MT = MATS[material] || MATS.optical;
    const INSET = MT.inset ?? 2, R0 = MT.radius ?? Math.round(Math.min(H, 30) * 0.31), R1 = MT.insertRadius ?? R0 - INSET, PAD = 9;
    const M = MAPS[mapping] || MAPS.linear;
    const quant = variant === 'stepped' ? steps || 6 : steps > 1 ? steps : 0;
    const toT = v => clamp(M.to(v, min, max), 0, 1);
    const fromT = t => M.from(clamp(t, 0, 1), min, max);
    const qT = t => (quant > 1 ? Math.round(clamp(t, 0, 1) * (quant - 1)) / (quant - 1) : t);
    const tToP = t => (variant === 'stepped' ? (Math.round(t * (quant - 1)) + 1) / quant : t);
    const pToT = p => (variant === 'stepped' ? Math.floor(clamp(p, 0, 0.9999) * quant) / (quant - 1) : clamp(p, 0, 1));
    const levels = precision >= 3 ? [1, 0.1, 0.01] : [1, 0.1];
    let G = variant === 'gradient' ? (typeof gradient === 'string' ? GRADIENTS[gradient] || GRADIENTS.temperature : gradient) : null;
    if (G && typeof gradient === 'string' && MT.gradients && MT.gradients[gradient]) G = { ...G, stops: MT.gradients[gradient], sample: null };
    const sampleG = t => (G.sample ? G.sample(t) : sampleStops(G.stops, t));

    const [inner, setInner] = useState(defaultValue ?? min);
    const value = valueProp ?? inner;
    const [enInner, setEnInner] = useState(defaultEnabled);
    const enabled = enabledProp ?? enInner;
    const [mode, setMode] = useState(null);
    const [zone, setZone] = useState(null);
    const [ratio, setRatio] = useState(1);
    const [flash, setFlash] = useState(null);
    const [ring, setRing] = useState(false);
    const [hud, setHud] = useState(null);
    const [kbExtra, setKbExtra] = useState(0);
    const [vw, setVw] = useState(200);
    const [zoom, setZoom] = useState(1);

    const rootRef = useRef(null), trackRef = useRef(null), valRef = useRef(null), viewRef = useRef(null), gRef = useRef(null);
    const drag = useRef(null), live = useRef(value), dirRef = useRef({ v: value, d: 1 });
    const clickMemo = useRef({ t: 0, v: value }), timers = useRef({}), zoomRef = useRef(1), cid = useRef('as' + Math.random().toString(36).slice(2, 8)).current;
    if (!drag.current) live.current = value;
    if (value !== dirRef.current.v) dirRef.current = { v: value, d: value > dirRef.current.v ? 1 : -1 };

    const emit = v => {
      if (quant > 1) v = fromT(qT(toT(v)));
      v = clamp(v, Math.min(min, max), Math.max(min, max));
      if (v === live.current) return;
      live.current = v;
      if (valueProp === undefined) setInner(v);
      onChange && onChange(v);
    };
    const pulse = (k, ms = 200) => { clearTimeout(timers.current.f); setFlash(k); timers.current.f = setTimeout(() => setFlash(null), ms); };
    const modRatio = e => (e.shiftKey ? levels[levels.length - 1] : e.altKey ? 0.1 : 1);
    const zoneRatio = dy => { const a = Math.abs(dy); return a < 26 ? 1 : a < 78 || levels.length < 3 ? 0.1 : 0.01; };
    const ppu = z => (vw / (span || (max - min) / 4)) * (z ?? zoom);

    const geo = () => {
      const r = trackRef.current.getBoundingClientRect();
      return tall ? { left: r.left + 10, W: r.width - 20, r } : { left: r.left + INSET, W: r.width - INSET * 2, r };
    };
    const hit = (x, y, g) => {
      const vr = valRef.current && valRef.current.getBoundingClientRect();
      const inVal = !!vr && (tall ? x >= vr.left - 10 && x <= vr.right + 10 && y >= vr.top - 8 && y <= vr.bottom + 8 : x >= vr.left - 10);
      if (variant === 'ruler') return { z: inVal ? 'value' : 'body', vr };
      if (variant === 'stepped') return { z: inVal ? 'value' : 'body', vr };
      const d = Math.abs(x - (g.left + tToP(toT(live.current)) * g.W));
      return { z: d <= 7 ? 'seam' : inVal ? 'value' : d <= 13 ? 'seam' : 'body', vr };
    };

    const applyDetent = (v, W, ctrl) => {
      const list = detents || [];
      let best = null, bd = Infinity;
      for (const d of list) { const dd = Math.abs(toT(v) - toT(d)); if (dd < bd) { bd = dd; best = d; } }
      if (best !== null && bd * W <= (ctrl ? 22 : 6)) return [best, best];
      if (ctrl && !list.length && !quant) { const t = Math.round(toT(v) * 20) / 20; return [fromT(t), t]; }
      return [v, null];
    };

    const swatch = v => {
      const d = drag.current; if (!d || !G) return;
      const t = toT(v), col = sampleG(t), f = formatValue(v, format, decimals, 0, unit);
      const cap = (describe || G.describe || (() => f.text + (f.unit ? ' ' + f.unit : '')))(t, col, v);
      setHud({ kind: 'swatch', sx: d.g.left + t * d.g.W, sy: d.g.r.bottom, color: col, caption: cap });
    };

    const moveBody = (e, dx) => {
      const d = drag.current, r = modRatio(e);
      d.vx += dx * r;
      let v = fromT(pToT((d.vx - d.g.left) / d.g.W));
      const [sv, sn] = applyDetent(v, d.g.W, e.ctrlKey || e.metaKey);
      if (sn !== null && sn !== d.snap) pulse('snap');
      d.snap = sn; v = sv;
      setRatio(r); emit(v); swatch(v);
    };
    const moveScrub = (e, dx) => {
      const d = drag.current, r = Math.min(zoneRatio(e.clientY - d.oy), modRatio(e));
      let v;
      if (variant === 'ruler') v = live.current + (dx / ppu(1)) * r;
      else {
        d.t = clamp(d.t + (dx / d.g.W) * r, 0, 1); v = fromT(d.t);
        if (e.ctrlKey || e.metaKey) { const [sv, sn] = applyDetent(v, d.g.W, true); if (sn !== null && sn !== d.snap) pulse('snap'); d.snap = sn; v = sv; }
      }
      setRatio(r); emit(v);
      setHud({ kind: 'scrub', ox: d.ox, oy: d.oy, px: e.clientX, py: e.clientY });
    };
    const moveRuler = (e, dx) => {
      const d = drag.current, r = modRatio(e);
      let v = live.current - dx / ppu();
      const list = marks || detents || [];
      let sn = null;
      if (e.ctrlKey || e.metaKey || list.length) for (const m of list) if (Math.abs(m - v) * ppu() <= (e.ctrlKey || e.metaKey ? 22 : 5)) { sn = m; v = m; }
      if (sn !== null && sn !== d.snap) pulse('snap');
      d.snap = sn;
      const pp = ppu(), u = niceUnit(6 / pp), maj = u * majorEvery(u), mk = Math.floor(v / maj);
      if (d.maj !== null && mk !== d.maj && sn === null) pulse('tick', 110);
      d.maj = mk;
      setRatio(r); emit(v);
    };

    const onPointerDown = e => {
      if (e.button !== 0) return;
      const now = performance.now();
      if (now - clickMemo.current.t > 420) clickMemo.current.v = live.current;
      clickMemo.current.t = now;
      e.preventDefault();
      rootRef.current && rootRef.current.focus({ preventScroll: true });
      if (!enabled) return;
      if (viewRef.current) { const w = Math.round(viewRef.current.getBoundingClientRect().width); if (w > 0 && w !== vw) setVw(w); }
      const g = geo(), x = e.clientX, y = e.clientY, t0 = toT(live.current);
      const { z, vr } = hit(x, y, g);
      const m = z === 'value' ? 'scrub' : variant === 'ruler' ? 'ruler' : z === 'seam' ? 'seam' : 'jump';
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) { /* noop */ }
      drag.current = { m, id: e.pointerId, v0: live.current, lx: x, vx: m === 'jump' ? x : g.left + tToP(t0) * g.W, t: t0, g, ox: vr ? vr.left + vr.width / 2 : x, oy: vr ? vr.top + vr.height / 2 : y, snap: null, maj: null };
      setMode(m); setRatio(1);
      if (m === 'jump') moveBody(e, 0);
      else if (m === 'scrub') setHud({ kind: 'scrub', ox: drag.current.ox, oy: drag.current.oy, px: x, py: y });
      else swatch(live.current);
    };
    const onPointerMove = e => {
      const d = drag.current;
      if (!d) {
        if (e.pointerType !== 'mouse') return;
        const z = enabled ? hit(e.clientX, e.clientY, geo()).z : 'off';
        if (z !== zone) setZone(z);
        return;
      }
      if (e.pointerId !== d.id) return;
      const dx = e.clientX - d.lx; d.lx = e.clientX;
      if (d.m === 'scrub') moveScrub(e, dx);
      else if (d.m === 'ruler') moveRuler(e, dx);
      else moveBody(e, dx);
    };
    const end = cancel => {
      const d = drag.current; if (!d) return;
      drag.current = null;
      if (cancel) emit(d.v0);
      else if (variant === 'ruler' && snapStep) {
        const prev = live.current, target = Math.round(prev / snapStep) * snapStep, pp = ppu(1);
        emit(target);
        if (gRef.current && !reduced && target !== prev) gRef.current.animate([{ transform: `translateX(${(target - prev) * pp}px)` }, { transform: 'translateX(0)' }], { duration: 180, easing: EASE });
      }
      setMode(null); setRatio(1);
      setHud(h => (h ? { ...h, leaving: true } : null));
      clearTimeout(timers.current.h); timers.current.h = setTimeout(() => setHud(null), 140);
      onCommit && onCommit(live.current);
    };

    const nudge = (dir, e) => {
      const r = modRatio(e), cur = live.current;
      if (quant > 1) { emit(fromT(qT(toT(cur) + dir / (quant - 1)))); return; }
      if (e.ctrlKey || e.metaKey) {
        const list = (detents || marks || []).slice().sort((a, b) => a - b);
        const next = dir > 0 ? list.find(d => d > cur + 1e-9) : list.slice().reverse().find(d => d < cur - 1e-9);
        if (next !== undefined) { emit(next); pulse('snap'); return; }
        const t = toT(cur);
        emit(fromT(dir > 0 ? Math.floor(t * 10 + 1e-6) / 10 + 0.1 : Math.ceil(t * 10 - 1e-6) / 10 - 0.1));
        return;
      }
      if (step) emit(cur + dir * step * r);
      else emit(fromT(toT(cur) + dir * 0.01 * r));
      if (r < 1) { setKbExtra(r <= 0.011 ? 2 : 1); clearTimeout(timers.current.k); timers.current.k = setTimeout(() => setKbExtra(0), 1100); }
    };
    const onKeyDown = e => {
      if (e.key === 'Escape') { if (drag.current) { e.preventDefault(); end(true); } return; }
      if (!enabled) return;
      if (e.key === 'Home') { e.preventDefault(); emit(min); return; }
      if (e.key === 'End') { e.preventDefault(); emit(max); return; }
      const dir = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
      if (!dir) return;
      e.preventDefault(); nudge(dir, e);
    };
    const onDoubleClick = e => {
      if (!toggleable) return;
      e.preventDefault();
      if (drag.current) end(false);
      const next = !enabled;
      if (!next) emit(clickMemo.current.v); // the first click of the pair must not cost the stored value
      if (enabledProp === undefined) setEnInner(next);
      onEnabledChange && onEnabledChange(next);
      pulse(next ? 'on' : 'off', 320);
    };

    const nudgeRef = useRef(nudge); nudgeRef.current = nudge;
    const enRef = useRef(enabled); enRef.current = enabled;
    useEffect(() => {
      const el = rootRef.current; if (!el) return;
      const h = e => {
        if (document.activeElement !== el || !enRef.current) return; // guarded: wheel edits only a focused slider
        const dv = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? -e.deltaY : e.deltaX;
        if (!dv) return;
        e.preventDefault(); nudgeRef.current(dv > 0 ? 1 : -1, e);
      };
      el.addEventListener('wheel', h, { passive: false });
      return () => el.removeEventListener('wheel', h);
    }, []);
    useLayoutEffect(() => {
      const el = viewRef.current; if (!el) return;
      const w = Math.round(el.getBoundingClientRect().width);
      if (w > 0 && w !== vw) setVw(w);
    });
    useLayoutEffect(() => {
      const el = viewRef.current; if (!el) return;
      const set = w => { w = Math.round(w || el.getBoundingClientRect().width || el.clientWidth); if (w > 0) setVw(w); };
      set();
      const raf = requestAnimationFrame(() => set());
      const tms = [0, 120, 600].map(ms => setTimeout(() => set(), ms));
      const onWin = () => set();
      window.addEventListener('resize', onWin); window.addEventListener('load', onWin);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(onWin);
      const off = () => { cancelAnimationFrame(raf); tms.forEach(clearTimeout); window.removeEventListener('resize', onWin); window.removeEventListener('load', onWin); };
      if (typeof ResizeObserver === 'undefined') return off;
      const ro = new ResizeObserver(() => set()); ro.observe(el);
      return () => { off(); ro.disconnect(); };
    }, [variant]);
    const zoomTarget = variant === 'ruler' && mode ? 1 / Math.sqrt(ratio) : 1;
    useEffect(() => {
      const from = zoomRef.current, to = zoomTarget;
      if (from === to) return;
      if (reduced) { zoomRef.current = to; setZoom(to); return; }
      const t0 = performance.now(); let raf;
      const f = now => { const k = Math.min(1, (now - t0) / 220), z = from + (to - from) * (1 - Math.pow(1 - k, 3)); zoomRef.current = z; setZoom(z); if (k < 1) raf = requestAnimationFrame(f); };
      raf = requestAnimationFrame(f);
      return () => cancelAnimationFrame(raf);
    }, [zoomTarget]);
    useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

    /* ---------- derived presentation ---------- */
    const t = toT(value), p = tToP(t), dragging = !!mode;
    const extra = quant > 1 ? 0 : dragging ? (ratio <= 0.011 ? 2 : ratio <= 0.11 ? 1 : 0) : kbExtra;
    const fv = formatter ? formatter(value, decimals + extra) : formatValue(value, format, decimals, extra, unit);
    const dir = dirRef.current.d;
    const integrated = layout !== 'paired';
    const showDot = indicator ?? toggleable;
    const hot = mode === 'seam' || mode === 'jump' || mode === 'ruler' || flash === 'on' || flash === 'snap' || flash === 'tick';
    const seamRest = zone === 'seam' ? MT.seamHover : MT.seam;
    const valueInk = !enabled ? C.inkLow : mode === 'scrub' || zone === 'value' ? MT.baseInkHi || C.inkHi : MT.baseInk || 'color-mix(in srgb, var(--as-ink-hi, var(--text-hi, #f4f4f4)) 86%, transparent)';
    const labelInk = enabled ? MT.baseInk || C.ink : C.inkLow;
    const cursor = !enabled ? 'default' : mode === 'ruler' ? 'grabbing' : mode ? 'ew-resize' : zone === 'seam' || zone === 'value' ? 'ew-resize' : variant === 'ruler' ? 'grab' : 'default';
    const fillCss = `calc(${INSET}px + ${p} * (100% - ${INSET * 2}px))`;

    const dot = showDot ? (
      <i style={{ flex: 'none', width: 4, height: 4, borderRadius: '50%', background: enabled ? C.signal : 'transparent', boxShadow: enabled ? `0 0 5px ${C.signalLine}` : `inset 0 0 0 1px ${C.inkLow}`, transition: `background 220ms ${EASE}, box-shadow 220ms ${EASE}` }}></i>
    ) : null;
    const labelEl = (color, over) => (
      <span style={{ flex: '0 1 auto', minWidth: 0, paddingRight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: MT.font || C.mono, fontSize: MT.upSize ? fsL + 2.5 : fsL, fontWeight: MT.lw || 500, letterSpacing: MT.ls ?? '.13em', textTransform: 'uppercase', textShadow: over ? MT.textShadow : MT.baseShadow ?? MT.textShadow, color, transition: `color 220ms ${EASE}` }}>{label}</span>
    );
    const readout = (color, unitColor, isBase, extraStyle) => (
      <span ref={isBase ? valRef : undefined} style={{ marginLeft: 'auto', flex: 'none', fontFamily: MT.font || C.mono, fontSize: MT.upSize ? fsV + 1 : fsV, fontWeight: MT.vw || 300, textShadow: isBase ? MT.baseShadow ?? MT.textShadow : MT.textShadow, lineHeight: 1.3, color, transition: `color 130ms ${EASE}`, ...extraStyle }}>
        <RollingValue text={fv.text} unit={fv.unit} dir={dir} fast={dragging} base={decimals} unitColor={unitColor} />
      </span>
    );
    const seam = (left, color, h, glow, dbl) => dbl ? (
      <i style={{ position: 'absolute', left, top: '50%', width: 4, height: h, marginTop: -h / 2, marginLeft: -3, borderRadius: 1, background: `linear-gradient(90deg, ${color} 0 1.2px, transparent 1.2px 2.8px, ${color} 2.8px 4px)`, filter: hot && enabled ? 'drop-shadow(0 0 3px rgba(26,223,184,.55))' : MT.seamDrop, pointerEvents: 'none', transition: `height 130ms ${EASE}, filter 160ms ${EASE}, opacity 220ms ${EASE}` }}></i>
    ) : (
      <i style={{ position: 'absolute', left, top: '50%', width: 2, height: h, marginTop: -h / 2, marginLeft: -1, borderRadius: 1, background: color, boxShadow: glow, pointerEvents: 'none', transition: `height 130ms ${EASE}, background 130ms ${EASE}, box-shadow 160ms ${EASE}, opacity 220ms ${EASE}` }}></i>
    );
    const seamGlow = hot && enabled ? `0 0 0 .5px ${C.signal}, 0 0 7px ${C.signalLine}` : MT.seamEdge;
    const seamColor = !enabled ? C.inkLow : hot ? (flash === 'snap' ? C.signalHi : MT.seamActive || C.signal) : seamRest;
    const dbl = MT.seamKind === 'double';
    const seamH = Math.round(H * (dbl ? (hot ? 0.36 : 0.3) : hot ? 0.46 : 0.38));
    const markTicks = (list, color) => (list || []).map((m, i) => (
      <i key={i} style={{ position: 'absolute', bottom: 3, left: `calc(${INSET}px + ${toT(m)} * (100% - ${INSET * 2}px))`, width: 1, height: 3, marginLeft: -0.5, background: color, pointerEvents: 'none' }}></i>
    ));
    const stepTicks = quant > 2 && quant <= 17 && variant === 'material' ? Array.from({ length: quant - 2 }, (_, i) => fromT((i + 1) / (quant - 1))) : null;

    const trackBase = {
      position: 'relative', flex: 1, minWidth: 0, height: H, borderRadius: R0, overflow: 'hidden',
      touchAction: 'pan-y', userSelect: 'none', WebkitUserSelect: 'none', cursor,
      transition: `box-shadow 130ms ${EASE}`,
    };
    const wellShadow = `${MT.well || C.well + ', ' + C.rim}${dragging ? ', inset 0 1px 3px rgba(0,0,0,.28)' : ''}${ring ? ', ' + C.focus : ''}`;
    const handlers = { onPointerDown, onPointerMove, onPointerUp: e => drag.current && e.pointerId === drag.current.id && end(false), onPointerCancel: () => end(true), onPointerLeave: () => !drag.current && zone && setZone(null), onDoubleClick };

    let track;
    if (variant === 'material' || variant === 'stepped') {
      const insertTransition = enabled
        ? `width ${dragging && !quant ? 0 : quant ? 70 : 130}ms ${EASE}, transform 260ms ${EASE} 40ms, opacity 200ms ${EASE} 40ms, filter 200ms ${EASE}`
        : `width 130ms ${EASE}, transform 220ms ${EXIT}, opacity 240ms ${EXIT}, filter 160ms ${EXIT}`;
      const insertState = { transform: enabled ? 'none' : 'scaleY(.1)', opacity: enabled ? 1 : 0, filter: !enabled ? 'saturate(0) brightness(.7)' : zone || dragging ? 'brightness(1.035)' : 'none', transition: insertTransition };
      const lit = Math.round(t * (quant - 1)) + 1;
      track = (
        <div ref={trackRef} {...handlers} style={{ ...trackBase, background: MT.trough || C.trough, backdropFilter: MT.troughBackdrop, WebkitBackdropFilter: MT.troughBackdrop, boxShadow: wellShadow }}>
          {variant === 'stepped' ? (
            <div style={{ position: 'absolute', inset: INSET, display: 'flex', gap: 2 }}>
              {Array.from({ length: quant }, (_, i) => (
                <i key={i} style={{ flex: 1, borderRadius: MT.cellRadius ?? Math.max(2, R1 - 1), background: i < lit ? MT.insert : MT.cell || C.cell, mixBlendMode: i < lit ? MT.blend : undefined, backdropFilter: i < lit ? MT.backdrop : 'none', WebkitBackdropFilter: i < lit ? MT.backdrop : 'none', boxShadow: i < lit ? MT.cellInsertShadow || MT.shadow : MT.cellShadow || 'inset 0 0 0 1px rgba(255,255,255,.035)', transformOrigin: '50% 50%', ...(i < lit ? insertState : { transition: `background 90ms ${EASE}` }) }}></i>
              ))}
            </div>
          ) : (
            <div style={{ position: 'absolute', left: INSET, top: INSET, bottom: INSET, width: `calc(${p} * (100% - ${INSET * 2}px))`, borderRadius: R1, background: MT.insert, mixBlendMode: MT.blend, backdropFilter: MT.backdrop, WebkitBackdropFilter: MT.backdrop, boxShadow: `${MT.shadow}${dragging ? ', inset 0 0 0 1px rgba(0,0,0,.06)' : ''}`, ...insertState }}></div>
          )}
          <div style={{ position: 'absolute', left: INSET + 3, top: '50%', height: 1, marginTop: -0.5, width: `calc(${p} * (100% - ${INSET * 2}px) - 6px)`, background: C.inkLow, opacity: enabled ? 0 : 0.8, transition: `opacity 220ms ${EASE} ${enabled ? 0 : 90}ms` }}></div>
          {markTicks(detents, 'rgba(128,128,128,.7)')}
          {markTicks(stepTicks, 'rgba(128,128,128,.45)')}
          {variant === 'material' ? seam(`max(${INSET + 4}px, calc(${fillCss} - 4px))`, seamColor, enabled ? seamH : 6, enabled ? seamGlow : 'none', dbl) : null}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 7, padding: `0 ${PAD}px`, pointerEvents: 'none' }}>
            {dot}{integrated && label ? labelEl(labelInk) : null}
            {readout(valueInk, MT.baseInk || C.inkLow, true)}
          </div>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 7, padding: `0 ${PAD}px`, pointerEvents: 'none', clipPath: `inset(0 calc(100% - ${fillCss}) 0 0)`, WebkitClipPath: `inset(0 calc(100% - ${fillCss}) 0 0)`, opacity: enabled ? 1 : 0, transition: `opacity 200ms ${EASE}` }}>
            {dot}{integrated && label ? labelEl(MT.ink, true) : null}
            {readout(MT.ink, MT.unitInk, false)}
          </div>
        </div>
      );
    } else if (variant === 'gradient') {
      const css = `linear-gradient(90deg, ${G.stops.map(([s, c]) => `${c} ${s * 100}%`).join(', ')})`;
      const ink2 = hex => (MT.darkInk ? (lum(hex) > 0.2 ? MT.darkInk : MT.lightInk) : inkOn(hex));
      const lInk = enabled ? ink2(sampleG(0.08)) : C.ink, vInk = enabled ? ink2(sampleG(0.93)) : C.inkLow;
      track = (
        <div ref={trackRef} {...handlers} style={{ ...trackBase, background: C.trough, boxShadow: `${C.rim}${ring ? ', ' + C.focus : ''}` }}>
          <div style={{ position: 'absolute', inset: 0, background: css, filter: enabled ? (zone || dragging ? 'brightness(1.04)' : 'none') : 'saturate(.12) brightness(.42)', opacity: enabled ? 1 : 0.8, transition: `filter 260ms ${enabled ? EASE : EXIT}, opacity 260ms ${EASE}` }}></div>
          {MT.gradWell ? null : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,.3), rgba(255,255,255,0) 46%, rgba(0,0,0,.12))', pointerEvents: 'none' }}></div>}
          <div style={{ position: 'absolute', inset: 0, borderRadius: R0, boxShadow: MT.gradWell || 'inset 0 1px 2px rgba(0,0,0,.35), inset 0 0 0 1px rgba(0,0,0,.18)', pointerEvents: 'none' }}></div>
          {markTicks(detents, 'rgba(0,0,0,.4)')}
          {dbl ? seam(`max(${INSET + 4}px, min(calc(100% - ${INSET + 4}px), ${fillCss}))`, !enabled ? C.inkLow : hot ? MT.seamActive : MT.gradSeam, enabled ? Math.round(H * 0.66) : 6, null, true) : seam(`max(${INSET + 4}px, min(calc(100% - ${INSET + 4}px), ${fillCss}))`, !enabled ? C.inkLow : hot ? '#141414' : 'rgba(20,20,20,.72)', enabled ? seamH + 2 : 6, hot && enabled ? '0 0 0 1px rgba(255,255,255,.55), 0 0 6px rgba(255,255,255,.4)' : '1px 0 0 rgba(255,255,255,.55)')}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 7, padding: `0 ${PAD}px`, pointerEvents: 'none' }}>
            {dot}{integrated && label ? labelEl(lInk) : null}
            {readout(vInk, vInk, true, MT.vw ? undefined : { fontWeight: mode === 'scrub' ? 500 : 300 })}
          </div>
        </div>
      );
    } else if (variant === 'ruler') {
      const pp = ppu(), u = niceUnit(6 / pp), maj = u * majorEvery(u), labelEvery = [1, 2, 5, 10, 20].find(k => maj * k * pp >= 40) || 20, lu = maj * labelEvery;
      const decs = Math.max(0, -Math.floor(Math.log10(lu) + 1e-9));
      const half = vw / 2 / pp, lo = Math.max(min, value - half - u), hi = Math.min(max, value + half + u);
      const minorOp = clamp((u * pp - 5) / 6, 0.3, 1), base = H - 8, ticks = [];
      const near = (a, q) => Math.abs(Math.round(a / q) * q - a) < u * 1e-3;
      for (let i = Math.ceil(lo / u - 1e-9), n = 0; i * u <= hi + 1e-9 && n < 500; i++, n++) {
        const tv = i * u, x = vw / 2 + (tv - value) * pp, isMaj = near(tv, maj);
        ticks.push(<line key={'t' + i} x1={x} x2={x} y1={base - (isMaj ? 7 : 3.5)} y2={base} stroke={MT.rulerInk ? MT.rulerInk : isMaj ? C.tickMajor : C.tick} strokeWidth={MT.rulerInk && isMaj ? 1.6 : 1} opacity={isMaj ? 1 : minorOp}></line>);
        if (isMaj && near(tv, lu)) ticks.push(<text key={'l' + i} x={x} y={10.5} textAnchor="middle" fill={MT.rulerInk || C.ink} style={{ fontFamily: MT.font || C.mono, fontSize: MT.font ? 8.8 : 8.5, fontWeight: MT.font ? 700 : 300 }}>{Number(tv.toFixed(decs)).toString()}</text>);
      }
      (marks || []).forEach((m, i) => { if (m >= lo && m <= hi) { const x = vw / 2 + (m - value) * pp; ticks.push(<line key={'m' + i} x1={x} x2={x} y1={base - 9} y2={base} stroke={C.inkHi} strokeWidth="1.5"></line>); } });
      const idx = !enabled ? C.inkLow : hot || mode === 'scrub' ? MT.seamActive || C.signalHi : MT.rulerInk || C.inkHi;
      const fade = 'linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent)';
      track = (
        <div ref={trackRef} {...handlers} style={{ ...trackBase, display: 'flex', alignItems: 'center', background: MT.trough || C.trough, backdropFilter: MT.troughBackdrop, WebkitBackdropFilter: MT.troughBackdrop, boxShadow: wellShadow }}>
          {dot || (integrated && label) ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, paddingLeft: PAD, flex: 'none', maxWidth: '40%', pointerEvents: 'none' }}>{dot}{integrated && label ? labelEl(labelInk) : null}</div>
          ) : null}
          <div ref={viewRef} style={{ position: 'relative', flex: 1, minWidth: 0, alignSelf: 'stretch', margin: '0 4px', WebkitMaskImage: fade, maskImage: fade, pointerEvents: 'none' }}>
            <svg width={vw} height={H} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: enabled ? 1 : 0.42, transition: `opacity 260ms ${enabled ? EASE : EXIT}` }}>
              <g ref={gRef}>{ticks}</g>
            </svg>
            <i style={{ position: 'absolute', left: vw / 2, top: 12, bottom: 6, width: 1.5, marginLeft: -0.75, borderRadius: 1, background: idx, boxShadow: hot && enabled ? `0 0 6px ${C.signalLine}` : 'none', transition: `background 130ms ${EASE}, box-shadow 160ms ${EASE}` }}></i>
            <i style={{ position: 'absolute', left: vw / 2, bottom: 2, width: 3, height: 3, marginLeft: -1.5, borderRadius: '50%', background: idx, transition: `background 130ms ${EASE}` }}></i>
          </div>
          <div style={{ flex: 'none', paddingRight: PAD, display: 'flex', pointerEvents: 'none' }}>{readout(valueInk, MT.baseInk || C.inkLow, true, { marginLeft: 0 })}</div>
        </div>
      );
    } else {
      const ch = H - 30, pts = [];
      if (variant === 'curve') {
        const f = typeof curve === 'function' ? curve : CURVES[curve] || CURVES.sigmoid;
        for (let i = 0; i <= 64; i++) { const x = i / 64; pts.push([x * vw, ch - f(x) * ch]); }
      } else {
        const s = samples && samples.length ? samples : [0];
        s.forEach((a, i) => pts.push([(i / Math.max(1, s.length - 1)) * vw, ch - clamp(a, 0, 1) * ch * 0.95]));
      }
      const d = pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ');
      const px = p * vw, f = variant === 'curve' ? (typeof curve === 'function' ? curve : CURVES[curve] || CURVES.sigmoid) : null;
      const py = f ? ch - f(p) * ch : 0;
      const idx = !enabled ? C.inkLow : hot || mode === 'scrub' ? MT.seamActive || C.signalHi : MT.rulerInk || C.inkHi;
      track = (
        <div ref={trackRef} {...handlers} style={{ ...trackBase, borderRadius: R0 + 1, background: MT.trough || C.trough, backdropFilter: MT.troughBackdrop, WebkitBackdropFilter: MT.troughBackdrop, boxShadow: wellShadow }}>
          <div style={{ position: 'absolute', left: 10, top: 7, display: 'flex', alignItems: 'center', gap: 7, pointerEvents: 'none' }}>{dot}{integrated && label ? labelEl(labelInk) : null}</div>
          <div style={{ position: 'absolute', right: 10, top: 5, display: 'flex', pointerEvents: 'none' }}>{readout(valueInk, MT.baseInk || C.inkLow, true, { marginLeft: 0 })}</div>
          <div ref={viewRef} style={{ position: 'absolute', left: 10, right: 10, top: 22, bottom: 8, pointerEvents: 'none', opacity: enabled ? 1 : 0.45, transition: `opacity 260ms ${enabled ? EASE : EXIT}` }}>
            <svg width={vw} height={ch} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
              <defs><clipPath id={cid}><rect x="-2" y="-10" width={Math.max(0, px + 2)} height={ch + 20}></rect></clipPath></defs>
              <path d={d} fill="none" stroke={C.inkLow} strokeWidth="1.1" strokeLinejoin="round"></path>
              <path d={d} fill="none" stroke={C.inkHi} strokeWidth="1.25" strokeLinejoin="round" clipPath={`url(#${cid})`}></path>
              {f ? <line x1={px} x2={px} y1={py} y2={ch} stroke={idx} strokeWidth="1" strokeDasharray="2 2.5"></line> : null}
            </svg>
            {f ? (
              <React.Fragment>
                <i style={{ position: 'absolute', left: px - 2.5, top: py - 2.5, width: 5, height: 5, borderRadius: '50%', background: idx, boxShadow: hot ? `0 0 6px ${C.signalLine}` : 'none' }}></i>
                <i style={{ position: 'absolute', left: px - 1.5, top: ch - 1.5, width: 3, height: 3, borderRadius: '50%', background: idx }}></i>
              </React.Fragment>
            ) : (
              <i style={{ position: 'absolute', left: px - 0.75, top: -3, bottom: -2, width: 1.5, borderRadius: 1, background: idx, boxShadow: hot ? `0 0 6px ${C.signalLine}` : 'none', transition: `background 130ms ${EASE}` }}></i>
            )}
          </div>
        </div>
      );
    }

    const hudText = fv.text + (fv.unit ? (fv.unit === '\u00B0' || fv.unit === '%' ? '' : ' ') + fv.unit : '');
    return (
      <div
        ref={rootRef} tabIndex={0} role="slider"
        aria-label={props['aria-label'] || label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={hudText} aria-disabled={!enabled || undefined}
        data-interacting={dragging ? 'true' : undefined}
        onKeyDown={onKeyDown}
        onFocus={e => setRing(!!(e.target.matches && e.target.matches(':focus-visible')))}
        onBlur={() => { setRing(false); if (drag.current) end(false); }}
        style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, width: '100%', minWidth: 0, outline: 'none', WebkitTapHighlightColor: 'transparent', ...style }}
      >
        {!integrated && label ? (
          <span style={{ flex: 'none', width: labelWidth, display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden' }}>{labelEl(labelInk)}</span>
        ) : null}
        {track}
        {hud ? <Hud h={hud} text={hudText} ratio={ratio} levels={levels.length} /> : null}
      </div>
    );
  }

  /* ================================================================
     FAMILY — switch · toggle group · segmented · color · list.
     Same well, same insert, same LED seam, same material prop as the slider.
     ================================================================ */
  function useFamily(material, density) {
    const MT = MATS[material] || MATS.optical;
    const H = DENSITY[density] || 26, [fsL] = TYPE[density] || TYPE.standard;
    const INSET = MT.inset ?? 2, R0 = MT.radius ?? Math.round(Math.min(H, 30) * 0.31), R1 = MT.insertRadius ?? R0 - INSET;
    const [ring, setRing] = useState(false);
    const refFam = MT.seamKind === 'double';
    return {
      MT, H, INSET, R0, R1, refFam,
      focusProps: { onFocus: e => setRing(!!(e.target.matches && e.target.matches(':focus-visible'))), onBlur: () => setRing(false) },
      well: extra => ({ position: 'relative', height: H, borderRadius: R0, background: MT.trough || C.trough, backdropFilter: MT.troughBackdrop, WebkitBackdropFilter: MT.troughBackdrop, boxShadow: (MT.well || C.well + ', ' + C.rim) + (ring ? ', ' + C.focus : ''), userSelect: 'none', WebkitUserSelect: 'none', WebkitTapHighlightColor: 'transparent', outline: 'none', boxSizing: 'border-box', transition: 'box-shadow 130ms ' + EASE, ...extra }),
      insert: on => ({ background: MT.insert, mixBlendMode: MT.blend, backdropFilter: MT.backdrop, WebkitBackdropFilter: MT.backdrop, boxShadow: MT.shadow, borderRadius: R1, filter: on ? 'none' : 'grayscale(1) brightness(.68) contrast(.92)', transition: 'filter 240ms ' + (on ? EASE : EXIT) }),
      text: (color, over, extra) => ({ fontFamily: MT.font || C.mono, fontSize: MT.upSize ? fsL + 2.5 : fsL, fontWeight: MT.lw || 500, letterSpacing: MT.ls ?? '.13em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3, color, textShadow: over ? MT.textShadow : MT.baseShadow ?? MT.textShadow, ...extra }),
      baseInk: MT.baseInk || 'color-mix(in srgb, var(--as-ink-hi, var(--text-hi, #f4f4f4)) 86%, transparent)',
      dimInk: MT.baseInk ? 'color-mix(in srgb, ' + MT.baseInk + ' 80%, transparent)' : C.ink,
      panelInk: refFam ? '#BBBCC4' : 'var(--text-hi, #f4f4f4)',
    };
  }

  function Led({ on, MT }) {
    const col = on ? MT.seamActive || C.signal : 'var(--as-led-off, #BEBEBE)';
    const glow = on ? ', 0 0 6px ' + (MT.seamActive ? 'rgba(26,223,184,.55)' : C.signalLine) : '';
    return <i style={{ flex: 'none', width: 3, height: 7, borderRadius: 1, background: col, boxShadow: '0 0 0 .5px #757575' + glow, transition: 'background 200ms ' + EASE + ', box-shadow 200ms ' + EASE }}></i>;
  }

  /* Switch — the insert as a two-position shutter. It slides to the active half and its
     LED seam lights; off, the same insert drains to grey. */
  function ArtinosSwitch({ label, labelOn, labelOff, value, defaultValue = false, onChange, material = 'optical', density = 'standard', style }) {
    const f = useFamily(material, density);
    const [inner, setInner] = useState(defaultValue);
    const on = value ?? inner;
    const toggle = () => { const n = !on; if (value === undefined) setInner(n); onChange && onChange(n); };
    const text = on ? labelOn ?? label : labelOff ?? label;
    return (
      <div role="switch" aria-checked={on} aria-label={label} tabIndex={0} {...f.focusProps}
        onClick={toggle} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } }}
        style={f.well({ width: '100%', cursor: 'pointer', ...style })}>
        <div style={{ position: 'absolute', top: f.INSET, bottom: f.INSET, width: 'calc(50% - ' + (f.INSET + 1) + 'px)', left: on ? 'calc(50% + 1px)' : f.INSET, display: 'flex', alignItems: 'center', gap: 8, padding: '0 9px', boxSizing: 'border-box', ...f.insert(on), transition: 'left 280ms ' + EASE + ', filter 240ms ' + (on ? EASE : EXIT) }}>
          <Led on={on} MT={f.MT} />
          <span style={f.text(f.MT.ink, true, { flex: 1, minWidth: 0, textAlign: 'center' })}>{text}</span>
        </div>
      </div>
    );
  }

  /* Toggle group — independent flags sharing one well. */
  function ArtinosToggleGroup({ label, options = [], value, defaultValue = [], onChange, multiple = true, material = 'optical', density = 'standard', style }) {
    const f = useFamily(material, density);
    const [inner, setInner] = useState(defaultValue);
    const sel = value ?? inner;
    const flip = o => {
      const has = sel.includes(o);
      const n = multiple ? (has ? sel.filter(x => x !== o) : [...sel, o]) : has ? [] : [o];
      if (value === undefined) setInner(n); onChange && onChange(n);
    };
    return (
      <div role="group" aria-label={label} style={f.well({ display: 'flex', alignItems: 'stretch', gap: 3, padding: f.INSET, paddingLeft: label ? 9 : f.INSET, ...style })}>
        {label ? <span style={f.text(f.baseInk, false, { marginRight: 'auto', flex: '0 1 auto', minWidth: 0, alignSelf: 'center', paddingRight: 8 })}>{label}</span> : null}
        {options.map(o => {
          const on = sel.includes(o);
          return (
            <button key={o} type="button" aria-pressed={on} {...f.focusProps} onClick={() => flip(o)}
              style={{ all: 'unset', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '0 10px', cursor: 'pointer', flex: label ? 'none' : 1, minWidth: 0, ...f.insert(on) }}>
              <Led on={on} MT={f.MT} />
              <span style={f.text(f.MT.ink, true)}>{o}</span>
            </button>
          );
        })}
      </div>
    );
  }

  /* Segmented — one of n. The insert travels; text under it switches ink as it arrives. */
  function ArtinosSegmented({ label, options = [], value, defaultValue, onChange, material = 'optical', density = 'standard', style }) {
    const f = useFamily(material, density);
    const [inner, setInner] = useState(defaultValue ?? options[0]);
    const cur = value ?? inner, n = Math.max(1, options.length), idx = Math.max(0, options.indexOf(cur));
    const pick = o => { if (value === undefined) setInner(o); onChange && onChange(o); };
    const onKeyDown = e => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return; e.preventDefault(); pick(options[(idx + d + n) % n]); };
    const W = '(100% - ' + f.INSET * 2 + 'px)';
    return (
      <div role="radiogroup" aria-label={label} tabIndex={0} {...f.focusProps} onKeyDown={onKeyDown} style={f.well({ width: '100%', ...style })}>
        <div style={{ position: 'absolute', top: f.INSET, bottom: f.INSET, left: 'calc(' + f.INSET + 'px + ' + idx + ' * ' + W + ' / ' + n + ')', width: 'calc(' + W + ' / ' + n + ')', ...f.insert(true), transition: 'left 300ms ' + EASE }}></div>
        <div style={{ position: 'absolute', inset: f.INSET, display: 'flex' }}>
          {options.map((o, i) => (
            <button key={o} type="button" role="radio" aria-checked={i === idx} tabIndex={-1} onClick={() => pick(o)}
              style={{ all: 'unset', flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '0 6px' }}>
              <span style={f.text(i === idx ? f.MT.ink : f.dimInk, i === idx, { transition: 'color 220ms ' + EASE + ' 60ms' })}>{o}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* Color — label in the well, the colour itself as the insert. Hex ink follows luminance. */
  function ArtinosColor({ label = 'Color', value, defaultValue = '#00C8B3', onChange, material = 'optical', density = 'standard', style }) {
    const f = useFamily(material, density);
    const [inner, setInner] = useState(defaultValue);
    const hex = String(value ?? inner).toUpperCase();
    const ok = /^#[0-9A-F]{6}$/.test(hex);
    const set = v => { if (value === undefined) setInner(v); onChange && onChange(v); };
    const ink = ok ? (lum(hex) > 0.36 ? '#1C1C1C' : '#EDEDED') : f.MT.ink;
    const rim = f.refFam ? 'inset 0 0 0 2px #6D6969, inset 0 6px 11.3px rgba(0,0,0,.31)' : 'inset 0 1px 0 rgba(255,255,255,.38), inset 0 0 0 1px rgba(0,0,0,.26), inset 0 -1px 0 rgba(0,0,0,.18), 0 1px 2px rgba(0,0,0,.35)';
    return (
      <div style={f.well({ display: 'flex', alignItems: 'stretch', paddingLeft: 9, ...style })}>
        <span style={f.text(f.baseInk, false, { flex: '1 1 auto', minWidth: 0, alignSelf: 'center', paddingRight: 8 })}>{label}</span>
        <label style={{ position: 'relative', flex: '0 0 48%', margin: f.INSET, borderRadius: f.R1, background: ok ? hex : '#000', boxShadow: rim, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', transition: 'background 180ms ' + EASE }}>
          <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,0) 48%, rgba(0,0,0,.1))', pointerEvents: 'none' }}></span>
          <span style={f.text(ink, true, { position: 'relative', textShadow: 'none', letterSpacing: f.MT.ls ?? '.08em' })}>{hex}</span>
          <input type="color" aria-label={label} value={ok ? hex.toLowerCase() : '#000000'} onChange={e => set(e.target.value.toUpperCase())} {...f.focusProps}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', border: 0, padding: 0, margin: 0 }} />
        </label>
      </div>
    );
  }

  /* List — closed, a full-width insert with a chevron; open, it extends downward into a
     soft-light glass panel (portalled so docks never clip it). */
  function ArtinosSelect({ label, options = [], value, defaultValue, onChange, material = 'optical', density = 'standard', style }) {
    const f = useFamily(material, density);
    const [inner, setInner] = useState(defaultValue);
    const cur = value ?? inner;
    const [open, setOpen] = useState(false), [hi, setHi] = useState(-1), [rect, setRect] = useState(null);
    const ref = useRef(null), panel = useRef(null);
    const show = () => { setRect(ref.current.getBoundingClientRect()); setHi(Math.max(0, options.indexOf(cur))); setOpen(true); };
    const close = () => setOpen(false);
    const pick = o => { if (value === undefined) setInner(o); onChange && onChange(o); close(); ref.current && ref.current.focus({ preventScroll: true }); };
    useEffect(() => {
      if (!open) return;
      const down = e => { if (!(ref.current && ref.current.contains(e.target)) && !(panel.current && panel.current.contains(e.target))) close(); };
      document.addEventListener('pointerdown', down, true); window.addEventListener('resize', close); window.addEventListener('scroll', close, true);
      return () => { document.removeEventListener('pointerdown', down, true); window.removeEventListener('resize', close); window.removeEventListener('scroll', close, true); };
    }, [open]);
    useLayoutEffect(() => {
      if (open && panel.current && !reduced) panel.current.animate([{ clipPath: 'inset(0 0 calc(100% - ' + f.H + 'px) 0 round ' + f.R0 + 'px)' }, { clipPath: 'inset(0 0 0 0 round ' + f.R0 + 'px)' }], { duration: 240, easing: EASE });
    }, [open]);
    const onKeyDown = e => {
      if (e.key === 'Escape') { if (open) { e.preventDefault(); close(); } return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!open) { show(); return; } const d = e.key === 'ArrowDown' ? 1 : -1; setHi(h => (h + d + options.length) % options.length); return; }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (open && hi >= 0) pick(options[hi]); else show(); }
    };
    const chevron = (color, up) => (
      <svg width="10" height="6" viewBox="0 0 10 6" style={{ flex: 'none', transform: up ? 'rotate(180deg)' : 'none', transition: 'transform 220ms ' + EASE }}>
        <path d="M1 1l4 4 4-4" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"></path>
      </svg>
    );
    const text = cur ?? label, ink = f.panelInk, rowH = Math.max(20, f.H - 6);
    const pnl = open && rect ? (
      <div ref={panel} role="listbox" aria-label={label} style={{ position: 'fixed', left: rect.left, top: rect.top, width: rect.width, zIndex: 2147482000, boxSizing: 'border-box', borderRadius: f.R0, padding: f.H + 'px 0 6px', background: 'rgba(0,0,0,.3)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', boxShadow: 'inset 0 4px 4px rgba(0,0,0,.43), 0 18px 40px -16px rgba(0,0,0,.7)' }}>
        <div style={{ position: 'absolute', inset: 1, borderRadius: f.R1, background: f.refFam ? REF_BAR : 'linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.04))', mixBlendMode: f.refFam ? 'soft-light' : undefined, boxShadow: f.refFam ? 'inset 0 0 0 1px #C3C3C3' : 'inset 0 0 0 1px rgba(255,255,255,.16), inset 0 1px 0 rgba(255,255,255,.22)', pointerEvents: 'none' }}></div>
        <div onClick={close} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: f.H, display: 'flex', alignItems: 'center', gap: 8, padding: '0 11px', cursor: 'pointer' }}>
          <span style={f.text(ink, true, { flex: 1, minWidth: 0, textShadow: '1px 1px 0 rgba(51,51,51,.78)' })}>{text}</span>
          {chevron(ink, true)}
        </div>
        {options.map((o, i) => (
          <div key={o} role="option" aria-selected={o === cur} onPointerEnter={() => setHi(i)} onClick={() => pick(o)}
            style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 9, height: rowH, padding: '0 11px', cursor: 'pointer', background: i === hi ? 'rgba(255,255,255,.07)' : 'transparent', transition: 'background 90ms ' + EASE }}>
            <span style={{ display: 'flex', width: 3, opacity: o === cur ? 1 : 0, transition: 'opacity 130ms ' + EASE }}><Led on={true} MT={f.MT} /></span>
            <span style={f.text(i === hi ? '#FFFFFF' : ink, true, { textShadow: '1px 1px 0 rgba(51,51,51,.78)' })}>{o}</span>
          </div>
        ))}
      </div>
    ) : null;
    return (
      <div ref={ref} role="combobox" aria-expanded={open} aria-haspopup="listbox" aria-label={label} tabIndex={0} {...f.focusProps}
        onKeyDown={onKeyDown} onClick={() => (open ? close() : show())} style={f.well({ width: '100%', cursor: 'pointer', ...style })}>
        <div style={{ position: 'absolute', inset: f.INSET, display: 'flex', alignItems: 'center', gap: 8, padding: '0 9px', ...f.insert(true), opacity: open ? 0 : 1, transition: 'opacity 120ms ' + EASE }}>
          <span style={f.text(f.MT.ink, true, { flex: 1, minWidth: 0 })}>{text}</span>
          {chevron(f.MT.ink, false)}
        </div>
        {pnl ? (RD && RD.createPortal ? RD.createPortal(pnl, document.body) : pnl) : null}
      </div>
    );
  }

  const api = { ArtinosSlider, ArtinosSwitch, ArtinosToggleGroup, ArtinosSegmented, ArtinosColor, ArtinosSelect, RollingValue, formatValue, GRADIENTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') { Object.assign(window, { ArtinosSlider, ArtinosSwitch, ArtinosToggleGroup, ArtinosSegmented, ArtinosColor, ArtinosSelect }); window.ArtinosSliderKit = api; }
})();
