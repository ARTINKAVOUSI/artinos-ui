import { createContext, useContext, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { HERO_THEMES, THEMES, THEME_META, TYPE_COLLECTIONS, TYPE_META } from '../../../src';
import { CHAPTERS, SECTIONS, chapterAnchor, chapterNumber, sectionAnchor } from '../chapters/registry';
import type { ThemeName } from '../../../src';
import persianGarden from '../assets/persian-garden.jpg';
import monstera from '../assets/monstera.jpg';

/* Shared showcase parts: swatches, backdrops, icons, and the Chapter / Spec / Code layout.
   Chapters and sections take their numbers and titles from ../chapters/registry. */

/** How specs render: the showcase shows code and full notes; the Theme Studio preview is compact. */
export const GalleryMode = createContext({ code: true, compact: false });

/** A three-colour chip: ground, control, signal — the theme at a glance. */
export const Swatch = ({ t }: { t: ThemeName }) => {
  const [a, b, c] = THEME_META[t].swatch;
  return <i className="sc-swatch" style={{ '--a': a, '--b': b, '--c': c } as CSSProperties} />;
};
export const THEME_OPTIONS = THEMES.map((t) => ({ value: t, label: THEME_META[t].label, icon: <Swatch t={t} /> }));
/** The eight hero themes, the place to start; each one's variations are picked beside it. */
export const HERO_OPTIONS = HERO_THEMES.map((t) => ({ value: t, label: THEME_META[t].label, icon: <Swatch t={t} /> }));
export const TYPE_OPTIONS = TYPE_COLLECTIONS.map((t) => ({ value: t, label: TYPE_META[t].label }));
/* a light product-shot room — wall, horizon, floor — the scene glass themes are not drawn for */
const studioRoom =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 10" preserveAspectRatio="none"><linearGradient id="g" x2="0" y2="1"><stop offset="0" stop-color="#c4c4c1"/><stop offset=".58" stop-color="#e2e2df"/><stop offset=".6" stop-color="#d2d2cf"/><stop offset="1" stop-color="#a9a9a6"/></linearGradient><rect width="16" height="10" fill="url(#g)"/></svg>',
  );
export const BACKDROPS = { none: '', garden: persianGarden, monstera, studio: studioRoom } as const;
export const BACKDROP_OPTIONS = [{ value: 'garden', label: 'Persian garden' }, { value: 'monstera', label: 'Monstera' }, { value: 'studio', label: 'Studio grey (light)' }, { value: 'none', label: 'None' }] as const;
/** Light backdrops: the page sets ArtinosTheme scene="light" over them. */
export const LIGHT_BACKDROPS: ReadonlySet<string> = new Set(['studio']);
export type Backdrop = keyof typeof BACKDROPS;

export const wave = Array.from({ length: 140 }, (_, i) => {
  const x = i / 139;
  const env = 0.55 + 0.45 * Math.sin(x * Math.PI * 2 * 1.4 + 0.6);
  return Math.min(1, Math.max(0, 0.42 + 0.36 * env * Math.sin(x * Math.PI * 2 * 5.5) + 0.07 * Math.sin(x * 97)));
});
const icon = (d: string) => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
export const ICONS = {
  fill: icon('M2 7h8M7 4l3 3-3 3M12 3v8'),
  start: icon('M3 3v8M5.5 5h6M5.5 9h4'),
  fixed: icon('M4 4h6v6H4z'),
  bold: icon('M4 3h4a2 2 0 010 4H4zM4 7h4.5a2 2 0 010 4H4z'),
  italic: icon('M6 3h5M3 11h5M8.5 3l-3 8'),
  under: icon('M4 3v4a3 3 0 006 0V3M3 12h8'),
  alignL: icon('M2 3h10M2 6h6M2 9h10M2 12h6'),
  alignC: icon('M2 3h10M4 6h6M2 9h10M4 12h6'),
  alignR: icon('M2 3h10M6 6h6M2 9h10M6 12h6'),
  reset: icon('M3 7a4 4 0 104-4H4M4 1v2h2'),
};

/* ---------- page parts ---------- */
export function Code({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <details className="sc-code">
      <summary>
        Code
        <button
          type="button"
          className="sc-copy"
          onClick={(e) => {
            e.preventDefault();
            navigator.clipboard?.writeText(children).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            });
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </summary>
      <pre>{children}</pre>
    </details>
  );
}

/** A description's opening sentence, and the rest: the deck is set a size up and bright, so a
 *  section says what it is in one line before the explanation. */
