/* 03 · Controls — every other shape a parameter takes, on the same well and insert. */
import { useState } from 'react';
import { Button, Checkbox, ChipGroup, ColorField, Field, FileDrop, NumberField, Panel, Segmented, Select, Switch, TextField, ToggleGroup } from '../../../src';
import { Chapter, ICONS, Spec } from '../shared';

function TextFields() {
  const [text, setText] = useState('Orb');
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');
  return (
    <div className="sc-grid">
      <TextField label="Name" value={text} onChange={setText} />
      <TextField type="search" label="Filter parameters" placeholder="Filter parameters…" value={search} onChange={setSearch} />
      <TextField size="sm" label="Tag" value={tag} placeholder="Small, for tight rows" onChange={setTag} />
    </div>
  );
}

function Drop() {
  const [files, setFiles] = useState<string[]>([]);
  return <FileDrop accept="image/*,.glb" multiple onFiles={(f) => setFiles(f.map((x) => x.name))} title="Drop a model or image" hint={files.length ? files.join(' · ') : 'GLB · PNG · JPG'} />;
}

const PASSES = ['Beauty', 'Depth', 'Normals'] as const;

function Checkboxes() {
  const [on, setOn] = useState<string[]>(['Beauty']);
  const all = on.length === PASSES.length;
  return (
    <div className="sc-grid">
      <div className="sc-stack" style={{ gap: 10 }}>
        <Checkbox label="All passes" checked={all} indeterminate={on.length > 0 && !all} onChange={(v) => setOn(v ? [...PASSES] : [])} />
        <div className="sc-stack" style={{ gap: 8, paddingLeft: 25 }}>
          {PASSES.map((p) => (
            <Checkbox key={p} label={p} checked={on.includes(p)} onChange={(v) => setOn(v ? [...on, p] : on.filter((x) => x !== p))} />
          ))}
        </div>
      </div>
      <div className="sc-stack" style={{ gap: 12 }}>
        <Checkbox label="Include textures" description="Bakes 12 maps, about 48 MB" defaultChecked />
        <Checkbox label="Embed fonts" description="Not available for this format" disabled />
      </div>
    </div>
  );
}

