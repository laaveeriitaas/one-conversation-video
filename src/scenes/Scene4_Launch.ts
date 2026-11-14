// Scene 4: Lanzarlo - Phone with habit app + confetti
import * as THREE from 'three';
import { BaseScene } from './BaseScene';
import { PhoneMockup } from '../ui/PhoneMockup';
import { ConfettiManager } from '../effects/Confetti';
import { CONFIG } from '../config';

export class Scene4_Launch extends BaseScene {
  private phoneMockup: PhoneMockup;
  private confettiManager: ConfettiManager;
  private stepLabel: THREE.Mesh;
  private confettiTriggered: boolean = false;

  constructor(scene: THREE.Scene) {
    super(scene);

    // Create phone mockup
    this.phoneMockup = new PhoneMockup();
    this.worldGroup.add(this.phoneMockup.getMesh());
    this.phoneMockup.getMesh().position.set(0, 2, 0);

    // Create confetti manager
    this.confettiManager = new ConfettiManager();
    this.worldGroup.add(this.confettiManager.getMesh());

    // Create step label
    this.stepLabel = this.createStepLabel('STEP 04', 'LAUNCH');
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
    this.confettiTriggered = false;
    this.phoneMockup.startAppear();
    this.phoneMockup.getHabitApp().start();
    this.confettiManager.reset();
  }

  update(deltaTime: number, globalTime: number, sceneProgress: number): void {
    this.phoneMockup.update(deltaTime, globalTime);
    this.confettiManager.update(deltaTime);

    // Trigger confetti when habit app completes
    if (!this.confettiTriggered && this.phoneMockup.getHabitApp().shouldTriggerConfetti()) {
      this.confettiTriggered = true;
      this.confettiManager.trigger(new THREE.Vector3(0, 10, 0));
    }
  }

  exit(): void {
    // Cleanup handled by dispose
  }

  getPhoneMockup(): PhoneMockup {
    return this.phoneMockup;
  }

  getConfettiManager(): ConfettiManager {
    return this.confettiManager;
  }

  getStepLabel(): THREE.Mesh {
    return this.stepLabel;
  }

  dispose(): void {
    this.phoneMockup.dispose();
    this.confettiManager.dispose();
    if (this.stepLabel) {
      this.stepLabel.geometry.dispose();
      (this.stepLabel.material as THREE.Material).dispose();
    }
    super.dispose();
  }
}