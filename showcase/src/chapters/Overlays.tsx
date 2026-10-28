/* 07 · Overlays — menus, the dialog, toasts, tooltips and the command palette. All of them
   are the one frosted sheet, portalled to <body>, keeping the theme they were opened in. */
import { useState } from 'react';
import { Button, CommandPalette, ContextMenu, Dialog, IconButton, Kbd, Menu, Tooltip, useToast } from '../../../src';
import type { Command, MenuEntry } from '../../../src';
import { Chapter, ICONS, Spec } from '../shared';
import { IC } from './demos';

function Menus() {
  const notify = useToast();
  const [snap, setSnap] = useState(true);
  const [grid, setGrid] = useState(false);
  const items: MenuEntry[] = [
    { type: 'label', label: 'Object' },
    { id: 'dup', label: 'Duplicate', icon: IC.copy, shortcut: 'Ctrl D', onSelect: () => notify({ title: 'Duplicated', tone: 'success' }) },
    { id: 'hide', label: 'Hide', icon: IC.eye, onSelect: () => notify({ title: 'Hidden' }) },
    { type: 'separator' },
    { type: 'label', label: 'View' },
    { id: 'snap', label: 'Snap to grid', checked: snap, onSelect: () => setSnap((v) => !v) },
    { id: 'grid', label: 'Show grid', checked: grid, onSelect: () => setGrid((v) => !v) },
    { type: 'separator' },
    { id: 'del', label: 'Delete', icon: IC.trash, danger: true, onSelect: () => notify({ title: 'Deleted', tone: 'error' }) },
  ];
  return (
    <div className="sc-stack">
      <div className="sc-row" style={{ alignItems: 'center' }}>
        <Menu trigger={<Button icon={IC.more}>Object</Button>} items={items} />
        <Menu trigger={<Button variant="ghost">Aligned to the end</Button>} items={items.slice(0, 4)} align="end" />
      </div>
      <ContextMenu
        items={() => [
          { id: 'copy', label: 'Copy', icon: IC.copy, shortcut: 'Ctrl C', onSelect: () => notify({ title: 'Copied' }) },
          { id: 'paste', label: 'Paste', onSelect: () => undefined, disabled: true },
          { type: 'separator' },
          { id: 'del', label: 'Delete', icon: IC.trash, danger: true, onSelect: () => notify({ title: 'Deleted', tone: 'error' }) },
        ]}
      >
        <div className="sc-drop-hint">Right-click here for a context menu</div>
      </ContextMenu>
    </div>
  );
}

function DialogDemo() {
  const [open, setOpen] = useState(false);
  const notify = useToast();
  return (
    <div className="sc-row" style={{ alignItems: 'center' }}>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete the orb…
      </Button>
      <span className="sc-note">Escape or the backdrop cancels; focus returns to the button.</span>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete the orb?"
        description="It is removed from the scene and its graph. This can't be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => (setOpen(false), notify({ title: 'Deleted', tone: 'error' }))}>
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}

function Toasts() {
  const notify = useToast();
  return (
    <div className="sc-row" style={{ alignItems: 'center' }}>
      <Button onClick={() => notify({ title: 'Render queued', description: 'Frame 1–240 · 4K', action: { label: 'Undo', onClick: () => notify({ title: 'Cancelled' }) } })}>Neutral</Button>
      <Button onClick={() => notify({ title: 'Saved', description: 'scene.artinos · 2.4 MB', tone: 'success' })}>Success</Button>
      <Button onClick={() => notify({ title: 'Low memory', description: 'Previews paused', tone: 'warning' })}>Warning</Button>
      <Button onClick={() => notify({ title: 'Export failed', description: 'Disk is full', tone: 'error', duration: 0 })}>Error · stays</Button>
    </div>
  );
}

function Tooltips() {
  return (
    <div className="sc-row" style={{ alignItems: 'center' }}>
      <Tooltip content="Duplicate, from above" shortcut={["mod", "D"]}>
        <Button variant="ghost">Top</Button>
      </Tooltip>
      <Tooltip content="From below" side="bottom">
        <Button variant="ghost">Bottom</Button>
      </Tooltip>
      <Tooltip content="From the left" side="left">
        <Button variant="ghost">Left</Button>
      </Tooltip>
      <Tooltip content="From the right" side="right">
        <Button variant="ghost">Right</Button>
      </Tooltip>
      <IconButton label="An icon button's label is its tooltip" icon={ICONS.reset} />
    </div>
  );
}

function PaletteDemo() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState('—');
  const commands: Command[] = [
    { id: 'new', label: 'New scene', group: 'File', shortcut: 'Ctrl N', run: () => setLast('New scene') },
    { id: 'open', label: 'Open…', group: 'File', run: () => setLast('Open') },
    { id: 'save', label: 'Save', group: 'File', shortcut: 'Ctrl S', run: () => setLast('Save') },
    { id: 'render', label: 'Render frame', group: 'Render', keywords: 'export image', run: () => setLast('Render frame') },
    { id: 'seq', label: 'Render sequence', group: 'Render', run: () => setLast('Render sequence') },
    { id: 'theme', label: 'Theme: Deep Frost', group: 'View', run: () => setLast('Theme: Deep Frost') },
  ];
  return (
    <div className="sc-row" style={{ alignItems: 'center' }}>
      <Button onClick={() => setOpen(true)} trailing={<Kbd keys={['mod', 'K']} />}>
        Command palette
      </Button>
      <span className="sc-note">
        Last command: <b>{last}</b>
      </span>
      <CommandPalette commands={commands} open={open} onOpenChange={setOpen} hotkey={null} />
    </div>
  );
}

