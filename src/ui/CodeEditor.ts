// Code editor component for Scene 3
import * as THREE from 'three';
import { CanvasTexture, createPanelTexture } from './CanvasTexture';
import { SyntaxHighlighter } from './TextRenderer';
import { CONFIG } from '../config';

const REACT_CODE = `import { useState, useEffect } from 'react';

interface Habit {
  id: string;
  name: string;
  streak: number;
  completed: boolean;
}

export function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('habits');
    if (saved) setHabits(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits));
  }, [habits]);

  const addHabit = () => {
    if (!newHabit.trim()) return;
    setHabits([...habits, {
      id: crypto.randomUUID(),
      name: newHabit,
      streak: 0,
      completed: false
    }]);
    setNewHabit('');
  };

  const toggleHabit = (id: string) => {
    setHabits(habits.map(h => h.id === id ? {
      ...h,
      completed: !h.completed,
      streak: h.completed ? h.streak - 1 : h.streak + 1
    } : h));
  };

  return (
    <div className="habit-tracker">
      <h1>Habit Tracker</h1>
      <input
        value={newHabit}
        onChange={e => setNewHabit(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && addHabit()}
        placeholder="New habit..."
      />
      <button onClick={addHabit}>Add</button>
      <ul>
        {habits.map(h => (
          <li key={h.id} onClick={() => toggleHabit(h.id)}>
            <span>{h.name}</span>
            <span className={h.completed ? 'done' : ''}>
              🔥 {h.streak}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}`;

export class CodeEditor {
  private mesh: THREE.Mesh;
  private texture: CanvasTexture;
  private highlighter: SyntaxHighlighter;

  // Animation state
  private typingProgress: number = 0; // 0 to 1
  private visibleLines: number = 0;
  private visibleCharsInLine: number = 0;
  private currentLine: number = 0;
  private isTyping: boolean = false;
  private typingStartTime: number = 0;
  private typingSpeed: number = 1; // speed multiplier

  // Badge
  private showBadge: boolean = false;
  private badgeScale: number = 0;
  private badgeStartTime: number = 0;

  constructor() {
    const editorWidth = 1024;
    const editorHeight = 768;

    this.highlighter = new SyntaxHighlighter({
      code: REACT_CODE,
      fontSize: 15,
      lineHeight: 1.6,
      fontFamily: '"JetBrains Mono", "Fira Code", "Monaco", monospace',
    });

    this.texture = createPanelTexture(
      editorWidth,
      editorHeight,
      (ctx, time, w, h) => this.drawEditor(ctx, time, w, h),
      'rgba(255,255,255,0.1)',
      1.5
    );

    const geometry = new THREE.PlaneGeometry(
      CONFIG.panel.width,
      CONFIG.panel.height * 0.85
    );
    const material = new THREE.MeshBasicMaterial({
      map: this.texture.getTexture(),
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0, 0.15);
  }

  startTyping(): void {
    this.isTyping = true;
    this.typingStartTime = 0;
    this.typingProgress = 0;
    this.currentLine = 0;
    this.visibleLines = 0;
    this.visibleCharsInLine = 0;
    this.showBadge = false;
    this.badgeScale = 0;
  }

  showTestBadge(): void {
    this.showBadge = true;
    this.badgeStartTime = 0;
    this.badgeScale = 0;
  }

  update(deltaTime: number): void {
    if (this.isTyping) {
      this.typingStartTime += deltaTime;

      // Typing animation: ~40 chars per second with pauses
      const totalChars = REACT_CODE.length;
      const baseSpeed = 45; // chars/sec
      const charsTyped = Math.floor(this.typingStartTime * baseSpeed);

      this.typingProgress = Math.min(1, charsTyped / totalChars);

      // Calculate visible lines and chars
      let remaining = charsTyped;
      this.visibleLines = 0;
      this.visibleCharsInLine = 0;

      const lines = REACT_CODE.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const lineLen = lines[i].length + 1; // +1 for newline
        if (remaining >= lineLen) {
          this.visibleLines = i + 1;
          remaining -= lineLen;
        } else {
          this.visibleLines = i;
          this.visibleCharsInLine = remaining;
          break;
        }
      }

      if (this.typingProgress >= 1) {
        this.isTyping = false;
        this.visibleLines = lines.length;
        this.visibleCharsInLine = 0;
        // Trigger badge after short delay
        setTimeout(() => this.showTestBadge(), 500);
      }
    }

    // Badge animation
    if (this.showBadge) {
      this.badgeStartTime += deltaTime;
      this.badgeScale = Math.min(1, this.badgeStartTime / 0.5);
      this.badgeScale = easeOutBack(this.badgeScale);
    }

    this.texture.needsUpdate = true;
  }

