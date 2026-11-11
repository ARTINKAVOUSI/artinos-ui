/* Layout system — three levels. A panel holds sections, a section holds parts. A panel is a
   MetaBlock: the same thing on a page, in a dock or floating, with capabilities that say how it
   may move; the workspace is only the place where panels are arranged. */
import { Chapter, Spec } from '../shared';
import { PanelDemo, PartsDemo, SectionDemo } from './layout-demo';
import { ListsDemo } from './lists-demo';
import { TabsDemo } from './tabs-demo';

/** What each level owns, prop by prop. */
const REFERENCE: { level: string; parts: string; owns: string; props: [string, string][] }[] = [
  {
    level: 'Panel',
    parts: 'Panel · Dock · MetaBlock',
    owns: 'A named frame that holds sections. On a page it is a Panel; in a workspace it is a DockPanel, a MetaBlock the engine places. One thing either way.',
    props: [
      ['icon · title · subtitle', 'what it is, in two lines; in a workspace the title is its tab'],
      ['actions · PanelBar', 'a live Badge or tools in the header; in a workspace the PanelBar rises into the tab strip'],
      ['footer', 'a quiet status line, on a Panel and on a DockPanel alike'],
      ['tabs · tabsPlacement', 'a Tabs strip under the header, or a rail down the left (side); Tabs: orientation, variant line · pill · icon, fill, count, dot, onClose'],
      ['variant', 'glass · solid for busy scenes · inset inside another panel'],
      ['collapsible · maxHeight', 'folds to its header; scrolls under soft fades'],
      ['labelWidth', 'one label column for every row inside'],
      ['dock · icon', 'where it starts in a workspace: left · right · bottom · float; the glyph for its tab'],
      ['Dock tabs', "each dock's tabs as a strip ('top') or a rail down its side ('side')"],
      ['capabilities', 'closable, movable, resizable, floatable, dockable, splittable, tabbable, maximizable, pinable, autoHideable: all on unless set false'],
      ['Dock', 'the workspace: panels, viewport, storageKey (the arrangement is saved), sizes, palette'],
      ['api.workspace', 'the MetaBlock engine: floatBlock, dockBlock, maximizeBlock, returnBlock, undo, redo, serialize'],
    ],
  },
  {
    level: 'Section',
    parts: 'Section · SectionGroup · createDockSections · createParamPanes',
    owns: 'One group, one idea, about seven parts. Grouping and categories are the same thing: a section.',
    props: [
      ['title · count', 'the heading, its hairline and one small fact; a click folds it'],
      ['description', 'one quiet line on what the group does'],
      ['modified · onReset', 'a reset in the heading once something changed'],
      ['enabled', 'an LED before the title: double-click the heading to switch the whole group off'],
      ['storageKey', 'remembers its fold'],
      ['columns · variant="card"', 'parts side by side; a soft tonal surface'],
      ['SectionGroup', 'accordion (one category open at a time), toolbar (Expand all · Collapse all), reorder'],
      ['createDockSections', 'one set of sections shown in panes; a section drags between any panes of the set, and tears off into its own panel in a workspace'],
      ['createParamPanes', 'the same panes built from a schema of parameters'],
    ],
  },
  {
    level: 'Parts',
    parts: 'Field · PropertyRow · controls · StatStrip · Meter · ItemList · Text · Callout',
    owns: 'Everything inside a section. A part sets a value, shows one, lists things or explains.',
    props: [
      ['Field', 'a name beside one or more controls; with none, the value is the answer; hero · quote · stacked · hint · error'],
      ['PropertyRow', 'a changed dot that becomes its reset, a binding and its status, a compact label column'],
      ['controls', 'Slider, Select, Switch, NumberField, ColorField…: pick the kind from the parameter (Sliders, Controls)'],
      ['readouts', 'StatStrip for the figures people look for first; Meter, Sparkline, Stat (Display)'],
      ['ItemList', 'variant plain · divided · cards · grid; size sm · md · lg; tileWidth; empty; reorder by drag or Alt + ↑ / ↓; group to trade rows'],
      ['ItemRow', 'thumbnail (square · round · wide), icon, swatch or leading; title, status, meta, description, value; progress; checked; depth and expanded for a tree; trailing tools'],
      ['ItemGroup', 'a named run of rows inside a list, with a count and tools'],
      ['Text · Callout', 'overline to name a sub-group, note for help; a Callout for what must not be missed'],
    ],
  },
];

