/// <reference lib="webworker" />

import {applyPalette, GIFEncoder, quantize, type GIFEncoderInstance} from 'gifenc';

type WorkerRequest =
  | {type: 'start'; width: number; height: number}
  | {type: 'frame'; pixels: ArrayBuffer; frame: number; delay: number}
  | {type: 'finish'};

let encoder: GIFEncoderInstance | null = null;
let width = 0;
let height = 0;

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  try {
    const message = event.data;
    if (message.type === 'start') {
      encoder = GIFEncoder();
      width = message.width;
      height = message.height;
      self.postMessage({type: 'ready'});
      return;
    }

    if (!encoder) throw new Error('GIF worker 尚未初始化');

    if (message.type === 'frame') {
      const pixels = new Uint8ClampedArray(message.pixels);
      const palette = quantize(pixels, 128, {format: 'rgb444'});
      const index = applyPalette(pixels, palette, 'rgb444');
      encoder.writeFrame(index, width, height, {
        palette,
        delay: message.delay,
        repeat: message.frame === 0 ? 0 : undefined,
      });
      self.postMessage({type: 'frame-complete', frame: message.frame});
      return;
    }

    encoder.finish();
    const result = encoder.bytes().slice().buffer as ArrayBuffer;
    self.postMessage({type: 'done', buffer: result}, [result]);
    encoder = null;
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'GIF worker 编码失败',
    });
  }
};

export {};
