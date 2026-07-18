import {Sparkles} from 'lucide-react';
import type {MotionRecipe} from '../engine/types';
import {effectName, RECIPE_FIELDS} from './recipe-meta';

interface RecipeComposerProps {
  recipe: MotionRecipe;
  autoDirector: boolean;
  onToggleAuto: () => void;
  onChange: (key: keyof MotionRecipe, value: string) => void;
}

export function RecipeComposer({recipe, autoDirector, onToggleAuto, onChange}: RecipeComposerProps) {
  return (
    <div className="recipe-composer">
      <div className="recipe-heading">
        <div>
          <span>COMPOSITION</span>
          <h3>组合配方</h3>
        </div>
        <button
          type="button"
          className={`director-switch ${autoDirector ? 'is-active' : ''}`}
          aria-pressed={autoDirector}
          onClick={onToggleAuto}
        >
          <Sparkles size={14} aria-hidden="true" />
          {autoDirector ? '自动导演' : '手动编排'}
        </button>
      </div>

      <div className="recipe-slots">
        {RECIPE_FIELDS.map((field) => (
          <label className="recipe-slot" key={field.key}>
            <span><small>{field.index}</small>{field.label}</span>
            <select
              aria-label={`${field.label}效果`}
              value={recipe[field.key]}
              onChange={(event) => onChange(field.key, event.target.value)}
            >
              {field.options.map((effect) => (
                <option value={effect} key={effect}>{effectName(effect)}</option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <p className="recipe-note">
        {autoDirector ? '根据文字长度和当前预设自动安排，修改任一槽位即进入手动编排。' : '五个槽位独立组合，换一版会生成新的组合。'}
      </p>
    </div>
  );
}