function ExportForm() {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [format, setFormat] = useState('glTF');
  const [touched, setTouched] = useState(false);
  const error = !touched ? undefined : !name.trim() ? "Give the export a name." : /[\\/:*?"<>|]/.test(name) ? "A name cannot contain / \\ : * ? \" < > |" : undefined;
  return (
    <Panel
      title="Export scene"
      subtitle="Orb · 4 layers"
      footer={
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          <Button variant="ghost" onClick={() => (setName(''), setNotes(''), setTouched(false))}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setTouched(true)}>
            Export
          </Button>
        </div>
      }
    >
      <div className="sc-stack" style={{ gap: 14 }}>
        <Field layout="stacked" label="Name" required error={error} hint="Used for the file and the kit's README">
          <TextField value={name} onChange={setName} placeholder="orb-studio" onBlur={() => setTouched(true)} />
        </Field>
        <Field layout="stacked" label="Notes" hint="Optional · shown to whoever opens it">
          <TextField multiline rows={2} value={notes} onChange={setNotes} placeholder="What changed in this version…" />
        </Field>
        <Field layout="stacked" label="Format">
          <Segmented options={['glTF', 'USDZ', 'OBJ']} value={format} onChange={setFormat} />
        </Field>
        <Checkbox label="Include textures" description="Bakes 12 maps, about 48 MB" defaultChecked />
      </div>
    </Panel>
  );
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
        id="checkbox"
        text="A choice in a form or a list. A small box cut into the well; checked, the insert fills it and the check draws itself in; mixed (some of a group) shows a dash. The label is the sans, with an optional quieter line under it. For a setting that applies at once, use a Switch; for a choice you confirm with a button, a Checkbox."
        code={`<Checkbox label="All passes" checked={all} indeterminate={some && !all} onChange={setAll} />
<Checkbox label="Include textures" description="Bakes 12 maps, about 48 MB" defaultChecked />`}
      >
        <Checkboxes />
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
          <ToggleGroup label="Passes" options={['Diffuse', 'Spec']} defaultValue={['Diffuse']} />
          <ToggleGroup label="Axis" options={['X', 'Y', 'Z']} defaultValue={['X', 'Z']} />
          <ToggleGroup options={['Front', 'Top']} defaultValue={['Front']} />
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
        id="chips"
        text="A wrapping set of choices: moods, tags, categories, filters. Off, a chip is a pill recessed in the well with its LED dark; on, it is the family's polished insert with its LED lit, the same language as a ToggleGroup's chips. Many can be on at once, or one with multiple={false}, which can also be emptied. A count after the label is quieter, with tabular digits, like every number."
        code={`
<ChipGroup label="Mood" options={['Joy', 'Curious', 'Startled', 'Shy', 'Sad', 'Groove']} defaultValue={['Curious']} />
<ChipGroup label="Category" multiple={false} defaultValue={['image']}
  options={[{ value: 'all', label: 'All', count: 276 }, { value: 'image', label: 'Image', count: 48 }, …]} />`}
      >
        <div className="sc-stack" style={{ gap: 14 }}>
          <ChipGroup label="Mood" options={['Joy', 'Curious', 'Startled', 'Shy', 'Sad', 'Groove']} defaultValue={['Curious', 'Groove']} />
          <ChipGroup
            label="Category"
            multiple={false}
            defaultValue={['image']}
            options={[
              { value: 'all', label: 'All', count: 276 },
              { value: 'image', label: 'Image', count: 48 },
              { value: 'video', label: 'Video', count: 22 },
              { value: 'audio', label: 'Audio', count: 12 },
              { value: '3d', label: '3D & worlds', count: 9 },
              { value: 'tools', label: 'Tools', count: 31, disabled: true },
            ]}
          />
        </div>
      </Spec>

      <Spec
        id="segmented"
        text="One of n. The insert travels between positions and the text it arrives under switches ink. Arrow keys move it; options can carry icons or be disabled."
        code={`
<Segmented label="Quality" options={['Low', 'Med', 'High', 'Ultra']} defaultValue="HIGH" />
<Segmented options={[{ value: 'l', icon: <AlignLeft /> }, …]} />`}
      >
        <div className="sc-grid">
          <Segmented label="Quality" options={['Low', 'Med', 'High', 'Ultra']} defaultValue="HIGH" />
          <Segmented label="Space" options={['Linear', 'sRGB', 'ACES']} defaultValue="ACES" />
          <Segmented label="Scale" options={['1×', '2×', { value: '4×', disabled: true }, '8×']} defaultValue="2X" />
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
<Select label="Tonemap" options={['ACES', 'AGX', 'Filmic']} defaultValue="AGX" />
<Select appearance="well" options={['Fixed', 'Fill', 'Hug']} defaultValue="Fixed" />`}
      >
        <div className="sc-grid">
          <Select label="List" options={['Item 1', 'Item 2', 'Item 3', 'Item 4']} />
          <Select label="Tonemap" options={['ACES', 'AGX', 'Filmic', 'Neutral']} defaultValue="AGX" />
          <Select label="Blend" options={['Normal', 'Add', 'Multiply', 'Screen', { value: 'Overlay', disabled: true }]} defaultValue="SCREEN" />
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

      <Spec
        id="forms"
        text="A form is Fields stacked: layout='stacked' puts the label above the control, hint a quiet line under it, and error replaces the hint with what is wrong, in the fault colour, and rings the control. The Field hands its id, message and state to the control inside, so the label is associated and the message is read out. TextField multiline is a textarea that grows with its text. One primary action at the end; validate when the person leaves the field or submits, not while they type."
        code={`<Field layout="stacked" label="Name" required error={error} hint="Used for the file name">
  <TextField value={name} onChange={setName} onBlur={() => setTouched(true)} />
</Field>
<Field layout="stacked" label="Notes" hint="Optional">
  <TextField multiline rows={2} value={notes} onChange={setNotes} />
</Field>`}
      >
        <div style={{ maxWidth: 420 }}>
          <ExportForm />
        </div>
      </Spec>
    </Chapter>
  );
}
