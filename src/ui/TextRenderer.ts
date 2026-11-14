// Texto con cursor, typing effect, syntax highlighting
import { CONFIG } from '../config';
import { measureText, drawText, drawMultilineText, drawTextWithCursor, tokenizeCode, getTokenColor, CodeToken, TextStyle } from '../utils/text';

export interface TypingConfig {
  text: string;
  speed: number; // caracteres por segundo
  startDelay?: number;
  cursorBlinkRate?: number; // ms
  onComplete?: () => void;
}

export interface SyntaxHighlightConfig {
  code: string;
  lineHeight?: number;
  fontSize?: number;
  fontFamily?: string;
}

export class TypingAnimator {
  private config: TypingConfig;
  private currentText: string = '';
  private currentIndex: number = 0;
  private elapsed: number = 0;
  private isComplete: boolean = false;
  private showCursor: boolean = true;
  private cursorBlinkTimer: number = 0;
  private cursorBlinkRate: number;

  constructor(config: TypingConfig) {
    this.config = config;
    this.cursorBlinkRate = config.cursorBlinkRate || 500;
  }

  update(deltaTime: number): void {
    if (this.isComplete) {
      // Parpadeo del cursor después de completar
      this.cursorBlinkTimer += deltaTime * 1000;
      if (this.cursorBlinkTimer >= this.cursorBlinkRate) {
        this.showCursor = !this.showCursor;
        this.cursorBlinkTimer = 0;
      }
      return;
    }

    this.elapsed += deltaTime;

    if (this.elapsed < (this.config.startDelay || 0)) return;

    const charsToAdd = Math.floor((this.elapsed - (this.config.startDelay || 0)) * this.config.speed);
    const targetIndex = Math.min(charsToAdd, this.config.text.length);

    if (targetIndex !== this.currentIndex) {
      this.currentIndex = targetIndex;
      this.currentText = this.config.text.slice(0, this.currentIndex);
    }

    // Cursor blink mientras escribe
    this.cursorBlinkTimer += deltaTime * 1000;
    if (this.cursorBlinkTimer >= this.cursorBlinkRate) {
      this.showCursor = !this.showCursor;
      this.cursorBlinkTimer = 0;
    }

    if (this.currentIndex >= this.config.text.length && !this.isComplete) {
      this.isComplete = true;
      this.showCursor = true;
      this.config.onComplete?.();
    }
  }

  reset(): void {
    this.currentText = '';
    this.currentIndex = 0;
    this.elapsed = 0;
    this.isComplete = false;
    this.showCursor = true;
    this.cursorBlinkTimer = 0;
  }

  setText(text: string): void {
    this.config.text = text;
    this.reset();
  }

  getCurrentText(): string {
    return this.currentText;
  }

  getFullText(): string {
    return this.config.text;
  }

  isFinished(): boolean {
    return this.isComplete;
  }

  getCursorVisible(): boolean {
    return this.showCursor;
  }

  getProgress(): number {
    return this.currentIndex / this.config.text.length;
  }
}

// Typing con borrado y reescritura (para Scene 1)
export class TypewriterSequence {
  private phases: Array<{
    text: string;
    speed: number;
    delayBefore?: number;
    delayAfter?: number;
    erase?: boolean;
    eraseSpeed?: number;
  }> = [];
  private currentPhase: number = 0;
  private phaseElapsed: number = 0;
  private phaseState: 'typing' | 'erasing' | 'waiting' | 'complete' = 'waiting';
  private currentText: string = '';
  private currentIndex: number = 0;
  private isComplete: boolean = false;
  private showCursor: boolean = true;
  private cursorBlinkTimer: number = 0;
  private cursorBlinkRate: number = 500;
  private onPhaseComplete?: (phaseIndex: number) => void;
  private onComplete?: () => void;

  addPhase(config: {
    text: string;
    speed: number;
    delayBefore?: number;
    delayAfter?: number;
    erase?: boolean;
    eraseSpeed?: number;
  }): this {
    this.phases.push(config);
    return this;
  }