export function OverlaysChapter() {
  return (
    <Chapter id="overlays">
      <Spec
        id="menus"
        text="Menu opens from its trigger and drops from it (or rises, when it opens upward); ContextMenu opens at the pointer. One highlight glides between rows; checkable items carry the LED. Arrows, Home, End, Enter and Escape drive both, and they stay on screen."
        code={`<Menu trigger={<Button>Object</Button>} items={[
  { type: 'label', label: 'Object' },
  { id: 'dup', label: 'Duplicate', shortcut: 'Ctrl D', onSelect: dup },
  { id: 'snap', label: 'Snap to grid', checked: snap, onSelect: toggleSnap },
  { type: 'separator' },
  { id: 'del', label: 'Delete', danger: true, onSelect: remove },
]} />
<ContextMenu items={() => entries}><Row /></ContextMenu>`}
      >
        <Menus />
      </Spec>

      <Spec
        id="dialog"
        text="The native <dialog>, shown modal: focus trapping, Escape and the inert page come from the browser. It rises in, its body and actions settle a moment later, and it fades out before it closes."
        code={`<Dialog open={open} onClose={close} title="Delete the orb?" description="This can't be undone."
        footer={<><Button variant="ghost">Cancel</Button><Button variant="danger">Delete</Button></>} />`}
      >
        <DialogDemo />
      </Spec>

      <Spec
        id="toasts"
        text="Wrap the app once in ToastProvider, then call useToast() anywhere. The tone is one small LED; a hairline drains to show the time left and holds while you hover. A dismissed toast slides away and the stack closes the gap. duration: 0 keeps it."
        code={`const notify = useToast();
notify({ title: 'Saved', description: 'scene.artinos', tone: 'success' });
notify({ title: 'Render queued', action: { label: 'Undo', onClick: undo } });`}
      >
        <Toasts />
      </Spec>

      <Spec id="tooltip" text="A short hint on hover or keyboard focus, sliding out of the side it points away from. It wraps one focusable element and portals out, so panels never clip it; shortcut shows the action's key caps after the hint." code={`<Tooltip content="Duplicate" shortcut={["mod", "D"]}><IconButton … /></Tooltip>
<Tooltip content="Frame the selection" side="bottom"><Button>Fit</Button></Tooltip>`}>
        <Tooltips />
      </Spec>

      <Spec
        id="palette"
        text="Ctrl/⌘ K search across commands, grouped and fuzzy-matched on label and keywords. Rows are the Select list's; the highlight glides with the arrows; Enter runs, Escape closes. Set hotkey to change or turn off the shortcut."
        code={`<CommandPalette open={open} onOpenChange={setOpen}
  commands={[{ id: 'render', label: 'Render frame', group: 'Render', keywords: 'export image', run: render }]} />`}
      >
        <PaletteDemo />
      </Spec>
    </Chapter>
  );
}
