import {compositionTiming, type CompositionTiming} from '../engine/composition';
import {easeInOutQuart, easeOutQuint, tempoProgress} from '../engine/easing';
import {randomFor} from '../engine/random';
import {graphemes} from '../engine/segment';
import {createTimeline, sceneAtFrame, sceneProgress} from '../engine/timeline';
import type {ProjectSpec, TimelineScene} from '../engine/types';
import {FONT_STACKS} from './fonts';

interface FrameContext {
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  project: ProjectSpec;
  scene: TimelineScene;
  timing: CompositionTiming;
  frame: number;
  width: number;
  height: number;
  foreground: string;
  background: string;
}

interface TextStyle {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  alpha: number;
}

interface DrawOptions {
  x?: number;
  y?: number;
  maxWidth?: number;
  maxHeight?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  alpha?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
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
  size *= Math.min(1, maxWidth / Math.max(1, metrics.width), maxHeight / measuredHeight);
  return Math.max(8, size);
}

function drawCentered(frame: FrameContext, text: string, options: DrawOptions = {}) {
  const {ctx, project, width, height} = frame;
  const maxWidth = options.maxWidth ?? width * 0.88;
  const maxHeight = options.maxHeight ?? height * 0.62;
  const size = fitFontSize(ctx, project, text, maxWidth, maxHeight);
  ctx.save();
  ctx.translate(options.x ?? width / 2, options.y ?? height / 2);
  ctx.rotate(options.rotation ?? 0);
  ctx.scale(options.scaleX ?? 1, options.scaleY ?? options.scaleX ?? 1);
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

function resolvePalette(project: ProjectSpec, timing: CompositionTiming) {
  const {emphasis} = project.recipe;
  let inverted = emphasis === 'invert' && timing.emphasis > 0.18;
  if (emphasis === 'flash' && timing.emphasis > 0) {
    inverted = Math.floor(timing.emphasisPhase * 10) % 2 === 1;
  }
  return inverted
    ? {foreground: project.background, background: project.foreground}
    : {foreground: project.foreground, background: project.background};
}

function renderBackground(frame: FrameContext) {
  const {ctx, project, scene, width, height, foreground, timing} = frame;
  const chars = graphemes(scene.text).filter((item) => item.trim());
  switch (project.recipe.background) {
    case 'tiles': {
      const density = 6 + Math.round(project.intensity * 5);
      const cellWidth = width / density;
      const cellHeight = height / density;
      for (let row = -1; row <= density; row += 1) {
        for (let column = -1; column <= density; column += 1) {
          const index = Math.abs(row * density + column) % Math.max(1, chars.length);
          const offset = timing.progress * cellWidth * (row % 2 === 0 ? 1 : -1);
          drawCentered(frame, chars[index] ?? scene.text, {
            x: (column + 0.5) * cellWidth + offset % cellWidth,
            y: (row + 0.5) * cellHeight,
            maxWidth: cellWidth * 0.78,
            maxHeight: cellHeight * 0.72,
            alpha: 0.1 + project.intensity * 0.08,
          });
        }
      }
      break;
    }
    case 'grid': {
      ctx.save();
      ctx.strokeStyle = foreground;
      ctx.globalAlpha = 0.14;
      ctx.lineWidth = Math.max(1, width / 720);
      const divisions = 6;
      for (let index = 1; index < divisions; index += 1) {
        ctx.beginPath();
        ctx.moveTo(width * index / divisions, 0);
        ctx.lineTo(width * index / divisions, height);
        ctx.moveTo(0, height * index / divisions);
        ctx.lineTo(width, height * index / divisions);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 'tunnel': {
      for (let index = 7; index >= 0; index -= 1) {
        const local = (timing.progress + index / 8) % 1;
        drawCentered(frame, scene.text, {
          maxWidth: width * 0.62,
          maxHeight: height * 0.22,
          scaleX: 0.16 + easeInOutQuart(local) * 2.8,
          alpha: Math.sin(local * Math.PI) * 0.18,
          fill: frame.background,
          stroke: foreground,
          strokeWidth: width * 0.004,
        });
      }
      break;
    }
    case 'scanlines': {
      ctx.save();
      ctx.fillStyle = foreground;
      ctx.globalAlpha = 0.09;
      const gap = Math.max(6, Math.round(height / 80));
      const offset = Math.round(timing.progress * gap);
      for (let y = -gap; y < height + gap; y += gap) {
        ctx.fillRect(0, y + offset, width, Math.max(1, gap * 0.18));
      }
      ctx.restore();
      break;
    }
    case 'none':
      break;
  }
}

function resolveTextStyle(frame: FrameContext): TextStyle {
  const {project, timing, width, height, scene} = frame;
  const enter = easeOutQuint(timing.entrance);
  const leave = easeInOutQuart(timing.exit);
  const direction = randomFor(project.seed, `${scene.id}-direction`) > 0.5 ? 1 : -1;
  const style: TextStyle = {
    x: width / 2,
    y: height / 2,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    alpha: 1,
  };

  if (project.recipe.entrance === 'fly') style.x += direction * width * (1 - enter) * 0.95;
  if (project.recipe.entrance === 'zoom') {
    style.scaleX *= 0.18 + enter * 0.82;
    style.scaleY *= 0.18 + enter * 0.82;
    style.alpha *= enter;
  }

  const phase = timing.progress * Math.PI * 4;
  if (project.recipe.motion === 'elastic') {
    const stretch = Math.sin(phase) * 0.12 * project.intensity * timing.motion;
    style.scaleX *= 1 + stretch;
    style.scaleY *= 1 - stretch * 0.72;
  }
  if (project.recipe.motion === 'drift') {
    style.x += Math.sin(phase * 0.5) * width * 0.045 * project.intensity * timing.motion;
    style.y += Math.cos(phase * 0.42) * height * 0.035 * project.intensity * timing.motion;
    style.rotation += Math.sin(phase * 0.35) * 0.035 * project.intensity * timing.motion;
  }

  if (project.recipe.emphasis === 'pulse') {
    const amount = timing.emphasis * project.intensity * 0.28;
    style.scaleX *= 1 + amount;
    style.scaleY *= 1 + amount;
  }

  if (project.recipe.exit === 'shrink') {
    style.scaleX *= 1 - leave * 0.82;
    style.scaleY *= 1 - leave * 0.82;
    style.alpha *= 1 - leave;
  }
  if (project.recipe.exit === 'fade') style.alpha *= 1 - leave;
  if (project.recipe.exit === 'fly') {
    style.x -= direction * width * leave * 1.05;
    style.alpha *= 1 - leave * 0.35;
  }
  return style;
}

function renderWaveText(frame: FrameContext, style: TextStyle, text: string) {
  const {project, timing, width, height} = frame;
  const chars = graphemes(text).filter((item) => item.trim());
  const count = Math.max(1, chars.length);
  const cellWidth = Math.min(width * 0.18, width * 0.84 / count);
  const amplitude = height * (0.045 + project.intensity * 0.075) * timing.motion;
  chars.forEach((char, index) => {
    const phase = timing.progress * Math.PI * 4 - index * 0.68;
    drawCentered(frame, char, {
      x: style.x + (index - (count - 1) / 2) * cellWidth,
      y: style.y + Math.sin(phase) * amplitude,
      maxWidth: cellWidth * 0.9,
      maxHeight: height * 0.26,
      scaleX: style.scaleX,
      scaleY: style.scaleY,
      rotation: style.rotation + Math.cos(phase) * 0.06 * project.intensity,
      alpha: style.alpha,
    });
  });
}

function renderScatterText(frame: FrameContext, style: TextStyle, text: string) {
  const {project, timing, width, height} = frame;
  const chars = graphemes(text).filter((item) => item.trim());
  const count = Math.max(1, chars.length);
  const columns = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);
  const enterScatter = project.recipe.entrance === 'scatter' ? 1 - easeOutQuint(timing.entrance) : 0;
  const exitScatter = project.recipe.exit === 'scatter' ? easeInOutQuart(timing.exit) : 0;
  const amount = Math.max(enterScatter, exitScatter);
  chars.forEach((char, index) => {
    const targetX = style.x + ((index % columns) + 0.5) / columns * width * 0.78 - width * 0.39;
    const targetY = style.y + (Math.floor(index / columns) + 0.5) / rows * height * 0.58 - height * 0.29;
    const scatterX = width * (0.04 + randomFor(project.seed, `recipe-x-${index}`) * 0.92);
    const scatterY = height * (0.04 + randomFor(project.seed, `recipe-y-${index}`) * 0.92);
    drawCentered(frame, char, {
      x: targetX + (scatterX - targetX) * amount,
      y: targetY + (scatterY - targetY) * amount,
      maxWidth: width / columns * 0.64,
      maxHeight: height / rows * 0.52,
      scaleX: style.scaleX,
      scaleY: style.scaleY,
      rotation: style.rotation + amount * (randomFor(project.seed, `recipe-r-${index}`) - 0.5) * Math.PI,
      alpha: style.alpha * (1 - amount * 0.45),
    });
  });
}

function renderShutterText(frame: FrameContext, style: TextStyle, text: string) {
  const {ctx, project, timing, width, height} = frame;
  const bands = 8;
  const enterOffset = project.recipe.entrance === 'shutter' ? 1 - easeOutQuint(timing.entrance) : 0;
  const exitOffset = project.recipe.exit === 'shutter' ? easeInOutQuart(timing.exit) : 0;
  const amount = Math.max(enterOffset, exitOffset);
  for (let index = 0; index < bands; index += 1) {
    const direction = index % 2 === 0 ? -1 : 1;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, index * height / bands, width, height / bands + 1);
    ctx.clip();
    drawCentered(frame, text, {
      x: style.x + direction * width * amount,
      y: style.y,
      maxWidth: width * 0.9,
      maxHeight: height * 0.58,
      scaleX: style.scaleX,
      scaleY: style.scaleY,
      rotation: style.rotation,
      alpha: style.alpha,
    });
    ctx.restore();
  }
}

function renderGlitchText(frame: FrameContext, style: TextStyle, text: string) {
  const {ctx, project, timing, width, height} = frame;
  const bands = 10;
  const maxShift = width * 0.12 * timing.emphasis * project.intensity;
  for (let index = 0; index < bands; index += 1) {
    const top = index * height / bands;
    const shift = (randomFor(project.seed + Math.floor(timing.emphasisPhase * 20), `mix-glitch-${index}`) - 0.5) * maxShift;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, top, width, height / bands + 1);
    ctx.clip();
    drawCentered(frame, text, {
      x: style.x + shift,
      y: style.y,
      maxWidth: width * 0.9,
      maxHeight: height * 0.58,
      scaleX: style.scaleX,
      scaleY: style.scaleY,
      rotation: style.rotation,
      alpha: style.alpha,
    });
    ctx.restore();
  }
}

