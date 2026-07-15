import {easeInOutQuart, easeOutQuint, pulse, tempoProgress} from '../engine/easing';
import {randomFor} from '../engine/random';
import {graphemes} from '../engine/segment';
import {createTimeline, sceneAtFrame, sceneProgress} from '../engine/timeline';
import type {ProjectSpec, TemplateId, TimelineScene} from '../engine/types';
import {FONT_STACKS} from './fonts';

interface FrameContext {
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  project: ProjectSpec;
  scene: TimelineScene;
  progress: number;
  frame: number;
  width: number;
  height: number;
  foreground: string;
  background: string;
}

function fontString(project: ProjectSpec, size: number) {
  const weight = project.fontId === 'noto-serif' ? 800 : 900;
  return `${weight} ${Math.max(1, size)}px ${FONT_STACKS[project.fontId]}`;
}

function fitFontSize(
  ctx: FrameContext['ctx'],
  project: ProjectSpec,
  text: string,
  maxWidth: number,
  maxHeight: number,
) {
  let size = maxHeight;
  ctx.font = fontString(project, size);
  const metrics = ctx.measureText(text);
  const measuredHeight = Math.max(1, metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent);
  const widthScale = maxWidth / Math.max(1, metrics.width);
  const heightScale = maxHeight / measuredHeight;
  size *= Math.min(1, widthScale, heightScale);
  return Math.max(8, size);
}

