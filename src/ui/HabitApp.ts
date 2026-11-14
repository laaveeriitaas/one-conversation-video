// Habit app UI inside phone (Scene 4)
import * as THREE from 'three';
import { CONFIG } from '../config';
import { easeOutBack, easeOutElastic } from '../utils/easing';

interface Habit {
  id: number;
  name: string;
  streak: number;
  completed: boolean;
}

const HABITS: Habit[] = [
  { id: 1, name: 'Exercise', streak: 0, completed: false },
  { id: 2, name: 'Read 20min', streak: 0, completed: false },
  { id: 3, name: 'Meditate', streak: 0, completed: false },
];

export class HabitApp {
  private habits: Habit[] = HABITS.map(h => ({ ...h }));
  private streakValue: number = 0;
  private targetStreak: number = 12;
  private streakProgress: number = 0;

  // Animation states
  private habitCheckProgress: number[] = [0, 0, 0];
  private habitCheckDelays: number[] = [0.5, 1.2, 1.9]; // segundos
  private habitCheckTimers: number[] = [0, 0, 0];
  private barChartProgress: number[] = [0, 0, 0, 0, 0, 0, 0];
  private barChartDelays: number[] = [2.5, 2.7, 2.9, 3.1, 3.3, 3.5, 3.7];
  private barChartTimers: number[] = [0, 0, 0, 0, 0, 0, 0];

  // Confetti trigger
  private confettiTriggered: boolean = false;
  private confettiTriggerTime: number = 4.5; // segundos después de empezar escena

  private globalTime: number = 0;
  private sceneStartTime: number = 0;
  private isActive: boolean = false;

  constructor() {}

  start(): void {
    this.isActive = true;
    this.sceneStartTime = 0;
    this.reset();
  }

  reset(): void {
    this.streakValue = 0;
    this.streakProgress = 0;
    this.habits = HABITS.map(h => ({ ...h, streak: 0, completed: false }));
    this.habitCheckProgress = [0, 0, 0];
    this.habitCheckTimers = [0, 0, 0];
    this.barChartProgress = [0, 0, 0, 0, 0, 0, 0];
    this.barChartTimers = [0, 0, 0, 0, 0, 0, 0];
    this.confettiTriggered = false;
    this.sceneStartTime = 0;
  }

  update(deltaTime: number, globalTime: number): void {
    if (!this.isActive) return;

    this.globalTime = globalTime;
    this.sceneStartTime += deltaTime;

    // Streak counter animation
    if (this.streakProgress < 1) {
      this.streakProgress += deltaTime / 2.5; // 2.5s to reach 12
      this.streakProgress = Math.min(1, this.streakProgress);
      this.streakValue = Math.round(easeOutElastic(this.streakProgress) * this.targetStreak);
    }

    // Habit check animations (staggered)
    this.habits.forEach((habit, i) => {
      if (!habit.completed && this.sceneStartTime >= this.habitCheckDelays[i]) {
        this.habitCheckTimers[i] += deltaTime;
        this.habitCheckProgress[i] = Math.min(1, this.habitCheckTimers[i] / 0.6);

        if (this.habitCheckProgress[i] >= 1) {
          habit.completed = true;
          habit.streak = this.streakValue;
        }
      }
    });

    // Bar chart growth
    const barValues = [3, 5, 4, 6, 7, 5, 8]; // Alturas relativas
    this.barChartProgress.forEach((_, i) => {
      if (this.sceneStartTime >= this.barChartDelays[i]) {
        this.barChartTimers[i] += deltaTime;
        this.barChartProgress[i] = Math.min(1, this.barChartTimers[i] / 0.5);
        this.barChartProgress[i] = easeOutBack(this.barChartProgress[i]);
      }
    });

    // Trigger confetti when last habit completes
    if (!this.confettiTriggered && this.habits.every(h => h.completed)) {
      this.confettiTriggered = true;
    }
  }

  shouldTriggerConfetti(): boolean {
    return this.confettiTriggered;
  }

  draw(ctx: CanvasRenderingContext2D, time: number, w: number, h: number): void {
    const padding = 24;
    const contentW = w - padding * 2;
    const contentH = h - padding * 2;

    // Phone app background
    ctx.fillStyle = '#0d0d12';
    ctx.fillRect(0, 0, w, h);

    // Status bar area
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, 50);

    // Time
    ctx.font = '600 18px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('9:41', padding, 25);

    // Battery/signal
    ctx.textAlign = 'right';
    ctx.fillText('100%', w - padding, 25);

    // App content
    let y = 80;

    // Streak counter (hero)
    this.drawStreakCounter(ctx, w, y);
    y += 140;

    // Habits list
    this.drawHabits(ctx, w, y);
    y += 280;

