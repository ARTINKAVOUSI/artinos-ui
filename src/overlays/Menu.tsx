'use client';
import { usePresence, useGlide } from '../core/motion';
import { ThemedPortal } from '../core/portal';
import {
  cloneElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

export type MenuEntry =
  | {
      type?: 'item';
      id: string;
      label: ReactNode;
      icon?: ReactNode;
      shortcut?: string;
      disabled?: boolean;
      danger?: boolean;
      checked?: boolean;
      onSelect: () => void;
    }
  | { type: 'separator' }
  | { type: 'label'; label: ReactNode };

const stop = (event: { stopPropagation: () => void }) => event.stopPropagation();

type Item = Extract<MenuEntry, { onSelect: () => void }>;
const isItem = (entry: MenuEntry): entry is Item => entry.type === undefined || entry.type === 'item';

/** Where the list opens: under an element (a button) or at a point (a right-click). */
type Anchor = { rect: DOMRect; align: 'start' | 'end' } | { x: number; y: number };

/**
 * The list both menus share: portalled, placed to stay on screen, keyboard
 * driven (arrows, Home, End, Enter, Escape), closed by an outside press.
 */
function MenuList({
  items,
  anchor,
  onClose,
  owner,
  leaving = false,
}: {
  items: readonly MenuEntry[];
  anchor: Anchor;
  onClose: (restoreFocus: boolean) => void;
  owner?: HTMLElement | null;
  /** Playing its exit: no longer interactive. */
  leaving?: boolean;
}) {
  const id = useId();
  const list = useRef<HTMLDivElement>(null);
  const glide = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(-1);
  // `above`: the list opened upward, so it grows from its bottom edge
  const [position, setPosition] = useState<{ left: number; top: number; above: boolean } | null>(null);
  useGlide(list, glide);
  const enabled = items.map((entry, index) => (isItem(entry) && !entry.disabled ? index : -1)).filter((index) => index >= 0);

  useLayoutEffect(() => {
    if (!list.current) return;
    const m = list.current.getBoundingClientRect();
    let left: number;
    let top: number;
    let above = false;
    if ('rect' in anchor) {
      left = anchor.align === 'end' ? anchor.rect.right - m.width : anchor.rect.left;
      top = anchor.rect.bottom + 4;
      if (top + m.height > window.innerHeight - 4) {
        top = Math.max(4, anchor.rect.top - m.height - 4);
        above = true;
      }
    } else {
      left = anchor.x;
      top = anchor.y;
      if (top + m.height > window.innerHeight - 4) {
        top = Math.max(4, anchor.y - m.height);
        above = true;
      }
    }
    left = Math.min(window.innerWidth - m.width - 4, Math.max(4, left));
    setPosition({ left, top, above });
    list.current.focus();
  }, [anchor]);

  // Callers pass a new onClose every render; the listeners below read the latest
  // one, so they bind once per open instead of on every render.
  const closeRef = useRef(onClose);
  useLayoutEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const close = () => closeRef.current(false);
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      // A press on the trigger itself is its own click: it toggles the menu.
      if (!list.current?.contains(target) && !owner?.contains(target)) close();
    };
    // The list scrolls itself when it is long: only a wheel elsewhere closes it.
    const onWheel = (event: WheelEvent) => {
      if (!list.current?.contains(event.target as Node)) close();
    };
    window.addEventListener('pointerdown', onPointer, true);
    window.addEventListener('blur', close);
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onPointer, true);
      window.removeEventListener('blur', close);
      window.removeEventListener('wheel', onWheel);
    };
  }, [owner]);

  const select = (index: number) => {
    const entry = items[index];
    if (!entry || !isItem(entry) || entry.disabled) return;
    onClose(true);
    entry.onSelect();
  };

  return (
    <ThemedPortal>
      <div
        ref={list}
        id={id}
        role="menu"
        tabIndex={-1}
        className="ar-menu"
        data-state={leaving ? 'closing' : position ? 'open' : undefined}
        data-side={position?.above ? 'above' : 'below'}
        style={{ left: position?.left ?? -9999, top: position?.top ?? -9999 }}
        // A portal's events still bubble up the React tree, to whatever rendered
        // the menu: a drag handle there (a dock strip) would start a drag.
        onPointerDown={stop}
        onPointerMove={stop}
        onPointerUp={stop}
        onMouseDown={stop}
        onClick={stop}
        onDoubleClick={stop}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onKeyDown={(event) => {
          event.stopPropagation();
          const at = enabled.indexOf(active);
          if (event.key === 'ArrowDown') setActive(enabled[(at + 1) % enabled.length] ?? -1);
          else if (event.key === 'ArrowUp')
            setActive(enabled[(Math.max(at, 0) - 1 + enabled.length) % enabled.length] ?? -1); // nothing highlighted → the last item
          else if (event.key === 'Home') setActive(enabled[0] ?? -1);
          else if (event.key === 'End') setActive(enabled[enabled.length - 1] ?? -1);
          else if (event.key === 'Enter' || event.key === ' ') select(active);
          else if (event.key === 'Escape' || event.key === 'Tab') onClose(event.key === 'Escape');
          else return;
          event.preventDefault();
        }}
      >
        <span ref={glide} className="ar-menu__glide" aria-hidden />
        {items.map((entry, index) => {
          if (entry.type === 'separator') return <div key={index} className="ar-menu__separator" role="separator" />;
          if (entry.type === 'label')
            return (
              <div key={index} className="ar-menu__label">
                {entry.label}
              </div>
            );
          return (
            <div
              key={entry.id}
              role={entry.checked === undefined ? 'menuitem' : 'menuitemcheckbox'}
              aria-checked={entry.checked}
              aria-disabled={entry.disabled || undefined}
              className="ar-menu__item"
              data-active={index === active || undefined}
              data-danger={entry.danger || undefined}
              onPointerEnter={() => !entry.disabled && setActive(index)}
              onClick={() => select(index)}
            >
              <span className="ar-menu__icon">
                {/* a checkable item shows the Select's LED: lit when on */}
                {entry.checked !== undefined ? <i className="ar-led" data-on={entry.checked ? '' : undefined} /> : entry.icon}
              </span>
              <span className="ar-menu__text">{entry.label}</span>
              {entry.shortcut && <span className="ar-menu__shortcut">{entry.shortcut}</span>}
            </div>
          );
        })}
      </div>
    </ThemedPortal>
  );
}