function Reference() {
  return (
    <div className="sc-ref">
      {REFERENCE.map((r, i) => (
        <section key={r.level} className="sc-ref__level">
          <header className="sc-ref__head">
            <span className="sc-num">{String(i + 1).padStart(2, '0')}</span>
            <h4>{r.level}</h4>
            <p>{r.owns}</p>
            <code>{r.parts}</code>
          </header>
          <dl className="sc-ref__props">
            {r.props.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

export function LayoutChapter() {
  return (
    <Chapter id="layout">
      <Spec
        id="panel"
        wide
        text="A panel is one thing wherever it sits, and every panel is a MetaBlock: a named frame that holds sections, which can be dragged, floated, docked, joined to another as a tab, split and maximized. Every panel on this page lives in a workspace, so try it on any of them. On a page it is a Panel; in a workspace it is a MetaBlock, and its capabilities say what it may do (float, dock, join another as a tab, split, maximize, pin, close). The workspace has no parts of its own: it is only where panels are arranged, around a canvas, and it remembers the arrangement. Every move is a MetaBlock call, so the toolbar over the canvas moves panels with the same calls a drag makes. The Inspector here is closable and floatable off: it stays docked and open, and the toolbar's Float is off for it."
        keys={[
          ['floatable', 'drag a tab out over the canvas'],
          ['dockable', 'drop it on an edge of the workspace'],
          ['tabbable', 'drop it on another panel’s tab strip'],
          ['splittable', 'drop it on the side of a docked panel'],
          ['maximizable', 'Maximize in its window or the toolbar'],
          ['pinable', 'right-click a tab: pin or auto-hide'],
          ['closable', 'the × on a floating panel; Return home'],
        ]}
        code={`<Dock
  viewport={<Canvas>…</Canvas>}
  storageKey="my-app.layout"
  panels={[
    { id: 'inspector', title: 'Inspector', dock: 'left', content: <Inspector />,
      capabilities: { closable: false, floatable: false } },          // stays docked and open
    { id: 'layers', title: 'Layers', dock: 'right', content: <Layers /> },
    { id: 'console', title: 'Console', content: <Console />, footer: 'Ready' },
    { id: 'effects', title: 'Effects', dock: 'float', content: <Effects /> },
  ]}
  onReady={(api) => {
    api.workspace.floatBlock('effects', { x: 300, y: 96, width: 290, height: 300 });
    api.workspace.dockBlock('effects', { area: 'center', targetGroupId: 'dock.right' });
    api.workspace.undo();
  }}
/>

// the same panel on a page, outside a workspace
<Panel title="Inspector" subtitle="Orb" footer="Ready"><Inspector /></Panel>`}
      >
        <PanelDemo />
      </Spec>

      <Spec
        id="tabs"
        wide
        text="Tabs come in two kinds, built on the same MetaBlock. A group of panels has its own tabs, one per panel: here the left group wears a rail of lines, the center a strip of lines, the right a strip of pills, the bottom a strip of icons, and a panel dragged out floats with a rail. Right-click any tab and its menu's Tabs row switches that group between Top and Side, and Line, Pill and Icon; the layout keeps the choice and it goes with the group when it floats, docks or joins another. Inside a panel, Tabs switch its views: a strip under the header, a rail down the side with tabsPlacement side, pills that share the width, icons for a tool rail, a count or a dot on a tab, and closable tabs for documents."
        keys={[
          ['← → · ↑ ↓', 'move along the strip or the rail'],
          ['Home · End', 'the first or last tab'],
          ['Delete', 'close the focused tab (with onClose)'],
          ['Right-click a tab', 'Tabs: Top · Side · Line · Pill · Icon for its group'],
        ]}
        code={`<Panel title="Inspector" tabs={
  <Tabs items={[{ value: 'object', label: 'Object', count: 4 }, { value: 'material', label: 'Material', dot: true }]}
        value={tab} onChange={setTab} />
}> … </Panel>

<Panel title="Settings" tabsPlacement="side" tabs={
  <Tabs items={[{ value: 'general', label: 'General', icon: <Gear /> }, …]} value={tab} onChange={setTab} />
}> … </Panel>                                                         // a rail: the Tabs turns vertical

<Tabs variant="pill" fill items={['scene', 'camera', 'lights']} … />  // a few views sharing the width
<Tabs variant="icon" orientation="vertical" items={[{ value: 'move', label: 'Move', icon: <Move /> }, …]} … />
<Tabs items={openDocs} value={cur} onChange={setCur} onClose={close} />

// a group's own tabs: seeded per dock, switched from any tab's menu, kept in the group's MetaBlock meta
<Dock
  tabs={{ left: 'side', right: { look: 'pill' }, bottom: { look: 'icon' }, float: { placement: 'side' } }}
  panels={[{ id: 'settings', title: 'Settings', icon: <Gear />, dock: 'left', content: <Settings /> }, …]}
/>
api.workspace.setGroupMeta('dock.right', { tabs: { placement: 'side', look: 'line' } });`}
      >
        <TabsDemo />
      </Spec>

      <Spec
        id="section"
        text="A section is the one way to group. A group of settings, a category, a fold: all of them are a Section, under a heading with its count. It folds on a click, resets once something changed, and switches off as a whole when it has an LED. SectionGroup makes sections act together: as categories with one open at a time, or with Expand all and Collapse all. One set of sections can live in many panels at once: the Scene panel here holds a pane of the same set as the workspace above, so a section drags from here into the Inspector and back."
        code={`const sections = createDockSections({
  panes: { inspector: ['object', 'material'], page: ['exposure', 'post', 'transform'] },
  render: (id) => SECTIONS[id](),     // each returns a <Section>
});
<Panel title="Scene"><sections.Pane id="page" toolbar /></Panel>     // on the page
{ id: 'inspector', content: <sections.Pane id="inspector" /> }        // in the workspace

<Section title="Exposure" count={2} description="How bright the frame is."
         modified={changed} onReset={reset}> … </Section>
<Section title="Post" defaultEnabled storageKey="post"> … </Section>
<Section title="Transform" columns={3} variant="card"> … </Section>

<SectionGroup accordion defaultOpen="camera">                       // categories
  <Section id="camera" title="Camera"> … </Section>
  <Section id="light" title="Light"> … </Section>
</SectionGroup>`}
      >
        <SectionDemo />
      </Spec>

      <Spec
        id="parts"
        wide
        text="Everything else is a part, and a part always sits in a section. Rows give a value its name: a Field beside its controls, a PropertyRow that knows when it changed. Controls set one value each, in the shape the parameter takes. Readouts show what is: a StatStrip of the figures people look for first, then meters. Lists hold things, and have a section of their own below. Text explains: an overline names a sub-group, a note helps, a Callout must not be missed."
        code={`<Section title="Rows">
  <Field label="Width"><NumberField … /><Select appearance="well" … /></Field>
  <Field label="Name">Orb <Tag>mesh</Tag></Field>
  <PropertyRow label="Gain" binding="LFO 1" modified={changed} onReset={reset}><Slider … /></PropertyRow>
</Section>
<Section title="Readouts">
  <StatStrip items={[{ label: 'Frame', value: '4.1', unit: 'ms' }, …]} />
  <Meter label="CPU" value={0.42} />
</Section>
<Section title="Text">
  <Text variant="overline">Overline</Text>  <Text variant="note">…</Text>  <Callout title="Callout">…</Callout>
</Section>`}
      >
        <PartsDemo />
      </Spec>

      <Spec
        id="lists"
        wide
        text="A list holds things: layers, renders, materials, presets, files, people. One row does it all: a lead (a thumbnail, an icon or a swatch), a name with a status light, a quiet meta line, a description that may wrap, the row's value at the end, then its tools. A list comes in four looks: plain rows, rows on hairlines, rows as cards, or a grid of tiles. It has three sizes: sm on one line, md, and lg with a large lead and the description. A row can be picked with a checkbox, show progress along its foot, and nest in a tree with a disclosure arrow. ItemGroup names a run of rows; empty says what to do when there are none."
        keys={[
          ['plain · sm', 'an outliner: dense, a tree, status lights'],
          ['divided · lg', 'media: wide thumbnails, a description, progress'],
          ['grid', 'pickers: materials, images, presets as tiles'],
          ['cards', 'a few rich choices, each on its own surface'],
        ]}
        code={`<ItemList label="Renders" variant="divided" size="lg">
  <ItemRow thumbnail="/renders/dusk.jpg" thumbShape="wide" title="Garden · dusk"
           meta="1920 × 1080 · 240 frames" description="Orb drifting through the arches…"
           status="live" value="42%" progress={0.42}
           checked={picked.has(id)} onCheckedChange={toggle}
           trailing={<IconButton icon={<More />} label="Actions" />} />
</ItemList>

<ItemList label="Materials" variant="grid" tileWidth={84}>
  <ItemGroup label="Glass" count={3}>
    <ItemRow thumbnail={<Sphere />} thumbShape="round" title="Clear" meta="IOR 1.52" selected onSelect={…} />
  </ItemGroup>
</ItemList>

<ItemList label="Outliner" size="sm">
  <ItemRow depth={0} expanded={open} onExpandedChange={setOpen} icon={<Folder />} title="Scene" />
  <ItemRow depth={1} icon={<Mesh />} title="Orb" meta="12,480 tris" status="live" />
</ItemList>

<ItemList label="Favourites" empty="No favourites yet: star a material to keep it here." />`}
      >
        <ListsDemo />
      </Spec>

      <Spec
        id="reference"
        wide
        text="What each level owns, prop by prop. Build from the inside out: parts in a section, sections in a panel, panels in a workspace. Never skip a level: a control straight in a panel has no group to fold, reset or move. One label column per panel, about seven parts per section, one live Badge and one primary action per view. A tool around a canvas is a Dock with the canvas as viewport; never position floating panels by hand."
      >
        <Reference />
      </Spec>
    </Chapter>
  );
}
