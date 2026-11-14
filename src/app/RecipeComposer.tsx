import {Sparkles} from 'lucide-react';
import type {CompositionMode, MotionRecipe} from '../engine/types';
import {effectName, primaryEffectName, RECIPE_FIELDS} from './recipe-meta';

interface RecipeComposerProps {
  recipe: MotionRecipe;
  compositionMode: CompositionMode;
  autoDirector: boolean;
  onModeChange: (mode: CompositionMode) => void;
  onToggleAuto: () => void;
  onChange: (key: keyof MotionRecipe, value: string) => void;
}

export function RecipeComposer({
  recipe,
  compositionMode,
  autoDirector,
  onModeChange,
  onToggleAuto,
  onChange,
}: RecipeComposerProps) {
  const isCombined = compositionMode === 'combined';

  return (
    <div className="recipe-composer">
      <div className="recipe-heading">
        <div>
          <h3>动效模式</h3>
        </div>
        {isCombined && (
          <button
            type="button"
            className={`director-switch ${autoDirector ? 'is-active' : ''}`}
            aria-pressed={autoDirector}
            onClick={onToggleAuto}
          >
            <Sparkles size={14} aria-hidden="true" />
            {autoDirector ? '自动导演' : '手动编排'}
          </button>
        )}
      </div>

      <div className="recipe-mode-switch" role="group" aria-label="动效模式">
        <button
          type="button"
          className={isCombined ? 'is-active' : ''}
          aria-pressed={isCombined}
          onClick={() => onModeChange('combined')}
        >
          组合配方
        </button>
        <button
          type="button"
          className={!isCombined ? 'is-active' : ''}
          aria-pressed={!isCombined}
          onClick={() => onModeChange('single')}
        >
          单一特效
        </button>
      </div>

      {isCombined ? (
        <>
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
            {autoDirector ? '根据文字长度和当前预设自动安排，修改任一效果即进入手动编排。' : '五个效果独立组合，换一版会生成新的组合。'}
          </p>
        </>
      ) : (
        <div className="single-effect-summary" aria-live="polite">
          <span>当前核心效果</span>
          <strong>{primaryEffectName(recipe)}</strong>
          <p>只启用一个动作。选择上方预设，即可切换核心效果。</p>
        </div>
      )}
    </div>
  );
}
