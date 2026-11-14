import {useCallback, useEffect, useRef, useState} from 'react';
import {dimensionsFor} from '../engine/project';
import type {ProjectSpec} from '../engine/types';
import {renderFrame} from '../renderer/render-frame';

interface CanvasPreviewProps {
  project: ProjectSpec;
  playing: boolean;
  restartToken: number;
  onFrameChange: (frame: number) => void;
}

export function CanvasPreview({project, playing, restartToken, onFrameChange}: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const lastTimestamp = useRef<number | null>(null);
  const projectRef = useRef(project);
  const playingRef = useRef(playing);
  const [ready, setReady] = useState(false);

  const draw = useCallback((frame: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', {alpha: false});
    if (!ctx) return;
    renderFrame(ctx, projectRef.current, frame);
    onFrameChange(frame);
  }, [onFrameChange]);

  useEffect(() => {
    projectRef.current = project;
    draw(frameRef.current);
  }, [draw, project]);
  useEffect(() => { playingRef.current = playing; }, [playing]);

  useEffect(() => {
    const {width, height} = dimensionsFor(project.aspectRatio, 'preview');
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    draw(frameRef.current);
    setReady(true);
  }, [project.aspectRatio, draw]);

  useEffect(() => {
    frameRef.current = 0;
    lastTimestamp.current = null;
    draw(0);
  }, [restartToken, project.templateId, project.seed, draw]);

  useEffect(() => {
    let animationFrame = 0;
    const tick = (timestamp: number) => {
      if (playingRef.current) {
        if (lastTimestamp.current === null) lastTimestamp.current = timestamp;
        const delta = Math.min(100, timestamp - lastTimestamp.current);
        lastTimestamp.current = timestamp;
        frameRef.current = (frameRef.current + delta / 1000 * projectRef.current.fps)
          % (projectRef.current.durationSeconds * projectRef.current.fps);
        draw(frameRef.current);
      } else {
        lastTimestamp.current = null;
      }
      animationFrame = requestAnimationFrame(tick);
    };
    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [draw]);

  return (
    <div className={`preview-wrap preview-${project.aspectRatio.replace(':', 'x')}`} data-ready={ready}>
      {!ready && <div className="preview-pending">正在加载字体</div>}
      <canvas
        ref={canvasRef}
        className="preview-canvas"
        role="img"
        aria-label={`“${project.text}”的动态文字预览`}
      />
    </div>
  );
}
