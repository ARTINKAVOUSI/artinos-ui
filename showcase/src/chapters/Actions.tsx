/* 04 · Actions — buttons, icon buttons in toolbars, key caps and badges. */
import { useState } from 'react';
import { Badge, Button, IconButton, Kbd, Toolbar, ToolbarSeparator, ToolbarSpacer } from '../../../src';
import { Chapter, ICONS, Spec } from '../shared';
import { IC } from './demos';

function StyleToolbar() {
  const [marks, setMarks] = useState({ b: true, i: false, u: false });
  const [align, setAlign] = useState<'l' | 'c' | 'r'>('l');
  const toggle = (k: keyof typeof marks) => setMarks((m) => ({ ...m, [k]: !m[k] }));
  return (
    <div className="sc-stack">
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
        text="A button is the family's insert in its well. primary lights the LED and is the one main action in a view; danger lights it in the fault colour; ghost is bare label ink for secondary actions. Icons lead, hints (usually a key cap) trail; sm fits tight rows."
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
        text="An icon button is bare ink that becomes an insert when pressed; its label is both the tooltip and the accessible name. A Toolbar groups them with hairline separators and spacers; floating gives it a pane of the theme's glass, for use over a canvas."
        code={`<Toolbar label="Text style">
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
