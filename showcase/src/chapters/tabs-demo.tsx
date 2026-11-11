/* The Layout system chapter's Tabs demo: every way a panel switches between its views, once each.
     Inspector   line · horizontal · counts and a dot
     Documents   line · closable tabs
     View        pill · fill: a few views sharing the width
     Settings    line · vertical: tabsPlacement="side", a rail of named views with icons
     Tools       icon · vertical: a tool rail, each tool named by its tooltip */
import { useState } from 'react';
import type { ReactElement } from 'react';
import { PanelSpace } from './space';
import { Field, NumberField, Panel, Section, Segmented, Select, Slider, Switch, Tabs, Text } from '../../../src';

const glyph = (d: string) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
const G = {
  general: glyph('M8 5.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4'),
  display: glyph('M2 3h12v8H2zM6 14h4M8 11v3'),
  audio: glyph('M3 6v4h2.5L9 13V3L5.5 6zM11.5 5.5a3.5 3.5 0 010 5'),
  keys: glyph('M1.5 4.5h13v7h-13zM4 7h1M7 7h1M10 7h1M5 9.5h6'),
  move: glyph('M8 1.5v13M1.5 8h13M8 1.5L6 3.5M8 1.5l2 2M8 14.5l-2-2M8 14.5l2-2M1.5 8l2-2M1.5 8l2 2M14.5 8l-2-2M14.5 8l-2 2'),
  rotate: glyph('M13 8a5 5 0 11-1.5-3.6M13 2.5v2.5h-2.5'),
  scale: glyph('M2.5 9.5v4h4M2.5 13.5l5-5M9.5 2.5h4v4M13.5 2.5l-5 5'),
  brush: glyph('M10.5 2.5l3 3-6.5 6.5-3-3zM4 9.5l-1.5 4 4-1.5'),
};

function Inspector() {
  const [tab, setTab] = useState('object');
  return (
    <Panel
      title="Inspector"
      subtitle="line · counts and a dot"
      tabs={
        <Tabs
          label="Inspector"
          items={[
            { value: 'object', label: 'Object', count: 4 },
            { value: 'material', label: 'Material', count: 3, dot: true },
            { value: 'physics', label: 'Physics' },
            { value: 'locked', label: 'Render', disabled: true },
          ]}
          value={tab}
          onChange={setTab}
        />
      }
    >
      {tab === 'object' ? (
        <Section title="Transform" count={2}>
          <Slider label="Scale" defaultValue={1} min={0.1} max={4} mapping="log" decimals={2} unit="×" />
          <Slider label="Rotation" defaultValue={24} min={0} max={360} format="angle" decimals={0} />
        </Section>
      ) : tab === 'material' ? (
        <Section title="Surface" count={2} description="The dot on the tab: a change waits to be baked.">
          <Slider label="Roughness" defaultValue={0.18} />
          <Slider label="Transmission" defaultValue={0.9} format="percent" decimals={0} />
        </Section>
      ) : (
        <Section title="Body" count={1}>
          <Slider label="Mass" defaultValue={2.4} min={0.1} max={50} mapping="log" decimals={1} unit="kg" />
        </Section>
      )}
    </Panel>
  );
}

function Documents() {
  const [open, setOpen] = useState(['Orb.graph', 'Dye.graph', 'Rim light.graph']);
  const [cur, setCur] = useState('Orb.graph');
  const close = (v: string) => {
    const next = open.filter((x) => x !== v);
    setOpen(next);
    if (cur === v && next.length) setCur(next[Math.max(0, open.indexOf(v) - 1)]);
  };
  return (
    <Panel
      title="Documents"
      subtitle="line · closable"
      tabs={open.length ? <Tabs label="Open graphs" items={open} value={cur} onChange={setCur} onClose={close} /> : undefined}
      footer={<span>Delete closes the focused tab</span>}
    >
      {open.length ? (
        <Section title={cur} count="3 nodes">
          <Text variant="note">Each document keeps its own graph. Close one with its ×, or reopen them all below.</Text>
        </Section>
      ) : (
        <Section title="Nothing open">
          <Text variant="note">Every tab is closed.</Text>
        </Section>
      )}
      <Field label="Reopen">
        <Switch
          variant="compact"
          label="Reopen all"
          value={false}
          onChange={() => {
            setOpen(['Orb.graph', 'Dye.graph', 'Rim light.graph']);
            setCur('Orb.graph');
          }}
        />
      </Field>
    </Panel>
  );
}