function drawCentered(
  frame: FrameContext,
  text: string,
  options: {
    x?: number;
    y?: number;
    maxWidth?: number;
    maxHeight?: number;
    scale?: number;
    rotation?: number;
    alpha?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  } = {},
) {
  const {ctx, project, width, height} = frame;
  const x = options.x ?? width / 2;
  const y = options.y ?? height / 2;
  const maxWidth = options.maxWidth ?? width * 0.88;
  const maxHeight = options.maxHeight ?? height * 0.76;
  const size = fitFontSize(ctx, project, text, maxWidth, maxHeight);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(options.rotation ?? 0);
  ctx.scale(options.scale ?? 1, options.scale ?? 1);
  ctx.globalAlpha = options.alpha ?? 1;
  ctx.font = fontString(project, size);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (options.stroke) {
    ctx.strokeStyle = options.stroke;
    ctx.lineWidth = options.strokeWidth ?? Math.max(2, size * 0.018);
    ctx.strokeText(text, 0, 0);
  }
  ctx.fillStyle = options.fill ?? frame.foreground;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawRegistration(frame: FrameContext, label: string) {
  const {ctx, width, height, foreground, project} = frame;
  ctx.save();
  ctx.fillStyle = foreground;
  ctx.globalAlpha = 0.55;
  ctx.font = `700 ${Math.max(10, width * 0.018)}px ${FONT_STACKS[project.fontId]}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(label.toUpperCase(), width * 0.035, height * 0.03);
  ctx.textAlign = 'right';
  ctx.fillText(String(frame.frame).padStart(4, '0'), width * 0.965, height * 0.03);
  ctx.restore();
}

function renderBoldCuts(frame: FrameContext) {
  const {scene, progress, width, height, project} = frame;
  if (scene.kind === 'climax') {
    const chars = graphemes(scene.text).filter((item) => item.trim());
    const density = 3 + Math.round(project.intensity * 5);
    for (let row = 0; row < density; row += 1) {
      for (let column = 0; column < density; column += 1) {
        const index = (row * density + column) % Math.max(1, chars.length);
        drawCentered(frame, chars[index] ?? scene.text, {
          x: ((column + 0.5) / density) * width,
          y: ((row + 0.5) / density) * height,
          maxWidth: width / density * 0.84,
          maxHeight: height / density * 0.82,
          rotation: (randomFor(project.seed, `cut-${index}`) - 0.5) * 0.14,
        });
      }
    }
    return;
  }

  if (scene.kind === 'resolve') {
    const enter = easeOutQuint(Math.min(1, progress * 2.4));
    drawCentered(frame, scene.text, {
      x: width * (1.16 - 0.66 * enter),
      maxWidth: width * 1.12,
      maxHeight: height * 0.42,
      scale: 0.82 + 0.18 * enter,
    });
    return;
  }

  const direction = randomFor(project.seed, scene.id) > 0.5 ? 1 : -1;
  const enter = easeOutQuint(Math.min(1, progress * 3.2));
  const holdScale = 1 + pulse(progress) * project.intensity * 0.11;
  const rotation = (randomFor(project.seed, `${scene.id}-rot`) - 0.5) * 0.16 * project.intensity;
  drawCentered(frame, scene.text, {
    x: width / 2 + direction * width * (1 - enter) * 0.9,
    maxWidth: width * (0.9 + project.intensity * 0.35),
    maxHeight: height * 0.82,
    scale: holdScale,
    rotation,
  });
  drawRegistration(frame, 'FW / hard cut');
}

function renderFlyGrid(frame: FrameContext) {
  const {ctx, scene, progress, width, height, project, foreground} = frame;
  const chars = graphemes(scene.text).filter((item) => item.trim());
  const count = Math.max(1, chars.length);
  ctx.save();
  ctx.strokeStyle = foreground;
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = Math.max(1, width / 540);
  for (let index = 1; index < 4; index += 1) {
    ctx.beginPath();
    ctx.moveTo((width * index) / 4, 0);
    ctx.lineTo((width * index) / 4, height);
    ctx.moveTo(0, (height * index) / 4);
    ctx.lineTo(width, (height * index) / 4);
    ctx.stroke();
  }
  ctx.restore();

  chars.forEach((char, index) => {
    const targetX = ((index % 3) + 0.5) / 3 * width;
    const targetY = (Math.floor(index / 3) + 0.5) / Math.ceil(count / 3) * height;
    const side = index % 4;
    const startX = side === 0 ? -width * 0.3 : side === 1 ? width * 1.3 : targetX;
    const startY = side === 2 ? -height * 0.3 : side === 3 ? height * 1.3 : targetY;
    const stagger = Math.max(0, Math.min(1, progress * 1.8 - index * 0.08));
    const move = easeOutQuint(stagger);
    drawCentered(frame, char, {
      x: startX + (targetX - startX) * move,
      y: startY + (targetY - startY) * move,
      maxWidth: width * 0.27,
      maxHeight: height / Math.ceil(count / 3) * 0.72,
      rotation: (1 - move) * (randomFor(project.seed, `fly-${index}`) - 0.5),
    });
  });
}

function renderElasticType(frame: FrameContext) {
  const {ctx, scene, progress, width, height, project} = frame;
  const enter = easeOutQuint(Math.min(1, progress * 2.2));
  const wave = Math.sin(progress * Math.PI * 4) * (1 - progress) * project.intensity;
  const stretchX = 0.35 + enter * 0.65 + wave * 0.18;
  const stretchY = 1.7 - enter * 0.7 - wave * 0.12;
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(stretchX, stretchY);
  drawCentered({...frame, width, height}, scene.text, {
    x: 0,
    y: 0,
    maxWidth: width * 0.92,
    maxHeight: height * 0.65,
  });
  ctx.restore();
  drawCentered(frame, scene.text, {
    y: height * 0.9,
    maxWidth: width * 0.72,
    maxHeight: height * 0.06,
    alpha: 0.55,
  });
}

function renderTunnelZoom(frame: FrameContext) {
  const {scene, progress, width, height, project, foreground} = frame;
  const loops = 7;
  for (let index = loops - 1; index >= 0; index -= 1) {
    const local = (progress + index / loops) % 1;
    const scale = 0.12 + easeInOutQuart(local) * 2.8;
    drawCentered(frame, scene.text, {
      maxWidth: width * 0.75,
      maxHeight: height * 0.28,
      scale,
      alpha: Math.sin(local * Math.PI) * 0.68,
      fill: index % 2 ? frame.background : foreground,
      stroke: foreground,
      strokeWidth: width * 0.005,
      rotation: (index % 2 ? -1 : 1) * 0.035 * project.intensity,
    });
  }
}

function renderFlashInvert(frame: FrameContext) {
  const {ctx, scene, progress, width, height, project} = frame;
  const flashes = Math.floor(progress * (5 + project.intensity * 9));
  const inverted = flashes % 2 === 1;
  ctx.fillStyle = inverted ? frame.foreground : frame.background;
  ctx.fillRect(0, 0, width, height);
  const fill = inverted ? frame.background : frame.foreground;
  const reveal = Math.min(1, progress * 2.8);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width * easeOutQuint(reveal), height);
  ctx.clip();
  drawCentered(frame, scene.text, {
    maxWidth: width * 0.9,
    maxHeight: height * 0.62,
    fill,
    scale: 0.78 + pulse(progress) * 0.3,
  });
  ctx.restore();
  ctx.fillStyle = fill;
  for (let index = 0; index < 5; index += 1) {
    const barWidth = width * randomFor(project.seed, `bar-${index}`) * 0.34;
    ctx.fillRect(0, (height * index) / 5, barWidth * pulse(progress), height * 0.015);
  }
}

function renderTileStorm(frame: FrameContext) {
  const {scene, progress, width, height, project} = frame;
  const chars = graphemes(scene.text).filter((item) => item.trim());
  const density = 4 + Math.round(project.intensity * 8);
  const cellW = width / density;
  const cellH = height / density;
  for (let row = -1; row <= density; row += 1) {
    for (let column = -1; column <= density; column += 1) {
      const index = Math.abs(row * density + column) % Math.max(1, chars.length);
      const offset = (progress * cellW * (row % 2 ? -1 : 1)) % cellW;
      drawCentered(frame, chars[index] ?? scene.text, {
        x: (column + 0.5) * cellW + offset,
        y: (row + 0.5) * cellH,
        maxWidth: cellW * 0.82,
        maxHeight: cellH * 0.8,
        rotation: (randomFor(project.seed, `tile-${index}`) - 0.5) * 0.12,
      });
    }
  }
  if (scene.kind === 'resolve') {
    drawCentered(frame, scene.text, {
      maxWidth: width * 0.88,
      maxHeight: height * 0.42,
      fill: frame.background,
      stroke: frame.foreground,
      strokeWidth: width * 0.012,
      scale: 0.8 + easeOutQuint(progress) * 0.2,
    });
  }
}

function renderGlitchSlice(frame: FrameContext) {
  const {ctx, scene, progress, width, height, project, foreground} = frame;
  const bands = 11;
  const maxShift = width * 0.13 * project.intensity;
  for (let index = 0; index < bands; index += 1) {
    const top = (height / bands) * index;
    const bandHeight = height / bands + 1;
    const shift = (randomFor(project.seed + Math.floor(progress * 12), `slice-${index}`) - 0.5) * maxShift;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, top, width, bandHeight);
    ctx.clip();
    drawCentered(frame, scene.text, {
      x: width / 2 + shift,
      maxWidth: width * 0.94,
      maxHeight: height * 0.62,
      rotation: (randomFor(project.seed, `grot-${index}`) - 0.5) * 0.035,
    });
    ctx.restore();
  }
  ctx.save();
  ctx.globalCompositeOperation = 'difference';
  ctx.fillStyle = foreground;
  const lineY = (progress * height * 1.2) % height;
  ctx.fillRect(0, lineY, width, Math.max(2, height * 0.012));
  ctx.restore();
}

function renderScatterAssemble(frame: FrameContext) {
  const {scene, progress, width, height, project} = frame;
  const chars = graphemes(scene.text).filter((item) => item.trim());
  const count = Math.max(1, chars.length);
  const columns = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);
  const assemble = progress < 0.72
    ? easeOutQuint(progress / 0.72)
    : 1 - easeInOutQuart((progress - 0.72) / 0.28);

  chars.forEach((char, index) => {
    const targetX = ((index % columns) + 0.5) / columns * width;
    const targetY = (Math.floor(index / columns) + 0.5) / rows * height;
    const angle = randomFor(project.seed, `angle-${index}`) * Math.PI * 2;
    const scatterX = width * (0.08 + randomFor(project.seed, `scatter-x-${index}`) * 0.84);
    const scatterY = height * (0.08 + randomFor(project.seed, `scatter-y-${index}`) * 0.84);
    drawCentered(frame, char, {
      x: scatterX + (targetX - scatterX) * assemble,
      y: scatterY + (targetY - scatterY) * assemble,
      maxWidth: width / columns * 0.82,
      maxHeight: height / rows * 0.78,
      rotation: (1 - assemble) * angle,
      alpha: 0.35 + assemble * 0.65,
    });
  });
}

function renderWaveFlow(frame: FrameContext) {
  const {scene, progress, width, height, project} = frame;
  const chars = graphemes(scene.text).filter((item) => item.trim());
  const count = Math.max(1, chars.length);
  const cellWidth = Math.min(width * 0.18, width * 0.86 / count);
  const amplitude = height * (0.07 + project.intensity * 0.09);
  chars.forEach((char, index) => {
    const phase = progress * Math.PI * 4 - index * 0.72;
    const enter = easeOutQuint(Math.max(0, Math.min(1, progress * 2.4 - index * 0.035)));
    drawCentered(frame, char, {
      x: width / 2 + (index - (count - 1) / 2) * cellWidth,
      y: height / 2 + Math.sin(phase) * amplitude,
      maxWidth: cellWidth * 0.88,
      maxHeight: height * 0.28,
      scale: 0.55 + enter * 0.45,
      rotation: Math.cos(phase) * 0.08 * project.intensity,
      alpha: 0.2 + enter * 0.8,
    });
  });
  drawRegistration(frame, 'FW / wave flow');
}

function renderTypewriter(frame: FrameContext) {
  const {ctx, scene, progress, width, height, foreground, project} = frame;
  const chars = graphemes(scene.text);
  const forwardProgress = progress < 0.78 ? progress / 0.78 : 1 - (progress - 0.78) / 0.22;
  const visible = Math.max(0, Math.min(chars.length, Math.ceil(forwardProgress * chars.length)));
  const typed = chars.slice(0, visible).join('');
  const cursorVisible = Math.floor(progress * 12) % 2 === 0;
  drawCentered(frame, `${typed}${cursorVisible ? '▌' : ' '}`, {
    maxWidth: width * 0.84,
    maxHeight: height * 0.4,
  });
  ctx.save();
  ctx.fillStyle = foreground;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(width * 0.08, height * 0.73, width * 0.84 * forwardProgress, Math.max(2, height * 0.006));
  ctx.font = `700 ${Math.max(10, width * 0.018)}px ${FONT_STACKS[project.fontId]}`;
  ctx.textAlign = 'left';
  ctx.fillText(`${String(visible).padStart(2, '0')} / ${String(chars.length).padStart(2, '0')}`, width * 0.08, height * 0.79);
  ctx.restore();
}

function renderShutterReveal(frame: FrameContext) {
  const {ctx, scene, progress, width, height, project} = frame;
  const bands = 8;
  const reveal = easeOutQuint(Math.min(1, progress * 1.8));
  for (let index = 0; index < bands; index += 1) {
    const bandHeight = height / bands + 1;
    const top = index * height / bands;
    const direction = index % 2 === 0 ? -1 : 1;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, top, width, bandHeight);
    ctx.clip();
    drawCentered(frame, scene.text, {
      x: width / 2 + direction * width * (1 - reveal),
      maxWidth: width * (0.86 + project.intensity * 0.16),
      maxHeight: height * 0.58,
    });
    ctx.restore();
  }
  drawRegistration(frame, 'FW / shutter reveal');
}

const TEMPLATE_RENDERERS: Record<TemplateId, (frame: FrameContext) => void> = {
  'bold-cuts': renderBoldCuts,
  'fly-grid': renderFlyGrid,
  'elastic-type': renderElasticType,
  'tunnel-zoom': renderTunnelZoom,
  'flash-invert': renderFlashInvert,
  'tile-storm': renderTileStorm,
  'glitch-slice': renderGlitchSlice,
  'scatter-assemble': renderScatterAssemble,
  'wave-flow': renderWaveFlow,
  typewriter: renderTypewriter,
  'shutter-reveal': renderShutterReveal,
};

export function renderFrame(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  project: ProjectSpec,
  frameNumber: number,
) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const timeline = createTimeline(project);
  const frame = ((Math.floor(frameNumber) % timeline.totalFrames) + timeline.totalFrames) % timeline.totalFrames;
  const scene = sceneAtFrame(timeline, frame);
  const linearProgress = sceneProgress(scene, frame);
  const progress = tempoProgress(linearProgress, project.speed);
  const frameContext: FrameContext = {
    ctx,
    project,
    scene,
    progress,
    frame,
    width,
    height,
    foreground: project.foreground,
    background: project.background,
  };

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = project.background;
  ctx.fillRect(0, 0, width, height);

  TEMPLATE_RENDERERS[project.templateId](frameContext);
  ctx.restore();
}
