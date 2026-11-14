// Task card component for Scene 2
import * as THREE from 'three';
import { CanvasTexture, createPanelTexture } from './CanvasTexture';
import { CONFIG } from '../config';
import { easeOutCubic, easeOutBack } from '../utils/easing';

export interface TaskData {
  id: number;
  title: string;
  description?: string;
}

const TASKS: TaskData[] = [
  { id: 1, title: 'Design data model', description: 'Habits, streaks, completions' },
  { id: 2, title: 'Build UI components', description: 'Cards, inputs, charts' },
  { id: 3, title: 'Implement streak logic', description: 'Daily/weekly calculations' },
  { id: 4, title: 'Add local persistence', description: 'IndexedDB / localStorage' },
  { id: 5, title: 'Polish & test', description: 'Animations, edge cases' },
];

export class TaskCard {
  private mesh: THREE.Mesh;
  private texture: CanvasTexture;
  private task: TaskData;
  private index: number;
  private total: number;

  // Animation state
  private slideProgress: number = 0; // 0 to 1
  private checkProgress: number = 0; // 0 to 1
  private strikethroughProgress: number = 0; // 0 to 1
  private isAnimatingIn: boolean = false;
  private isChecking: boolean = false;
  private checkDelay: number = 0;
  private animationStartTime: number = 0;

  // Checkmark drawing
  private checkPathLength: number = 0;
  private checkPathProgress: number = 0;

