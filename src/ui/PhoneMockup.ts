// Phone mockup component for Scene 4
import * as THREE from 'three';
import { CanvasTexture, createPanelTexture } from './CanvasTexture';
import { HabitApp } from './HabitApp';
import { CONFIG } from '../config';

export class PhoneMockup {
  private mesh: THREE.Mesh;
  private screenTexture: CanvasTexture;
  private habitApp: HabitApp;
  private swayAngle: number = 0;
  private swaySpeed: number = 0.3;
  private isVisible: boolean = false;
  private appearProgress: number = 0;
  private appearStartTime: number = 0;

  constructor() {
    this.habitApp = new HabitApp();

    // Phone screen texture (content area)
    const screenWidth = 540;
    const screenHeight = 1170;

    this.screenTexture = new CanvasTexture({
      width: screenWidth,
      height: screenHeight,
      onDraw: (ctx, time, w, h) => this.habitApp.draw(ctx, time, w, h),
    });

    // Phone body geometry
    const phoneGeometry = this.createPhoneGeometry();
    const phoneMaterial = createPhoneMaterial(this.screenTexture.getTexture());

    this.mesh = new THREE.Mesh(phoneGeometry, phoneMaterial);
    this.mesh.position.set(0, 0, 0);
    this.mesh.scale.setScalar(0.8); // Slightly smaller
  }

  private createPhoneGeometry(): THREE.BufferGeometry {
    // Phone body: rounded rect extruded
    const width = 4.5;
    const height = 9.5;
    const depth = 0.28;
    const radius = 0.7;

    const shape = new THREE.Shape();
    const hw = width / 2;
    const hh = height / 2;
    const r = radius;

    shape.moveTo(-hw + r, -hh);
    shape.lineTo(hw - r, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
    shape.lineTo(hw, hh - r);
    shape.quadraticCurveTo(hw, hh, hw - r, hh);
    shape.lineTo(-hw + r, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
    shape.lineTo(-hw, -hh + r);
    shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

    const extrudeSettings = { depth, bevelEnabled: false, steps: 1 };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();
    geometry.computeVertexNormals();
    return geometry;
  }

  startAppear(): void {
    this.isVisible = true;
    this.appearStartTime = 0;
    this.appearProgress = 0;
    this.habitApp.reset();
  }

  update(deltaTime: number, globalTime: number): void {
    // Appear animation
    if (this.appearProgress < 1) {
      this.appearStartTime += deltaTime;
      this.appearProgress = Math.min(1, this.appearStartTime / 0.8);
      this.appearProgress = easeOutBack(this.appearProgress);
      this.mesh.scale.setScalar(0.8 * this.appearProgress);
    }

    // Sway animation
    if (this.isVisible) {
      this.swayAngle += deltaTime * this.swaySpeed;
      const sway = Math.sin(this.swayAngle) * 0.05; // ~3 degrees
      this.mesh.rotation.y = sway;

      // Slight vertical bob
      this.mesh.position.y = Math.sin(this.swayAngle * 0.7) * 0.15;
    }

    // Update habit app
    this.habitApp.update(deltaTime, globalTime);
    this.screenTexture.needsUpdate = true;
  }

  private drawPhoneBody(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    // This is handled by Three.js material, not canvas
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  getScreenTexture(): CanvasTexture {
    return this.screenTexture;
  }

  getHabitApp(): HabitApp {
    return this.habitApp;
  }

  reset(): void {
    this.isVisible = false;
    this.appearProgress = 0;
    this.appearStartTime = 0;
    this.mesh.scale.setScalar(0);
    this.mesh.rotation.y = 0;
    this.mesh.position.set(0, 0, 0);
    this.swayAngle = 0;
    this.habitApp.reset();
  }

  dispose(): void {
    this.screenTexture.dispose();
    this.habitApp.dispose();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

function createPhoneMaterial(screenMap: THREE.Texture): THREE.MeshPhysicalMaterial {
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0a0a0f,
    metalness: 0.8,
    roughness: 0.15,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    transmission: 0,
    thickness: 0,
  });

  // Screen material with the app texture
  const screenMaterial = new THREE.MeshBasicMaterial({
    map: screenMap,
    transparent: true,
    side: THREE.FrontSide,
    depthWrite: false,
  });

  return bodyMaterial;
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}