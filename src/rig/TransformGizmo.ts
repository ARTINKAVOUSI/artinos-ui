/* TransformGizmo — move, rotate and scale handles drawn on an object, inside the three.js scene.
   Needs `three`, so it is not exported from the package index: import it from this file.

     const gizmo = new TransformGizmo(camera, renderer.domElement);
     scene.add(gizmo);                       // at the scene root
     gizmo.attach(mesh);
     gizmo.setMode('rotate');                // 'translate' · 'rotate' · 'scale'
     gizmo.addEventListener('objectChange', () => save(mesh));
     gizmo.addEventListener('dragging-changed', (e) => (orbit.enabled = !e.value));
     gizmo.addEventListener('change', render);   // only for scenes drawn on demand

   React Three Fiber: build it once with useMemo from useThree's camera and gl.domElement, show
   it with <primitive object={gizmo} />, and dispose() it on unmount.

   It keeps one size on screen whatever the distance, follows the object by itself every frame,
   and uses only MeshBasicMaterial, so it draws the same under WebGL and WebGPU. The event names
   are three's own TransformControls names. */
import * as THREE from 'three';

export type GizmoMode = 'translate' | 'rotate' | 'scale';
export type GizmoSpace = 'world' | 'local';
export type GizmoHandle = 'x' | 'y' | 'z' | 'xy' | 'yz' | 'xz' | 'xyz' | 'screen';
export type GizmoCamera = THREE.PerspectiveCamera | THREE.OrthographicCamera;

export interface GizmoSnap {
  /** World units. */
  translate?: number;
  /** Degrees. */
  rotate?: number;
  /** Scale factor steps. */
  scale?: number;
}

export interface TransformGizmoOptions {
  mode?: GizmoMode;
  space?: GizmoSpace;
  /** Size on screen, 1 is about a quarter of the view's height. */
  size?: number;
  /** Steps a drag keeps to. Without it, holding Ctrl snaps to 0.25 units · 15° · 0.1×. */
  snap?: GizmoSnap | null;
  /** Axis colours and the neutral of the centre and the outer ring. Default: the kit's --ar-axis-* values. */
  colors?: Partial<GizmoColors>;
}

export interface GizmoColors {
  x: THREE.ColorRepresentation;
  y: THREE.ColorRepresentation;
  z: THREE.ColorRepresentation;
  neutral: THREE.ColorRepresentation;
}

export interface TransformGizmoEventMap extends THREE.Object3DEventMap {
  /** Something to redraw: a hover, a drag step, a mode change. */
  change: {};
  /** The attached object moved, turned or changed size. */
  objectChange: {};
  /** A drag began (`value: true`) or ended: switch orbit controls off meanwhile. */
  'dragging-changed': { value: boolean };
}

/** The kit's axis colours as set on an element's theme: `new TransformGizmo(camera, el, { colors: gizmoColorsOf(el) })`. */
export function gizmoColorsOf(element: Element): Partial<GizmoColors> {
  const style = getComputedStyle(element);
  const read = (name: string) => style.getPropertyValue(name).trim() || undefined;
  const out: Partial<GizmoColors> = {};
  const [x, y, z] = [read('--ar-axis-x'), read('--ar-axis-y'), read('--ar-axis-z')];
  if (x) out.x = x;
  if (y) out.y = y;
  if (z) out.z = z;
  return out;
}

const DEFAULT_COLORS: GizmoColors = { x: 0xef6372, y: 0x7cc98a, z: 0x6ea6f2, neutral: 0xe9ebef };
const DEFAULT_SNAP: Required<GizmoSnap> = { translate: 0.25, rotate: 15, scale: 0.1 };
const AXIS = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) } as const;
type AxisName = keyof typeof AXIS;
const AXIS_NAMES: readonly AxisName[] = ['x', 'y', 'z'];
const WHITE = new THREE.Color(0xffffff);
const UP = new THREE.Vector3(0, 1, 0);
const FORWARD = new THREE.Vector3(0, 0, 1);

