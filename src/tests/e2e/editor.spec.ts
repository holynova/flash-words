import {expect, test} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('creates and previews a kinetic type project', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', {name: '写下要动起来的文字'})).toBeVisible();
  const input = page.getByLabel('动画文字');
  await input.fill('文字正在发生');
  await page.getByRole('button', {name: /故障切片/}).click();
  await expect(page.getByRole('heading', {name: '故障切片'})).toBeVisible();
  await expect(page.getByRole('img', {name: /文字正在发生/})).toBeVisible();
  await expect(page.getByText('6/60')).toBeVisible();
});

test('persists the project locally', async ({page}) => {
  await page.goto('/');
  await page.getByLabel('动画文字').fill('保存在本地');
  await page.reload();
  await expect(page.getByLabel('动画文字')).toHaveValue('保存在本地');
});

test('switches between word and character output and persists the choice', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('button', {name: '按词'})).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', {name: '逐字'}).click();
  await expect(page.getByRole('button', {name: '逐字'})).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('每个字单独出现')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', {name: '逐字'})).toHaveAttribute('aria-pressed', 'true');
});

test('supports a narrow mobile viewport without horizontal overflow', async ({page}, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Mobile-only layout assertion');
  await page.goto('/');
  await expect(page.getByRole('img')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.getByRole('button', {name: '导出视频'})).toBeVisible();
});

test('exposes inline validation for matching colors', async ({page}) => {
  await page.goto('/');
  const colors = page.locator('input[type="color"]');
  const value = await colors.nth(0).inputValue();
  await colors.nth(1).fill(value);
  await expect(page.getByText('文字和背景颜色不能相同')).toBeVisible();
  await expect(page.getByRole('button', {name: '导出视频'})).toBeDisabled();
});

test('shows an inline error for an empty draft', async ({page}) => {
  await page.goto('/');
  await page.getByLabel('动画文字').fill('');
  await expect(page.getByText('请输入至少一个字符')).toBeVisible();
  await expect(page.getByRole('button', {name: '导出视频'})).toBeDisabled();
});

test('renders all fourteen templates at both aspect ratios', async ({page}) => {
  test.setTimeout(60_000);
  await page.goto('/');
  const templates = [
    '黑白跳切',
    '飞入网格',
    '平滑缩放',
    '无限推进',
    '闪烁反相',
    '密集平铺',
    '故障切片',
    '散落聚合',
    '波浪字流',
    '打字显现',
    '快门揭示',
    '单行弹幕',
    '多行弹幕',
    '倍增平铺',
  ];
  for (const ratio of ['1:1', '9:16']) {
    await page.getByRole('button', {name: ratio}).click();
    for (const name of templates) {
      await page.getByRole('button', {name}).click();
      await page.waitForTimeout(80);
      const canvasState = await page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
        const context = canvas.getContext('2d');
        if (!context) return {width: 0, height: 0, colorful: false};
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        const first = `${pixels[0]}-${pixels[1]}-${pixels[2]}`;
        let colorful = false;
        for (let index = 0; index < pixels.length; index += 800) {
          if (`${pixels[index]}-${pixels[index + 1]}-${pixels[index + 2]}` !== first) {
            colorful = true;
            break;
          }
        }
        return {width: canvas.width, height: canvas.height, colorful};
      });
      expect(canvasState.colorful, `${name} should draw foreground pixels`).toBe(true);
      expect(ratio === '1:1' ? canvasState.width === canvasState.height : canvasState.height > canvasState.width).toBe(true);
    }
  }
});

test('keeps locked template and palette while randomizing the seed', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button', {name: '故障切片'}).click();
  await page.getByRole('button', {name: '锁定当前配方'}).click();
  const colors = page.locator('input[type="color"]');
  const beforeColors = [await colors.nth(0).inputValue(), await colors.nth(1).inputValue()];
  const recipeSelects = page.locator('.recipe-slot select');
  const beforeRecipe = await recipeSelects.evaluateAll((selects) => selects.map((select) => (select as HTMLSelectElement).value));
  const beforeSeed = await page.locator('.stage-seed span').textContent();
  await page.getByRole('button', {name: /换一版/}).click();
  await expect(page.getByRole('heading', {name: '故障切片'})).toBeVisible();
  expect([await colors.nth(0).inputValue(), await colors.nth(1).inputValue()]).toEqual(beforeColors);
  expect(await recipeSelects.evaluateAll((selects) => selects.map((select) => (select as HTMLSelectElement).value))).toEqual(beforeRecipe);
  await expect(page.locator('.stage-seed span')).not.toHaveText(beforeSeed ?? '');
});

