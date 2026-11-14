// Configuración global centralizada
export const CONFIG = {
  // Video
  width: 1920,
  height: 1080,
  fps: 60,
  duration: 15, // segundos
  totalFrames: 15 * 60, // 900

  // Colores
  accent: 0xff8a4c,
  accentHex: '#ff8a4c',
  background: 0x050508,
  white: 0xffffff,
  glassTint: 0x1a1a2e,

  // Gradientes de la cúpula (hex -> three.js Color)
  domeGradients: [
    { color: 0x7c4dff, pos: 0.0 },   // violeta
    { color: 0xff8a4c, pos: 0.33 },  // naranja
    { color: 0x00d4ff, pos: 0.66 },  // azul
    { color: 0xff2d95, pos: 1.0 },   // rosa
  ],

  // Material de vidrio
  glass: {
    transmission: 0.9,
    roughness: 0.3,
    ior: 1.5,
    thickness: 0.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.0,
    metalness: 0.0,
  },

  // Panel dimensions
  panel: {
    width: 16,
    height: 9,
    depth: 0.15,
    radius: 0.8,
  },

  // Dome
  dome: {
    radius: 55,
    segments: 64,
  },

  // Camera positions (scene centers in world space)
  scenes: {
    describe: { x: -40, y: 0, z: 0 },
    plan: { x: 0, y: 0, z: 0 },
    build: { x: 40, y: 0, z: 0 },
    launch: { x: 0, y: 0, z: 40 },
    reveal: { x: 0, y: 15, z: 80 },
  },

  // Camera
  camera: {
    fov: 45,
    near: 0.1,
    far: 200,
    driftAmplitude: 0.3,
    driftSpeed: 0.15,
    transitionDuration: 0.4, // segundos
  },

  // Timing por escena (en segundos)
  sceneTiming: {
    describe: { start: 0, end: 3 },
    plan: { start: 3, end: 6 },
    build: { start: 6, end: 9.5 },
    launch: { start: 9.5, end: 12.5 },
    reveal: { start: 12.5, end: 15 },
  },

  // Font
  font: {
    family: 'Inter, system-ui, sans-serif',
    weights: [400, 500, 600, 700] as const,
  },

  // Confetti
  confetti: {
    count: 100,
    gravity: -9.8,
    groundY: -5,
    colors: [0xff8a4c, 0x7c4dff, 0x00d4ff, 0xff2d95, 0xffffff],
  },

  // Render
  render: {
    pixelRatio: 1,
    antialias: true,
    alpha: false,
  },
} as const;

// Helper para obtener timing de escena
export function getSceneProgress(t: number, sceneKey: keyof typeof CONFIG.sceneTiming): number {
  const { start, end } = CONFIG.sceneTiming[sceneKey];
  if (t <= start) return 0;
  if (t >= end) return 1;
  return (t - start) / (end - start);
}

// Helper para saber escena activa
export function getActiveScene(t: number): keyof typeof CONFIG.sceneTiming {
  if (t < 3) return 'describe';
  if (t < 6) return 'plan';
  if (t < 9.5) return 'build';
  if (t < 12.5) return 'launch';
  return 'reveal';
}