interface Part {
  mode: GizmoMode;
  handle: GizmoHandle;
  material: THREE.MeshBasicMaterial;
  base: THREE.Color;
  opacity: number;
  picker: THREE.Mesh;
}

interface Drag {
  handle: GizmoHandle;
  pointerId: number;
  /** the object at the start, in world space */
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
  parentInverse: THREE.Quaternion;
  /** the gizmo's own axes at the start, in world space */
  frame: THREE.Quaternion;
  axis: THREE.Vector3;
  hit: THREE.Vector3;
  param: number;
  /** rotation: the running angle, and the last reading it was unwrapped from */
  angle: number;
  last: number;
  /** a ring seen edge-on is pulled along the screen instead: px direction of a positive turn */
  tangent: THREE.Vector2 | null;
  px: THREE.Vector2;
}

const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const v3 = new THREE.Vector3();
const q1 = new THREE.Quaternion();
const plane = new THREE.Plane();

export class TransformGizmo extends THREE.Object3D<TransformGizmoEventMap> {
  camera: GizmoCamera;
  readonly domElement: HTMLElement;
  object: THREE.Object3D | null = null;
  mode: GizmoMode;
  space: GizmoSpace;
  size: number;
  snap: GizmoSnap | null;
  /** False: drawn, but it ignores the pointer. */
  enabled = true;
  /** True while a handle is being dragged. */
  dragging = false;
  /** The handle under the pointer or in the hand. */
  handle: GizmoHandle | null = null;

  private parts: Part[] = [];
  private groups: Record<GizmoMode, THREE.Group> = { translate: new THREE.Group(), rotate: new THREE.Group(), scale: new THREE.Group() };
  private arcs: Array<{ frame: THREE.Group; arc: THREE.Group }> = [];
  private billboard = new THREE.Group();
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private eye = new THREE.Vector3();
  private drag: Drag | null = null;
  private owned: Array<{ dispose: () => void }> = [];

  constructor(camera: GizmoCamera, domElement: HTMLElement, options: TransformGizmoOptions = {}) {
    super();
    this.camera = camera;
    this.domElement = domElement;
    this.mode = options.mode ?? 'translate';
    this.space = options.space ?? 'world';
    this.size = options.size ?? 1;
    this.snap = options.snap ?? null;
    this.visible = false;
    this.build({ ...DEFAULT_COLORS, ...options.colors });
    this.setMode(this.mode);
    domElement.addEventListener('pointerdown', this.onPointerDown);
    domElement.addEventListener('pointermove', this.onPointerMove);
    domElement.addEventListener('pointerup', this.onPointerUp);
    domElement.addEventListener('pointercancel', this.onPointerUp);
    domElement.addEventListener('pointerleave', this.onPointerLeave);
  }

  /** Put the handles on an object. */
  attach(object: THREE.Object3D) {
    this.object = object;
    this.visible = true;
    this.redraw();
    return this;
  }

  detach() {
    this.endDrag();
    this.object = null;
    this.visible = false;
    this.setHandle(null);
    this.redraw();
    return this;
  }

  setMode(mode: GizmoMode) {
    this.endDrag();
    this.mode = mode;
    for (const key of Object.keys(this.groups) as GizmoMode[]) this.groups[key].visible = key === mode;
    this.setHandle(null);
    this.redraw();
  }

  setSpace(space: GizmoSpace) {
    this.space = space;
    this.redraw();
  }

  dispose() {
    const el = this.domElement;
    el.removeEventListener('pointerdown', this.onPointerDown);
    el.removeEventListener('pointermove', this.onPointerMove);
    el.removeEventListener('pointerup', this.onPointerUp);
    el.removeEventListener('pointercancel', this.onPointerUp);
    el.removeEventListener('pointerleave', this.onPointerLeave);
    for (const item of this.owned) item.dispose();
    this.removeFromParent();
  }