export interface MenuProps {
  /** The trigger — one button. It is wired to open the menu. */
  trigger: ReactElement<Record<string, unknown>>;
  items: readonly MenuEntry[];
  align?: 'start' | 'end';
}

/** Menu — a dropdown of actions opened from a button. */
export function Menu({ trigger, items, align = 'start' }: MenuProps) {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const button = useRef<HTMLElement | null>(null);

  const close = (restoreFocus: boolean) => {
    setAnchor(null);
    if (restoreFocus) button.current?.focus();
  };

  const wired = cloneElement(trigger, {
    'aria-haspopup': 'menu',
    'aria-expanded': anchor !== null,
    onClick: (event: MouseEvent) => {
      (trigger.props.onClick as ((event: MouseEvent) => void) | undefined)?.(event);
      button.current = event.currentTarget as HTMLElement;
      setAnchor((open) => (open ? null : { rect: button.current!.getBoundingClientRect(), align }));
    },
  });

  const { shown, leaving } = usePresence(anchor, 140);
  return (
    <>
      {wired}
      {shown && <MenuList items={items} anchor={shown} onClose={close} owner={button.current} leaving={leaving} />}
    </>
  );
}

export interface ContextMenuProps {
  /** Built when the menu opens, so it always reflects the current value. */
  items: () => readonly MenuEntry[];
  children: ReactNode;
  /** Off, the browser's own menu shows instead. */
  disabled?: boolean;
}

/**
 * ContextMenu — the same menu, opened by a right-click (or the keyboard's
 * Menu key / Shift+F10) anywhere inside its children. It adds no box of its
 * own (`display: contents`), so wrapping a row never changes the layout.
 */
export function ContextMenu({ items, children, disabled = false }: ContextMenuProps) {
  const [open, setOpen] = useState<{ anchor: Anchor; items: readonly MenuEntry[]; from: HTMLElement | null } | null>(null);

  const onContextMenu = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    // Text fields keep the browser's menu (cut, copy, paste, spelling).
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, [contenteditable="true"]')) return;
    event.preventDefault();
    // Handled here: an outer right-click handler (the dock's panel menu) must not open too.
    event.stopPropagation();
    const keyboard = event.clientX === 0 && event.clientY === 0;
    const rect = target.getBoundingClientRect();
    const anchor: Anchor = keyboard ? { x: rect.left, y: rect.bottom + 4 } : { x: event.clientX, y: event.clientY };
    setOpen({ anchor, items: items(), from: document.activeElement as HTMLElement | null });
  };

  const { shown, leaving } = usePresence(open, 140);
  return (
    <div className="ar-context" onContextMenu={onContextMenu}>
      {children}
      {shown && (
        <MenuList
          items={shown.items}
          anchor={shown.anchor}
          leaving={leaving}
          onClose={(restoreFocus) => {
            if (restoreFocus) shown.from?.focus?.();
            setOpen(null);
          }}
        />
      )}
    </div>
  );
}

