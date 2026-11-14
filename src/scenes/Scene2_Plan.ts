// Scene 2: Planificarlo - Task cards
import * as THREE from 'three';
import { BaseScene } from './BaseScene';
import { TaskCard } from '../ui/TaskCard';
import { CONFIG } from '../config';

export class Scene2_Plan extends BaseScene {
  private taskCards: TaskCard[] = [];
  private stepLabel: THREE.Mesh;
  private entranceStarted: boolean = false;
  private checkStarted: boolean = false;

  constructor(scene: THREE.Scene) {
    super(scene);

    // Create 5 task cards
    for (let i = 0; i < 5; i++) {
      const card = new TaskCard(i, 5);
      this.taskCards.push(card);
      this.worldGroup.add(card.getMesh());
    }

    // Create step label
    this.stepLabel = this.createStepLabel('STEP 02', 'PLAN');
    this.worldGroup.add(this.stepLabel);
    this.stepLabel.position.set(0, -7, 0.3);
  }

  private createStepLabel(stepText: string, wordText: string): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = '800 64px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#ff8a4c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(stepText, canvas.width / 2, 60);

    ctx.font = '700 96px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(wordText, canvas.width / 2, 170);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const geometry = new THREE.PlaneGeometry(16, 4);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    return new THREE.Mesh(geometry, material);
  }

  enter(): void {
    this.entranceStarted = false;
    this.checkStarted = false;

    // Reset all cards
    this.taskCards.forEach((card, i) => {
      card.reset();
      // Start entrance with stagger
      card.startEntrance(i * 0.1);
    });
  }

  update(deltaTime: number, globalTime: number, sceneProgress: number): void {
    // Start entrance animations
    if (!this.entranceStarted) {
      this.entranceStarted = true;
    }

    // Start check animations at specific progress points
    if (sceneProgress > 0.2 && !this.checkStarted) {
      this.checkStarted = true;
      this.taskCards.forEach((card, i) => {
        card.startCheck(i * 0.5); // Staggered 500ms
      });
    }

    // Update all cards
    this.taskCards.forEach(card => {
      card.update(deltaTime, globalTime);
    });
  }

  exit(): void {
    // Cards will be cleaned up by dispose
  }

  getTaskCards(): TaskCard[] {
    return this.taskCards;
  }

  getStepLabel(): THREE.Mesh {
    return this.stepLabel;
  }

  areAllComplete(): boolean {
    return this.taskCards.every(card => card.isComplete());
  }

  dispose(): void {
    this.taskCards.forEach(card => card.dispose());
    if (this.stepLabel) {
      this.stepLabel.geometry.dispose();
      (this.stepLabel.material as THREE.Material).dispose();
    }
    super.dispose();
  }
}