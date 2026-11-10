/* 04 · Rig — controls for things in 3D space: the camera's view, an object's rotation, a vector.
   They are DOM, like the rest of the family, and speak three.js's own tuples, so the small
   viewport here is driven by nothing but their values. */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Button, Field, Panel, Segmented, Trackball, Vector3Field, ViewGizmo, eulerFromQuat, orbitBy, orbitPosition, qFromEuler, qFromOrbit } from '../../../src';
import type { Quat, Vec3 } from '../../../src';
import { TransformGizmo, gizmoColorsOf, type GizmoMode, type GizmoSpace } from '../../../src/rig/TransformGizmo';
import { Chapter, Spec } from '../shared';

const HOME_VIEW = qFromOrbit(35, 24);
const REST: { position: Vec3; rotation: Quat; scale: Vec3 } = { position: [0, 0.6, 0], rotation: qFromEuler([0, 30, 0]), scale: [1, 1, 1] };

interface RigViewportProps {
  position: Vec3;
  rotation: Quat;
  scale: Vec3;
  view: Quat;
  mode: GizmoMode;
  space: GizmoSpace;
  /** The gizmo moved the object. */
  onTransform: (position: Vec3, rotation: Quat, scale: Vec3) => void;
  /** A drag on the empty viewport orbits the camera. */
  onView: (view: Quat) => void;
  height?: number;
}

/** A small three.js scene with one object and its gizmo, drawn only when something changes. */
function RigViewport(props: RigViewportProps) {
  const { position, rotation, scale, view, mode, space, height = 340 } = props;
  const host = useRef<HTMLDivElement>(null);
  const rig = useRef<{ draw: () => void; body: THREE.Group; camera: THREE.PerspectiveCamera; gizmo: TransformGizmo } | null>(null);
  const latest = useRef(props);
  latest.current = props;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(2, devicePixelRatio));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x30343c, 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(3, 5, 4);
    scene.add(key);
    const grid = new THREE.GridHelper(8, 16, 0x8a8f99, 0x8a8f99);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.28;
    scene.add(grid);

    // a body with a nose, so its heading reads at a glance
    const body = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({ color: 0xd9dce2, roughness: 0.42, metalness: 0.15 });
    body.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 1), skin));
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.8, 24), new THREE.MeshStandardMaterial({ color: 0x3cbca5, roughness: 0.35 }));
    nose.rotation.z = -Math.PI / 2;
    nose.position.x = 1.15;
    body.add(nose);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.08), skin);
    fin.position.set(-0.5, 0.6, 0);
    body.add(fin);
    const axes = new THREE.AxesHelper(1.9);
    axes.setColors(new THREE.Color(0xef6372), new THREE.Color(0x7cc98a), new THREE.Color(0x6ea6f2));
    body.add(axes);
    scene.add(body);

    const draw = () => renderer.render(scene, camera);

    // the handles on the object: they write to it, and the panel reads it back
    const gizmo = new TransformGizmo(camera, renderer.domElement, { colors: gizmoColorsOf(el), size: 1.15 });
    scene.add(gizmo);
    gizmo.attach(body);
    gizmo.addEventListener('change', draw);
    gizmo.addEventListener('objectChange', () => latest.current.onTransform(body.position.toArray() as Vec3, body.quaternion.toArray() as Quat, body.scale.toArray() as Vec3));

    // a drag on the empty viewport orbits, as the ball in the corner does
    const canvas = renderer.domElement;
    let orbit: { x: number; y: number } | null = null;
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || gizmo.dragging) return;
      orbit = { x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (!orbit) return;
      latest.current.onView(orbitBy(latest.current.view, -(event.clientX - orbit.x) * 0.008, -(event.clientY - orbit.y) * 0.008));
      orbit = { x: event.clientX, y: event.clientY };
    };
    const up = () => (orbit = null);
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.style.touchAction = 'none';
    const fit = () => {
      const { width, height: h } = el.getBoundingClientRect();
      if (!width || !h) return;
      renderer.setSize(width, h, false);
      camera.aspect = width / h;
      camera.updateProjectionMatrix();
      draw();
    };
    const watch = new ResizeObserver(fit);
    watch.observe(el);
    rig.current = { draw, body, camera, gizmo };
    fit();
    return () => {
      watch.disconnect();
      gizmo.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      rig.current = null;
    };
  }, []);

  useEffect(() => {
    const r = rig.current;
    if (!r) return;
    r.body.position.fromArray(position);
    r.body.quaternion.fromArray(rotation);
    r.body.scale.fromArray(scale);
    r.camera.quaternion.fromArray(view);
    r.camera.position.fromArray(orbitPosition(view, 8.5, [0, 0.5, 0]));
    if (r.gizmo.mode !== mode) r.gizmo.setMode(mode);
    if (r.gizmo.space !== space) r.gizmo.setSpace(space);
    r.draw();
  });

  return (
    <div ref={host} className="sc-rig__view" style={{ height }}>
      {failed ? <span className="sc-note">WebGL is not available here; the controls still report their values.</span> : null}
    </div>
  );
}

