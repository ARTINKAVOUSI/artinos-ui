import { createContext, useContext, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { THEMES, THEME_META } from '../../../src';
import type { ThemeName } from '../../../src';
import persianGarden from '../assets/persian-garden.jpg';
import monstera from '../assets/monstera.jpg';

/* Shared showcase parts: swatches, backdrops, icons, and the Spec / Code / Part layout. */

/** How specs render: the showcase shows code and full notes; the Theme Studio preview is compact. */
export const GalleryMode = createContext({ code: true, compact: false });

/** A three-colour chip: ground, control, signal — the theme at a glance. */
export const Swatch = ({ t }: { t: ThemeName }) => {
  const [a, b, c] = THEME_META[t].swatch;
  return <i className="sc-swatch" style={{ '--a': a, '--b': b, '--c': c } as CSSProperties} />;
};
export const THEME_OPTIONS = THEMES.map((t) => ({ value: t, label: THEME_META[t].label, icon: <Swatch t={t} /> }));
export const BACKDROPS = { none: '', garden: persianGarden, monstera } as const;
export const BACKDROP_OPTIONS = [{ value: 'garden', label: 'Persian garden' }, { value: 'monstera', label: 'Monstera' }, { value: 'none', label: 'None' }] as const;
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
        CODE
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
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </summary>
      <pre>{children}</pre>
    </details>
  );
}

export function Spec({ n, title, text, keys, code, children }: { n: string; title: string; text: ReactNode; keys?: Array<[string, string]>; code?: string; children: ReactNode }) {
  const mode = useContext(GalleryMode);
  if (mode.compact)
    return (
      <section className="sc-spec sc-spec--compact">
        <div className="sc-about">
          <span className="sc-num">{n}</span>
          <b className="sc-title">{title}</b>
        </div>
        <div className="sc-demo">{children}</div>
      </section>
    );
  return (
    <section className="sc-spec" id={'s' + n}>
      <div className="sc-about">
        <span className="sc-num">{n}</span>
        <b className="sc-title">{title}</b>
        <p className="sc-text">{text}</p>
        {keys ? (
          <div className="sc-keys">
            {keys.map(([k, v]) => (
              <span key={k} style={{ display: 'contents' }}>
                <b>{k}</b>
                <span>{v}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="sc-demo">
        {children}
        {code && mode.code ? <Code>{code.trim()}</Code> : null}
      </div>
    </section>
  );
}

/** A part heading. Its id (`part-<slug>`) is what the contents nav in the bar jumps to. */
export const partId = (title: string) => 'part-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const Part = ({ title, note }: { title: string; note: string }) => (
  <div className="sc-part" id={partId(title)} data-part={title}>
    <h2>{title}</h2>
    <span>{note}</span>
  </div>
);