  setCallbacks(callbacks: { onPhaseComplete?: (i: number) => void; onComplete?: () => void }): this {
    this.onPhaseComplete = callbacks.onPhaseComplete;
    this.onComplete = callbacks.onComplete;
    return this;
  }

  update(deltaTime: number): void {
    if (this.isComplete) {
      this.cursorBlinkTimer += deltaTime * 1000;
      if (this.cursorBlinkTimer >= this.cursorBlinkRate) {
        this.showCursor = !this.showCursor;
        this.cursorBlinkTimer = 0;
      }
      return;
    }

    if (this.currentPhase >= this.phases.length) {
      this.isComplete = true;
      this.onComplete?.();
      return;
    }

    const phase = this.phases[this.currentPhase];
    this.phaseElapsed += deltaTime;

    switch (this.phaseState) {
      case 'waiting':
        if (this.phaseElapsed >= (phase.delayBefore || 0)) {
          this.phaseState = phase.erase ? 'erasing' : 'typing';
          this.phaseElapsed = 0;
        }
        break;

      case 'typing': {
        const charsToAdd = Math.floor(this.phaseElapsed * phase.speed);
        this.currentIndex = Math.min(charsToAdd, phase.text.length);
        this.currentText = phase.text.slice(0, this.currentIndex);

        this.cursorBlinkTimer += deltaTime * 1000;
        if (this.cursorBlinkTimer >= this.cursorBlinkRate) {
          this.showCursor = !this.showCursor;
          this.cursorBlinkTimer = 0;
        }

        if (this.currentIndex >= phase.text.length) {
          this.phaseState = 'waiting';
          this.phaseElapsed = 0;
          this.showCursor = true;
        }
        break;
      }

      case 'erasing': {
        const charsToErase = Math.floor(this.phaseElapsed * (phase.eraseSpeed || phase.speed));
        this.currentIndex = Math.max(0, phase.text.length - charsToErase);
        this.currentText = phase.text.slice(0, this.currentIndex);

        this.cursorBlinkTimer += deltaTime * 1000;
        if (this.cursorBlinkTimer >= this.cursorBlinkRate) {
          this.showCursor = !this.showCursor;
          this.cursorBlinkTimer = 0;
        }

        if (this.currentIndex <= 0) {
          this.currentPhase++;
          this.phaseState = 'waiting';
          this.phaseElapsed = 0;
          this.onPhaseComplete?.(this.currentPhase - 1);
        }
        break;
      }
    }
  }

  reset(): void {
    this.currentPhase = 0;
    this.phaseElapsed = 0;
    this.phaseState = 'waiting';
    this.currentText = '';
    this.currentIndex = 0;
    this.isComplete = false;
    this.showCursor = true;
    this.cursorBlinkTimer = 0;
  }

  getCurrentText(): string {
    return this.currentText;
  }

  getCursorVisible(): boolean {
    return this.showCursor;
  }

  isFinished(): boolean {
    return this.isComplete;
  }

  getPhaseProgress(): number {
    const phase = this.phases[this.currentPhase];
    if (!phase) return 1;
    if (this.phaseState === 'typing') return this.currentIndex / phase.text.length;
    if (this.phaseState === 'erasing') return 1 - this.currentIndex / phase.text.length;
    return this.phaseState === 'complete' ? 1 : 0;
  }
}

// Syntax Highlighter para CodeEditor
export class SyntaxHighlighter {
  private tokens: CodeToken[] = [];
  private config: Required<SyntaxHighlightConfig>;

  constructor(config: SyntaxHighlightConfig) {
    this.config = {
      code: config.code,
      lineHeight: config.lineHeight || 1.5,
      fontSize: config.fontSize || 14,
      fontFamily: config.fontFamily || 'Inter, "JetBrains Mono", "Fira Code", monospace',
    };
    this.tokens = tokenizeCode(this.config.code);
  }

