// Escena principal: mundo, dome, ground, lighting, panel container
import * as THREE from 'three';
import { CONFIG } from '../config';
import { GradientDome } from '../effects/GradientDome';
import { createGlassMaterial, createRoundedPanelGeometry } from '../effects/GlassMaterial';
import { createEnvMap } from './EnvMap';

export class World {
  scene: THREE.Scene;
  dome!: GradientDome;
  ground!: THREE.Mesh;
  panelContainer!: THREE.Group;
  envMap: THREE.CubeTexture | null = null;
  glassMaterial!: THREE.MeshPhysicalMaterial;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(CONFIG.background);

    this.panelContainer = new THREE.Group();
    this.scene.add(this.panelContainer);

    this.setupDome();
    this.setupGround();
    this.setupLighting();
    this.setupEnvMap();
    this.createGlassMaterial();

    // Create the 4 main panels
    this.createMainPanels();
  }

  private createMainPanels(): void {
    // Panel for Describe scene
    this.createPanel(
      PANEL_POSITIONS.describe,
      PANEL_ROTATIONS.describe
    );

    // Panel for Plan scene
    this.createPanel(
      PANEL_POSITIONS.plan,
      PANEL_ROTATIONS.plan
    );

    // Panel for Build scene
    this.createPanel(
      PANEL_POSITIONS.build,
      PANEL_ROTATIONS.build
    );

    // Panel for Launch scene
    this.createPanel(
      PANEL_POSITIONS.launch,
      PANEL_ROTATIONS.launch
    );
  }

  private setupDome(): void {
    this.dome = new GradientDome();
    this.scene.add(this.dome);
  }

  private setupGround(): void {
    // Suelo sutil para recibir sombras/confeti
    const groundGeo = new THREE.PlaneGeometry(500, 500);
    const groundMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -6;
    this.scene.add(this.ground);
  }

  private setupLighting(): void {
    // Luz ambiente suave
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambient);

    // Luz direccional principal (simula luz de la cúpula)
    const dirLight = new THREE.DirectionalLight(0xfff5e6, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = false;
    this.scene.add(dirLight);

    // Luz de relleno fría
    const fillLight = new THREE.DirectionalLight(0x7c4dff, 0.2);
    fillLight.position.set(-10, 5, -10);
    this.scene.add(fillLight);

    // Luz de acento naranja
    const accentLight = new THREE.DirectionalLight(CONFIG.accent, 0.3);
    accentLight.position.set(0, 15, 0);
    this.scene.add(accentLight);
  }

  private setupEnvMap(): void {
    this.envMap = createEnvMap();
  }

  private createGlassMaterial(): void {
    this.glassMaterial = createGlassMaterial(this.envMap);
  }

  // Crear panel de vidrio en posición específica
  createPanel(position: THREE.Vector3, rotation: THREE.Euler = new THREE.Euler()): THREE.Mesh {
    const geometry = createRoundedPanelGeometry();
    const panel = new THREE.Mesh(geometry, this.glassMaterial.clone());
    panel.position.copy(position);
    panel.rotation.copy(rotation);
    panel.castShadow = false;
    panel.receiveShadow = false;
    this.panelContainer.add(panel);
    return panel;
  }

  update(time: number, cameraPos: THREE.Vector3): void {
    this.dome.update(time, cameraPos);
  }

  dispose(): void {
    this.dome.dispose();
    this.ground.geometry.dispose();
    (this.ground.material as THREE.Material).dispose();
    this.panelContainer.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });
    this.glassMaterial.dispose();
    if (this.envMap) this.envMap.dispose();
  }
}

// Posiciones predefinidas para los 4 paneles principales + reveal
export const PANEL_POSITIONS = {
  describe: new THREE.Vector3(-40, 0, 0),
  plan: new THREE.Vector3(0, 0, 0),
  build: new THREE.Vector3(40, 0, 0),
  launch: new THREE.Vector3(0, 0, 40),
  // Para reveal, los 4 paneles están en sus posiciones originales
} as const;

export const PANEL_ROTATIONS = {
  describe: new THREE.Euler(0, Math.PI / 6, 0),   // Ligeramente rotado hacia cámara
  plan: new THREE.Euler(0, 0, 0),
  build: new THREE.Euler(0, -Math.PI / 6, 0),
  launch: new THREE.Euler(0, Math.PI / 2, 0),
} as const;