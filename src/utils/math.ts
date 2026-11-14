// Utilidades matemáticas 3D
import * as THREE from 'three';

export function lerpVec3(a: THREE.Vector3, b: THREE.Vector3, t: number, out = new THREE.Vector3()): THREE.Vector3 {
  return out.lerpVectors(a, b, t);
}

export function lerpQuat(a: THREE.Quaternion, b: THREE.Quaternion, t: number, out = new THREE.Quaternion()): THREE.Quaternion {
  return out.slerpQuaternions(a, b, t);
}

export function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randomVec3(xRange: [number, number], yRange: [number, number], zRange: [number, number], out = new THREE.Vector3()): THREE.Vector3 {
  return out.set(
    randomInRange(xRange[0], xRange[1]),
    randomInRange(yRange[0], yRange[1]),
    randomInRange(zRange[0], zRange[1])
  );
}

// Perlin noise simple para drift de cámara (1D)
const perm = new Array(512);
const grad3 = new Array(512);
for (let i = 0; i < 256; i++) {
  perm[i] = i;
  const angle = (i / 256) * Math.PI * 2;
  grad3[i] = { x: Math.cos(angle), y: Math.sin(angle), z: 0 };
}
for (let i = 0; i < 256; i++) {
  const j = Math.floor(Math.random() * 256);
  [perm[i], perm[j]] = [perm[j], perm[i]];
  perm[i + 256] = perm[i];
  grad3[i + 256] = grad3[i];
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerpInternal(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

function grad(hash: { x: number; y: number; z: number }, x: number, y: number, z: number): number {
  return hash.x * x + hash.y * y + hash.z * z;
}

export function perlin1D(x: number): number {
  const X = Math.floor(x) & 255;
  x -= Math.floor(x);
  const u = fade(x);
  const a = perm[X];
  const b = perm[X + 1];
  return lerpInternal(grad(grad3[a], x, 0, 0), grad(grad3[b], x - 1, 0, 0), u);
}

export function perlin2D(x: number, y: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  const u = fade(x);
  const v = fade(y);
  const a = perm[X] + Y;
  const b = perm[X + 1] + Y;
  return lerpInternal(
    lerpInternal(grad(grad3[perm[a]], x, y, 0), grad(grad3[perm[b]], x - 1, y, 0), u),
    lerpInternal(grad(grad3[perm[a + 1]], x, y - 1, 0), grad(grad3[perm[b + 1]], x - 1, y - 1, 0), u),
    v
  );
}

export function perlin3D(x: number, y: number, z: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  z -= Math.floor(z);
  const u = fade(x);
  const v = fade(y);
  const w = fade(z);
  const A = perm[X] + Y;
  const AA = perm[A] + Z;
  const AB = perm[A + 1] + Z;
  const B = perm[X + 1] + Y;
  const BA = perm[B] + Z;
  const BB = perm[B + 1] + Z;
  return lerpInternal(
    lerpInternal(
      lerpInternal(grad(grad3[perm[AA]], x, y, z), grad(grad3[perm[BA]], x - 1, y, z), u),
      lerpInternal(grad(grad3[perm[AB]], x, y - 1, z), grad(grad3[perm[BB]], x - 1, y - 1, z), u),
      v
    ),
    lerpInternal(
      lerpInternal(grad(grad3[perm[AA + 1]], x, y, z - 1), grad(grad3[perm[BA + 1]], x - 1, y, z - 1), u),
      lerpInternal(grad(grad3[perm[AB + 1]], x, y - 1, z - 1), grad(grad3[perm[BB + 1]], x - 1, y - 1, z - 1), u),
      v
    ),
    w
  );
}

// Generar posición en órbita elíptica
export function getOrbitPosition(
  time: number,
  radiusX: number,
  radiusZ: number,
  speed: number,
  height: number = 0,
  phase: number = 0,
  out = new THREE.Vector3()
): THREE.Vector3 {
  const angle = time * speed + phase;
  return out.set(
    Math.cos(angle) * radiusX,
    height + Math.sin(angle * 0.5) * 0.5, // ligero movimiento vertical
    Math.sin(angle) * radiusZ
  );
}

// Generar matriz de rotación look-at
export function lookAtMatrix(
  position: THREE.Vector3,
  target: THREE.Vector3,
  up: THREE.Vector3 = new THREE.Vector3(0, 1, 0),
  out = new THREE.Matrix4()
): THREE.Matrix4 {
  return out.lookAt(position, target, up);
}

// Easing functions (re-export from easing.ts for convenience)
export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function easeInOutExpo(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  if (t < 0.5) return 0.5 * Math.pow(2, 20 * t - 10);
  return 0.5 * (2 - Math.pow(2, -20 * t + 10));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}