  setCode(code: string): void {
    this.config.code = code;
    this.tokens = tokenizeCode(code);
  }

  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    visibleLines: number = -1,
    visibleChars: number = -1
  ): { width: number; height: number; lineCount: number } {
    ctx.font = `${this.config.fontSize}px ${this.config.fontFamily}`;
    const lineHeight = this.config.fontSize * this.config.lineHeight;

    const lines = this.config.code.split('\n');
    const linesToDraw = visibleLines > 0 ? lines.slice(0, visibleLines) : lines;

    let maxWidth = 0;
    let totalHeight = 0;

    linesToDraw.forEach((line, lineIndex) => {
      let cursorX = x;
      let charCount = 0;

      // Filtrar tokens de esta línea
      const lineTokens = this.getTokensForLine(lineIndex);
      const tokensToDraw = visibleChars > 0 ? this.getTokensUpToChar(lineTokens, visibleChars) : lineTokens;

      tokensToDraw.forEach(token => {
        if (visibleChars > 0 && charCount >= visibleChars) return;

        ctx.fillStyle = getTokenColor(token.type);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(token.text, cursorX, y + lineIndex * lineHeight);

        cursorX += ctx.measureText(token.text).width;
        charCount += token.text.length;
      });

      maxWidth = Math.max(maxWidth, cursorX - x);
    });

    totalHeight = linesToDraw.length * lineHeight;

    return { width: maxWidth, height: totalHeight, lineCount: linesToDraw.length };
  }

  private getTokensForLine(lineIndex: number): CodeToken[] {
    const lines = this.config.code.split('\n');
    let charIndex = 0;

    for (let i = 0; i < lineIndex; i++) {
      charIndex += lines[i].length + 1; // +1 for newline
    }

    const lineLength = lines[lineIndex].length;
    const lineEndIndex = charIndex + lineLength;

    const result: CodeToken[] = [];
    let currentCharIndex = 0;

    for (const token of this.tokens) {
      const tokenEndIndex = currentCharIndex + token.text.length;

      if (tokenEndIndex > charIndex && currentCharIndex < lineEndIndex) {
        // Token overlapps with this line
        let start = Math.max(0, charIndex - currentCharIndex);
        let end = Math.min(token.text.length, lineEndIndex - currentCharIndex);

        if (start < end) {
          result.push({
            ...token,
            text: token.text.slice(start, end)
          });
        }
      }

      currentCharIndex = tokenEndIndex;
      if (currentCharIndex >= lineEndIndex) break;
    }

    return result;
  }

  private getTokensUpToChar(tokens: CodeToken[], maxChars: number): CodeToken[] {
    const result: CodeToken[] = [];
    let charCount = 0;

    for (const token of tokens) {
      if (charCount + token.text.length <= maxChars) {
        result.push(token);
        charCount += token.text.length;
      } else {
        const remaining = maxChars - charCount;
        if (remaining > 0) {
          result.push({ ...token, text: token.text.slice(0, remaining) });
        }
        break;
      }
    }

    return result;
  }

  getLineCount(): number {
    return this.config.code.split('\n').length;
  }

  getTotalHeight(lineHeight?: number): number {
    return this.getLineCount() * (lineHeight || this.config.fontSize * this.config.lineHeight);
  }
}

// Bouncing dots animation (para "On it. Here's the plan...")
export class BouncingDots {
  private dotCount: number;
  private speed: number;
  private phase: number = 0;
  private maxHeight: number;

  constructor(dotCount = 3, speed = 3, maxHeight = 8) {
    this.dotCount = dotCount;
    this.speed = speed;
    this.maxHeight = maxHeight;
  }

  update(deltaTime: number): void {
    this.phase += deltaTime * this.speed;
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number, dotSize: number = 4, color: string = '#ffffff'): void {
    ctx.fillStyle = color;

    for (let i = 0; i < this.dotCount; i++) {
      const offset = (i / this.dotCount) * Math.PI * 2;
      const bounce = Math.sin(this.phase + offset) * this.maxHeight;
      ctx.beginPath();
      ctx.arc(x + i * (dotSize * 2.5), y + bounce, dotSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  reset(): void {
    this.phase = 0;
  }
}