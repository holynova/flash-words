import {describe, expect, it} from 'vitest';
import {DEFAULT_PROJECT, dimensionsFor, normalizeProject, validateProject} from '../engine/project';

describe('project model', () => {
  it('normalizes unsafe imported values', () => {
    const project = normalizeProject({
      text: '',
      durationSeconds: 80,
      intensity: -2,
      aspectRatio: 'wrong',
      foreground: 'red',
    });
    expect(project.text).toBe('');
    expect(project.durationSeconds).toBe(12);
    expect(project.intensity).toBe(0.2);
    expect(project.aspectRatio).toBe('1:1');
    expect(project.foreground).toBe(DEFAULT_PROJECT.foreground);
  });

  it('returns production dimensions for both ratios', () => {
    expect(dimensionsFor('1:1', 'video')).toEqual({width: 1080, height: 1080});
    expect(dimensionsFor('9:16', 'video')).toEqual({width: 1080, height: 1920});
    expect(dimensionsFor('9:16', 'gif')).toEqual({width: 405, height: 720});
  });

  it('rejects identical foreground and background', () => {
    expect(validateProject({...DEFAULT_PROJECT, foreground: '#111111', background: '#111111'}))
      .toBe('文字和背景颜色不能相同');
  });

  it('preserves an empty draft so the editor can show validation', () => {
    const project = normalizeProject({...DEFAULT_PROJECT, text: ''});
    expect(project.text).toBe('');
    expect(validateProject(project)).toBe('请输入至少一个字符');
  });
});
