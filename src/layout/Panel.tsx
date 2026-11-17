'use client';
import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ElementType, ReactNode } from 'react';
import { useControllable, useLabelColumn } from '../core/hooks';
import { autoHideAttrs, useInterfaceVisibility } from '../core/autohide';
import { RollingText } from '../core/RollingValue';
import { FieldContext } from '../core/field';
import { useSortable } from '../core/sortable';
import type { SortPlace } from '../core/sortable';
import { cx, revealClipped } from '../core/utils';
import { TabsDefaults } from './Tabs';
import { PaneContext } from '../core/pane';

/* ARTINOS layout — the frames controls live in.
 *   Panel         frosted card: header (icon · title · subtitle · actions), body, foot status line;
 *                 glass, solid or inset; collapsible; a scrolling body past maxHeight
 *   SectionGroup  sections that behave together: an accordion, expand / collapse all
 *   Section       a titled group: description, icon, count, reset, card, columns, remembered fold
 *   Field    property row: label column + control(s) — the "Width [268] [Fixed ˅]" form
 */

export interface PanelProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** A small mark before the title: an icon, a swatch. */
  icon?: ReactNode;
  /** Right side of the header: icon buttons, status dot… */
  actions?: ReactNode;
  /** Slot between header and body, e.g. <Tabs>. */
  tabs?: ReactNode;
  /** top (default): the tabs run across under the header · side: they become a rail down the
   *  left of the body (a Tabs inside turns vertical), for a panel with many views or a settings sheet. */
  tabsPlacement?: 'top' | 'side';
  /** Foot status line. */
  footer?: ReactNode;
  /** glass: the theme's frosted pane (default) · solid: opaque, for busy scenes · inset: a quiet
   *  hairline frame with no glass of its own, for a panel inside a panel. */
  variant?: 'glass' | 'solid' | 'inset';
  /** Fold the panel to its header: a click on the title or the chevron. */
  collapsible?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The body scrolls past this height, its edges fading so the cut reads as deliberate. */
  maxHeight?: number | string;
  /** One label column for every Field inside, so their labels line up (e.g. 96). */
  labelWidth?: number | string;
  /** Fade out with the interface (a Dock's hideKey or idleHide, `useAutoHide`, `interfaceVisibility`):
   *  for a panel floating over a canvas. A panel inside a Dock already hides with it. */
  autoHide?: boolean;
  children?: ReactNode;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

/** The shared Field label column a Panel or Section hands down. */
const labelColumn = (w: number | string | undefined): CSSProperties | undefined =>
  w === undefined ? undefined : ({ '--ar-field-label-w': typeof w === 'number' ? w + 'px' : w } as CSSProperties);

