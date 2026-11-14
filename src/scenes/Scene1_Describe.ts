// Scene 1: Describirlo - Chat bar typing
import * as THREE from 'three';
import { BaseScene } from './BaseScene';
import { ChatBar } from '../ui/ChatBar';
import { CONFIG } from '../config';
import { PANEL_POSITIONS, PANEL_ROTATIONS } from '../world/World';

export class Scene1_Describe extends BaseScene {
  private chatBar: ChatBar;
  private stepLabel: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    super(scene);

    // Create chat bar
    this.chatBar = new ChatBar();
    this.worldGroup.add(this.chatBar.getMesh());

    // Position chat bar on panel (panel is in World at PANEL_POSITIONS.describe)
    this.chatBar.getMesh().position.set(0, 0, 0.2);

    // Create step label
    this.stepLabel = this.createStepLabel('STEP 01', 'DESCRIBE');
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
    this.chatBar.reset();
  }

  update(deltaTime: number, globalTime: number, sceneProgress: number): void {
    this.chatBar.update(deltaTime);
  }

  exit(): void {}

  getChatBar(): ChatBar {
    return this.chatBar;
  }

  getStepLabel(): THREE.Mesh {
    return this.stepLabel;
  }

  dispose(): void {
    this.chatBar.dispose();
    if (this.stepLabel) {
      this.stepLabel.geometry.dispose();
      (this.stepLabel.material as THREE.Material).dispose();
    }
    super.dispose();
  }
}