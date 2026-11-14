// Chat bar component for Scene 1
import * as THREE from 'three';
import { CanvasTexture, createPanelTexture } from './CanvasTexture';
import { TypewriterSequence, BouncingDots } from './TextRenderer';
import { CONFIG } from '../config';

export class ChatBar {
  private mesh: THREE.Mesh;
  private texture: CanvasTexture;
  private typewriter: TypewriterSequence;
  private bouncingDots: BouncingDots;
  private isSecondPhase: boolean = false;
  private phaseChanged: boolean = false;

  constructor() {
    // Panel dimensions - chat bar style (wider, shorter)
    const panelWidth = 1024;
    const panelHeight = 200;

    this.typewriter = new TypewriterSequence()
      .addPhase({
        text: 'Build me a habit tracker with streaks',
        speed: 35, // chars/sec
        delayBefore: 0.5,
        delayAfter: 1.0,
        erase: true,
        eraseSpeed: 50,
      })
      .addPhase({
        text: 'On it. Here\'s the plan.',
        speed: 30,
        delayBefore: 0.3,
        delayAfter: 999, // Stay forever
      })
      .setCallbacks({
        onPhaseComplete: (i) => {
          if (i === 0) this.isSecondPhase = true;
        },
        onComplete: () => {},
      });

    this.bouncingDots = new BouncingDots(3, 4, 6);

    this.texture = createPanelTexture(
      panelWidth,
      panelHeight,
      (ctx, time, w, h) => this.drawChat(ctx, time, w, h),
      'rgba(255,255,255,0.2)',
      2
    );

    const geometry = new THREE.PlaneGeometry(CONFIG.panel.width, CONFIG.panel.height);
    const material = new THREE.MeshBasicMaterial({
      map: this.texture.getTexture(),
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0, 0.1); // Slightly in front of panel
  }

  private drawChat(ctx: CanvasRenderingContext2D, time: number, w: number, h: number): void {
    const padding = 32;
    const contentW = w - padding * 2;
    const contentH = h - padding * 2;

    // Chat input area background
    const inputY = h - 80;
    const inputH = 56;
    const inputRadius = 12;

    // Input background
    const inputGrad = ctx.createLinearGradient(0, inputY, 0, inputY + inputH);
    inputGrad.addColorStop(0, 'rgba(255,255,255,0.06)');
    inputGrad.addColorStop(1, 'rgba(255,255,255,0.02)');
    ctx.fillStyle = inputGrad;
    ctx.beginPath();
    ctx.roundRect(padding, inputY, contentW, inputH, inputRadius);
    ctx.fill();

    // Input border
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(padding, inputY, contentW, inputH, inputRadius);
    ctx.stroke();

    // Text area
    const textX = padding + 20;
    const textY = inputY + inputH / 2;
    const textMaxW = contentW - 40;

    if (!this.isSecondPhase) {
      // First phase: typing "Build me a habit tracker with streaks"
      const text = this.typewriter.getCurrentText();
      const showCursor = this.typewriter.getCursorVisible();

      ctx.font = '500 28px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      // Draw text with cursor
      const beforeCursor = text;
      const cursorWidth = showCursor ? 2 : 0;

      ctx.fillText(beforeCursor, textX, textY);

      if (showCursor) {
        const textWidth = ctx.measureText(beforeCursor).width;
        ctx.fillStyle = '#ff8a4c';
        ctx.fillRect(textX + textWidth, textY - 18, 2, 36);
      }
    } else {
      // Second phase: "On it. Here's the plan." + bouncing dots
      const text = this.typewriter.getCurrentText();
      const showCursor = this.typewriter.getCursorVisible();

      ctx.font = '500 28px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      const baseText = 'On it. Here\'s the plan';
      const typedPart = text.slice(0, Math.min(text.length, baseText.length));

      ctx.fillText(typedPart, textX, textY);

      // Bouncing dots after "plan"
      if (text.length > baseText.length) {
        const dotsText = text.slice(baseText.length);
        const baseWidth = ctx.measureText(baseText).width;

        if (dotsText.length <= 3) {
          // Draw bouncing dots
          this.bouncingDots.draw(ctx, textX + baseWidth + 8, textY, 4, '#ff8a4c');
        } else {
          // Cursor after dots
          ctx.fillText(dotsText, textX + baseWidth + 8, textY);
          if (showCursor) {
            const dotsWidth = ctx.measureText(dotsText).width;
            ctx.fillStyle = '#ff8a4c';
            ctx.fillRect(textX + baseWidth + 8 + dotsWidth, textY - 18, 2, 36);
          }
        }
      } else if (showCursor) {
        const textWidth = ctx.measureText(typedPart).width;
        ctx.fillStyle = '#ff8a4c';
        ctx.fillRect(textX + textWidth, textY - 18, 2, 36);
      }
    }

    // Placeholder hint when empty
    if (!this.isSecondPhase && this.typewriter.getCurrentText().length === 0) {
      ctx.font = '400 24px Inter, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillText('Ask me to build anything...', textX, textY);
    }
  }

  update(deltaTime: number): void {
    this.typewriter.update(deltaTime);
    if (this.isSecondPhase) {
      this.bouncingDots.update(deltaTime);
    }
    this.texture.needsUpdate = true;
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  getTexture(): CanvasTexture {
    return this.texture;
  }

  reset(): void {
    this.typewriter.reset();
    this.bouncingDots.reset();
    this.isSecondPhase = false;
    this.phaseChanged = false;
  }

  dispose(): void {
    this.texture.dispose();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}