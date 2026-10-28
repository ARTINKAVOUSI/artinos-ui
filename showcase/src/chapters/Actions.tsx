/* 04 · Actions — buttons, icon buttons in toolbars, key caps and badges. */
import { useState } from 'react';
import { Badge, Button, IconButton, Kbd, Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarSpacer } from '../../../src';
import { Chapter, ICONS, Spec } from '../shared';
import { IC } from './demos';

const tool = (d: string) => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const TOOLS = [
  { id: 'select', label: 'Select', icon: tool('M3 2l7 4.5-3 .8-1.4 3.2L3 2z') },
  { id: 'move', label: 'Move', icon: tool('M7 1.5v11M1.5 7h11M7 1.5L5.5 3M7 1.5L8.5 3M7 12.5L5.5 11M7 12.5L8.5 11M1.5 7L3 5.5M1.5 7L3 8.5M12.5 7L11 5.5M12.5 7L11 8.5') },
  { id: 'brush', label: 'Brush', icon: tool('M11.5 2.5l-6 6M4 9.5c-1.5 0-2 1-2 2.5 1.5 0 3 0 3.5-1.5z') },
  { id: 'erase', label: 'Erase', icon: tool('M2.5 9.5l5-5 4 4-3.5 3.5h-3zM5 12h7') },
  { id: 'zoom', label: 'Zoom', icon: tool('M6 2.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7zM8.6 8.6l3 3') },
];

function ToolStrip() {
  const [active, setActive] = useState('brush');
  const [grid, setGrid] = useState(true);
  const [snap, setSnap] = useState(false);
  return (
    <Toolbar label="Canvas tools">
      <ToolbarGroup label="Tools">
        {TOOLS.map((t) => (
          <IconButton key={t.id} size="sm" label={t.label} icon={t.icon} labelled="active" active={active === t.id} onClick={() => setActive(t.id)} />
        ))}
      </ToolbarGroup>
      <ToolbarGroup label="Guides">
        <IconButton size="sm" label="Grid" icon={tool('M2 5h10M2 9h10M5 2v10M9 2v10')} active={grid} onClick={() => setGrid(!grid)} />
        <IconButton size="sm" label="Snap" icon={tool('M3 3v4a4 4 0 008 0V3M3 3h2.5M8.5 3H11')} active={snap} onClick={() => setSnap(!snap)} />
      </ToolbarGroup>
      <ToolbarSpacer />
      <Button size="sm" variant="ghost">
        Reset
      </Button>
      <Button size="sm">Export</Button>
      <Button size="sm" variant="primary">
        Render
      </Button>
    </Toolbar>
  );
}

function StyleToolbar() {
  const [marks, setMarks] = useState({ b: true, i: false, u: false });
  const [align, setAlign] = useState<'l' | 'c' | 'r'>('l');
  const toggle = (k: keyof typeof marks) => setMarks((m) => ({ ...m, [k]: !m[k] }));
  return (
    <div className="sc-stack">
      <ToolStrip />
      <Toolbar label="Text style">
        <IconButton label="Bold" icon={ICONS.bold} active={marks.b} onClick={() => toggle('b')} />
        <IconButton label="Italic" icon={ICONS.italic} active={marks.i} onClick={() => toggle('i')} />
        <IconButton label="Underline" icon={ICONS.under} active={marks.u} onClick={() => toggle('u')} />
        <ToolbarSeparator />
        <IconButton label="Align left" icon={ICONS.alignL} active={align === 'l'} onClick={() => setAlign('l')} />
        <IconButton label="Center" icon={ICONS.alignC} active={align === 'c'} onClick={() => setAlign('c')} />
        <IconButton label="Align right" icon={ICONS.alignR} active={align === 'r'} onClick={() => setAlign('r')} />
      </Toolbar>
      <div className="sc-canvas-strip">
        <Toolbar label="Canvas tools" floating>
          <IconButton label="Play" icon={IC.play} filled />
          <IconButton label="Undo" icon={IC.undo} />
          <ToolbarSeparator />
          <IconButton label="Duplicate" icon={IC.copy} />
          <IconButton label="Delete" icon={IC.trash} />
          <ToolbarSpacer />
          <Button size="sm" variant="primary">
            Render
          </Button>
        </Toolbar>
      </div>
    </div>
  );
}

