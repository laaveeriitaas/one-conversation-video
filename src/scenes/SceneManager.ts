// Scene manager: global timeline, scene switching
import * as THREE from 'three';
import { CONFIG } from '../config';
import { BaseScene } from './BaseScene';
import { Scene1_Describe } from './Scene1_Describe';
import { Scene2_Plan } from './Scene2_Plan';
import { Scene3_Build } from './Scene3_Build';
import { Scene4_Launch } from './Scene4_Launch';
import { Scene5_Reveal } from './Scene5_Reveal';
import { getActiveScene, getSceneProgress } from '../config';

export class SceneManager {
  private scene: THREE.Scene;
  private scenes: Map<string, BaseScene> = new Map();
  private currentSceneName: string = 'describe';
  private currentScene: BaseScene | null = null;
  private previousSceneName: string | null = null;
  private globalTime: number = 0;
  private isPlaying: boolean = false;
  private timeScale: number = 1;

  // Callbacks
  private onSceneChange?: (name: string, progress: number) => void;
  private onComplete?: () => void;

  constructor(threeScene: THREE.Scene) {
    this.scene = threeScene;
    this.initScenes();
  }

  private initScenes(): void {
    this.scenes.set('describe', new Scene1_Describe(this.scene));
    this.scenes.set('plan', new Scene2_Plan(this.scene));
    this.scenes.set('build', new Scene3_Build(this.scene));
    this.scenes.set('launch', new Scene4_Launch(this.scene));
    this.scenes.set('reveal', new Scene5_Reveal(this.scene));
  }

  setCallbacks(callbacks: {
    onSceneChange?: (name: string, progress: number) => void;
    onComplete?: () => void;
  }): void {
    this.onSceneChange = callbacks.onSceneChange;
    this.onComplete = callbacks.onComplete;
  }

  play(): void {
    this.isPlaying = true;
    this.activateScene('describe');
  }

  pause(): void {
    this.isPlaying = false;
  }

  stop(): void {
    this.isPlaying = false;
    this.globalTime = 0;
    if (this.currentScene) {
      this.currentScene.deactivate();
      this.currentScene = null;
    }
    this.currentSceneName = 'describe';
    this.activateScene('describe');
  }

  setTime(time: number): void {
    this.globalTime = Math.max(0, Math.min(CONFIG.duration, time));
    this.updateSceneForTime(this.globalTime);
  }

  setTimeScale(scale: number): void {
    this.timeScale = scale;
  }

  getGlobalTime(): number {
    return this.globalTime;
  }

  getCurrentSceneName(): string {
    return this.currentSceneName;
  }

  getCurrentScene(): BaseScene | null {
    return this.currentScene;
  }

  getSceneProgress(sceneName?: string): number {
    const name = sceneName || this.currentSceneName;
    return getSceneProgress(this.globalTime, name as keyof typeof CONFIG.sceneTiming);
  }

  update(deltaTime: number): void {
    if (!this.isPlaying) return;

    const scaledDelta = deltaTime * this.timeScale;
    this.globalTime += scaledDelta;

    // Clamp to duration
    if (this.globalTime >= CONFIG.duration) {
      this.globalTime = CONFIG.duration;
      this.isPlaying = false;
      this.onComplete?.();
      return;
    }

    // Check for scene transition
    const newSceneName = getActiveScene(this.globalTime);
    if (newSceneName !== this.currentSceneName) {
      this.transitionToScene(newSceneName);
    }

    // Update current scene
    if (this.currentScene) {
      const sceneProgress = getSceneProgress(this.globalTime, this.currentSceneName as keyof typeof CONFIG.sceneTiming);
      this.currentScene.update(scaledDelta, this.globalTime, sceneProgress);
    }

    // Update all scenes (some may need global updates)
    this.scenes.forEach(scene => {
      scene.updateGlobal(scaledDelta, this.globalTime);
    });
  }

  private updateSceneForTime(time: number): void {
    const newSceneName = getActiveScene(time);
    if (newSceneName !== this.currentSceneName) {
      this.transitionToScene(newSceneName, true);
    }

    if (this.currentScene) {
      const sceneProgress = getSceneProgress(this.globalTime, this.currentSceneName as keyof typeof CONFIG.sceneTiming);
      this.currentScene.update(0, this.globalTime, sceneProgress);
    }
  }

  private transitionToScene(newSceneName: string, instant = false): void {
    // Deactivate previous scene
    if (this.currentScene) {
      this.currentScene.deactivate();
    }

    this.previousSceneName = this.currentSceneName;
    this.currentSceneName = newSceneName;
    this.currentScene = this.scenes.get(newSceneName) || null;

    if (this.currentScene) {
      this.currentScene.activate();
    }

    this.onSceneChange?.(newSceneName, 0);
  }

  private activateScene(name: string): void {
    this.currentSceneName = name;
    this.currentScene = this.scenes.get(name) || null;
    if (this.currentScene) {
      this.currentScene.activate();
    }
  }

  // Get scene by name
  getScene(name: string): BaseScene | undefined {
    return this.scenes.get(name);
  }

  dispose(): void {
    this.scenes.forEach(scene => scene.dispose());
    this.scenes.clear();
    this.currentScene = null;
  }
}