const Chevron = ({ up }: { up: boolean }) => (
  <svg className="ar-chevron" data-up={up ? '' : undefined} viewBox="0 0 10 6" aria-hidden="true">
    <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function Panel({ title, subtitle, icon, actions, tabs, tabsPlacement = 'top', footer, variant = 'glass', collapsible = false, open, defaultOpen = true, onOpenChange, maxHeight, labelWidth, autoHide = false, children, as = 'section', className, style, id }: PanelProps) {
  // Narrowed for JSX: hosts that augment JSX.IntrinsicElements (React Three Fiber) make
  // the full ElementType union too large for TypeScript to call. Any tag renders the same.
  const Tag = as as 'section';
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  // in a Dock pane the panel is the pane: its tab carries the name, the pane its glass
  const inPane = useContext(PaneContext);
  const shown = !collapsible || isOpen;
  const bodyId = useId();
  const ui = useInterfaceVisibility();
  // the label column fits the longest name in the panel; a labelWidth, or the pane around it, decides instead
  const fit = labelWidth === undefined && !inPane;
  const rootRef = useRef<HTMLElement>(null);
  useLabelColumn(rootRef, fit);
  const hiding = autoHide && !inPane ? autoHideAttrs(ui) : undefined;
  const titles = (
    <div className="ar-panel__titles">
      {title && !inPane ? <div className="ar-panel__title">{title}</div> : null}
      {subtitle ? <div className="ar-panel__subtitle">{subtitle}</div> : null}
    </div>
  );
  return (
    <Tag ref={rootRef} id={id} data-ar-label-fit={fit ? '' : undefined} className={cx('ar-panel', className)} data-variant={variant === 'glass' ? undefined : variant} data-open={shown ? '' : undefined} data-tabs={tabs && tabsPlacement === 'side' ? 'side' : undefined} data-pane={inPane ? '' : undefined} aria-label={inPane && typeof title === 'string' ? title : undefined} style={{ ...labelColumn(labelWidth), ...style }} {...hiding} inert={(hiding && !ui.visible) || undefined}>
      {(inPane ? subtitle || actions : title || subtitle || actions || icon) ? (
        <header className="ar-panel__head">
          {icon && !inPane ? <span className="ar-panel__icon">{icon}</span> : null}
          {collapsible ? (
            <button type="button" className="ar-panel__toggle" aria-expanded={shown} aria-controls={bodyId} onClick={() => setOpen(!isOpen)}>
              {titles}
            </button>
          ) : (
            titles
          )}
          {actions ? <div className="ar-panel__actions">{actions}</div> : null}
          {collapsible ? (
            <button type="button" className="ar-panel__chevron" tabIndex={-1} aria-hidden="true" onClick={() => setOpen(!isOpen)}>
              <Chevron up={shown} />
            </button>
          ) : null}
        </header>
      ) : null}
      <div className="ar-panel__fold" id={bodyId} inert={!shown || undefined}>
        <div className="ar-panel__inner">
          {tabs ? (
            <div className="ar-panel__tabs">
              {tabsPlacement === 'side' ? <TabsDefaults.Provider value={{ orientation: 'vertical' }}>{tabs}</TabsDefaults.Provider> : tabs}
            </div>
          ) : null}
          <div
            className="ar-panel__body"
            data-scroll={maxHeight !== undefined ? '' : undefined}
            style={maxHeight !== undefined ? { maxHeight: typeof maxHeight === 'number' ? maxHeight + 'px' : maxHeight } : undefined}
          >
            {/* what the panel holds is not the pane: a panel inside it is drawn as usual */}
            {inPane ? <PaneContext.Provider value={false}>{children}</PaneContext.Provider> : children}
          </div>
          {footer ? <footer className="ar-panel__foot">{footer}</footer> : null}
        </div>
      </div>
    </Tag>
  );
}

/* ---------- SectionGroup: sections that behave together ---------- */

interface GroupState {
  accordion: boolean;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  /** expand or collapse all, stamped so each press reaches every section once */
  command: { open: boolean; stamp: number } | null;
}
const SectionGroupContext = createContext<GroupState | null>(null);

export interface SectionGroupProps {
  /** One open at a time: opening a section closes the one that was open. Give each Section an id. */
  accordion?: boolean;
  /** The id of the section open at first (accordion). */
  defaultOpen?: string | null;
  /** Expand all · Collapse all, above the sections. */
  toolbar?: boolean;
  /** Accessible name of the group. */
  label?: string;
  /** Drag sections by their heading to reorder (Alt+↑/↓ on a heading): onReorder(from, to). */
  onReorder?: (from: number, to: number) => void;
  /** Groups that share a group name trade sections by drag — across panels and dock panes:
   *  onMove({ list, index }, { list, index }). Give each SectionGroup an id. */
  group?: string;
  id?: string;
  onMove?: (from: SortPlace, to: SortPlace) => void;
  /** A section dropped outside every group asks to become its own floating panel at that point.
   *  createDockSections wires this to the Dock for you. */
  onTearOff?: (from: SortPlace, at: { x: number; y: number }) => void;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function SectionGroup({ accordion = false, defaultOpen = null, toolbar = false, label, onReorder, group, id, onMove, onTearOff, children, className, style }: SectionGroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const autoId = useId();
  const sortable = !!(onReorder || onMove);
  useSortable(ref, {
    id: id ?? autoId,
    group,
    itemSelector: ':scope > .ar-section',
    handleSelector: '.ar-section__head',
    enabled: sortable,
    onMove: (from, to) => (onMove ? onMove(from, to) : from.list === to.list && onReorder?.(from.index, to.index)),
    onTearOff,
  });
  const [openId, setOpenId] = useState<string | null>(defaultOpen);
  const [command, setCommand] = useState<GroupState['command']>(null);
  const value = useMemo(() => ({ accordion, openId, setOpenId, command }), [accordion, openId, command]);
  const all = (open: boolean) => {
    if (accordion) {
      if (!open) setOpenId(null);
      return;
    }
    setCommand({ open, stamp: (command?.stamp ?? 0) + 1 });
  };
  return (
    <div ref={ref} id={id} role="group" aria-label={label} className={cx('ar-section-group', className)} data-accordion={accordion ? '' : undefined} data-sortable={sortable ? '' : undefined} style={style}>
      {toolbar ? (
        <div className="ar-section-group__bar">
          {accordion ? null : (
            <button type="button" className="ar-section-group__all" onClick={() => all(true)}>
              Expand all
            </button>
          )}
          <button type="button" className="ar-section-group__all" onClick={() => all(false)}>
            Collapse all
          </button>
        </div>
      ) : null}
      <SectionGroupContext.Provider value={value}>{children}</SectionGroupContext.Provider>
    </div>
  );
}

export interface SectionProps {
  title: ReactNode;
  /** A quiet line under the heading, at the top of the body: what this group does. */
  description?: ReactNode;
  /** Quiet info right after the title: a count (numbers roll) or a short note such as
   *  "1 changed · 3". Clicking it folds the group like the title. */
  count?: ReactNode;
  /** Slim things that belong to the group, at the end of the title row before the chevron: a status Badge, a tool. */
  actions?: ReactNode;
  /** Something in the group differs from its default: with onReset, a reset button shows in the title row. */
  modified?: boolean;
  onReset?: () => void;
  /** The group's on/off, shown by an LED before the title. One click on the title row folds the
   *  group open or closed; a double-click (or Shift+Enter) switches it on or off. Off folds it
   *  closed and makes it inert; values are kept, and on restores the fold it had. The chevron
   *  always shows. */
  enabled?: boolean;
  defaultEnabled?: boolean;
  onEnabledChange?: (on: boolean) => void;
  collapsible?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Remember open or closed across visits (localStorage), under this key. Makes it collapsible. */
  storageKey?: string;
  /** caps: a small sentence-case name (default) · text: a larger title (inspector) */
  heading?: 'caps' | 'text';
  /** plain: a heading over its rows, on a hairline (the default) · card: the group sits on a soft tonal surface. */
  variant?: 'plain' | 'card';
  /** Lay the rows out in 2 or 3 columns (each child is a cell). */
  columns?: 1 | 2 | 3;
  /** One label column for every Field inside, so their labels line up (e.g. 96). */
  labelWidth?: number | string;
  /** Needed inside an accordion SectionGroup. */
  id?: string;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Section({
  title,
  description,
  count,
  actions,
  modified = false,
  onReset,
  enabled,
  defaultEnabled,
  onEnabledChange,
  collapsible = false,
  open,
  defaultOpen = true,
  onOpenChange,
  storageKey,
  heading = 'caps',
  variant = 'plain',
  columns = 1,
  labelWidth,
  id,
  children,
  className,
  style,
}: SectionProps) {
  const group = useContext(SectionGroupContext);
  const autoId = useId();
  const key = id ?? autoId;
  const inAccordion = !!group?.accordion && open === undefined;
  const [own, setOwn] = useControllable(open, defaultOpen, onOpenChange);
  const isOpen = inAccordion ? group!.openId === key : own;
  const setOpen = (v: boolean) => {
    if (inAccordion) {
      group!.setOpenId(v ? key : null);
      onOpenChange?.(v);
    } else setOwn(v);
    if (storageKey) {
      try {
        localStorage.setItem('ar-section:' + storageKey, v ? '1' : '0');
      } catch {
        /* storage unavailable: the fold just is not remembered */
      }
    }
  };
  // remembered fold: read after mount, so the server's HTML and the first render agree
  useEffect(() => {
    if (!storageKey || open !== undefined || inAccordion) return;
    try {
      const v = localStorage.getItem('ar-section:' + storageKey);
      if (v !== null && (v === '1') !== own) setOwn(v === '1');
    } catch {
      /* storage unavailable */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);
  // Expand all · Collapse all from the group
  const stamp = group?.command?.stamp;
  useEffect(() => {
    if (!group?.command || inAccordion) return;
    setOpen(group.command.open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stamp]);

  const toggleable = enabled !== undefined || defaultEnabled !== undefined;
  const [isOn, setOn] = useControllable(enabled, defaultEnabled ?? true, onEnabledChange);
  // a switchable group always shows its chevron, so it can always be folded; so does one in an
  // accordion, in a group with expand / collapse all, or one that remembers its fold
  const foldable = collapsible || toggleable || inAccordion || storageKey !== undefined || !!group;
  const bodyId = useId();
  const off = toggleable && !isOn;
  // switching the group off folds it closed, like collapsing it; on, it unfolds to where it was
  const shown = (!foldable || isOpen) && !off;
  const titleId = useId();
  const hintId = useId();
  // On a switchable group a click waits a moment for a possible second click: a double-click
  // switches the group, a single click folds it. Plain collapsible groups fold at once.
  const pending = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(pending.current), []);
  const onTriggerClick = (event: { detail: number; shiftKey: boolean }) => {
    if (!toggleable) return setOpen(!isOpen);
    clearTimeout(pending.current);
    if (event.detail === 0) {
      // the keyboard: Enter / Space fold, Shift+Enter switches
      if (event.shiftKey) setOn(!isOn);
      else if (!off) setOpen(!isOpen);
      return;
    }
    if (event.detail >= 2) return setOn(!isOn);
    if (off) return;
    pending.current = setTimeout(() => setOpen(!isOpen), 220);
  };
  const titleText = (
    <>
      {/* a switchable group says on or off with an LED before its title */}
      {toggleable ? <i className="ar-led ar-section__led" data-on={isOn ? '' : undefined} /> : null}
      <span className="ar-section__title" id={titleId}>
        {title}
      </span>
    </>
  );
  const rest = (
    <>
      {count != null ? (
        <span className="ar-section__count">{typeof count === 'number' || typeof count === 'string' ? <RollingText text={String(count)} base={0} /> : count}</span>
      ) : null}
      {/* the section's hairline, between the title and the count; still the fold's hit area */}
      <i className="ar-section__rule" />
    </>
  );
  return (
    <div
      id={id}
      className={cx('ar-section', className)}
      data-heading={heading}
      data-variant={variant === 'card' ? 'card' : undefined}
      data-open={shown ? '' : undefined}
      data-off={off ? '' : undefined}
      data-switchable={toggleable ? '' : undefined}
      style={{ ...labelColumn(labelWidth), ...style }}
    >
      <div className="ar-section__head" onPointerEnter={(e) => revealClipped(e.currentTarget, e.currentTarget.querySelector<HTMLElement>('.ar-section__title'))}>
        {foldable ? (
          <button
            type="button"
            className="ar-section__trigger"
            aria-expanded={shown}
            aria-controls={bodyId}
            aria-describedby={toggleable ? hintId : undefined}
            onClick={onTriggerClick}
          >
            {titleText}
            {rest}
            {toggleable ? (
              <span className="ar-sr" id={hintId}>
                {isOn ? 'On' : 'Off'}. Double-click or Shift+Enter to switch {isOn ? 'off' : 'on'}.
              </span>
            ) : null}
          </button>
        ) : (
          <span className="ar-section__trigger">
            {titleText}
            {rest}
          </span>
        )}
        {onReset && modified ? (
          <button type="button" className="ar-tool ar-section__reset" aria-label={'Reset ' + (typeof title === 'string' ? title : 'group')} title="Reset to defaults" onClick={onReset}>
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2.5 6a3.5 3.5 0 1 0 1.1-2.55M2.5 2v2.2h2.2" />
            </svg>
          </button>
        ) : null}
        {actions ? <span className="ar-section__actions">{actions}</span> : null}
        {foldable ? (
          // the chevron mirrors the title; switched off, it stays and points closed
          <button type="button" className="ar-section__chevron" tabIndex={-1} aria-hidden="true" disabled={off} onClick={() => setOpen(!isOpen)}>
            <Chevron up={shown} />
          </button>
        ) : null}
      </div>
      <div className="ar-section__fold" id={bodyId} inert={!shown || undefined}>
        <div className="ar-section__body" data-columns={columns > 1 ? columns : undefined}>
          {description != null ? <p className="ar-section__description">{description}</p> : null}
          {children}
        </div>
      </div>
    </div>
  );
}

export interface FieldProps {
  label: ReactNode;
  children?: ReactNode;
  /** Label column width (inline layout). Default 108px (token --ar-field-label-w). */
  labelWidth?: number | string;
  /** inline: the label in a column beside the control (inspectors) · stacked: the label above it (forms). */
  layout?: 'inline' | 'stacked';
  /** A quiet line under the control: what to enter, a limit, a default. */
  hint?: ReactNode;
  /** What is wrong, in words. Replaces the hint, turns the line and the control's ring the fault colour. */
  error?: ReactNode;
  /** Marks the label and tells the control. */
  required?: boolean;
  /** row: a label beside its value (default) · hero: the panel's one big statement, large and light, where an <em> word takes the serif and the accent · quote: someone's words, in the serif's italic. Use each sparingly: a panel has one focal point. */
  variant?: 'row' | 'hero' | 'quote';
  className?: string;
  style?: CSSProperties;
}

export function Field({ label, children, labelWidth, layout = 'inline', hint, error, required, variant = 'row', className, style }: FieldProps) {
  const lw = labelWidth === undefined ? undefined : typeof labelWidth === 'number' ? labelWidth + 'px' : labelWidth;
  const id = useId().replace(/:/g, '');
  const message = error ?? hint;
  const invalid = error != null && error !== false;
  return (
    <div
      className={cx('ar-field', className)}
      data-layout={layout === 'stacked' ? 'stacked' : undefined}
      data-variant={variant === 'row' ? undefined : variant}
      data-invalid={invalid ? '' : undefined}
      style={{ ...(lw ? ({ '--ar-field-label-w': lw } as CSSProperties) : null), ...style }}
    >
      <label className="ar-field__label" htmlFor={id + '-control'}>
        {label}
        {required ? (
          <span className="ar-field__required" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      <div className="ar-field__control">
        <FieldContext.Provider value={{ controlId: id + '-control', describedBy: message != null ? id + '-message' : undefined, invalid, required }}>{children}</FieldContext.Provider>
      </div>
      {message != null ? (
        <span id={id + '-message'} className="ar-field__message" role={invalid ? 'alert' : undefined}>
          {message}
        </span>
      ) : null}
    </div>
  );
}
