// Controlador de cámara: vuelo entre escenas, drift lento, cuts rápidos
import * as THREE from 'three';
import { CONFIG } from '../config';
import { SCENE_CAMERA_STATES, SCENE_ORDER, SceneName, getSceneTiming } from './ScenePositions';
import { easeInOutExpo, easeOutExpo, lerp, perlin3D } from '../utils/math';

export class CameraController {
  camera: THREE.PerspectiveCamera;
  currentScene: SceneName = 'describe';
  previousScene: SceneName = 'describe';
  transitionProgress: number = 0;
  isTransitioning: boolean = false;

  // Drift
  driftTime: number = 0;
  driftSeed: number = Math.random() * 1000;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.setScene('describe', true);
  }

  setScene(scene: SceneName, instant = false): void {
    this.previousScene = this.currentScene;
    this.currentScene = scene;
    this.transitionProgress = instant ? 1 : 0;
    this.isTransitioning = !instant;
    this.driftTime = 0;
  }

  update(time: number, deltaTime: number): void {
    const timing = getSceneTiming(this.currentScene);
    const sceneProgress = (time - timing.start) / (timing.end - timing.start);

    if (this.isTransitioning) {
      this.transitionProgress = Math.min(1, this.transitionProgress + deltaTime / CONFIG.camera.transitionDuration);

      if (this.transitionProgress >= 1) {
        this.isTransitioning = false;
        this.transitionProgress = 1;
      }
    }

    // Drift time accumulates during scene
    this.driftTime += deltaTime * CONFIG.camera.driftSpeed;

    const targetState = this.getInterpolatedState(time);
    this.applyCameraState(targetState);
  }

  private getInterpolatedState(time: number): { position: THREE.Vector3; target: THREE.Vector3; fov: number } {
    const currentState = SCENE_CAMERA_STATES[this.currentScene];
    const previousState = SCENE_CAMERA_STATES[this.previousScene];

    // Si no hay transición, usar estado actual con drift
    if (!this.isTransitioning) {
      return this.addDrift(currentState, time);
    }

    // Transición con expo ease
    const t = easeInOutExpo(this.transitionProgress);

    const position = new THREE.Vector3().lerpVectors(previousState.position, currentState.position, t);
    const target = new THREE.Vector3().lerpVectors(previousState.target, currentState.target, t);
    const fov = lerp(previousState.fov, currentState.fov, t);

    return { position, target, fov };
  }

  private addDrift(state: { position: THREE.Vector3; target: THREE.Vector3; fov: number }, time: number): { position: THREE.Vector3; target: THREE.Vector3; fov: number } {
    const amplitude = CONFIG.camera.driftAmplitude;
    const seed = this.driftSeed;

    // Perlin noise para drift orgánico
    const driftX = perlin3D(time * 0.1 + seed, 0, 0) * amplitude;
    const driftY = perlin3D(0, time * 0.1 + seed, 0) * amplitude * 0.5;
    const driftZ = perlin3D(0, 0, time * 0.1 + seed) * amplitude;

    // Target drift (más sutil)
    const targetDriftX = perlin3D(time * 0.08 + seed + 100, 0, 0) * amplitude * 0.3;
    const targetDriftY = perlin3D(0, time * 0.08 + seed + 100, 0) * amplitude * 0.2;

    return {
      position: new THREE.Vector3(
        state.position.x + driftX,
        state.position.y + driftY,
        state.position.z + driftZ
      ),
      target: new THREE.Vector3(
        state.target.x + targetDriftX,
        state.target.y + targetDriftY,
        state.target.z
      ),
      fov: state.fov,
    };
  }

  private applyCameraState(state: { position: THREE.Vector3; target: THREE.Vector3; fov: number }): void {
    this.camera.position.copy(state.position);
    this.camera.lookAt(state.target);
    this.camera.fov = state.fov;
    this.camera.updateProjectionMatrix();
  }

  // Forzar corte inmediato a una escena (para reveal)
  cutToScene(scene: SceneName): void {
    this.setScene(scene, true);
    const state = SCENE_CAMERA_STATES[scene];
    this.camera.position.copy(state.position);
    this.camera.lookAt(state.target);
    this.camera.fov = state.fov;
    this.camera.updateProjectionMatrix();
  }

  getCurrentScene(): SceneName {
    return this.currentScene;
  }

  getTransitionProgress(): number {
    return this.transitionProgress;
  }
}

// Helper para determinar qué escena está activa en tiempo t
export function getSceneAtTime(t: number): SceneName {
  if (t < 3) return 'describe';
  if (t < 6) return 'plan';
  if (t < 9.5) return 'build';
  if (t < 12.5) return 'launch';
  return 'reveal';
}

// Verificar si hay cambio de escena en el frame actual
export function checkSceneTransition(previousTime: number, currentTime: number): SceneName | null {
  const prevScene = getSceneAtTime(previousTime);
  const currScene = getSceneAtTime(currentTime);
  return prevScene !== currScene ? currScene : null;
}