  /** Follows the object, faces the camera and keeps its size on screen: three calls this every frame. */
  override updateMatrixWorld(force?: boolean) {
    const object = this.object;
    if (object) {
      object.updateWorldMatrix(true, false);
      object.matrixWorld.decompose(this.position, q1, v1);
      // scale handles always follow the object's own axes: a scale is a local thing
      if (this.space === 'local' || this.mode === 'scale') this.quaternion.copy(q1);
      else this.quaternion.identity();

      const camera = this.camera;
      camera.updateWorldMatrix(true, false);
      const cameraPosition = v2.setFromMatrixPosition(camera.matrixWorld);
      let span: number;
      if ((camera as THREE.OrthographicCamera).isOrthographicCamera) {
        const ortho = camera as THREE.OrthographicCamera;
        span = (ortho.top - ortho.bottom) / ortho.zoom;
        this.eye.set(0, 0, 1).transformDirection(camera.matrixWorld);
      } else {
        const perspective = camera as THREE.PerspectiveCamera;
        span = (2 * this.position.distanceTo(cameraPosition) * Math.tan((perspective.fov * Math.PI) / 360)) / perspective.zoom;
        this.eye.copy(cameraPosition).sub(this.position).normalize();
      }
      this.scale.setScalar(Math.max(1e-6, (span * this.size) / 4.4));

      // each ring shows the half that faces the camera
      for (const { frame, arc } of this.arcs) {
        const seen = v3.copy(this.eye).applyQuaternion(q1.copy(this.quaternion).multiply(frame.quaternion).invert());
        arc.rotation.z = Math.atan2(seen.y, seen.x) - Math.PI / 2;
      }
      camera.matrixWorld.decompose(v3, q1, v1);
      this.billboard.quaternion.copy(this.quaternion).invert().multiply(q1);
    }
    super.updateMatrixWorld(force);
  }

  /* ---------- building ---------- */

  private keep<T extends { dispose: () => void }>(item: T) {
    this.owned.push(item);
    return item;
  }

