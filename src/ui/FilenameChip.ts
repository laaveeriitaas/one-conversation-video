// Filename chips orbiting around code editor (Scene 3)
import * as THREE from 'three';
import { CanvasTexture, createPanelTexture } from './CanvasTexture';
import { CONFIG } from '../config';
import { getOrbitPosition } from '../utils/math';

const FILENAMES = [
  'App.tsx',
  'HabitCard.tsx',
  'useStreak.ts',
  'habitStore.ts',
  'types.ts',
  'utils.ts',
];

export class FilenameChip {
  private mesh: THREE.Mesh;
  private texture: CanvasTexture;
  private filename: string;
  private orbitRadiusX: number;
  private orbitRadiusZ: number;
  private orbitSpeed: number;
  private orbitPhase: number;
  private orbitHeight: number;
  private isVisible: boolean = false;
  private appearProgress: number = 0;
  private appearStartTime: number = 0;
  private appearDelay: number = 0;

  constructor(index: number) {
    this.filename = FILENAMES[index];
    this.orbitRadiusX = 18 + index * 1.5;
    this.orbitRadiusZ = 12 + index * 1.0;
    this.orbitSpeed = 0.15 + index * 0.02;
    this.orbitPhase = (index / FILENAMES.length) * Math.PI * 2;
    this.orbitHeight = (index % 2 === 0 ? 1 : -1) * 3;
    this.appearDelay = index * 0.15;

    const chipWidth = 384;
    const chipHeight = 96;

    this.texture = createPanelTexture(
      chipWidth,
      chipHeight,
      (ctx, time, w, h) => this.drawChip(ctx, time, w, h),
      'rgba(255,138,76,0.3)',
      1.5
    );

    const geometry = new THREE.PlaneGeometry(4, 1);
    const material = new THREE.MeshBasicMaterial({
      map: this.texture.getTexture(),
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, this.orbitHeight, 0);
  }

  startAppear(delay: number): void {
    this.appearDelay = delay;
    this.appearStartTime = -delay;
    this.isVisible = true;
  }

  update(deltaTime: number, globalTime: number): void {
    // Appear animation
    if (this.appearStartTime < 0) {
      this.appearStartTime += deltaTime;
      if (this.appearStartTime >= 0) {
        this.appearProgress = 0;
      }
    } else if (this.appearProgress < 1) {
      this.appearProgress += deltaTime / 0.4;
      this.appearProgress = Math.min(1, this.appearProgress);
      this.appearProgress = easeOutBack(this.appearProgress);
    }

    // Orbit position
    if (this.isVisible) {
      const pos = getOrbitPosition(
        globalTime,
        this.orbitRadiusX,
        this.orbitRadiusZ,
        this.orbitSpeed,
        this.orbitHeight,
        this.orbitPhase
      );

      // Apply appear scale
      const scale = this.appearProgress;
      this.mesh.scale.setScalar(scale);
      this.mesh.position.copy(pos);

      // Always face camera (billboard)
      this.mesh.lookAt(0, pos.y, 0);
      this.mesh.rotateY(Math.PI);
    }

    this.texture.needsUpdate = true;
  }

  private drawChip(ctx: CanvasRenderingContext2D, time: number, w: number, h: number): void {
    const padding = 16;
    const contentW = w - padding * 2;
    const contentH = h - padding * 2;

    // Background with accent gradient
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, 'rgba(255,138,76,0.15)');
    grad.addColorStop(1, 'rgba(124,77,255,0.1)');
    ctx.fillStyle = grad;
    ctx.fillRect(padding, padding, contentW, contentH);

    // Border
    ctx.strokeStyle = 'rgba(255,138,76,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(padding, padding, contentW, contentH, 10);
    ctx.stroke();

    // File icon
    ctx.fillStyle = '#ff8a4c';
    ctx.font = '24px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('📄', padding + 16, h / 2);

    // Filename
    ctx.font = '500 20px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.filename, padding + 56, h / 2);

    // Accent dot
    ctx.fillStyle = '#ff8a4c';
    ctx.beginPath();
    ctx.arc(w - padding - 16, h / 2, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  getTexture(): CanvasTexture {
    return this.texture;
  }

  reset(): void {
    this.isVisible = false;
    this.appearProgress = 0;
    this.appearStartTime = 0;
    this.mesh.scale.setScalar(0);
  }

  dispose(): void {
    this.texture.dispose();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}