    // Bar chart
    this.drawBarChart(ctx, w, y, contentW);
  }

  private drawStreakCounter(ctx: CanvasRenderingContext2D, w: number, y: number): void {
    const centerX = w / 2;

    // Fire icon background
    const iconSize = 80;
    const grad = ctx.createRadialGradient(centerX, y + iconSize/2, 0, centerX, y + iconSize/2, iconSize);
    grad.addColorStop(0, 'rgba(255,138,76,0.3)');
    grad.addColorStop(1, 'rgba(255,138,76,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(centerX, y + iconSize/2, iconSize, 0, Math.PI * 2);
    ctx.fill();

    // Fire emoji
    ctx.font = '72px "Apple Color Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔥', centerX, y + iconSize/2 + 4);

    // Streak number
    ctx.font = '800 64px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#ff8a4c';
    ctx.fillText(this.streakValue.toString(), centerX, y + iconSize + 50);

    // Label
    ctx.font = '500 20px Inter, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('day streak', centerX, y + iconSize + 90);
  }

  private drawHabits(ctx: CanvasRenderingContext2D, w: number, y: number): void {
    const padding = 24;
    const cardW = w - padding * 2;
    const cardH = 72;
    const gap = 12;

    this.habits.forEach((habit, i) => {
      const cardY = y + i * (cardH + gap);
      const progress = this.habitCheckProgress[i];

      // Card background
      const isChecked = habit.completed;
      ctx.fillStyle = isChecked ? 'rgba(40,202,66,0.15)' : 'rgba(255,255,255,0.03)';
      ctx.beginPath();
      ctx.roundRect(padding, cardY, cardW, cardH, 16);
      ctx.fill();

      // Border
      ctx.strokeStyle = isChecked ? 'rgba(40,202,66,0.4)' : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(padding, cardY, cardW, cardH, 16);
      ctx.stroke();

      // Checkbox
      const boxSize = 36;
      const boxX = padding + 18;
      const boxY = cardY + (cardH - boxSize) / 2;

      // Checkbox bg
      ctx.fillStyle = isChecked ? 'rgba(40,202,66,0.2)' : 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxSize, boxSize, 10);
      ctx.fill();

      // Checkbox border
      ctx.strokeStyle = isChecked ? '#28ca42' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxSize, boxSize, 10);
      ctx.stroke();

      // Animated checkmark
      if (progress > 0) {
        this.drawCheckmark(ctx, boxX, boxY, boxSize, progress, isChecked ? '#28ca42' : '#ff8a4c');
      }

      // Habit name
      const textX = boxX + boxSize + 16;
      const textY = cardY + cardH / 2;

      ctx.font = '500 24px Inter, system-ui, sans-serif';
      ctx.fillStyle = isChecked ? 'rgba(255,255,255,0.6)' : '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(habit.name, textX, textY);

      // Streak badge
      if (isChecked) {
        const badgeText = `🔥 ${habit.streak}`;
        ctx.font = '500 18px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#ff8a4c';
        ctx.textAlign = 'right';
        ctx.fillText(badgeText, w - padding - 18, textY);
      }
    });
  }

  private drawCheckmark(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    progress: number,
    color: string
  ): void {
    const cx = x + size / 2;
    const cy = y + size / 2;
    const checkSize = size * 0.35;

    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const pathLength1 = checkSize * 0.6;
    const pathLength2 = checkSize;
    const totalPath = pathLength1 + pathLength2;
    const currentLength = totalPath * progress;

    ctx.beginPath();
    if (currentLength <= pathLength1) {
      ctx.moveTo(cx - checkSize * 0.3, cy - checkSize * 0.1);
      ctx.lineTo(
        cx - checkSize * 0.3 + currentLength * 0.707,
        cy - checkSize * 0.1 + currentLength * 0.707
      );
    } else {
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

  private drawBarChart(ctx: CanvasRenderingContext2D, w: number, y: number, contentW: number): void {
    const padding = 24;
    const chartW = contentW;
    const chartH = 140;
    const barCount = 7;
    const barWidth = (chartW - (barCount + 1) * 12) / barCount;
    const gap = 12;
    const barValues = [3, 5, 4, 6, 7, 5, 8];
    const maxValue = Math.max(...barValues);
    const baseY = y + chartH - 20;

    // Chart background
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.beginPath();
    ctx.roundRect(padding, y, chartW, chartH, 16);
    ctx.fill();

    // Y-axis label
    ctx.font = '400 14px Inter, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Weekly Activity', padding + 12, y + 20);

    // Bars
    barValues.forEach((value, i) => {
      const progress = this.barChartProgress[i];
      const barH = (value / maxValue) * (chartH - 60) * progress;
      const barX = padding + gap + i * (barWidth + gap);

      // Bar gradient
      const grad = ctx.createLinearGradient(0, baseY, 0, baseY - barH);
      grad.addColorStop(0, '#ff8a4c');
      grad.addColorStop(1, '#7c4dff');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.roundRect(barX, baseY - barH, barWidth, barH, 6);
      ctx.fill();

      // Day label
      const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
      ctx.font = '500 14px Inter, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(days[i], barX + barWidth / 2, baseY + 8);
    });
  }

  getHabits(): Habit[] {
    return this.habits;
  }

  isComplete(): boolean {
    return this.habits.every(h => h.completed) && this.streakProgress >= 1;
  }

  dispose(): void {
    // No Three.js resources to dispose
  }
}