  private part(mode: GizmoMode, handle: GizmoHandle, color: THREE.ColorRepresentation, opacity: number, visuals: THREE.BufferGeometry[], pick: THREE.BufferGeometry, into: THREE.Object3D) {
    const material = this.keep(new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthTest: false, depthWrite: false, toneMapped: false, fog: false, side: THREE.DoubleSide }));
    for (const geometry of visuals) {
      const mesh = new THREE.Mesh(this.keep(geometry), material);
      mesh.renderOrder = 999;
      into.add(mesh);
    }
    const picker = new THREE.Mesh(this.keep(pick), material);
    picker.visible = false; // never drawn; the raycaster reads it all the same
    into.add(picker);
    this.parts.push({ mode, handle, material, base: new THREE.Color(color), opacity, picker });
  }

  private build(colors: GizmoColors) {
    const { translate, rotate, scale } = this.groups;
    this.add(translate, rotate, scale);
    const along = (axis: AxisName, parent: THREE.Object3D) => {
      // a frame whose +Y runs along the axis: cylinders and cones are made along Y
      const frame = new THREE.Group();
      frame.quaternion.setFromUnitVectors(UP, AXIS[axis]);
      parent.add(frame);
      return frame;
    };
    const at = <G extends THREE.BufferGeometry>(geometry: G, y: number) => geometry.translate(0, y, 0) as G;

    for (const axis of AXIS_NAMES) {
      // move: a shaft with an arrowhead
      this.part('translate', axis, colors[axis], 0.95, [at(new THREE.CylinderGeometry(0.011, 0.011, 0.66, 8), 0.51), at(new THREE.ConeGeometry(0.052, 0.19, 24), 0.93)], at(new THREE.CylinderGeometry(0.085, 0.085, 0.86, 6), 0.61), along(axis, translate));
      // scale: a shaft with a block
      this.part('scale', axis, colors[axis], 0.95, [at(new THREE.CylinderGeometry(0.011, 0.011, 0.58, 8), 0.47), at(new THREE.BoxGeometry(0.095, 0.095, 0.095), 0.8)], at(new THREE.CylinderGeometry(0.085, 0.085, 0.74, 6), 0.52), along(axis, scale));
      // turn: half a ring about the axis, kept towards the camera
      const frame = new THREE.Group();
      frame.quaternion.setFromUnitVectors(FORWARD, AXIS[axis]);
      const arc = new THREE.Group();
      frame.add(arc);
      rotate.add(frame);
      this.arcs.push({ frame, arc });
      this.part('rotate', axis, colors[axis], 0.95, [new THREE.TorusGeometry(0.82, 0.011, 8, 64, Math.PI)], new THREE.TorusGeometry(0.82, 0.075, 4, 32, Math.PI), arc);
    }

    // move in a plane: a small square between two axes, in the colour of the third
    const planes: Array<[GizmoHandle, AxisName, THREE.Euler]> = [
      ['xy', 'z', new THREE.Euler(0, 0, 0)],
      ['yz', 'x', new THREE.Euler(0, -Math.PI / 2, 0)],
      ['xz', 'y', new THREE.Euler(Math.PI / 2, 0, 0)],
    ];
    for (const [handle, normal, turn] of planes) {
      const frame = new THREE.Group();
      frame.rotation.copy(turn);
      translate.add(frame);
      this.part('translate', handle, colors[normal], 0.42, [new THREE.PlaneGeometry(0.17, 0.17).translate(0.3, 0.3, 0)], new THREE.PlaneGeometry(0.25, 0.25).translate(0.3, 0.3, 0), frame);
    }

    // the centre: move across the screen, or scale all three together
    this.part('translate', 'xyz', colors.neutral, 0.9, [new THREE.SphereGeometry(0.05, 20, 12)], new THREE.SphereGeometry(0.11, 8, 6), translate);
    this.part('scale', 'xyz', colors.neutral, 0.9, [new THREE.BoxGeometry(0.12, 0.12, 0.12)], new THREE.BoxGeometry(0.2, 0.2, 0.2), scale);

    // roll about the line of sight: an outer ring that always faces the camera
    rotate.add(this.billboard);
    this.part('rotate', 'screen', colors.neutral, 0.5, [new THREE.TorusGeometry(0.98, 0.007, 8, 96)], new THREE.TorusGeometry(0.98, 0.06, 4, 48), this.billboard);
  }

  /* ---------- pointer ---------- */

  private redraw() {
    this.dispatchEvent({ type: 'change' });
  }

  private setHandle(handle: GizmoHandle | null) {
    const changed = handle !== this.handle;
    this.handle = handle;
    for (const part of this.parts) {
      const lit = part.handle === handle && part.mode === this.mode;
      part.material.color.copy(part.base);
      if (lit) part.material.color.lerp(WHITE, 0.42);
      // in the hand, the rest steps back
      part.material.opacity = lit ? 1 : this.dragging ? part.opacity * 0.28 : part.opacity;
    }
    if (changed) this.domElement.style.cursor = handle ? (this.dragging ? 'grabbing' : 'grab') : '';
    return changed;
  }

  private aim(event: PointerEvent) {
    const rect = this.domElement.getBoundingClientRect();
    this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.raycaster.ray;
  }

  private pick(event: PointerEvent): GizmoHandle | null {
    if (!this.object || !this.enabled) return null;
    this.aim(event);
    const pickers = this.parts.filter((p) => p.mode === this.mode).map((p) => p.picker);
    const hits = this.raycaster.intersectObjects(pickers, false);
    if (!hits.length) return null;
    // the centre wins where it overlaps the start of the axes
    const centre = hits.find((h) => this.parts.find((p) => p.picker === h.object)?.handle === 'xyz');
    const hit = centre ?? hits[0];
    return this.parts.find((p) => p.picker === hit.object)!.handle;
  }

  /** Where along a line (origin + t·direction) the pointer's ray passes closest. */
  private along(ray: THREE.Ray, origin: THREE.Vector3, direction: THREE.Vector3) {
    const w = v1.copy(origin).sub(ray.origin);
    const b = direction.dot(ray.direction);
    const denominator = 1 - b * b;
    if (denominator < 1e-5) return null;
    return (b * ray.direction.dot(w) - direction.dot(w)) / denominator;
  }

  private onPlane(ray: THREE.Ray, origin: THREE.Vector3, normal: THREE.Vector3) {
    plane.setFromNormalAndCoplanarPoint(normal, origin);
    return ray.intersectPlane(plane, new THREE.Vector3());
  }

  /** The normal of the plane a handle moves in: the third axis, or the line of sight. */
  private normalOf(handle: GizmoHandle, frame: THREE.Quaternion) {
    if (handle === 'xy') return AXIS.z.clone().applyQuaternion(frame);
    if (handle === 'yz') return AXIS.x.clone().applyQuaternion(frame);
    if (handle === 'xz') return AXIS.y.clone().applyQuaternion(frame);
    return this.eye.clone();
  }

  private toPixels(world: THREE.Vector3) {
    const rect = this.domElement.getBoundingClientRect();
    const p = v3.copy(world).project(this.camera);
    return new THREE.Vector2(((p.x + 1) / 2) * rect.width, ((1 - p.y) / 2) * rect.height);
  }

  private onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || !this.object || !this.enabled) return;
    const handle = this.pick(event);
    if (!handle) return;
    const object = this.object;
    const ray = this.raycaster.ray;
    this.updateMatrixWorld();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    object.matrixWorld.decompose(position, quaternion, v1);
    const parentInverse = new THREE.Quaternion();
    if (object.parent) object.parent.getWorldQuaternion(parentInverse).invert();
    const frame = this.quaternion.clone();
    const single = handle === 'x' || handle === 'y' || handle === 'z';
    const axis = single ? AXIS[handle].clone().applyQuaternion(frame) : this.mode === 'rotate' ? this.eye.clone() : this.normalOf(handle, frame);
    const rect = this.domElement.getBoundingClientRect();
    const px = new THREE.Vector2(event.clientX - rect.left, event.clientY - rect.top);
    const centre = this.toPixels(position);

    let hit: THREE.Vector3 | null = position.clone();
    let param = 0;
    let tangent: THREE.Vector2 | null = null;
    if (this.mode === 'rotate') {
      if (Math.abs(axis.dot(this.eye)) > 0.2) hit = this.onPlane(ray, position, axis);
      else {
        // edge-on: the near side of the ring travels along axis × eye
        const travel = this.toPixels(v2.copy(axis).cross(this.eye).multiplyScalar(this.scale.x).add(position)).sub(centre);
        tangent = travel.lengthSq() > 1e-6 ? travel.normalize() : new THREE.Vector2(1, 0);
      }
    } else if (single) {
      const t = this.along(ray, position, axis);
      if (t === null) return;
      param = t;
    } else if (this.mode === 'translate') hit = this.onPlane(ray, position, axis);
    if (!hit) return;

    this.drag = { handle, pointerId: event.pointerId, position, quaternion, scale: object.scale.clone(), parentInverse, frame, axis, hit, param, angle: 0, last: 0, tangent, px };
    this.dragging = true;
    this.setHandle(handle);
    this.domElement.style.cursor = 'grabbing';
    try {
      this.domElement.setPointerCapture(event.pointerId);
    } catch {
      /* capture is best-effort */
    }
    event.preventDefault();
    this.dispatchEvent({ type: 'dragging-changed', value: true });
    this.redraw();
  };

  private onPointerMove = (event: PointerEvent) => {
    const drag = this.drag;
    if (!drag) {
      if (event.buttons) return; // someone else's drag (an orbit) is passing over
      if (this.setHandle(this.pick(event))) this.redraw();
      return;
    }
    if (event.pointerId !== drag.pointerId || !this.object) return;
    const ray = this.aim(event);
    const snapping = this.snap ?? (event.ctrlKey || event.metaKey ? DEFAULT_SNAP : null);
    const grain = (step: number | undefined, value: number) => (step ? Math.round(value / step) * step : value);
    const fine = event.shiftKey ? 0.25 : 1;
    const object = this.object;
    const single = drag.handle === 'x' || drag.handle === 'y' || drag.handle === 'z';
    const rect = this.domElement.getBoundingClientRect();
    const px = v2.set(event.clientX - rect.left, event.clientY - rect.top, 0);

    if (this.mode === 'translate') {
      const offset = new THREE.Vector3();
      if (single) {
        const t = this.along(ray, drag.position, drag.axis);
        if (t === null) return;
        offset.copy(drag.axis).multiplyScalar(grain(snapping?.translate, (t - drag.param) * fine));
      } else {
        const hit = this.onPlane(ray, drag.position, drag.axis);
        if (!hit) return;
        offset.copy(hit).sub(drag.hit).multiplyScalar(fine);
        if (snapping?.translate) {
          // snap along the gizmo's own axes
          const local = offset.applyQuaternion(q1.copy(drag.frame).invert());
          local.set(grain(snapping.translate, local.x), grain(snapping.translate, local.y), grain(snapping.translate, local.z));
          offset.applyQuaternion(drag.frame);
        }
      }
      const world = offset.add(drag.position);
      object.position.copy(object.parent ? object.parent.worldToLocal(world) : world);
    } else if (this.mode === 'rotate') {
      if (drag.tangent) {
        drag.angle += (((px.x - drag.px.x) * drag.tangent.x + (px.y - drag.px.y) * drag.tangent.y) / 90) * fine;
        drag.px.set(px.x, px.y);
      } else {
        const hit = this.onPlane(ray, drag.position, drag.axis);
        if (!hit) return;
        const from = v1.copy(drag.hit).sub(drag.position).normalize();
        const side = v3.copy(drag.axis).cross(from);
        const to = hit.sub(drag.position);
        const reading = Math.atan2(to.dot(side), to.dot(from));
        let step = reading - drag.last;
        if (step > Math.PI) step -= 2 * Math.PI;
        else if (step < -Math.PI) step += 2 * Math.PI;
        drag.last = reading;
        drag.angle += step * fine;
      }
      const step = snapping?.rotate ? (snapping.rotate * Math.PI) / 180 : 0;
      const world = q1.setFromAxisAngle(drag.axis, grain(step, drag.angle)).multiply(drag.quaternion);
      object.quaternion.copy(drag.parentInverse).multiply(world).normalize();
    } else {
      let factor: number;
      if (single) {
        const t = this.along(ray, drag.position, drag.axis);
        if (t === null || Math.abs(drag.param) < 1e-6) return;
        factor = t / drag.param;
      } else factor = 1 + (px.x - drag.px.x - (px.y - drag.px.y)) / 120; // right and up grow, left and down shrink
      factor = Math.max(0.01, grain(snapping?.scale, 1 + (factor - 1) * fine));
      object.scale.copy(drag.scale);
      if (single) object.scale[drag.handle as AxisName] *= factor;
      else object.scale.multiplyScalar(factor);
    }
    this.dispatchEvent({ type: 'objectChange' });
    this.redraw();
  };

  private endDrag() {
    const drag = this.drag;
    if (!drag) return;
    this.drag = null;
    this.dragging = false;
    try {
      this.domElement.releasePointerCapture(drag.pointerId);
    } catch {
      /* already released */
    }
    this.setHandle(this.handle);
    this.domElement.style.cursor = this.handle ? 'grab' : '';
    this.dispatchEvent({ type: 'dragging-changed', value: false });
    this.redraw();
  }

  private onPointerUp = () => this.endDrag();

  private onPointerLeave = () => {
    if (!this.drag && this.setHandle(null)) this.redraw();
  };
}
