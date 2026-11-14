// Scene 3: Construirlo - Code editor + orbiting chips
import * as THREE from 'three';
import { BaseScene } from './BaseScene';
import { CodeEditor } from '../ui/CodeEditor';
import { FilenameChip } from '../ui/FilenameChip';
import { CONFIG } from '../config';

export class Scene3_Build extends BaseScene {
  private codeEditor: CodeEditor;
  private filenameChips: FilenameChip[] = [];
  private stepLabel: THREE.Mesh;
  private typingStarted: boolean = false;
  private badgeShown: boolean = false;

  constructor(scene: THREE.Scene) {
    super(scene);

    // Create code editor
    this.codeEditor = new CodeEditor();
    this.worldGroup.add(this.codeEditor.getMesh());
    this.codeEditor.getMesh().position.set(0, 0, 0.2);

    // Create 6 filename chips
    for (let i = 0; i < 6; i++) {
      const chip = new FilenameChip(i);
      this.filenameChips.push(chip);
      this.worldGroup.add(chip.getMesh());
    }

    // Create step label
    this.stepLabel = this.createStepLabel('STEP 03', 'BUILD');
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
    this.typingStarted = false;
    this.badgeShown = false;
    this.codeEditor.reset();
    this.filenameChips.forEach((chip, i) => {
      chip.reset();
      // Start chips appearing with stagger after typing starts
      chip.startAppear(1.5 + i * 0.15);
    });
  }

  update(deltaTime: number, globalTime: number, sceneProgress: number): void {
    // Start typing at scene start
    if (!this.typingStarted) {
      this.typingStarted = true;
      this.codeEditor.startTyping();
    }

    // Show badge when typing complete
    if (!this.badgeShown && this.codeEditor.isTypingComplete()) {
      this.badgeShown = true;
      this.codeEditor.showTestBadge();
    }

    this.codeEditor.update(deltaTime);
    this.filenameChips.forEach(chip => chip.update(deltaTime, globalTime));
  }

  exit(): void {
    // Cleanup handled by dispose
  }

  getCodeEditor(): CodeEditor {
    return this.codeEditor;
  }

  getFilenameChips(): FilenameChip[] {
    return this.filenameChips;
  }

  getStepLabel(): THREE.Mesh {
    return this.stepLabel;
  }

  dispose(): void {
    this.codeEditor.dispose();
    this.filenameChips.forEach(chip => chip.dispose());
    if (this.stepLabel) {
      this.stepLabel.geometry.dispose();
      (this.stepLabel.material as THREE.Material).dispose();
    }
    super.dispose();
  }
}