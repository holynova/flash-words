import {describe, expect, it} from 'vitest';
import {DEFAULT_PROJECT} from '../engine/project';
import {createTimeline, sceneAtFrame} from '../engine/timeline';

describe('auto director timeline', () => {
  it('covers every frame without gaps', () => {
    const timeline = createTimeline(DEFAULT_PROJECT);
    expect(timeline.scenes[0].startFrame).toBe(0);
    expect(timeline.scenes.at(-1)?.endFrame).toBe(timeline.totalFrames);
    for (let index = 1; index < timeline.scenes.length; index += 1) {
      expect(timeline.scenes[index].startFrame).toBe(timeline.scenes[index - 1].endFrame);
    }
    for (let frame = 0; frame < timeline.totalFrames; frame += 1) {
      expect(sceneAtFrame(timeline, frame)).toBeDefined();
    }
  });

  it('wraps frames for looped playback', () => {
    const timeline = createTimeline(DEFAULT_PROJECT);
    expect(sceneAtFrame(timeline, timeline.totalFrames).id).toBe(timeline.scenes[0].id);
  });

  it('switches between word and character output without dropping content', () => {
    const text = '动态文字让每一个关键词拥有自己的节奏 Motion belongs to every word';
    const wordTimeline = createTimeline({...DEFAULT_PROJECT, text, segmentationMode: 'word'});
    const characterTimeline = createTimeline({...DEFAULT_PROJECT, text, segmentationMode: 'character'});
    const wordScenes = wordTimeline.scenes.filter((scene) => scene.kind === 'focus' || scene.kind === 'phrase');
    const characterScenes = characterTimeline.scenes.filter(
      (scene) => scene.kind === 'focus' || scene.kind === 'phrase',
    );
    const focusText = characterScenes
      .filter((scene) => scene.kind === 'focus' || scene.kind === 'phrase')
      .map((scene) => scene.text)
      .join('')
      .replace(/\s+/gu, '');
    expect(focusText).toBe(text.replace(/\s+/gu, ''));
    expect(characterScenes.every((scene) => [...scene.text].length === 1)).toBe(true);
    expect(wordScenes.length).toBeLessThan(characterScenes.length);
  });

  it.each(['marquee', 'marquee-lines', 'multiply'] as const)(
    'keeps %s motion continuous across the full video',
    (motion) => {
      const project = {
        ...DEFAULT_PROJECT,
        recipe: {...DEFAULT_PROJECT.recipe, motion},
      };
      const timeline = createTimeline(project);
      expect(timeline.scenes).toHaveLength(1);
      expect(timeline.scenes[0]).toMatchObject({
        text: DEFAULT_PROJECT.text,
        startFrame: 0,
        endFrame: timeline.totalFrames,
      });
    },
  );
});
