// Utilidades para medir y dibujar texto en canvas
export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
  color: string;
  lineHeight?: number;
  letterSpacing?: number;
}

export interface TextMetrics {
  width: number;
  height: number;
  actualBoundingBoxAscent: number;
  actualBoundingBoxDescent: number;
}

// Cache de contextos para medición
const measureCache = new Map<string, TextMetrics>();
const measureCanvas = document.createElement('canvas');
const measureCtx = measureCanvas.getContext('2d')!;

function getCacheKey(text: string, style: TextStyle): string {
  return `${style.fontFamily}|${style.fontSize}|${style.fontWeight}|${text}`;
}

export function measureText(text: string, style: TextStyle): TextMetrics {
  const key = getCacheKey(text, style);
  const cached = measureCache.get(key);
  if (cached) return cached;

  const font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
  measureCtx.font = font;
  const metrics = measureCtx.measureText(text);

  const result: TextMetrics = {
    width: metrics.width,
    height: style.fontSize * (style.lineHeight || 1.2),
    actualBoundingBoxAscent: metrics.actualBoundingBoxAscent || style.fontSize * 0.8,
    actualBoundingBoxDescent: metrics.actualBoundingBoxDescent || style.fontSize * 0.2,
  };

  measureCache.set(key, result);
  return result;
}

export function measureMultilineText(lines: string[], style: TextStyle): { width: number; height: number; lineMetrics: TextMetrics[] } {
  const lineMetrics = lines.map(l => measureText(l, style));
  const width = Math.max(...lineMetrics.map(m => m.width));
  const lineHeight = style.fontSize * (style.lineHeight || 1.2);
  const height = lineMetrics.length * lineHeight;
  return { width, height, lineMetrics };
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  style: TextStyle,
  align: CanvasTextAlign = 'left',
  baseline: CanvasTextBaseline = 'alphabetic'
): void {
  ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
  ctx.fillStyle = style.color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;

  if (style.letterSpacing) {
    // Dibujar carácter por carácter para letter-spacing
    const chars = text.split('');
    let cursorX = x;
    for (const char of chars) {
      ctx.fillText(char, cursorX, y);
      cursorX += ctx.measureText(char).width + style.letterSpacing;
    }
  } else {
    ctx.fillText(text, x, y);
  }
}

export function drawMultilineText(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  style: TextStyle,
  align: CanvasTextAlign = 'left'
): void {
  const lineHeight = style.fontSize * (style.lineHeight || 1.2);
  lines.forEach((line, i) => {
    drawText(ctx, line, x, y + i * lineHeight, style, align);
  });
}

// Dibujar texto con cursor parpadeante
export function drawTextWithCursor(
  ctx: CanvasRenderingContext2D,
  text: string,
  cursorPos: number,
  x: number,
  y: number,
  style: TextStyle,
  showCursor: boolean,
  cursorColor: string = style.color
): void {
  const beforeCursor = text.slice(0, cursorPos);
  const afterCursor = text.slice(cursorPos);

  ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
  ctx.fillStyle = style.color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  const beforeWidth = ctx.measureText(beforeCursor).width;

  // Texto antes del cursor
  ctx.fillText(beforeCursor, x, y);

  // Cursor
  if (showCursor) {
    const cursorHeight = style.fontSize * 0.9;
    const cursorY = y - style.fontSize * 0.75;
    ctx.fillStyle = cursorColor;
    ctx.fillRect(x + beforeWidth, cursorY, 2, cursorHeight);
  }

  // Texto después del cursor (si hay selección, etc.)
  if (afterCursor) {
    ctx.fillStyle = style.color;
    ctx.fillText(afterCursor, x + beforeWidth + (showCursor ? 2 : 0), y);
  }
}

// Tokenizer simple para syntax highlighting (React/TSX)
export interface CodeToken {
  type: 'keyword' | 'string' | 'function' | 'variable' | 'comment' | 'operator' | 'punctuation' | 'jsx' | 'number' | 'plain';
  text: string;
}