  constructor(index: number, total: number) {
    this.index = index;
    this.total = total;
    this.task = TASKS[index];

    const cardWidth = 700;
    const cardHeight = 140;

    this.texture = createPanelTexture(
      cardWidth,
      cardHeight,
      (ctx, time, w, h) => this.drawCard(ctx, time, w, h),
      'rgba(255,255,255,0.15)',
      1.5
    );

    const geometry = new THREE.PlaneGeometry(
      CONFIG.panel.width * 0.8,
      CONFIG.panel.height * 0.3
    );
    const material = new THREE.MeshBasicMaterial({
      map: this.texture.getTexture(),
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.resetPosition();
  }

  private resetPosition(): void {
    // Start off-screen to the right
    const spacing = 1.1;
    const startY = (this.total - 1) * spacing * 0.5 - this.index * spacing;
    this.mesh.position.set(25, startY * 4, 0.15);
  }

  startEntrance(delay: number): void {
    this.isAnimatingIn = true;
    this.animationStartTime = -delay; // Negative delay
    this.slideProgress = 0;
  }

  startCheck(delay: number): void {
    this.checkDelay = delay;
    this.isChecking = true;
    this.checkProgress = 0;
    this.strikethroughProgress = 0;
    this.checkPathProgress = 0;
  }

  update(deltaTime: number, globalTime: number): void {
    // Entrance animation
    if (this.isAnimatingIn) {
      this.animationStartTime += deltaTime;
      if (this.animationStartTime > 0) {
        this.slideProgress = Math.min(1, this.animationStartTime / 0.6);
        this.slideProgress = easeOutBack(this.slideProgress);

        if (this.slideProgress >= 1) {
          this.isAnimatingIn = false;
          this.slideProgress = 1;
        }
      }
    }

    // Check animation
    if (this.isChecking) {
      if (this.checkDelay > 0) {
        this.checkDelay -= deltaTime;
        return;
      }

      this.checkProgress += deltaTime / 0.8; // 800ms total

      if (this.checkProgress <= 0.4) {
        // First 40%: draw checkmark
        this.checkPathProgress = this.checkProgress / 0.4;
      } else if (this.checkProgress <= 0.7) {
        // Next 30%: hold checkmark, start strikethrough
        this.checkPathProgress = 1;
        this.strikethroughProgress = (this.checkProgress - 0.4) / 0.3;
      } else {
        // Last 30%: complete strikethrough
        this.strikethroughProgress = Math.min(1, (this.checkProgress - 0.4) / 0.3);
      }

      if (this.checkProgress >= 1) {
        this.isChecking = false;
        this.checkProgress = 1;
        this.checkPathProgress = 1;
        this.strikethroughProgress = 1;
      }
    }

    // Update position based on slide progress
    const spacing = 1.1;
    const startY = (this.total - 1) * spacing * 0.5 - this.index * spacing;
    const targetX = 0;
    const currentX = this.isAnimatingIn ? lerp(25, targetX, this.slideProgress) : targetX;

    this.mesh.position.set(currentX, startY * 4, 0.15);

    this.texture.needsUpdate = true;
  }

  private drawCard(ctx: CanvasRenderingContext2D, time: number, w: number, h: number): void {
    const padding = 24;
    const contentW = w - padding * 2;
    const contentH = h - padding * 2;

    // Card background - dimmed when checked
    const checkedAlpha = this.isChecking || this.checkProgress > 0 ? this.checkProgress * 0.3 : 0;
    const bgAlpha = 0.04 - checkedAlpha * 0.02;

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, `rgba(255,255,255,${bgAlpha + 0.02})`);
    gradient.addColorStop(1, `rgba(255,255,255,${bgAlpha})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(padding, padding, contentW, contentH);

    // Checkbox area (left side)
    const boxSize = 32;
    const boxX = padding + 16;
    const boxY = padding + (contentH - boxSize) / 2;

    // Checkbox background
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxSize, boxSize, 8);
    ctx.fill();

    // Checkbox border
    const borderColor = this.checkProgress > 0 ? '#ff8a4c' : 'rgba(255,255,255,0.2)';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxSize, boxSize, 8);
    ctx.stroke();

    // Draw checkmark
    if (this.checkPathProgress > 0) {
      ctx.strokeStyle = '#ff8a4c';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const cx = boxX + boxSize / 2;
      const cy = boxY + boxSize / 2;
      const checkSize = boxSize * 0.35;

      // Checkmark path: two lines
      // First line: down-right
      // Second line: down-left (longer)
      const pathLength1 = checkSize * 0.6;
      const pathLength2 = checkSize;
      const totalPath = pathLength1 + pathLength2;
      const currentLength = totalPath * this.checkPathProgress;

      ctx.beginPath();
      if (currentLength <= pathLength1) {
        // Drawing first segment
        ctx.moveTo(cx - checkSize * 0.3, cy - checkSize * 0.1);
        ctx.lineTo(
          cx - checkSize * 0.3 + currentLength * 0.707,
          cy - checkSize * 0.1 + currentLength * 0.707
        );
      } else {
        // First segment done, drawing second
        ctx.moveTo(cx - checkSize * 0.3, cy - checkSize * 0.1);
        ctx.lineTo(cx - checkSize * 0.3 + pathLength1 * 0.707, cy - checkSize * 0.1 + pathLength1 * 0.707);
        const remaining = currentLength - pathLength1;
        ctx.lineTo(
          cx - checkSize * 0.3 + pathLength1 * 0.707 + remaining * 0.707,
          cy - checkSize * 0.1 + pathLength1 * 0.707 - remaining * 0.707
        );
      }
      ctx.stroke();
    }

    // Task text
    const textX = boxX + boxSize + 20;
    const textY = boxY + boxSize / 2;
    const textMaxW = contentW - (boxSize + 36);

    // Title
    ctx.font = '600 26px Inter, system-ui, sans-serif';
    ctx.fillStyle = this.strikethroughProgress > 0 ? 'rgba(255,255,255,0.5)' : '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Truncate if needed
    let title = this.task.title;
    const titleWidth = ctx.measureText(title).width;
    if (titleWidth > textMaxW) {
      while (ctx.measureText(title + '...').width > textMaxW && title.length > 0) {
        title = title.slice(0, -1);
      }
      title += '...';
    }

    ctx.fillText(title, textX, textY - 16);

    // Description
    if (this.task.description) {
      ctx.font = '400 20px Inter, system-ui, sans-serif';
      ctx.fillStyle = this.strikethroughProgress > 0 ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.6)';
      let desc = this.task.description;
      if (ctx.measureText(desc).width > textMaxW) {
        while (ctx.measureText(desc + '...').width > textMaxW && desc.length > 0) {
          desc = desc.slice(0, -1);
        }
        desc += '...';
      }
      ctx.fillText(desc, textX, textY + 18);
    }

    // Strikethrough line
    if (this.strikethroughProgress > 0) {
      const lineY = textY;
      const lineWidth = Math.max(ctx.measureText(this.task.title).width, ctx.measureText(this.task.description || '').width) + 4;
      const drawWidth = lineWidth * this.strikethroughProgress;

      ctx.strokeStyle = '#ff8a4c';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(textX - 2, lineY);
      ctx.lineTo(textX - 2 + drawWidth, lineY);
      ctx.stroke();
    }

    // Accent line on left edge
    ctx.fillStyle = '#ff8a4c';
    ctx.fillRect(padding + 2, padding + 4, 4, contentH - 8);
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  getTexture(): CanvasTexture {
    return this.texture;
  }

  isComplete(): boolean {
    return this.checkProgress >= 1;
  }

  reset(): void {
    this.slideProgress = 0;
    this.checkProgress = 0;
    this.strikethroughProgress = 0;
    this.checkPathProgress = 0;
    this.isAnimatingIn = false;
    this.isChecking = false;
    this.checkDelay = 0;
    this.animationStartTime = 0;
    this.resetPosition();
  }

  dispose(): void {
    this.texture.dispose();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

// Helper function
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}