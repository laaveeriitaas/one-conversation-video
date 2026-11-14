// Render pipeline: Playwright capture + FFmpeg stitch
import { chromium, Browser, Page } from 'playwright';
import { spawn, ChildProcess } from 'child_process';
import { CONFIG } from '../src/config';
import { promises as fs } from 'fs';
import path from 'path';

const FRAMES_DIR = path.resolve('frames');
const OUTPUT_FILE = path.resolve('output.mp4');
const TOTAL_FRAMES = CONFIG.totalFrames;
const FPS = CONFIG.fps;
const WIDTH = CONFIG.width;
const HEIGHT = CONFIG.height;

interface RenderOptions {
  mode: 'frames' | 'video' | 'dev';
  headless?: boolean;
  batchSize?: number;
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function clearFramesDir(): Promise<void> {
  try {
    await fs.rm(FRAMES_DIR, { recursive: true, force: true });
  } catch {}
  await ensureDir(FRAMES_DIR);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runFFmpeg(inputPattern: string, outputFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-framerate', String(FPS),
      '-i', inputPattern,
      '-c:v', 'libx264',
      '-preset', 'slow',
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      outputFile,
    ];

    console.log(`Running: ffmpeg ${args.join(' ')}`);

    const ffmpeg = spawn('ffmpeg', args, { stdio: 'pipe' });

    let stderr = '';
    ffmpeg.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log('FFmpeg completed successfully');
        resolve();
      } else {
        console.error('FFmpeg failed:', stderr);
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on('error', (err) => {
      reject(new Error(`Failed to spawn ffmpeg: ${err.message}`));
    });
  });
}

async function checkFFmpeg(): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version'], { stdio: 'ignore' });
    ffmpeg.on('close', (code) => resolve(code === 0));
    ffmpeg.on('error', () => resolve(false));
  });
}

async function renderFrames(options: RenderOptions): Promise<void> {
  const { headless = true, batchSize = 50 } = options;

  console.log(`Starting frame render: ${TOTAL_FRAMES} frames at ${FPS}fps`);
  console.log(`Resolution: ${WIDTH}x${HEIGHT}`);
  console.log(`Output directory: ${FRAMES_DIR}`);

  await clearFramesDir();

  const browser = await chromium.launch({
    headless,
    args: [
      '--disable-gpu',
      '--use-gl=swiftshader',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--memory-pressure-off',
      '--max_old_space_size=4096',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  // Navigate to dev server
  const devUrl = 'http://localhost:5173?capture=true';
  console.log(`Navigating to ${devUrl}...`);
  await page.goto(devUrl, { waitUntil: 'networkidle', timeout: 60000 });

  // Wait for Three.js to initialize
  await page.waitForFunction(() => {
    return window.__CAPTURE_MODE__ === true || document.querySelector('#three-canvas') !== null;
  }, { timeout: 30000 });

  // Enable capture mode
  await page.evaluate(() => {
    window.__CAPTURE_MODE__ = true;
  });

  // Wait a bit for first frame
  await sleep(1000);

  console.log('Starting frame capture...');
  const startTime = Date.now();

  for (let batch = 0; batch < Math.ceil(TOTAL_FRAMES / batchSize); batch++) {
    const batchStart = batch * batchSize;
    const batchEnd = Math.min(batchStart + batchSize, TOTAL_FRAMES);

    console.log(`Batch ${batch + 1}/${Math.ceil(TOTAL_FRAMES / batchSize)}: frames ${batchStart}-${batchEnd - 1}`);

    for (let frame = batchStart; frame < batchEnd; frame++) {
      const t = frame / FPS;

      // Render frame via page.evaluate
      await page.evaluate((time) => {
        // This calls the capture mode function exposed by main.ts
        if (window.setCaptureFrame) {
          window.setCaptureFrame(time);
        }
      }, t);

      // Wait for render to complete
      await page.waitForFunction((frameNum) => {
        return window.__FRAME_READY__ === frameNum;
      }, frame, { timeout: 5000 });

      // Capture screenshot
      const framePath = path.join(FRAMES_DIR, `frame_${frame.toString().padStart(4, '0')}.png`);
      await page.screenshot({
        path: framePath,
        type: 'png',
        animations: 'disabled',
      });

      if (frame % 60 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const fps = (frame + 1) / elapsed;
        const eta = (TOTAL_FRAMES - frame - 1) / fps;
        console.log(`  Frame ${frame}/${TOTAL_FRAMES - 1} (${fps.toFixed(1)} fps, ETA: ${eta.toFixed(0)}s)`);
      }
    }

    // Small delay between batches to prevent memory pressure
    if (batchEnd < TOTAL_FRAMES) {
      await sleep(500);
    }
  }

  await browser.close();

  const totalTime = (Date.now() - startTime) / 1000;
  console.log(`Frame capture complete in ${totalTime.toFixed(1)}s (${(TOTAL_FRAMES / totalTime).toFixed(1)} fps avg)`);
}

async function stitchVideo(): Promise<void> {
  console.log('Stitching frames to MP4...');

  const hasFFmpeg = await checkFFmpeg();
  if (!hasFFmpeg) {
    throw new Error('FFmpeg not found. Please install FFmpeg.');
  }

  const inputPattern = path.join(FRAMES_DIR, 'frame_%04d.png');
  await runFFmpeg(inputPattern, OUTPUT_FILE);

  // Verify output
  const stats = await fs.stat(OUTPUT_FILE);
  console.log(`Video created: ${OUTPUT_FILE} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const mode = (args[0] as RenderOptions['mode']) || 'video';

  console.log('=== One Conversation Video Renderer ===');
  console.log(`Mode: ${mode}`);

  if (mode === 'frames' || mode === 'video') {
    await renderFrames({ mode: 'frames', headless: true, batchSize: 50 });
  }

  if (mode === 'video') {
    await stitchVideo();
    console.log('\n✅ Render complete!');
    console.log(`Output: ${OUTPUT_FILE}`);
  } else if (mode === 'frames') {
    console.log('\n✅ Frames captured!');
    console.log(`Frames directory: ${FRAMES_DIR}`);
  } else if (mode === 'dev') {
    console.log('Dev mode - start Vite dev server: npm run dev');
  } else {
    console.error(`Unknown mode: ${mode}`);
    console.log('Usage: node scripts/render.ts [frames|video|dev]');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Render failed:', err);
  process.exit(1);
});