const KEYWORDS = new Set([
  'import', 'export', 'const', 'let', 'var', 'function', 'return', 'if', 'else',
  'for', 'while', 'try', 'catch', 'finally', 'async', 'await', 'typeof',
  'interface', 'type', 'enum', 'class', 'extends', 'implements', 'public',
  'private', 'protected', 'readonly', 'static', 'default', 'from', 'as',
  'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'React',
]);

const FUNCTIONS = new Set([
  'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback',
  'map', 'filter', 'reduce', 'find', 'includes', 'push', 'pop',
]);

export function tokenizeCode(code: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  let i = 0;

  while (i < code.length) {
    const char = code[i];

    // Whitespace
    if (/\s/.test(char)) {
      let j = i;
      while (j < code.length && /\s/.test(code[j])) j++;
      tokens.push({ type: 'plain', text: code.slice(i, j) });
      i = j;
      continue;
    }

    // Comments
    if (char === '/' && code[i + 1] === '/') {
      let j = i;
      while (j < code.length && code[j] !== '\n') j++;
      tokens.push({ type: 'comment', text: code.slice(i, j) });
      i = j;
      continue;
    }

    if (char === '/' && code[i + 1] === '*') {
      let j = i + 2;
      while (j < code.length - 1 && !(code[j] === '*' && code[j + 1] === '/')) j++;
      j += 2;
      tokens.push({ type: 'comment', text: code.slice(i, j) });
      i = j;
      continue;
    }

    // Strings
    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      let j = i + 1;
      let escaped = false;
      while (j < code.length) {
        if (code[j] === quote && !escaped) break;
        escaped = code[j] === '\\' && !escaped;
        j++;
      }
      j = Math.min(j + 1, code.length);
      tokens.push({ type: 'string', text: code.slice(i, j) });
      i = j;
      continue;
    }

    // Numbers
    if (/\d/.test(char)) {
      let j = i;
      while (j < code.length && /[\d._]/.test(code[j])) j++;
      tokens.push({ type: 'number', text: code.slice(i, j) });
      i = j;
      continue;
    }

    // Identifiers / Keywords
    if (/[a-zA-Z_$]/.test(char)) {
      let j = i;
      while (j < code.length && /[a-zA-Z0-9_$]/.test(code[j])) j++;
      const word = code.slice(i, j);
      let type: CodeToken['type'] = 'plain';
      if (KEYWORDS.has(word)) type = 'keyword';
      else if (FUNCTIONS.has(word)) type = 'function';
      else if (word[0] === word[0].toUpperCase() && word.length > 1) type = 'jsx'; // Component
      else if (/^[A-Z]+$/.test(word)) type = 'variable'; // Constant
      tokens.push({ type, text: word });
      i = j;
      continue;
    }

    // JSX punctuation
    if (char === '<' || char === '>' || char === '/' && code[i + 1] === '>') {
      if (char === '<' && code[i + 1] !== '/' && code[i + 1] !== '!') {
        tokens.push({ type: 'jsx', text: '<' });
        i++;
        continue;
      }
      if (char === '/' && code[i + 1] === '>') {
        tokens.push({ type: 'jsx', text: '/>' });
        i += 2;
        continue;
      }
      if (char === '>') {
        tokens.push({ type: 'jsx', text: '>' });
        i++;
        continue;
      }
    }

    // Operators & punctuation
    const twoChar = code.slice(i, i + 2);
    const operators = ['=>', '==', '!=', '===', '!==', '<=', '>=', '&&', '||', '??', '+=', '-=', '++', '--'];
    if (operators.includes(twoChar)) {
      tokens.push({ type: 'operator', text: twoChar });
      i += 2;
      continue;
    }

    tokens.push({ type: 'punctuation', text: char });
    i++;
  }

  return tokens;
}

const TOKEN_COLORS: Record<CodeToken['type'], string> = {
  keyword: '#ff79c6',
  string: '#f1fa8c',
  function: '#50fa7b',
  variable: '#bd93f9',
  comment: '#6272a4',
  operator: '#ff79c6',
  punctuation: '#f8f8f2',
  jsx: '#ffb86c',
  number: '#bd93f9',
  plain: '#f8f8f2',
};

export function getTokenColor(type: CodeToken['type']): string {
  return TOKEN_COLORS[type] || TOKEN_COLORS.plain;
}