test('combines five effect slots and persists a manual recipe', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('button', {name: '自动导演'})).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('进入效果').selectOption('typewriter');
  await page.getByLabel('持续效果').selectOption('wave');
  await page.getByLabel('强调效果').selectOption('glitch');
  await page.getByLabel('退出效果').selectOption('shutter');
  await page.getByLabel('背景效果').selectOption('tiles');
  await expect(page.getByRole('heading', {name: '自定义组合'})).toBeVisible();
  await expect(page.getByRole('button', {name: '手动编排'})).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByText('打字 · 波浪 · 故障 · 快门 · 平铺')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('进入效果')).toHaveValue('typewriter');
  await expect(page.getByLabel('背景效果')).toHaveValue('tiles');
});

test('switches from the default combined recipe to one single effect and persists it', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('button', {name: '组合配方'})).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', {name: '单一特效'}).click();
  await expect(page.getByRole('button', {name: '单一特效'})).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.recipe-slot')).toHaveCount(0);
  await expect(page.locator('.single-effect-summary strong')).toHaveText('闪烁');

  await page.getByRole('button', {name: '飞入网格'}).click();
  await expect(page.locator('.single-effect-summary strong')).toHaveText('飞入');
  await expect(page.getByRole('heading', {name: '飞入网格 · 单效'})).toBeVisible();

  await page.reload();
  await expect(page.getByRole('button', {name: '单一特效'})).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.single-effect-summary strong')).toHaveText('飞入');
});

test('auto director adapts the recipe to text length and presets restore it', async ({page}) => {
  await page.goto('/');
  await page.getByLabel('动画文字').fill('这是一段需要自动导演重新安排节奏的长文字');
  await expect(page.getByLabel('进入效果')).toHaveValue('typewriter');
  await page.getByRole('button', {name: '波浪字流'}).click();
  await expect(page.getByRole('button', {name: '自动导演'})).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', {name: '波浪字流'})).toBeVisible();
});

test('keeps the seed and layout when layout is locked', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button', {name: '锁定当前排版'}).click();
  const beforeSeed = await page.locator('.stage-seed span').textContent();
  await page.getByRole('button', {name: /换一版/}).click();
  await expect(page.locator('.stage-seed span')).toHaveText(beforeSeed ?? '');
});

test('redraws edits immediately while preview is paused', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button', {name: '暂停预览'}).click();
  const before = await page.locator('canvas').evaluate((canvas: HTMLCanvasElement) =>
    Array.from(canvas.getContext('2d')!.getImageData(0, 0, 1, 1).data),
  );
  await page.locator('input[type="color"]').nth(1).fill('#123456');
  await expect.poll(() => page.locator('canvas').evaluate((canvas: HTMLCanvasElement) =>
    Array.from(canvas.getContext('2d')!.getImageData(0, 0, 1, 1).data),
  )).not.toEqual(before);
});

test('round-trips a project JSON file', async ({page}) => {
  await page.goto('/');
  await page.getByLabel('动画文字').fill('可重复编辑的文字');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', {name: '保存'}).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('.flashwords.json');

  await page.locator('input[type="file"]').setInputFiles({
    name: 'import.flashwords.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      version: 1,
      text: '重新载入成功',
      aspectRatio: '9:16',
      durationSeconds: 6,
      fps: 30,
      templateId: 'tile-storm',
      seed: 8128,
      intensity: 0.65,
      speed: 1.3,
      fontId: 'noto-serif',
      foreground: '#f5f1e8',
      background: '#0d0d0c',
      locks: {template: true, palette: true, layout: false},
    })),
  });
  await expect(page.getByLabel('动画文字')).toHaveValue('重新载入成功');
  await expect(page.getByRole('heading', {name: '密集平铺'})).toBeVisible();
  await expect(page.getByText('1.3×')).toBeVisible();
  await expect(page.getByText('项目文件已载入')).toBeVisible();
});

test('has no serious accessibility violations', async ({page}) => {
  await page.goto('/');
  const results = await new AxeBuilder({page}).analyze();
  const blocking = results.violations.filter((violation) =>
    violation.impact === 'critical' || violation.impact === 'serious',
  );
  expect(blocking).toEqual([]);
});

test('does not autoplay when reduced motion is requested', async ({browser}) => {
  const context = await browser.newContext({reducedMotion: 'reduce'});
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4188/');
  await expect(page.getByRole('button', {name: '播放预览'})).toBeVisible();
  await page.getByRole('button', {name: '波浪字流'}).click();
  await expect(page.getByRole('button', {name: '播放预览'})).toBeVisible();
  await page.getByRole('button', {name: /换一版/}).click();
  await expect(page.getByRole('button', {name: '播放预览'})).toBeVisible();
  await context.close();
});
