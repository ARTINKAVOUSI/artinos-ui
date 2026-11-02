/* Zones: ranges of a value that read differently, shared by Meter, Spectrum and Stat. */

export type InstrumentTone = 'live' | 'warm' | 'neutral' | 'hot';

export interface Zone {
  /** The zone starts here, in the instrument's own units, and runs to the next one. */
  from: number;
  tone: InstrumentTone;
}

const TONE_INK: Record<InstrumentTone, string> = {
  live: 'var(--ar-signal)',
  warm: 'var(--ar-warn)',
  neutral: 'var(--ar-text-low)',
  hot: 'var(--ar-fault)',
};

/** The tone at `value`: the last zone it has reached, else `base`. */
export function toneAt(zones: readonly Zone[] | undefined, value: number, base: InstrumentTone): InstrumentTone {
  let tone = base;
  let reached = -Infinity;
  for (const z of zones ?? []) {
    if (value >= z.from && z.from >= reached) {
      tone = z.tone;
      reached = z.from;
    }
  }
  return tone;
}

/** The zones painted along a track from min to max. `feather` softens each join, in percent. */
export function zoneGradient(zones: readonly Zone[], base: InstrumentTone, min: number, max: number, angle: string, feather: number) {
  const pct = (v: number) => ((v - min) / (max - min || 1)) * 100;
  const sorted = [...zones].sort((a, b) => a.from - b.from);
  const stops = [`${TONE_INK[base]} 0%`];
  let ink = TONE_INK[base];
  for (const z of sorted) {
    const at = pct(z.from);
    stops.push(`${ink} ${(at - feather).toFixed(2)}%`, `${TONE_INK[z.tone]} ${(at + feather).toFixed(2)}%`);
    ink = TONE_INK[z.tone];
  }
  stops.push(`${ink} 100%`);
  return `linear-gradient(${angle}, ${stops.join(', ')})`;
}
