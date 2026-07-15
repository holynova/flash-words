import {
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  WebMOutputFormat,
} from 'mediabunny';
import {dimensionsFor} from '../engine/project';
import type {ExportOptions, ProjectSpec} from '../engine/types';
import {renderFrame} from '../renderer/render-frame';
import {ensureFontsLoaded} from '../renderer/fonts';
import {detectVideoCapability} from './capabilities';

export interface VideoExportResult {
  blob: Blob;
  extension: 'mp4' | 'webm';
  codecLabel: string;
}

function abortIfNeeded(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('导出已取消', 'AbortError');
}

export async function exportVideo(project: ProjectSpec, options: ExportOptions = {}): Promise<VideoExportResult> {
  const {width, height} = dimensionsFor(project.aspectRatio, 'video');
  options.onProgress?.({phase: 'preparing', progress: 0, message: '正在准备视频编码器'});
  await ensureFontsLoaded();
  abortIfNeeded(options.signal);

  const capability = await detectVideoCapability(width, height);
  if (!capability.container || !capability.codec) throw new Error(capability.label);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', {alpha: false});
  if (!ctx) throw new Error('无法创建视频画布');

  const target = new BufferTarget();
  const format = capability.container === 'mp4' ? new Mp4OutputFormat() : new WebMOutputFormat();
  const output = new Output({format, target});
  const source = new CanvasSource(canvas, {
    codec: capability.codec,
    bitrate: QUALITY_HIGH,
  });
  output.addVideoTrack(source, {frameRate: project.fps});
  await output.start();

  const totalFrames = Math.round(project.durationSeconds * project.fps);
  for (let frame = 0; frame < totalFrames; frame += 1) {
    abortIfNeeded(options.signal);
    renderFrame(ctx, project, frame);
    await source.add(frame / project.fps, 1 / project.fps);
    if (frame % 3 === 0 || frame === totalFrames - 1) {
      const progress = (frame + 1) / totalFrames;
      options.onProgress?.({
        phase: 'rendering',
        progress: progress * 0.92,
        message: `正在渲染 ${frame + 1} / ${totalFrames} 帧`,
      });
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
  }

  abortIfNeeded(options.signal);
  options.onProgress?.({phase: 'encoding', progress: 0.95, message: '正在封装视频文件'});
  await output.finalize();
  const buffer = target.buffer;
  if (!buffer) throw new Error('视频编码器没有返回文件');
  const extension = capability.container;
  const blob = new Blob([buffer], {type: extension === 'mp4' ? 'video/mp4' : 'video/webm'});
  options.onProgress?.({phase: 'done', progress: 1, message: '视频已生成'});
  return {blob, extension, codecLabel: capability.label};
}
