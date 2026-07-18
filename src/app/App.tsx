import {useCallback, useMemo, useRef, useState} from 'react';
import {
  Download,
  FileDown,
  Film,
  Image as ImageIcon,
  Lock,
  Pause,
  Play,
  RefreshCcw,
  RotateCcw,
  Shuffle,
  Smartphone,
  Square,
  Upload,
  X,
} from 'lucide-react';
import {clampText, visibleCharacterCount} from '../engine/segment';
import {normalizeProject, validateProject} from '../engine/project';
import type {ExportProgress, MotionRecipe, ProjectLocks, ProjectSpec} from '../engine/types';
import {downloadBlob, safeFilename} from '../exporters/download';
import {exportGif} from '../exporters/gif';
import {exportVideo} from '../exporters/video';
import {CanvasPreview} from './CanvasPreview';
import {recipeSummary} from './recipe-meta';
import {RecipeComposer} from './RecipeComposer';
import {TEMPLATES} from './template-meta';
import {useProject} from './use-project';

type ExportKind = 'video' | 'gif';

const FONT_OPTIONS: Array<{id: ProjectSpec['fontId']; name: string}> = [
  {id: 'noto-sans', name: '思源黑体'},
  {id: 'noto-serif', name: '思源宋体'},
  {id: 'archivo-black', name: 'Archivo 海报体'},
];