function renderTunnelText(frame: FrameContext, style: TextStyle, text: string) {
  const {timing, width, height, foreground} = frame;
  for (let index = 6; index >= 0; index -= 1) {
    const local = (timing.progress + index / 7) % 1;
    drawCentered(frame, text, {
      x: style.x,
      y: style.y,
      maxWidth: width * 0.72,
      maxHeight: height * 0.25,
      scaleX: style.scaleX * (0.14 + easeInOutQuart(local) * 2.6),
      scaleY: style.scaleY * (0.14 + easeInOutQuart(local) * 2.6),
      rotation: style.rotation + (index % 2 === 0 ? -1 : 1) * 0.025,
      alpha: style.alpha * Math.sin(local * Math.PI) * 0.72 * timing.motion,
      fill: index % 2 === 0 ? frame.background : foreground,
      stroke: foreground,
      strokeWidth: width * 0.004,
    });
  }
}

function renderForeground(frame: FrameContext) {
  const {project, scene, timing, width, height} = frame;
  const style = resolveTextStyle(frame);
  const allCharacters = graphemes(scene.text);
  const visibleCount = project.recipe.entrance === 'typewriter'
    ? Math.ceil(allCharacters.length * easeOutQuint(timing.entrance))
    : allCharacters.length;
  const text = allCharacters.slice(0, visibleCount).join('');
  const displayText = project.recipe.entrance === 'typewriter' && timing.entrance < 1
    ? `${text}${Math.floor(timing.progress * 16) % 2 === 0 ? '▌' : ' '}`
    : text;

  if (project.recipe.emphasis === 'glitch' && timing.emphasis > 0.04) {
    renderGlitchText(frame, style, displayText);
  } else if (
    (project.recipe.entrance === 'shutter' && timing.entrance < 1)
    || (project.recipe.exit === 'shutter' && timing.exit > 0)
  ) {
    renderShutterText(frame, style, displayText);
  } else if (
    (project.recipe.entrance === 'scatter' && timing.entrance < 1)
    || (project.recipe.exit === 'scatter' && timing.exit > 0)
  ) {
    renderScatterText(frame, style, displayText);
  } else if (project.recipe.motion === 'wave' && timing.motion > 0.01) {
    renderWaveText(frame, style, displayText);
  } else if (project.recipe.motion === 'tunnel' && timing.motion > 0.01) {
    renderTunnelText(frame, style, displayText);
  } else {
    drawCentered(frame, displayText, {
      x: style.x,
      y: style.y,
      maxWidth: width * 0.9,
      maxHeight: height * 0.58,
      scaleX: style.scaleX,
      scaleY: style.scaleY,
      rotation: style.rotation,
      alpha: style.alpha,
    });
  }
}

function drawRegistration(frame: FrameContext) {
  const {ctx, project, width, height, foreground} = frame;
  const label = `${project.recipe.entrance} / ${project.recipe.motion} / ${project.recipe.emphasis}`;
  ctx.save();
  ctx.fillStyle = foreground;
  ctx.globalAlpha = 0.52;
  ctx.font = `700 ${Math.max(10, width * 0.016)}px ${FONT_STACKS[project.fontId]}`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText(label.toUpperCase(), width * 0.035, height * 0.03);
  ctx.textAlign = 'right';
  ctx.fillText(String(frame.frame).padStart(4, '0'), width * 0.965, height * 0.03);
  ctx.restore();
}

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
  const progress = tempoProgress(sceneProgress(scene, frame), project.speed);
  const timing = compositionTiming(progress);
  const palette = resolvePalette(project, timing);
  const frameContext: FrameContext = {
    ctx,
    project,
    scene,
    timing,
    frame,
    width,
    height,
    foreground: palette.foreground,
    background: palette.background,
  };

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, width, height);
  renderBackground(frameContext);
  renderForeground(frameContext);
  drawRegistration(frameContext);
  ctx.restore();
}