  private drawEditor(ctx: CanvasRenderingContext2D, time: number, w: number, h: number): void {
    const padding = 16;
    const contentW = w - padding * 2;
    const contentH = h - padding * 2;

    // Editor background (dark)
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(padding, padding, contentW, contentH);

    // Window dots (top-left)
    const dotY = padding + 16;
    const dotX = padding + 16;
    const dotSpacing = 18;
    const dotRadius = 6;

    ['#ff5f57', '#ffbd2e', '#28ca42'].forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(dotX + i * dotSpacing, dotY, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Tab bar
    const tabY = padding + 44;
    const tabH = 32;
    ctx.fillStyle = '#161b22';
    ctx.fillRect(padding, tabY, contentW, tabH);

    // Tab
    const tabW = 120;
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(padding + 4, tabY + 2, tabW, tabH - 4);
    ctx.font = '500 13px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#e6edf3';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('App.tsx', padding + 16, tabY + tabH / 2);

    // Tab close
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '14px monospace';
    ctx.fillText('×', padding + tabW - 10, tabY + tabH / 2 + 4);

    // Code area
    const codeY = tabY + tabH + 8;
    const codeH = contentH - (tabH + 52);
    const codeX = padding + 16;
    const codeMaxW = contentW - 32;

    // Line numbers background
    ctx.fillStyle = '#161b22';
    ctx.fillRect(padding, codeY, 60, codeH);

    // Draw syntax highlighted code
    const result = this.highlighter.draw(
      ctx,
      codeX,
      codeY + 8,
      this.visibleLines > 0 ? this.visibleLines : -1,
      this.visibleLines > 0 && this.visibleLines <= this.highlighter.getLineCount()
        ? this.visibleCharsInLine
        : -1
    );

    // Line numbers
    ctx.font = '400 13px "JetBrains Mono", monospace';
    ctx.fillStyle = '#484f58';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';

    const lines = REACT_CODE.split('\n');
    const linesToShow = this.visibleLines > 0 ? Math.min(this.visibleLines, lines.length) : lines.length;
    const lineHeight = 15 * 1.6;

    for (let i = 0; i < linesToShow; i++) {
      const isCurrentLine = i === this.visibleLines - 1 && this.isTyping;
      ctx.fillStyle = isCurrentLine ? '#ff8a4c' : '#484f58';
      ctx.fillText(`${(i + 1).toString().padStart(3, ' ')}`, padding + 54, codeY + 8 + i * lineHeight);

      // Current line indicator
      if (isCurrentLine) {
        ctx.fillStyle = 'rgba(255,138,76,0.1)';
        ctx.fillRect(padding + 60, codeY + 8 + i * lineHeight, codeMaxW, lineHeight);
      }
    }

    // Cursor on current line
    if (this.isTyping && this.visibleLines > 0 && this.visibleLines <= lines.length) {
      const cursorLine = this.visibleLines - 1;
      const cursorX = codeX;
      const cursorY = codeY + 8 + cursorLine * lineHeight;

      // Blinking cursor
      if (Math.floor(time * 2) % 2 === 0) {
        // Measure text up to cursor position
        const lineText = lines[cursorLine].slice(0, this.visibleCharsInLine);
        ctx.font = '400 13px "JetBrains Mono", monospace';
        const textWidth = ctx.measureText(lineText).width;

        ctx.fillStyle = '#ff8a4c';
        ctx.fillRect(codeX + textWidth, cursorY, 2, lineHeight * 0.9);
      }
    }

    // Draw badge
    if (this.showBadge && this.badgeScale > 0) {
      const badgeW = 200;
      const badgeH = 44;
      const badgeX = w - padding - badgeW - 16;
      const badgeY = padding + 16;

      ctx.save();
      ctx.translate(badgeX + badgeW / 2, badgeY + badgeH / 2);
      ctx.scale(this.badgeScale, this.badgeScale);
      ctx.translate(-(badgeX + badgeW / 2), -(badgeY + badgeH / 2));

      // Badge background
      const grad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
      grad.addColorStop(0, '#1f6f3a');
      grad.addColorStop(1, '#144d2a');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 12);
      ctx.fill();

      // Border
      ctx.strokeStyle = '#28ca42';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 12);
      ctx.stroke();

      // Checkmark
      ctx.strokeStyle = '#28ca42';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const cx = badgeX + 24;
      const cy = badgeY + badgeH / 2;
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy);
      ctx.lineTo(cx, cy + 6);
      ctx.lineTo(cx + 10, cy - 6);
      ctx.stroke();

      // Text
      ctx.font = '600 16px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('12 tests passed', badgeX + 44, badgeY + badgeH / 2);

      ctx.restore();
    }
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  getTexture(): CanvasTexture {
    return this.texture;
  }

  isTypingComplete(): boolean {
    return !this.isTyping && this.typingProgress >= 1;
  }

  reset(): void {
    this.typingProgress = 0;
    this.visibleLines = 0;
    this.visibleCharsInLine = 0;
    this.currentLine = 0;
    this.isTyping = false;
    this.typingStartTime = 0;
    this.showBadge = false;
    this.badgeScale = 0;
    this.badgeStartTime = 0;
  }

  dispose(): void {
    this.texture.dispose();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

// Helper
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}