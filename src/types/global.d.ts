// Global type declarations for capture mode
interface Window {
  __CAPTURE_MODE__: boolean;
  __FRAME_READY__: number;
  setCaptureFrame: (time: number) => void;
}

// Module declarations for Node.js compatibility
declare const module: {
  exports: any;
} | undefined;