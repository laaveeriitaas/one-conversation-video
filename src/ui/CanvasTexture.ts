// Textura de canvas redibujada cada frame para paneles UI
import * as THREE from 'three';
import { CONFIG } from '../config';

export interface CanvasTextureOptions {
  width: number;
  height: number;
  clearColor?: string;
  onDraw?: (ctx: CanvasRenderingContext2D, time: number, width: number, height: number) => void;
}

export class CanvasTexture {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  width: number;
  height: number;
  clearColor: string;
  onDraw?: (ctx: CanvasRenderingContext2D, time: number, width: number, height: number) => void;
  needsUpdate: boolean = true;
  lastTime: number = -1;

  constructor(options: CanvasTextureOptions) {
    this.width = options.width;
    this.height = options.height;
    this.clearColor = options.clearColor || 'rgba(0,0,0,0)';
    this.onDraw = options.onDraw;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    const ctx = this.canvas.getContext('2d', { alpha: true, willReadFrequently: false });
    if (!ctx) throw new Error('Could not get 2d context');
    this.context = ctx;

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.needsUpdate = true;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;
    this.texture.colorSpace = THREE.SRGBColorSpace;
  }

  update(time: number): void {
    if (this.lastTime === time && !this.needsUpdate) return;

    this.clear();
    if (this.onDraw) {
      this.onDraw(this.context, time, this.width, this.height);
    }

    this.texture.needsUpdate = true;
    this.lastTime = time;
    this.needsUpdate = false;
  }

  clear(): void {
    this.context.clearRect(0, 0, this.width, this.height);
    if (this.clearColor !== 'rgba(0,0,0,0)') {
      this.context.fillStyle = this.clearColor;
      this.context.fillRect(0, 0, this.width, this.height);
    }
  }

  setDrawCallback(fn: (ctx: CanvasRenderingContext2D, time: number, width: number, height: number) => void): void {
    this.onDraw = fn;
    this.needsUpdate = true;
  }

  getTexture(): THREE.CanvasTexture {
    return this.texture;
  }

  dispose(): void {
    this.texture.dispose();
    this.canvas.remove();
  }
}

// Helper para crear textura de panel con borde y contenido
export function createPanelTexture(
  width: number,
  height: number,
  drawContent: (ctx: CanvasRenderingContext2D, time: number, w: number, h: number) => void,
  borderColor: string = 'rgba(255,255,255,0.3)',
  borderWidth: number = 2
): CanvasTexture {
  return new CanvasTexture({
    width,
    height,
    onDraw: (ctx, time, w, h) => {
      // Fondo sutil del panel
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, 'rgba(255,255,255,0.03)');
      gradient.addColorStop(1, 'rgba(255,255,255,0.01)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      // Borde redondeado
      const radius = 16;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.beginPath();
      ctx.roundRect(borderWidth/2, borderWidth/2, w - borderWidth, h - borderWidth, radius);
      ctx.stroke();

      // Clip para contenido interno
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(borderWidth, borderWidth, w - borderWidth * 2, h - borderWidth * 2, radius - borderWidth);
      ctx.clip();

      // Dibujar contenido
      drawContent(ctx, time, w - borderWidth * 2, h - borderWidth * 2);

      ctx.restore();
    },
  });
}