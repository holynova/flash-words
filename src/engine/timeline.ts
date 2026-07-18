import {graphemes, words} from './segment';
import type {ProjectSpec, Timeline, TimelineScene} from './types';

const CONTINUOUS_MOTIONS = new Set<ProjectSpec['recipe']['motion']>([
  'marquee',
  'marquee-lines',
  'multiply',
]);

function sceneText(project: ProjectSpec): string[] {
  const characterSegments = graphemes(project.text).filter((item) => item.trim());
  if (project.segmentationMode === 'character') return characterSegments;
  const wordSegments = words(project.text);
  return wordSegments.length > 0 ? wordSegments : characterSegments;
}

export function createTimeline(project: ProjectSpec): Timeline {
  const totalFrames = Math.round(project.durationSeconds * project.fps);
  if (CONTINUOUS_MOTIONS.has(project.recipe.motion)) {
    return {
      totalFrames,
      scenes: [{
        id: `continuous-${project.recipe.motion}`,
        kind: 'climax',
        text: project.text,
        startFrame: 0,
        endFrame: totalFrames,
        emphasis: 1,
      }],
    };
  }
  const tokens = sceneText(project);
  const mainFrames = Math.round(totalFrames * 0.72);
  const climaxFrames = Math.round(totalFrames * 0.18);
  const framePerToken = mainFrames / Math.max(1, tokens.length);
  const scenes: TimelineScene[] = tokens.map((text, index) => ({
    id: `focus-${index}`,
    kind: index % 3 === 2 ? 'phrase' : 'focus',
    text,
    startFrame: Math.round(index * framePerToken),
    endFrame: Math.round((index + 1) * framePerToken),
    emphasis: index % 3 === 0 ? 1 : 0.75,
  }));

  scenes.push({
    id: 'climax',
    kind: 'climax',
    text: project.text,
    startFrame: mainFrames,
    endFrame: mainFrames + climaxFrames,
    emphasis: 1,
  });
  scenes.push({
    id: 'resolve',
    kind: 'resolve',
    text: project.text,
    startFrame: mainFrames + climaxFrames,
    endFrame: totalFrames,
    emphasis: 0.88,
  });

  return {totalFrames, scenes};
}

export function sceneAtFrame(timeline: Timeline, frame: number) {
  const wrappedFrame = ((frame % timeline.totalFrames) + timeline.totalFrames) % timeline.totalFrames;
  return timeline.scenes.find(
    (scene) => wrappedFrame >= scene.startFrame && wrappedFrame < scene.endFrame,
  ) ?? timeline.scenes[timeline.scenes.length - 1];
}

export function sceneProgress(scene: TimelineScene, frame: number) {
  const length = Math.max(1, scene.endFrame - scene.startFrame);
  return Math.min(1, Math.max(0, (frame - scene.startFrame) / length));
}
