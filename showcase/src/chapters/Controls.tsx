/* 03 · Controls — every other shape a parameter takes, on the same well and insert. */
import { useState } from 'react';
import { ColorField, FileDrop, NumberField, Segmented, Select, Switch, TextField, ToggleGroup } from '../../../src';
import { Chapter, ICONS, Spec } from '../shared';

function TextFields() {
  const [text, setText] = useState('Orb');
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');
  return (
    <div className="sc-grid">
      <TextField label="Name" value={text} onChange={setText} />
      <TextField type="search" placeholder="Filter parameters…" value={search} onChange={setSearch} />
      <TextField size="sm" label="Tag" value={tag} placeholder="Small, for tight rows" onChange={setTag} />
    </div>
  );
}

function Drop() {
  const [files, setFiles] = useState<string[]>([]);
  return <FileDrop accept="image/*,.glb" multiple onFiles={(f) => setFiles(f.map((x) => x.name))} title="Drop a model or image" hint={files.length ? files.join(' · ') : 'GLB · PNG · JPG'} />;
}

export function ControlsChapter() {
  return (
    <Chapter id="controls">
      <Spec
        id="number-field"
        text="A recessed numeric cell that is also a scrubber. Drag sideways to scrub (Alt 0.1×, Shift 10×); click to type — Enter commits, Escape cancels; typing a digit starts fresh. Arrows and wheel step while focused."
        code={`
<NumberField value={w} onChange={setW} min={0} step={1} aria-label="Width" />
<NumberField label="X" decimals={2} step={0.01} unit="m" />
<NumberField label="Rot" format="angle" decimals={1} align="end" />`}
      >
        <div className="sc-grid">
          <NumberField defaultValue={268} aria-label="Width" />
          <NumberField label="X" defaultValue={1.25} decimals={2} step={0.01} unit="m" />
          <NumberField label="Rot" defaultValue={45} decimals={1} format="angle" align="end" />
          <NumberField label="Samples" defaultValue={64} min={1} max={4096} step={8} />
        </div>
      </Spec>

      <Spec
        id="text-field"
        text="A single line of text cut into the well. type=&quot;search&quot; adds the magnifier and a clear button, and Escape clears it. Typed text is body text; the placeholder is dim ink."
        code={`
<TextField label="Name" value={name} onChange={setName} />
<TextField type="search" placeholder="Filter…" value={q} onChange={setQ} />`}
      >
        <TextFields />
      </Spec>

      <Spec
        id="switch"
        text="shutter: the slider insert as a two-position shutter — it travels to the active half and its LED seam lights; off, the same insert drains to grey. compact: the inspector knob. Click, Space or Enter."
        code={`
<Switch label="Shadows" defaultValue />
<Switch label="Live" labelOff="Paused" />
<Switch variant="compact" label="Enabled" value={on} onChange={setOn} />`}
      >
        <div className="sc-grid">
          <Switch label="Shadows" defaultValue />
          <Switch label="Bloom" />
          <Switch label="Live" labelOff="Paused" defaultValue />
          <Switch label="Locked" disabled defaultValue />
        </div>
        <div className="sc-row" style={{ alignItems: 'center' }}>
          <Switch variant="compact" label="Enabled" defaultValue />
          <Switch variant="compact" label="Snap" />
          <Switch variant="compact" density="comfort" label="Grid" defaultValue />
        </div>
      </Spec>

      <Spec
        id="toggle-group"
        text="Independent flags sharing one well; each chip is a small insert with its own LED seam. multiple={false} makes a solo group that can also be emptied. Icon options recede into the well when off."
        code={`
<ToggleGroup label="Axis" options={['X', 'Y', 'Z']} defaultValue={['X', 'Z']} />
<ToggleGroup label="Solo" options={['A', 'B', 'C']} multiple={false} />
<ToggleGroup options={[{ value: 'bold', icon: <Bold />, title: 'Bold' }, …]} />`}
      >
        <div className="sc-grid">
          <ToggleGroup label="Passes" options={['DIFFUSE', 'SPEC']} defaultValue={['DIFFUSE']} />
          <ToggleGroup label="Axis" options={['X', 'Y', 'Z']} defaultValue={['X', 'Z']} />
          <ToggleGroup options={['FRONT', 'TOP']} defaultValue={['FRONT']} />
          <ToggleGroup label="Solo" options={['A', 'B', 'C']} defaultValue={['B']} multiple={false} />
          <ToggleGroup
            label="Style"
            options={[
              { value: 'b', icon: ICONS.bold, title: 'Bold' },
              { value: 'i', icon: ICONS.italic, title: 'Italic' },
              { value: 'u', icon: ICONS.under, title: 'Underline' },
            ]}
            defaultValue={['b']}
          />
          <ToggleGroup
            label="Align"
            multiple={false}
            options={[
              { value: 'l', icon: ICONS.alignL, title: 'Left' },
              { value: 'c', icon: ICONS.alignC, title: 'Centre' },
              { value: 'r', icon: ICONS.alignR, title: 'Right' },
            ]}
            defaultValue={['l']}
          />
        </div>
      </Spec>

      <Spec
        id="segmented"
        text="One of n. The insert travels between positions and the text it arrives under switches ink. Arrow keys move it; options can carry icons or be disabled."
        code={`
<Segmented label="Quality" options={['LOW', 'MED', 'HIGH', 'ULTRA']} defaultValue="HIGH" />
<Segmented options={[{ value: 'l', icon: <AlignLeft /> }, …]} />`}
      >
        <div className="sc-grid">
          <Segmented label="Quality" options={['LOW', 'MED', 'HIGH', 'ULTRA']} defaultValue="HIGH" />
          <Segmented label="Space" options={['LINEAR', 'SRGB', 'ACES']} defaultValue="ACES" />
          <Segmented label="Scale" options={['1X', '2X', { value: '4X', disabled: true }, '8X']} defaultValue="2X" />
          <Segmented
            label="Align"
            options={[
              { value: 'l', icon: ICONS.alignL, title: 'Left' },
              { value: 'c', icon: ICONS.alignC, title: 'Centre' },
              { value: 'r', icon: ICONS.alignR, title: 'Right' },
            ]}
            defaultValue="c"
          />
        </div>
      </Spec>

      <Spec
        id="select"
        text="Closed, a full-width insert with a chevron — or a quiet well with appearance=&quot;well&quot;. Open, the frosted list unrolls out of the face, portalled to <body> so docks never clip it. Arrows, Home/End, Enter, Escape and type-ahead."
        code={`
<Select label="Tonemap" options={['ACES', 'AGX', 'FILMIC']} defaultValue="AGX" />
<Select appearance="well" options={['Fixed', 'Fill', 'Hug']} defaultValue="Fixed" />`}
      >
        <div className="sc-grid">
          <Select label="List" options={['ITEM 1', 'ITEM 2', 'ITEM 3', 'ITEM 4']} />
          <Select label="Tonemap" options={['ACES', 'AGX', 'FILMIC', 'NEUTRAL']} defaultValue="AGX" />
          <Select label="Blend" options={['NORMAL', 'ADD', 'MULTIPLY', 'SCREEN', { value: 'OVERLAY', disabled: true }]} defaultValue="SCREEN" />
          <Select label="Sizing" appearance="well" options={['Fixed', 'Fill', 'Hug']} defaultValue="Fixed" />
        </div>
      </Spec>

      <Spec
        id="color"
        text="Label in the well, the colour itself as the insert; hex ink follows luminance. Click the colour for the system picker, click the code to type one. alpha adds a scrubbable opacity readout (drag it, or arrows) over a checkerboard."
        code={`
<ColorField label="Color" value={hex} onChange={setHex} />
<ColorField label="Fog" alpha defaultValue="#E4671BCC" />   // #RRGGBBAA
<ColorField alpha defaultValue="#8DBBB4FF" />               // no label: full-width swatch`}
      >
        <div className="sc-grid">
          <ColorField label="Color" defaultValue="#00C8B3" />
          <ColorField label="Fog" alpha defaultValue="#E4671BCC" />
          <ColorField label="Ambient" defaultValue="#B0B0B0" />
          <ColorField label="Key Light" defaultValue="#F2E8D5" />
          <ColorField alpha defaultValue="#8DBBB4FF" />
          <ColorField alpha defaultValue="#5A7CFF66" />
        </div>
      </Spec>

      <Spec
        id="file-drop"
        text="A wide well with an etched rim. Hold a file over it and the rim breathes in the signal colour and the arrow lifts; drop, or click to browse. accept filters what it takes."
        code={`<FileDrop accept="image/*,.glb" multiple onFiles={(files) => load(files)} title="Drop a model or image" hint="GLB · PNG · JPG" />`}
      >
        <Drop />
      </Spec>
    </Chapter>
  );
}