export function ActionsChapter() {
  return (
    <Chapter id="actions">
      <Spec
        id="buttons"
        text="Three weights. primary is the family's polished insert in its well with a lit LED: the one main action in a view (danger lights it in the fault colour). default is a quiet raised face with a hairline, for every other action. ghost is bare label ink. Icons lead, hints (usually a key cap) trail; sm fits tight rows. A label cut by an ellipsis shows in full as its tooltip."
        code={`<Button variant="primary" icon={<PlayIcon />}>Render</Button>
<Button>Default</Button>   <Button variant="ghost">Cancel</Button>   <Button variant="danger">Delete</Button>
<Button size="sm" trailing={<Kbd keys={['mod', 'S']} />}>Save</Button>`}
      >
        <div className="sc-row" style={{ alignItems: 'center' }}>
          <Button variant="primary" icon={IC.play}>
            Render
          </Button>
          <Button>Default</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="sc-row" style={{ alignItems: 'center' }}>
          <Button size="sm" icon={IC.save} trailing={<Kbd keys={['mod', 'S']} />}>
            Save
          </Button>
          <Button size="sm" variant="ghost" icon={IC.undo}>
            Undo
          </Button>
          <Button size="sm" variant="primary">
            Apply
          </Button>
        </div>
      </Spec>

      <Spec
        id="toolbars"
        text="An icon button is bare ink that becomes an insert when pressed; its label is both the tooltip and the accessible name. ToolbarGroup sets related buttons in one shared well, so a toolbar reads as a few groups rather than a row of equal pills; labelled='active' names the current tool and keeps the rest as icons. Separators and spacers divide the rest; floating gives the toolbar a pane of the theme's glass, for use over a canvas."
        code={`<Toolbar label="Canvas tools">
  <ToolbarGroup label="Tools">
    {tools.map((t) => <IconButton key={t.id} size="sm" label={t.label} icon={t.icon} labelled="active" active={tool === t.id} onClick={() => setTool(t.id)} />)}
  </ToolbarGroup>
  <ToolbarSpacer />
  <Button size="sm">Export</Button>  <Button size="sm" variant="primary">Render</Button>
</Toolbar>
<Toolbar label="Text style">
  <IconButton label="Bold" icon={<B />} active={bold} onClick={toggleBold} />
  <ToolbarSeparator />
  <IconButton label="Align left" icon={<AlignL />} />
</Toolbar>
<Toolbar label="Canvas" floating> … <ToolbarSpacer /> <Button size="sm">Render</Button> </Toolbar>`}
      >
        <StyleToolbar />
      </Spec>

      <Spec
        id="keys-badges"
        text="Kbd draws key caps as tiny wells; mod is ⌘ on Apple platforms and Ctrl elsewhere, read after hydration so server HTML never mismatches. A Badge marks state with a wash and a hairline of its colour, never a solid fill; a live badge's dot breathes."
        code={`<Kbd keys={['mod', 'Shift', 'P']} />
<Badge tone="live" dot>Live</Badge>   <Badge tone="warm">Bound</Badge>   <Badge tone="danger">Fault</Badge>   <Badge>v2.0</Badge>`}
      >
        <div className="sc-row" style={{ alignItems: 'center' }}>
          <Kbd keys={['mod', 'K']} />
          <Kbd keys={['mod', 'Shift', 'P']} />
          <Kbd keys={['alt', 'Enter']} />
          <Kbd keys={['Esc']} />
        </div>
        <div className="sc-row" style={{ alignItems: 'center' }}>
          <Badge tone="live" dot>
            Live
          </Badge>
          <Badge tone="warm">Bound</Badge>
          <Badge tone="danger" dot>
            Fault
          </Badge>
          <Badge>v2.0</Badge>
          <Badge tone="neutral">Draft</Badge>
        </div>
      </Spec>
    </Chapter>
  );
}
