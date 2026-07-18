import {useCallback, useEffect, useState} from 'react';
import {DEFAULT_PROJECT, normalizeProject} from '../engine/project';
import {directRecipe, randomRecipe} from '../engine/recipes';
import {nextSeed} from '../engine/random';
import {TEMPLATE_IDS, type ProjectSpec} from '../engine/types';

const STORAGE_KEY = 'flash-words/project-v1';
const PALETTES = [
  {foreground: '#f5f1e8', background: '#0d0d0c'},
  {foreground: '#11110f', background: '#d9ff43'},
  {foreground: '#ffefe0', background: '#d52b1e'},
  {foreground: '#10110f', background: '#f2a7c8'},
  {foreground: '#ece7dc', background: '#173f35'},
  {foreground: '#fff8de', background: '#263da8'},
];

function loadInitialProject() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeProject(JSON.parse(stored)) : structuredClone(DEFAULT_PROJECT);
  } catch {
    return structuredClone(DEFAULT_PROJECT);
  }
}

export function useProject() {
  const [project, setProject] = useState<ProjectSpec>(loadInitialProject);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch {
      // Editing and export still work when storage is blocked or full.
    }
  }, [project]);

  const updateProject = useCallback((patch: Partial<ProjectSpec>) => {
    setProject((current) => {
      const merged = normalizeProject({...current, ...patch});
      const shouldDirect = merged.autoDirector
        && !patch.recipe
        && (patch.text !== undefined || patch.templateId !== undefined || patch.autoDirector === true);
      return shouldDirect
        ? normalizeProject({...merged, recipe: directRecipe(merged.templateId, merged.text, merged.seed)})
        : merged;
    });
  }, []);

  const randomize = useCallback(() => {
    setProject((current) => {
      const seed = nextSeed();
      const templateId = current.locks.template
        ? current.templateId
        : TEMPLATE_IDS[seed % TEMPLATE_IDS.length];
      const palette = current.locks.palette
        ? {foreground: current.foreground, background: current.background}
        : PALETTES[(seed >>> 4) % PALETTES.length];
      const recipe = current.locks.template
        ? current.recipe
        : current.autoDirector
          ? directRecipe(templateId, current.text, seed)
          : randomRecipe(seed);
      return normalizeProject({
        ...current,
        ...palette,
        templateId,
        recipe,
        seed: current.locks.layout ? current.seed : seed,
      });
    });
  }, []);

  const reset = useCallback(() => setProject(structuredClone(DEFAULT_PROJECT)), []);

  return {project, setProject, updateProject, randomize, reset};
}
