import type { CSSProperties, ElementType, ReactNode } from 'react';
import { cx } from '../core/utils';

/* ARTINOS Text and layout — the type roles and the two spacing primitives everything else is
   composed with, so a panel never needs a hand-set font size, margin or gap.
 *   Text    display · title · heading · subheading · overline · lead · body · note · caption ·
 *           label · value · quote · code, in a tone and a face
 *   Stack   a column whose gaps come from the space scale
 *   Inline  a row whose gaps come from the space scale */

export type TextVariant = 'display' | 'title' | 'heading' | 'subheading' | 'overline' | 'kicker' | 'lead' | 'body' | 'note' | 'caption' | 'label' | 'value' | 'quote' | 'code';
export type TextFace = 'sans' | 'serif' | 'mono';
export type TextTone = 'hi' | 'mid' | 'low' | 'faint' | 'signal' | 'warn' | 'fault';

/** Each role's element when `as` is not given. */
const TAGS: Record<TextVariant, ElementType> = {
  display: 'h1',
  title: 'h2',
  heading: 'h3',
  subheading: 'h4',
  overline: 'span',
  kicker: 'span',
  lead: 'p',
  body: 'p',
  note: 'p',
  caption: 'p',
  label: 'span',
  value: 'span',
  quote: 'blockquote',
  code: 'code',
};

export interface TextProps {
  /** The role, which sets size, weight, face, leading and ink:
   *  display (a hero figure or headline) · title (a panel or page title) · heading (a group's
   *  name in prose) · subheading (a heading inside a group) · overline (a small label above a
   *  title, in the accent; kicker is the same in the ink) · lead (the opening paragraph) · body
   *  (a paragraph) · note (help and asides) · caption (a line under a figure) · label (the name
   *  of a thing) · value (a figure in the mono) · quote (a pull quote in the serif) · code (inline
   *  code). Default body. Inside any of them, strong, em, mark, code, kbd and a are styled. */
  variant?: TextVariant;
  /** The face: sans (default for most roles), serif (an editorial title or quote), mono. */
  face?: TextFace;
  /** Ink. Default: the role's own (titles hi, body mid, captions low…). */
  tone?: TextTone;
  align?: 'start' | 'center' | 'end';
  /** One line, cut with an ellipsis. */
  truncate?: boolean;
  /** At most this many lines, the last cut with an ellipsis. */
  lines?: number;
  /** Keep a paragraph to a comfortable line length (--ar-measure). Default true for lead, body,
   *  note, caption and quote. */
  measure?: boolean;
  as?: ElementType;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

const MEASURED: ReadonlySet<TextVariant> = new Set(['lead', 'body', 'note', 'caption', 'quote']);

export function Text({ variant = 'body', face, tone, align, truncate, lines, measure, as, children, className, style, id }: TextProps) {
  const Tag = (as ?? TAGS[variant]) as 'p';
  const measured = measure ?? MEASURED.has(variant);
  return (
    <Tag
      id={id}
      className={cx('ar-type', className)}
      data-variant={variant}
      data-face={face}
      data-tone={tone}
      data-align={align && align !== 'start' ? align : undefined}
      data-truncate={truncate ? '' : undefined}
      data-measure={measured ? '' : undefined}
      style={lines ? ({ '--_lines': lines, ...style } as CSSProperties) : style}
      data-lines={lines ? '' : undefined}
    >
      {children}
    </Tag>
  );
}

/** A step on the space scale (1–9: 2 · 4 · 6 · 8 · 12 · 16 · 20 · 24 · 32 px), or a role:
 *  row (between rows in a group), group (between groups), none. */
export type Space = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 'row' | 'group' | 'none';

const gapOf = (g: Space) => (g === 'row' ? 'var(--ar-row-gap)' : g === 'group' ? 'var(--ar-group-gap)' : g === 'none' || g === 0 ? '0px' : `var(--ar-space-${g})`);

export interface StackProps {
  /** The gap between children. Default 'row'. */
  gap?: Space;
  /** How children sit across the column. Default stretch. */
  align?: 'stretch' | 'start' | 'center' | 'end';
  as?: ElementType;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

/** Stack — a column whose gaps come from the space scale. */
export function Stack({ gap = 'row', align, as = 'div', children, className, style, id }: StackProps) {
  const Tag = as as 'div';
  return (
    <Tag id={id} className={cx('ar-stack', className)} data-align={align && align !== 'stretch' ? align : undefined} style={{ '--_gap': gapOf(gap), ...style } as CSSProperties}>
      {children}
    </Tag>
  );
}

export interface InlineProps {
  /** The gap between children. Default 4 (8 px). */
  gap?: Space;
  /** How children sit across the row. Default center; baseline lines up text of different sizes. */
  align?: 'center' | 'baseline' | 'start' | 'end' | 'stretch';
  /** How the row's children spread along it; between pushes the first and last to the ends. */
  justify?: 'start' | 'center' | 'end' | 'between';
  /** Let children wrap onto further rows. */
  wrap?: boolean;
  as?: ElementType;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

/** Inline — a row whose gaps come from the space scale. */
export function Inline({ gap = 4, align, justify, wrap, as = 'div', children, className, style, id }: InlineProps) {
  const Tag = as as 'div';
  return (
    <Tag
      id={id}
      className={cx('ar-inline', className)}
      data-align={align && align !== 'center' ? align : undefined}
      data-justify={justify && justify !== 'start' ? justify : undefined}
      data-wrap={wrap ? '' : undefined}
      style={{ '--_gap': gapOf(gap), ...style } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
