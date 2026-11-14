// Scene 5: Revelación - Wide shot + curtain + final text
import * as THREE from 'three';
import { BaseScene } from './BaseScene';
import { CONFIG } from '../config';
import { easeOutBack, easeOutElastic } from '../utils/easing';

export class Scene5_Reveal extends BaseScene {
  private curtain: THREE.Mesh;
  private finalText: THREE.Mesh;
  private builtWithPill: THREE.Mesh;
  private sceneLabel: THREE.Mesh;

  // Animation state
  private curtainProgress: number = 0;
  private textProgress: number = 0;
  private pillProgress: number = 0;
  private pullbackProgress: number = 0;
  private isPullbackComplete: boolean = false;

  constructor(scene: THREE.Scene) {
    super(scene);

    // Dark curtain (large plane)
    this.curtain = this.createCurtain();
    this.worldGroup.add(this.curtain);

    // Final text: "ONE CONVERSATION / Idea → App"
    this.finalText = this.createFinalText();
    this.worldGroup.add(this.finalText);

    // "Built with Claude Code" pill
    this.builtWithPill = this.createBuiltWithPill();
    this.worldGroup.add(this.builtWithPill);

    // Scene label (minimal)
    this.sceneLabel = this.createStepLabel('STEP 05', 'REVEAL');
    this.worldGroup.add(this.sceneLabel);
    this.sceneLabel.position.set(0, -7, 0.3);
  }

  private createCurtain(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(300, 200);
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, -10); // Behind everything
    mesh.renderOrder = 10; // Render last
    return mesh;
  }

  private createFinalText(): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // "ONE CONVERSATION"
    ctx.font = '800 84px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ONE CONVERSATION', canvas.width / 2, 140);

    // Divider
    ctx.font = '400 48px Inter, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('/', canvas.width / 2, 230);

    // "Idea → App"
    ctx.font = '600 72px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#ff8a4c';
    ctx.fillText('Idea', canvas.width / 2 - 140, 330);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('→', canvas.width / 2, 330);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('App', canvas.width / 2 + 140, 330);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const geometry = new THREE.PlaneGeometry(40, 10);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 5, -5); // In front of curtain
    return mesh;
  }

  private createBuiltWithPill(): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padding = 24;
    const radius = 40;
    const pillW = 400;
    const pillH = 80;
    const x = (canvas.width - pillW) / 2;
    const y = (canvas.height - pillH) / 2;

    // Glassmorphism pill background
    const grad = ctx.createLinearGradient(x, y, x + pillW, y + pillH);
    grad.addColorStop(0, 'rgba(255,255,255,0.15)');
    grad.addColorStop(1, 'rgba(255,255,255,0.05)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, pillW, pillH, radius);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, pillW, pillH, radius);
    ctx.stroke();

    // Text
    ctx.font = '600 28px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Built with Claude Code', canvas.width / 2, canvas.height / 2 + 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const geometry = new THREE.PlaneGeometry(20, 5);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    // Position fixed to camera (will be updated in render loop)
    mesh.position.set(0, -12, -8);
    mesh.renderOrder = 20; // On top
    return mesh;
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
    this.curtainProgress = 0;
    this.textProgress = 0;
    this.pillProgress = 0;
    this.pullbackProgress = 0;
    this.isPullbackComplete = false;

    // Reset curtain
    (this.curtain.material as THREE.MeshBasicMaterial).opacity = 0;
    this.curtain.position.y = 100; // Start above

    // Reset text
    this.finalText.scale.setScalar(0);
    this.finalText.position.set(0, 5, -5);

    // Reset pill
    this.builtWithPill.scale.setScalar(0);
  }

  update(deltaTime: number, globalTime: number, sceneProgress: number): void {
    // Phase 1: Camera pullback (first 2 seconds of scene)
    if (!this.isPullbackComplete) {
      this.pullbackProgress += deltaTime / 2.0;
      this.pullbackProgress = Math.min(1, this.pullbackProgress);

      if (this.pullbackProgress >= 1) {
        this.isPullbackComplete = true;
      }
    }

    // Phase 2: Curtain fade down (after pullback)
    if (this.isPullbackComplete) {
      this.curtainProgress += deltaTime / 1.5;
      this.curtainProgress = Math.min(1, this.curtainProgress);

      const curtainMaterial = this.curtain.material as THREE.MeshBasicMaterial;
      curtainMaterial.opacity = this.curtainProgress;
      this.curtain.position.y = 100 * (1 - this.curtainProgress);
    }

    // Phase 3: Final text appear (after curtain starts)
    if (this.curtainProgress > 0.3) {
      this.textProgress += deltaTime / 1.2;
      this.textProgress = Math.min(1, this.textProgress);

      const eased = easeOutElastic(this.textProgress);
      this.finalText.scale.setScalar(eased);

      // Subtle float
      this.finalText.position.y = 5 + Math.sin(globalTime * 2) * 0.1;
    }

    // Phase 4: Built with pill appear
    if (this.textProgress > 0.6) {
      this.pillProgress += deltaTime / 0.8;
      this.pillProgress = Math.min(1, this.pillProgress);

      const eased = easeOutBack(this.pillProgress);
      this.builtWithPill.scale.setScalar(eased);
    }
  }

  exit(): void {
    // Cleanup handled by dispose
  }

  getCurtain(): THREE.Mesh {
    return this.curtain;
  }

  getFinalText(): THREE.Mesh {
    return this.finalText;
  }

  getBuiltWithPill(): THREE.Mesh {
    return this.builtWithPill;
  }

  getPullbackProgress(): number {
    return this.pullbackProgress;
  }

  isComplete(): boolean {
    return this.pillProgress >= 1;
  }

  dispose(): void {
    if (this.curtain) {
      this.curtain.geometry.dispose();
      (this.curtain.material as THREE.Material).dispose();
    }
    if (this.finalText) {
      this.finalText.geometry.dispose();
      (this.finalText.material as THREE.Material).dispose();
    }
    if (this.builtWithPill) {
      this.builtWithPill.geometry.dispose();
      (this.builtWithPill.material as THREE.Material).dispose();
    }
    if (this.sceneLabel) {
      this.sceneLabel.geometry.dispose();
      (this.sceneLabel.material as THREE.Material).dispose();
    }
    super.dispose();
  }
}