function ViewSwitch() {
  const [view, setView] = useState('scene');
  return (
    <Panel title="View" subtitle="pill · fill" tabs={<Tabs label="View" variant="pill" fill items={['scene', 'camera', 'lights']} value={view} onChange={setView} />}>
      <Section title={view === 'scene' ? 'Scene' : view === 'camera' ? 'Camera' : 'Lights'} count={1}>
        {view === 'scene' ? (
          <Slider label="Exposure" bipolar detents={[0]} min={-3} max={3} decimals={1} unit="EV" defaultValue={0.3} />
        ) : view === 'camera' ? (
          <Slider label="Focal" variant="ruler" min={12} max={200} span={40} unit="mm" decimals={0} defaultValue={35} />
        ) : (
          <Slider label="Key" variant="gradient" gradient="temperature" min={2000} max={10000} decimals={0} unit="K" defaultValue={5600} />
        )}
      </Section>
    </Panel>
  );
}

const SETTINGS: Record<string, () => ReactElement> = {
  general: () => (
    <Section title="General" count={2}>
      <Field label="Language">
        <Select options={['English', 'Deutsch', 'فارسی']} defaultValue="English" appearance="well" label="Language" />
      </Field>
      <Field label="Autosave">
        <Switch variant="compact" label="Autosave" defaultValue />
      </Field>
    </Section>
  ),
  display: () => (
    <Section title="Display" count={2}>
      <Field label="Scale">
        <Segmented options={['90%', '100%', '125%']} defaultValue="100%" label="Interface scale" />
      </Field>
      <Slider label="Frame rate" variant="stepped" steps={4} min={30} max={120} decimals={0} unit="fps" defaultValue={60} />
    </Section>
  ),
  audio: () => (
    <Section title="Audio" count={1}>
      <Slider label="Output" format="db" min={-60} max={6} decimals={1} detents={[0]} defaultValue={-6} />
    </Section>
  ),
  keys: () => (
    <Section title="Keys" count={1}>
      <Field label="Repeat">
        <NumberField defaultValue={30} unit="/s" aria-label="Key repeat" />
      </Field>
    </Section>
  ),
};

function Settings() {
  const [tab, setTab] = useState('general');
  return (
    <Panel
      title="Settings"
      subtitle="line · vertical · tabsPlacement side"
      tabsPlacement="side"
      labelWidth={84}
      tabs={
        <Tabs
          label="Settings"
          items={[
            { value: 'general', label: 'General', icon: G.general },
            { value: 'display', label: 'Display', icon: G.display },
            { value: 'audio', label: 'Audio', icon: G.audio, dot: true },
            { value: 'keys', label: 'Keys', icon: G.keys, count: 48 },
          ]}
          value={tab}
          onChange={setTab}
        />
      }
    >
      {SETTINGS[tab]()}
    </Panel>
  );
}

function Tools() {
  const [tool, setTool] = useState('move');
  const name = { move: 'Move', rotate: 'Rotate', scale: 'Scale', paint: 'Paint' }[tool];
  return (
    <Panel
      title="Tools"
      subtitle="icon · vertical rail"
      tabsPlacement="side"
      tabs={
        <Tabs
          label="Tools"
          variant="icon"
          items={[
            { value: 'move', label: 'Move', icon: G.move },
            { value: 'rotate', label: 'Rotate', icon: G.rotate },
            { value: 'scale', label: 'Scale', icon: G.scale },
            { value: 'paint', label: 'Paint', icon: G.brush, dot: true },
          ]}
          value={tool}
          onChange={setTool}
        />
      }
    >
      <Section title={name ?? 'Tool'} count={1}>
        <Slider label="Snap" variant="stepped" steps={5} min={0} max={4} decimals={0} defaultValue={2} />
      </Section>
    </Panel>
  );
}

export function TabsDemo() {
  return (
    <PanelSpace
      id="tabs"
      height={680}
      sizes={{ left: 0.34, right: 0.3, bottom: 0.32 }}
      panels={[
        { id: 'settings', title: 'Settings', dock: 'left', content: <Settings /> },
        { id: 'inspector', title: 'Inspector', dock: 'center', content: <Inspector /> },
        { id: 'documents', title: 'Documents', dock: 'right', content: <Documents /> },
        { id: 'tools', title: 'Tools', dock: 'bottom', active: true, content: <Tools /> },
        { id: 'view', title: 'View', dock: 'bottom', content: <ViewSwitch /> },
      ]}
    />
  );
}