function TransformRig() {
  const [view, setView] = useState<Quat>(HOME_VIEW);
  const [position, setPosition] = useState<Vec3>(REST.position);
  const [rotation, setRotation] = useState<Quat>(REST.rotation);
  const [scale, setScale] = useState<Vec3>(REST.scale);
  const [linked, setLinked] = useState(true);
  const [mode, setMode] = useState<GizmoMode>('translate');
  const [space, setSpace] = useState<GizmoSpace>('world');
  const reset = () => {
    setPosition(REST.position);
    setRotation(REST.rotation);
    setScale(REST.scale);
    setView(HOME_VIEW);
  };
  return (
    <div className="sc-rig">
      <div className="sc-rig__stage">
        <RigViewport
          position={position}
          rotation={rotation}
          scale={scale}
          view={view}
          mode={mode}
          space={space}
          onView={setView}
          onTransform={(p, r, s) => {
            setPosition(p);
            setRotation(r);
            setScale(s);
          }}
        />
        <ViewGizmo className="sc-rig__gizmo" value={view} onChange={setView} defaultValue={HOME_VIEW} />
        <div className="sc-rig__tools">
          <Segmented style={{ width: 196 }} label="Gizmo" value={mode} onChange={setMode} options={[{ value: 'translate', label: 'Move' }, { value: 'rotate', label: 'Rotate' }, { value: 'scale', label: 'Scale' }]} />
          <Segmented style={{ width: 128 }} label="Space" value={space} onChange={setSpace} options={[{ value: 'world', label: 'World' }, { value: 'local', label: 'Local' }]} />
        </div>
      </div>
      <Panel title="Transform" subtitle="Body 01" labelWidth={64} actions={<Button size="sm" variant="ghost" onClick={reset}>Reset</Button>} className="sc-rig__panel">
        <Field label="Position">
          <Vector3Field label="Position" value={position} onChange={setPosition} step={0.05} unit="m" />
        </Field>
        <Field label="Rotation">
          <Vector3Field label="Rotation" value={eulerFromQuat(rotation)} onChange={(e) => setRotation(qFromEuler(e))} step={1} decimals={0} unit="°" min={-180} max={180} />
        </Field>
        <Field label="Scale">
          <Vector3Field label="Scale" value={scale} onChange={setScale} step={0.01} min={0.05} max={4} linked={linked} onLinkedChange={setLinked} />
        </Field>
        <div className="sc-rig__ball">
          <Trackball value={rotation} onChange={setRotation} view={view} defaultValue={REST.rotation} size={132} />
        </div>
      </Panel>
    </div>
  );
}

function ViewOnly() {
  const [view, setView] = useState<Quat>(HOME_VIEW);
  return (
    <div className="sc-row" style={{ alignItems: 'center' }}>
      <ViewGizmo value={view} onChange={setView} defaultValue={HOME_VIEW} />
      <ViewGizmo value={view} onChange={setView} defaultValue={HOME_VIEW} size={64} />
      <ViewGizmo value={view} onChange={setView} defaultValue={HOME_VIEW} size={120} />
    </div>
  );
}

