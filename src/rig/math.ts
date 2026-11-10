/* Rig math — the little 3D algebra the rig controls share. No dependency: values are plain
   tuples in three.js's own layout, so they go straight in and out of a scene:

     mesh.quaternion.fromArray(q)      camera.quaternion.fromArray(view)
     mesh.position.fromArray(p)        mesh.rotation.set(...eulerRad)

   Right-handed, Y up, the camera looks down its own −Z. Euler angles are in degrees, order XYZ
   (three's default). */

export type Vec3 = [number, number, number];
/** [x, y, z, w] */
export type Quat = [number, number, number, number];

export const QUAT_IDENTITY: Quat = [0, 0, 0, 1];
export const DEG = Math.PI / 180;

export const AXES = ['x', 'y', 'z'] as const;
export type Axis = (typeof AXES)[number];
export const AXIS_VEC: Record<Axis, Vec3> = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };

export const vLength = (v: Vec3) => Math.hypot(v[0], v[1], v[2]);
export const vNormalize = (v: Vec3): Vec3 => {
  const l = vLength(v) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
export const vCross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const vDot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export const qNormalize = (q: Quat): Quat => {
  const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  return [q[0] / l, q[1] / l, q[2] / l, q[3] / l];
};
export const qConjugate = (q: Quat): Quat => [-q[0], -q[1], -q[2], q[3]];

/** a · b: apply b first, then a. */
export const qMul = (a: Quat, b: Quat): Quat => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];

/** A turn of `angle` radians about a unit axis. */
export const qAxisAngle = (axis: Vec3, angle: number): Quat => {
  const s = Math.sin(angle / 2);
  return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(angle / 2)];
};

/** Rotate a vector by a quaternion. */
export const qRotate = (q: Quat, v: Vec3): Vec3 => {
  const [x, y, z, w] = q;
  const tx = 2 * (y * v[2] - z * v[1]);
  const ty = 2 * (z * v[0] - x * v[2]);
  const tz = 2 * (x * v[1] - y * v[0]);
  return [v[0] + w * tx + (y * tz - z * ty), v[1] + w * ty + (z * tx - x * tz), v[2] + w * tz + (x * ty - y * tx)];
};

/** Shortest-path blend from a to b. */
export const qSlerp = (a: Quat, b: Quat, t: number): Quat => {
  let cos = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  const to: Quat = cos < 0 ? [-b[0], -b[1], -b[2], -b[3]] : b;
  cos = Math.abs(cos);
  if (cos > 0.9995) return qNormalize([a[0] + (to[0] - a[0]) * t, a[1] + (to[1] - a[1]) * t, a[2] + (to[2] - a[2]) * t, a[3] + (to[3] - a[3]) * t]);
  const theta = Math.acos(cos);
  const s = Math.sin(theta);
  const wa = Math.sin((1 - t) * theta) / s;
  const wb = Math.sin(t * theta) / s;
  return [a[0] * wa + to[0] * wb, a[1] * wa + to[1] * wb, a[2] * wa + to[2] * wb, a[3] * wa + to[3] * wb];
};

/** The angle between two orientations, in radians. */
export const qAngle = (a: Quat, b: Quat) => 2 * Math.acos(Math.min(1, Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3])));

/** Euler degrees (XYZ order) → quaternion. */
export const qFromEuler = (e: Vec3): Quat => {
  const [x, y, z] = [e[0] * DEG * 0.5, e[1] * DEG * 0.5, e[2] * DEG * 0.5];
  const [c1, c2, c3, s1, s2, s3] = [Math.cos(x), Math.cos(y), Math.cos(z), Math.sin(x), Math.sin(y), Math.sin(z)];
  return [s1 * c2 * c3 + c1 * s2 * s3, c1 * s2 * c3 - s1 * c2 * s3, c1 * c2 * s3 + s1 * s2 * c3, c1 * c2 * c3 - s1 * s2 * s3];
};

/** Quaternion → Euler degrees (XYZ order), each within ±180. */
export const eulerFromQuat = (q: Quat): Vec3 => {
  const [x, y, z, w] = q;
  const m11 = 1 - 2 * (y * y + z * z);
  const m12 = 2 * (x * y - z * w);
  const m13 = 2 * (x * z + y * w);
  const m22 = 1 - 2 * (x * x + z * z);
  const m23 = 2 * (y * z - x * w);
  const m32 = 2 * (y * z + x * w);
  const m33 = 1 - 2 * (x * x + y * y);
  const ey = Math.asin(Math.max(-1, Math.min(1, m13)));
  const [ex, ez] = Math.abs(m13) < 0.9999999 ? [Math.atan2(-m23, m33), Math.atan2(-m12, m11)] : [Math.atan2(m32, m22), 0];
  const clean = (r: number) => Number((r / DEG).toFixed(4)) + 0;
  return [clean(ex), clean(ey), clean(ez)];
};

/** The six axis views, as camera orientations: `VIEWS.x` looks at the origin from +X. */
export const VIEWS: Record<Axis | '-x' | '-y' | '-z', Quat> = {
  x: qAxisAngle([0, 1, 0], Math.PI / 2),
  '-x': qAxisAngle([0, 1, 0], -Math.PI / 2),
  y: qAxisAngle([1, 0, 0], -Math.PI / 2),
  '-y': qAxisAngle([1, 0, 0], Math.PI / 2),
  z: [0, 0, 0, 1],
  '-z': qAxisAngle([0, 1, 0], Math.PI),
};

/** A camera orientation from an orbit: `azimuth` around Y and `elevation` above the horizon, in degrees. */
export const qFromOrbit = (azimuth: number, elevation: number): Quat => qMul(qAxisAngle([0, 1, 0], azimuth * DEG), qAxisAngle([1, 0, 0], -elevation * DEG));

/** Where an orbiting camera with this orientation stands: `distance` back from `target` along its own +Z. */
export const orbitPosition = (view: Quat, distance: number, target: Vec3 = [0, 0, 0]): Vec3 => {
  const back = qRotate(view, [0, 0, distance]);
  return [target[0] + back[0], target[1] + back[1], target[2] + back[2]];
};

/** Orbit a camera as a turntable: `yaw` radians about the world's Y, `pitch` about the camera's own X, never past the poles. */
export const orbitBy = (view: Quat, yaw: number, pitch: number): Quat => {
  const yawed = qMul(qAxisAngle([0, 1, 0], yaw), view);
  const pitched = qMul(yawed, qAxisAngle([1, 0, 0], pitch));
  return qNormalize(qRotate(pitched, [0, 1, 0])[1] >= 0 ? pitched : yawed);
};