export function App() {
  const {project, setProject, updateProject, randomize, reset} = useProject();
  const [playing, setPlaying] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [restartToken, setRestartToken] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [exportKind, setExportKind] = useState<ExportKind | null>(null);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [notice, setNotice] = useState('项目会自动保存在这台设备上');
  const importRef = useRef<HTMLInputElement>(null);
  const exportAbort = useRef<AbortController | null>(null);

  const totalFrames = project.durationSeconds * project.fps;
  const validationError = validateProject(project);
  const activeTemplate = useMemo(
    () => TEMPLATES.find((item) => item.id === project.templateId) ?? TEMPLATES[0],
    [project.templateId],
  );

  const restart = useCallback(() => {
    setRestartToken((value) => value + 1);
    setCurrentFrame(0);
    setPlaying(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const setTemplate = (templateId: ProjectSpec['templateId']) => {
    updateProject({templateId, autoDirector: true});
    restart();
  };

  const toggleAutoDirector = () => {
    updateProject({autoDirector: !project.autoDirector});
    restart();
  };

  const setRecipeEffect = (key: keyof MotionRecipe, value: string) => {
    updateProject({
      autoDirector: false,
      recipe: {...project.recipe, [key]: value} as MotionRecipe,
    });
    restart();
  };

  const toggleLock = (key: keyof ProjectLocks) => {
    updateProject({locks: {...project.locks, [key]: !project.locks[key]}});
  };

  const handleRandomize = () => {
    randomize();
    restart();
    setNotice('已生成新版本，锁定项保持不变');
  };

  const runExport = async (kind: ExportKind) => {
    if (validationError || exportKind) return;
    const controller = new AbortController();
    exportAbort.current = controller;
    setExportKind(kind);
    setExportError(null);
    setPlaying(false);
    try {
      const filename = safeFilename(project.text);
      if (kind === 'video') {
        const result = await exportVideo(project, {
          signal: controller.signal,
          onProgress: setExportProgress,
        });
        downloadBlob(result.blob, `${filename}.${result.extension}`);
        setNotice(`${result.codecLabel} 已下载`);
      } else {
        const blob = await exportGif(project, {
          signal: controller.signal,
          onProgress: setExportProgress,
        });
        downloadBlob(blob, `${filename}.gif`);
        setNotice('GIF 已下载');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setNotice('导出已取消');
      } else {
        setExportError(error instanceof Error ? error.message : '无法完成导出');
      }
    } finally {
      exportAbort.current = null;
      setExportKind(null);
      window.setTimeout(() => setExportProgress(null), 1200);
    }
  };

  const exportProjectFile = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], {type: 'application/json'});
    downloadBlob(blob, `${safeFilename(project.text)}.flashwords.json`);
    setNotice('项目文件已下载');
  };

  const importProjectFile = async (file?: File) => {
    if (!file) return;
    try {
      const imported = normalizeProject(JSON.parse(await file.text()));
      setProject(imported);
      restart();
      setNotice('项目文件已载入');
    } catch {
      setExportError('项目文件格式不正确');
    }
  };

  const frameLabel = `${(currentFrame / project.fps).toFixed(1)} / ${project.durationSeconds.toFixed(1)} 秒`;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <header className="topbar">
        <div className="wordmark" aria-label="Flash Words">
          <span>FLASH</span><span>WORDS</span>
        </div>
        <div className="topbar-meta">
          <span>动态文字实验室</span>
          <span className="status-dot" aria-hidden="true" />
          <span>仅在本地处理</span>
        </div>
        <button className="button button-signal top-random" type="button" onClick={handleRandomize}>
          <Shuffle size={16} aria-hidden="true" /> 换一版
        </button>
      </header>

      <main id="main-content" className="workspace">
        <aside className="control-rail" aria-label="动画设置">
          <section className="rail-section input-section">
            <div className="section-heading">
              <span className="section-index">01</span>
              <h1>写下要动起来的文字</h1>
            </div>
            <label className="sr-only" htmlFor="motion-text">动画文字</label>
            <textarea
              id="motion-text"
              value={project.text}
              rows={4}
              onChange={(event) => updateProject({text: clampText(event.target.value)})}
              aria-describedby="text-count text-error"
            />
            <div className="field-meta">
              <span id="text-error" className={validationError ? 'field-error' : ''}>{validationError ?? '支持中英文、数字和 Emoji'}</span>
              <span id="text-count" className="counter">{visibleCharacterCount(project.text)}/60</span>
            </div>
          </section>

          <section className="rail-section">
            <div className="section-heading inline-heading">
              <span className="section-index">02</span>
              <h2>选择组合预设</h2>
              <button
                className={`icon-lock ${project.locks.template ? 'is-locked' : ''}`}
                type="button"
                onClick={() => toggleLock('template')}
                aria-label={project.locks.template ? '解除配方锁定' : '锁定当前配方'}
              >
                <Lock size={14} aria-hidden="true" />
              </button>
            </div>
            <div className="template-grid">
              {TEMPLATES.map((template) => (
                <button
                  type="button"
                  className={`template-button template-${template.id} ${project.templateId === template.id ? 'is-active' : ''}`}
                  key={template.id}
                  onClick={() => setTemplate(template.id)}
                  aria-pressed={project.templateId === template.id}
                  aria-label={template.name}
                  title={template.description}
                >
                  <span className="template-glyph" aria-hidden="true">{template.glyph}</span>
                  <span>{template.shortName}</span>
                </button>
              ))}
            </div>
            <RecipeComposer
              recipe={project.recipe}
              autoDirector={project.autoDirector}
              onToggleAuto={toggleAutoDirector}
              onChange={setRecipeEffect}
            />
            {project.recipe.emphasis === 'flash' && (
              <p className="motion-warning">此模板包含快速闪烁，光敏用户请谨慎使用。</p>
            )}
          </section>

          <section className="rail-section compact-controls">
            <div className="section-heading inline-heading">
              <span className="section-index">03</span>
              <h2>调整节奏和形状</h2>
              <button
                className={`icon-lock ${project.locks.layout ? 'is-locked' : ''}`}
                type="button"
                onClick={() => toggleLock('layout')}
                aria-label={project.locks.layout ? '解除排版锁定' : '锁定当前排版'}
              >
                <Lock size={14} aria-hidden="true" />
              </button>
            </div>

            <div className="segmented" aria-label="画布比例">
              <button type="button" className={project.aspectRatio === '1:1' ? 'is-active' : ''} onClick={() => updateProject({aspectRatio: '1:1'})}>
                <Square size={15} aria-hidden="true" /> 1:1
              </button>
              <button type="button" className={project.aspectRatio === '9:16' ? 'is-active' : ''} onClick={() => updateProject({aspectRatio: '9:16'})}>
                <Smartphone size={15} aria-hidden="true" /> 9:16
              </button>
            </div>

            <label className="range-field">
              <span><span>时长</span><output>{project.durationSeconds.toFixed(1)} 秒</output></span>
              <input type="range" min="4" max="12" step="0.5" value={project.durationSeconds} onChange={(event) => updateProject({durationSeconds: Number(event.target.value)})} />
            </label>
            <label className="range-field">
              <span><span>动效强度</span><output>{Math.round(project.intensity * 100)}%</output></span>
              <input type="range" min="0.2" max="1" step="0.05" value={project.intensity} onChange={(event) => updateProject({intensity: Number(event.target.value)})} />
            </label>
            <label className="range-field">
              <span><span>速度</span><output>{project.speed.toFixed(1)}×</output></span>
              <input type="range" min="0.5" max="2" step="0.1" value={project.speed} onChange={(event) => updateProject({speed: Number(event.target.value)})} />
            </label>

            <label className="select-field">
              <span>字体</span>
              <select value={project.fontId} onChange={(event) => updateProject({fontId: event.target.value as ProjectSpec['fontId']})}>
                {FONT_OPTIONS.map((font) => <option value={font.id} key={font.id}>{font.name}</option>)}
              </select>
            </label>

            <div className="color-heading">
              <span>配色</span>
              <button
                className={`icon-lock ${project.locks.palette ? 'is-locked' : ''}`}
                type="button"
                onClick={() => toggleLock('palette')}
                aria-label={project.locks.palette ? '解除配色锁定' : '锁定当前配色'}
              >
                <Lock size={14} aria-hidden="true" />
              </button>
            </div>
            <div className="color-row">
              <label><span>字</span><input type="color" value={project.foreground} onChange={(event) => updateProject({foreground: event.target.value})} /></label>
              <button className="swap-colors" type="button" onClick={() => updateProject({foreground: project.background, background: project.foreground})} aria-label="交换文字和背景颜色">
                <RefreshCcw size={15} aria-hidden="true" />
              </button>
              <label><span>底</span><input type="color" value={project.background} onChange={(event) => updateProject({background: event.target.value})} /></label>
            </div>
          </section>
        </aside>

        <section className="stage-column" aria-label="动画预览">
          <div className="stage-header">
            <div>
              <span className="eyebrow">LIVE COMPOSITION</span>
              <h2>{project.autoDirector ? activeTemplate.name : '自定义组合'}</h2>
              <p className="stage-recipe">{recipeSummary(project.recipe)}</p>
            </div>
            <div className="stage-seed">SEED <span>{String(project.seed).padStart(8, '0').slice(-8)}</span></div>
          </div>

          <div className="stage-surface">
            <CanvasPreview project={project} playing={playing} restartToken={restartToken} onFrameChange={setCurrentFrame} />
          </div>

          <div className="transport">
            <button className="transport-primary" type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? '暂停预览' : '播放预览'}>
              {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
            </button>
            <button type="button" onClick={restart} aria-label="从头播放"><RotateCcw size={17} aria-hidden="true" /></button>
            <div className="timeline-track" aria-hidden="true">
              <span style={{transform: `scaleX(${Math.min(1, currentFrame / totalFrames)})`}} />
            </div>
            <output className="timecode">{frameLabel}</output>
          </div>
        </section>

        <aside className="export-rail" aria-label="导出设置">
          <section className="export-intro">
            <span className="section-index light">04</span>
            <h2>把动态文字带走</h2>
            <p>画面逐帧在你的浏览器中生成，不会上传文字或视频。</p>
          </section>

          <div className="export-specs">
            <div><span>VIDEO</span><strong>1080P</strong><small>30 FPS · MP4 / WebM</small></div>
            <div><span>GIF</span><strong>720P</strong><small>15 FPS · 无限循环</small></div>
          </div>

          <div className="export-actions">
            <button className="export-button primary" type="button" disabled={Boolean(validationError || exportKind)} onClick={() => runExport('video')}>
              <Film size={19} aria-hidden="true" />
              <span><strong>{exportKind === 'video' ? '正在生成视频' : '导出视频'}</strong><small>优先 H.264 MP4</small></span>
              <Download size={17} aria-hidden="true" />
            </button>
            <button className="export-button" type="button" disabled={Boolean(validationError || exportKind)} onClick={() => runExport('gif')}>
              <ImageIcon size={19} aria-hidden="true" />
              <span><strong>{exportKind === 'gif' ? '正在生成 GIF' : '导出 GIF'}</strong><small>适合聊天和网页</small></span>
              <Download size={17} aria-hidden="true" />
            </button>
          </div>

          {exportProgress && (
            <div className="export-progress" aria-live="polite">
              <div><span>{exportProgress.message}</span><strong>{Math.round(exportProgress.progress * 100)}%</strong></div>
              <div className="progress-track"><span style={{transform: `scaleX(${exportProgress.progress})`}} /></div>
              {exportKind && <button type="button" onClick={() => exportAbort.current?.abort()}><X size={14} aria-hidden="true" /> 取消</button>}
            </div>
          )}

          {exportError && <div className="export-error" role="alert">{exportError}</div>}

          <section className="project-files">
            <h3>项目文件</h3>
            <div>
              <button type="button" onClick={exportProjectFile}><FileDown size={15} aria-hidden="true" /> 保存</button>
              <button type="button" onClick={() => importRef.current?.click()}><Upload size={15} aria-hidden="true" /> 载入</button>
              <button type="button" onClick={() => { reset(); restart(); setNotice('已恢复示例项目'); }}><RotateCcw size={15} aria-hidden="true" /> 重置</button>
            </div>
            <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={(event) => importProjectFile(event.target.files?.[0])} />
          </section>

          <div className="local-status" aria-live="polite"><span className="status-dot" aria-hidden="true" />{notice}</div>
        </aside>
      </main>

      <footer className="footer">
        <span>FLASH WORDS / V1.0</span>
        <nav aria-label="页脚导航">
          <a href="#privacy">隐私</a>
          <a href="#terms">使用说明</a>
        </nav>
      </footer>

      <section className="legal-strip" id="privacy">
        <h2>隐私</h2><p>Flash Words 不上传输入文字、项目文件或导出内容。浏览器仅在本地保存最近一次项目。</p>
      </section>
      <section className="legal-strip" id="terms">
        <h2>使用说明</h2><p>快速闪烁可能不适合光敏用户。导出能力取决于浏览器的视频编码支持，无法生成 MP4 时会自动尝试 WebM。</p>
      </section>
    </div>
  );
}