function BallOnly() {
  const [q, setQ] = useState<Quat>(qFromEuler([20, -35, 10]));
  return (
    <div className="sc-row" style={{ alignItems: 'flex-start' }}>
      <Trackball value={q} onChange={setQ} size={148} />
      <Trackball value={q} onChange={setQ} size={96} readout={false} label="Rotation, small" />
    </div>
  );
}

function VectorOnly() {
  const [p, setP] = useState<Vec3>([1.2, 0, -3.5]);
  const [s, setS] = useState<Vec3>([1, 1, 1]);
  const [linked, setLinked] = useState(true);
  return (
    <div className="sc-stack" style={{ maxWidth: 340 }}>
      <Vector3Field label="Position" value={p} onChange={setP} unit="m" />
      <Vector3Field label="Scale" value={s} onChange={setS} step={0.01} min={0.01} linked={linked} onLinkedChange={setLinked} />
    </div>
  );
}

export function RigChapter() {
  return (
    <Chapter id="rig">
      <Spec
        id="rig-transform"
        wide
        text="A transform rig around a viewport. The handles on the object are a TransformGizmo inside the three.js scene: drag an arrow, a plane square, a ring or a block. The ball in the corner is the camera, and the panel shows the same object in numbers; all of them stay in step. Shift is fine, Ctrl snaps."
        code={`const [view, setView] = useState<Quat>(qFromOrbit(35, 24));
const [rotation, setRotation] = useState<Quat>(QUAT_IDENTITY);

<ViewGizmo value={view} onChange={setView} />
<Vector3Field label="Position" value={position} onChange={setPosition} unit="m" />
<Trackball value={rotation} onChange={setRotation} view={view} />

// in the scene: handles on the object itself (needs three)
import { TransformGizmo } from './artinos-ui/rig/TransformGizmo';
const gizmo = new TransformGizmo(camera, renderer.domElement);
scene.add(gizmo);
gizmo.attach(mesh);
gizmo.setMode('rotate');            // 'translate' · 'rotate' · 'scale'
gizmo.addEventListener('objectChange', () => setRotation(mesh.quaternion.toArray()));

camera.quaternion.fromArray(view);
camera.position.fromArray(orbitPosition(view, 8.5, target));
mesh.quaternion.fromArray(rotation);`}
      >
        <TransformRig />
      </Spec>

      <Spec
        id="view-gizmo"
        text="The camera's orientation as six axis ends. Drag to orbit as a turntable, with Y kept up. Click an end to look down that axis; click the one facing you to flip to the far side. Double-click the ball to return to the default view."
        keys={[
          ['Drag', 'orbit · Shift fine'],
          ['← → ↑ ↓', 'orbit 15° · Shift 5°'],
          ['X Y Z', 'snap to the axis · Shift the far side'],
          ['Home', 'default view'],
        ]}
        code={`<ViewGizmo value={view} onChange={setView} defaultValue={home} size={84} />`}
      >
        <ViewOnly />
      </Spec>

      <Spec
        id="trackball"
        text="A rotation you turn with the hand. Drag the body to tumble it freely, a ring to turn about that axis alone, or outside the ball to roll about the line of sight. The value is a quaternion, so it never locks; the Euler angles read underneath. Give it the camera's view and it turns the way the object turns on screen."
        keys={[
          ['Drag body', 'tumble'],
          ['Drag ring', 'one axis · Ctrl snaps 15°'],
          ['Drag outside', 'roll'],
          ['Shift', 'fine'],
          ['Double-click', 'rest'],
        ]}
        code={`<Trackball value={q} onChange={setQ} view={cameraQuat} snap={15} />`}
      >
        <BallOnly />
      </Spec>

      <Spec
        id="vector3"
        text="X, Y and Z in one row, each a NumberField in its axis colour: scrub, type, or step with the arrows. With linked on, changing one keeps the three in proportion, which is what a scale wants."
        code={`<Vector3Field label="Position" value={p} onChange={setP} unit="m" />
<Vector3Field label="Scale" value={s} onChange={setS} linked={linked} onLinkedChange={setLinked} />`}
      >
        <VectorOnly />
      </Spec>
    </Chapter>
  );
}
