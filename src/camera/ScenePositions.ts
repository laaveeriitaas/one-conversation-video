// Posiciones de cámara para cada escena
import * as THREE from 'three';
import { CONFIG } from '../config';

export interface CameraState {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
}

export const SCENE_CAMERA_STATES: Record<string, CameraState> = {
  describe: {
    position: new THREE.Vector3(-40, 1.5, 8),
    target: new THREE.Vector3(-40, 0, 0),
    fov: 40,
  },
  plan: {
    position: new THREE.Vector3(0, 1.5, 8),
    target: new THREE.Vector3(0, 0, 0),
    fov: 40,
  },
  build: {
    position: new THREE.Vector3(40, 1.5, 8),
    target: new THREE.Vector3(40, 0, 0),
    fov: 40,
  },
  launch: {
    position: new THREE.Vector3(0, 1.5, 48),
    target: new THREE.Vector3(0, 0, 40),
    fov: 40,
  },
  reveal: {
    position: new THREE.Vector3(0, 20, 80),
    target: new THREE.Vector3(0, 0, 0),
    fov: 50,
  },
};

// Posiciones de los paneles en el mundo
export const PANEL_WORLD_POSITIONS = {
  describe: new THREE.Vector3(-40, 0, 0),
  plan: new THREE.Vector3(0, 0, 0),
  build: new THREE.Vector3(40, 0, 0),
  launch: new THREE.Vector3(0, 0, 40),
} as const;

export const SCENE_ORDER = ['describe', 'plan', 'build', 'launch', 'reveal'] as const;
export type SceneName = typeof SCENE_ORDER[number];

export function getSceneIndex(name: SceneName): number {
  return SCENE_ORDER.indexOf(name);
}

export function getSceneTiming(name: SceneName): { start: number; end: number } {
  const timings = CONFIG.sceneTiming;
  switch (name) {
    case 'describe': return { start: timings.describe.start, end: timings.describe.end };
    case 'plan': return { start: timings.plan.start, end: timings.plan.end };
    case 'build': return { start: timings.build.start, end: timings.build.end };
    case 'launch': return { start: timings.launch.start, end: timings.launch.end };
    case 'reveal': return { start: timings.reveal.start, end: timings.reveal.end };
  }
}