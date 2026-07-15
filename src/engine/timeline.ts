import {graphemes, words} from './segment';
import type {ProjectSpec, Timeline, TimelineScene} from './types';

function sceneText(project: ProjectSpec): string[] {
  const wordSegments = words(project.text);
  const characterSegments = graphemes(project.text).filter((item) => item.trim());
  if (wordSegments.length > 1 && wordSegments.length <= 10) return wordSegments;
  if (characterSegments.length <= 10) return characterSegments;

  const chunkSize = Math.ceil(characterSegments.length / 8);
  const chunks: string[] = [];
  for (let index = 0; index < characterSegments.length; index += chunkSize) {
    chunks.push(characterSegments.slice(index, index + chunkSize).join(''));
  }
  return chunks;
}

export function createTimeline(project: ProjectSpec): Timeline {
  const totalFrames = Math.round(project.durationSeconds * project.fps);
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
