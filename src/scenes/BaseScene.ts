// Base scene class with lifecycle
import * as THREE from 'three';
import { CONFIG } from '../config';

export abstract class BaseScene {
  protected scene: THREE.Scene;
  protected worldGroup: THREE.Group;
  protected isActive: boolean = false;
  protected progress: number = 0; // 0 to 1 within scene

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);
  }

  // Called when scene becomes active
  abstract enter(): void;

  // Called every frame while active
  abstract update(deltaTime: number, globalTime: number, sceneProgress: number): void;

  // Called when scene becomes inactive
  abstract exit(): void;

  // Optional: called every frame regardless of active state
  updateGlobal(deltaTime: number, globalTime: number): void {}

  activate(): void {
    this.isActive = true;
    this.progress = 0;
    this.enter();
  }

  deactivate(): void {
    this.isActive = false;
    this.exit();
  }

  getProgress(): number {
    return this.progress;
  }

  isSceneActive(): boolean {
    return this.isActive;
  }

  protected setProgress(p: number): void {
    this.progress = Math.max(0, Math.min(1, p));
  }

  // Cleanup
  dispose(): void {
    this.worldGroup.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      } else if (child instanceof THREE.Group) {
        child.children.forEach(c => {
          if (c instanceof THREE.Mesh) {
            c.geometry.dispose();
            if (Array.isArray(c.material)) {
              c.material.forEach(m => m.dispose());
            } else {
              c.material.dispose();
            }
          }
        });
      }
    });
    this.scene.remove(this.worldGroup);
  }

  getGroup(): THREE.Group {
    return this.worldGroup;
  }
}