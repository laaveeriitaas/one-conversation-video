// Main entry point: Three.js setup, render loop, dev controls
import * as THREE from 'three';
import { CONFIG } from './config';
import { World } from './world/World';
import { CameraController } from './camera/CameraController';
import { SceneManager } from './scenes/SceneManager';
import { GradientDome } from './effects/GradientDome';

// Global references for render pipeline
let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let world: World;
let cameraController: CameraController;
let sceneManager: SceneManager;
let animationId: number;
let lastTime: number = 0;
let isRendering: boolean = false;
let renderMode: 'dev' | 'capture' = 'dev';
let captureFrame: number = 0;
let captureCallback: ((frame: number) => void) | null = null;

// Dev UI elements
let timeSlider: HTMLInputElement | null = null;
let playBtn: HTMLButtonElement | null = null;
let timeDisplay: HTMLSpanElement | null = null;
let isPlaying: boolean = false;

export function initThreeJS(canvas?: HTMLCanvasElement): void {
  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: CONFIG.render.antialias,
    alpha: CONFIG.render.alpha,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true, // Required for frame capture
  });
  renderer.setSize(CONFIG.width, CONFIG.height);
  renderer.setPixelRatio(CONFIG.render.pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = false;

  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(
    CONFIG.camera.fov,
    CONFIG.width / CONFIG.height,
    CONFIG.camera.near,
    CONFIG.camera.far
  );
  camera.position.set(0, 1.5, 8);

  // World
  world = new World();

  // Camera controller
  cameraController = new CameraController(camera);

  // Scene manager
  sceneManager = new SceneManager(scene);
  sceneManager.setCallbacks({
    onSceneChange: (name, progress) => {
      console.log(`Scene changed to: ${name}`);
      cameraController.setScene(name as any);
    },
    onComplete: () => {
      console.log('Animation complete!');
      if (renderMode === 'capture' && captureCallback) {
        captureCallback(-1); // Signal completion
      }
    },
  });

  // Start animation
  sceneManager.play();

  // Handle resize
  window.addEventListener('resize', onResize);

  // Start render loop
  animate(0);
}

function onResize(): void {
  // In capture mode, we don't resize
  if (renderMode === 'capture') return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function animate(time: number): void {
  animationId = requestAnimationFrame(animate);

  const deltaTime = (time - lastTime) / 1000; // Convert to seconds
  lastTime = time;

  if (renderMode === 'capture') {
    // In capture mode, time is controlled externally
    return;
  }

  // Update world (dome, etc.)
  world.update(sceneManager.getGlobalTime(), camera.position);

  // Update camera controller
  cameraController.update(sceneManager.getGlobalTime(), deltaTime);

  // Update scene manager
  sceneManager.update(deltaTime);

  // Update dev UI
  updateDevUI();

  // Render
  renderer.render(scene, camera);
}

function updateDevUI(): void {
  if (!timeDisplay || !timeSlider) return;

  const t = sceneManager.getGlobalTime();
  timeDisplay.textContent = `${t.toFixed(2)}s / ${CONFIG.duration}s`;
  timeSlider.value = (t / CONFIG.duration).toString();
}

// Dev mode initialization
export function initDevMode(): void {
  // Create dev UI
  const devUI = document.createElement('div');
  devUI.id = 'dev-ui';
  devUI.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(10, 10, 20, 0.95);
    border: 1px solid rgba(255,138,76,0.3);
    border-radius: 12px;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    z-index: 1000;
    font-family: Inter, system-ui, sans-serif;
    color: #fff;
    backdrop-filter: blur(10px);
  `;

  devUI.innerHTML = `
    <button id="play-btn" style="
      background: #ff8a4c;
      border: none;
      border-radius: 8px;
      padding: 8px 16px;
      font-weight: 600;
      cursor: pointer;
      color: #fff;
    ">⏸ Pause</button>
    <span id="time-display" style="min-width: 120px; font-variant-numeric: tabular-nums;">0.00s / 15.00s</span>
    <input id="time-slider" type="range" min="0" max="1" step="0.001" value="0" style="
      width: 300px;
      accent-color: #ff8a4c;
    " />
    <button id="reset-btn" style="
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 8px;
      padding: 8px 16px;
      font-weight: 500;
      cursor: pointer;
      color: #fff;
    ">↺ Reset</button>
  `;

  document.body.appendChild(devUI);

  const playBtn = document.getElementById('play-btn') as HTMLButtonElement;
  const timeDisplay = document.getElementById('time-display') as HTMLSpanElement;
  const timeSlider = document.getElementById('time-slider') as HTMLInputElement;
  const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;

  if (!playBtn || !timeDisplay || !timeSlider || !resetBtn) {
    console.error('Dev UI elements not found');
    return;
  }

  playBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
      sceneManager.play();
      playBtn.textContent = '⏸ Pause';
    } else {
      sceneManager.pause();
      playBtn.textContent = '▶ Play';
    }
  });

  timeSlider.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    const targetTime = parseFloat(target.value) * CONFIG.duration;
    sceneManager.setTime(targetTime);
    sceneManager.pause();
    isPlaying = false;
    playBtn.textContent = '▶ Play';
  });

  resetBtn.addEventListener('click', () => {
    sceneManager.stop();
    isPlaying = false;
    playBtn.textContent = '▶ Play';
  });

  isPlaying = true;
}

// Capture mode for frame-by-frame rendering
export function setCaptureMode(frame: number, onFrameReady: (frame: number) => void): void {
  renderMode = 'capture';
  captureFrame = frame;
  captureCallback = onFrameReady;

  const t = (frame / CONFIG.fps);
  sceneManager.setTime(t);

  // Force update
  world.update(t, camera.position);
  cameraController.update(t, 0);
  sceneManager.update(0);

  // Render frame
  renderer.render(scene, camera);

  // Signal ready
  if (captureCallback) {
    captureCallback(frame);
  }

  // Mark frame as ready for Playwright
  if (typeof window !== 'undefined') {
    window.__FRAME_READY__ = frame;
  }
}

export function exitCaptureMode(): void {
  renderMode = 'dev';
  captureCallback = null;
  sceneManager.play();

  if (typeof window !== 'undefined') {
    window.__CAPTURE_MODE__ = false;
  }
}

export function getRenderer(): THREE.WebGLRenderer {
  return renderer;
}

export function getScene(): THREE.Scene {
  return scene;
}

export function getCamera(): THREE.PerspectiveCamera {
  return camera;
}

export function getSceneManager(): SceneManager {
  return sceneManager;
}

export function getWorld(): World {
  return world;
}

export function dispose(): void {
  cancelAnimationFrame(animationId);
  window.removeEventListener('resize', onResize);
  sceneManager.dispose();
  world.dispose();
  renderer.dispose();

  const devUI = document.getElementById('dev-ui');
  if (devUI) devUI.remove();
}

// Auto-init if not in capture mode
if (typeof window !== 'undefined' && !window.__CAPTURE_MODE__) {
  const canvas = document.createElement('canvas');
  canvas.id = 'three-canvas';
  canvas.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: block;';
  document.body.appendChild(canvas);

  initThreeJS(canvas);

  // Wait for fonts then init dev UI
  document.fonts.ready.then(() => {
    initDevMode();
  });
}

// Export for capture script (Node.js compatibility)
// Note: In ES modules, use import statements instead
// This is kept for potential dynamic imports