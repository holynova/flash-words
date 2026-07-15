import {dimensionsFor} from '../engine/project';
import type {ExportOptions, ProjectSpec} from '../engine/types';
import {ensureFontsLoaded} from '../renderer/fonts';
import {renderFrame} from '../renderer/render-frame';

function abortIfNeeded(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('导出已取消', 'AbortError');
}

export async function exportGif(project: ProjectSpec, options: ExportOptions = {}): Promise<Blob> {
  options.onProgress?.({phase: 'preparing', progress: 0, message: '正在准备 GIF 编码器'});
  await ensureFontsLoaded();
  abortIfNeeded(options.signal);

  const {width, height} = dimensionsFor(project.aspectRatio, 'gif');
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', {alpha: false, willReadFrequently: true});
  if (!ctx) throw new Error('无法创建 GIF 画布');

  const worker = new Worker(new URL('./gif.worker.ts', import.meta.url), {type: 'module'});
  const request = <T,>(message: unknown, transfer: Transferable[] = []) => new Promise<T>((resolve, reject) => {
    const onMessage = (event: MessageEvent) => {
      if (event.data.type === 'error') {
        cleanup();
        reject(new Error(event.data.message));
        return;
      }
      cleanup();
      resolve(event.data as T);
    };
    const onError = (event: ErrorEvent) => {
      cleanup();
      reject(new Error(event.message || 'GIF worker 无法运行'));
    };
    const cleanup = () => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
    };
    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);
    worker.postMessage(message, transfer);
  });

  const gifFps = 15;
  const totalFrames = Math.round(project.durationSeconds * gifFps);
  try {
    await request({type: 'start', width, height});
    for (let frame = 0; frame < totalFrames; frame += 1) {
      abortIfNeeded(options.signal);
      renderFrame(ctx, project, frame * (project.fps / gifFps));
      const pixels = ctx.getImageData(0, 0, width, height).data;
      const buffer = pixels.slice().buffer as ArrayBuffer;
      const delay = frame % 3 === 2 ? 60 : 70;
      await request({type: 'frame', pixels: buffer, frame, delay}, [buffer]);

      if (frame % 2 === 0 || frame === totalFrames - 1) {
        const progress = (frame + 1) / totalFrames;
        options.onProgress?.({
          phase: 'rendering',
          progress,
          message: `正在生成 GIF ${frame + 1} / ${totalFrames} 帧`,
        });
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }
    }

    const result = await request<{type: 'done'; buffer: ArrayBuffer}>({type: 'finish'});
    options.onProgress?.({phase: 'done', progress: 1, message: 'GIF 已生成'});
    return new Blob([result.buffer], {type: 'image/gif'});
  } finally {
    worker.terminate();
  }
}