function splitDeck(text: string): [string, string] {
  const m = /^(.*?[.!?])(?=\s+[A-Z`(])\s+([\s\S]+)$/.exec(text.trim());
  return m ? [m[1], m[2]] : [text.trim(), ''];
}

/** The names a paragraph can open on, set in bold as a run-in head so a block can be scanned. */
const PART_NAMES = new Set(CHAPTERS.flatMap((c) => c.components ?? []));

/** Long explanations read better in short pieces: a new paragraph every couple of sentences, and at
 *  a semicolon that moves on to another named part. */
function readablePieces(text: string): string[] {
  const sentences = text.trim().split(/(?<=[.!?])\s+(?=[A-Z`(])/).flatMap((s) => (s.length > 170 ? s.split(/;\s+(?=[A-Z])/).map((part, i, all) => (i < all.length - 1 ? part + '.' : part)) : [s]));
  const pieces: string[] = [];
  for (const s of sentences) {
    const last = pieces[pieces.length - 1];
    if (last && last.length + s.length < 170 && !PART_NAMES.has(s.split(/\s/)[0])) pieces[pieces.length - 1] = last + ' ' + s;
    else pieces.push(s);
  }
  return pieces;
}

function Piece({ text }: { text: string }) {
  const [first, ...rest] = text.split(' ');
  return PART_NAMES.has(first) ? (
    <p>
      <b>{first}</b> {rest.join(' ')}
    </p>
  ) : (
    <p>{text}</p>
  );
}

/** One section: a header band (number and title) across the width, then the explanation beside
 *  the demo on its stage. `wide`: the demo takes the full width under its description (a
 *  workspace needs the room). */
export function Spec({ id, text, keys, code, wide, children }: { id: string; text: ReactNode; keys?: Array<[string, string]>; code?: string; wide?: boolean; children: ReactNode }) {
  const mode = useContext(GalleryMode);
  const def = SECTIONS.get(id);
  if (!def) throw new Error(`Section "${id}" is not in chapters/registry.ts`);
  if (mode.compact)
    return (
      <section className="sc-spec sc-spec--compact">
        <div className="sc-about">
          <span className="sc-num">{def.n}</span>
          <b className="sc-title">{def.title}</b>
        </div>
        <div className="sc-demo">{children}</div>
      </section>
    );
  const [deck, rest] = typeof text === 'string' ? splitDeck(text) : ['', ''];
  return (
    <section className={wide ? 'sc-spec sc-spec--wide' : 'sc-spec'} id={sectionAnchor(id)} data-section={id}>
      <div className="sc-about">
        <header className="sc-spec__head">
          <span className="sc-num">{def.n}</span>
          <h3 className="sc-title">{def.title}</h3>
        </header>
        {typeof text === 'string' ? (
          <>
            <p className="sc-deck">{deck}</p>
            {rest ? (
              <div className="sc-text">
                {readablePieces(rest).map((piece, i) => (
                  <Piece key={i} text={piece} />
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="sc-text">{text}</div>
        )}
        {keys ? (
          <dl className="sc-keys">
            {keys.map(([k, v]) => (
              <div key={k} className="sc-keys__row">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
      <div className="sc-demo">
        <div className="sc-show">{children}</div>
        {code && mode.code ? <Code>{code.trim()}</Code> : null}
      </div>
    </section>
  );
}

/** A chapter: its opener (number, title, note, the components it covers), then its sections. */
export function Chapter({ id, children }: { id: string; children: ReactNode }) {
  const mode = useContext(GalleryMode);
  const def = CHAPTERS.find((c) => c.id === id);
  if (!def) throw new Error(`Chapter "${id}" is not in chapters/registry.ts`);
  return (
    <section className="sc-chapter" id={chapterAnchor(id)} data-chapter={id}>
      <header className="sc-chapter__head">
        <span className="sc-chapter__num">{chapterNumber(id)}</span>
        <div className="sc-chapter__titles">
          <span className="sc-chapter__eyebrow">
            Chapter {chapterNumber(id)}
            {def.components ? ` · ${def.components.length} components` : ''}
          </span>
          <h2>{def.title}</h2>
          {mode.compact ? null : <p>{def.note}</p>}
        </div>
        {def.components && !mode.compact ? (
          <div className="sc-chapter__parts" aria-label="Components in this chapter">
            {def.components.map((name) => (
              <code key={name}>{name}</code>
            ))}
          </div>
        ) : null}
      </header>
      {children}
    </section>
  );
}
