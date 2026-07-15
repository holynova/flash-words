import {readFile, stat} from 'node:fs/promises';
import {expect, test} from '@playwright/test';

test.beforeEach(async ({page}, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'High-resolution export is validated on desktop engines only');
  await page.goto('/');
  await page.locator('input[type="range"]').first().fill('4');
  await page.getByRole('button', {name: '暂停预览'}).click();
});

test('exports a valid animated GIF through the worker', async ({page}, testInfo) => {
  test.setTimeout(120_000);
  const downloadPromise = page.waitForEvent('download', {timeout: 110_000});
  await page.getByRole('button', {name: '导出 GIF'}).click();
  const download = await downloadPromise;
  const outputPath = testInfo.outputPath('flash-words-smoke.gif');
  await download.saveAs(outputPath);
  const bytes = await readFile(outputPath);
  expect(bytes.subarray(0, 6).toString('ascii')).toMatch(/^GIF8[79]a$/u);
  expect((await stat(outputPath)).size).toBeGreaterThan(10_000);
  await expect(page.getByText('GIF 已下载')).toBeVisible();
});

test('exports a playable video container', async ({page}, testInfo) => {
  test.setTimeout(180_000);
  const downloadPromise = page.waitForEvent('download', {timeout: 170_000});
  await page.getByRole('button', {name: '导出视频'}).click();
  const download = await downloadPromise;
  const extension = download.suggestedFilename().split('.').at(-1);
  expect(['mp4', 'webm']).toContain(extension);
  const outputPath = testInfo.outputPath(`flash-words-smoke.${extension}`);
  await download.saveAs(outputPath);
  const bytes = await readFile(outputPath);
  const signature = bytes.subarray(0, 32).toString('latin1');
  if (extension === 'mp4') expect(signature).toContain('ftyp');
  if (extension === 'webm') expect(bytes.subarray(0, 4)).toEqual(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  expect((await stat(outputPath)).size).toBeGreaterThan(20_000);
  await expect(page.getByText(/已下载$/u)).toBeVisible();
});

test('cancels a long export without downloading a partial file', async ({page}) => {
  test.setTimeout(60_000);
  await page.locator('input[type="range"]').first().fill('12');
  await page.getByRole('button', {name: '导出 GIF'}).click();
  const cancel = page.getByRole('button', {name: '取消'});
  await expect(cancel).toBeVisible();
  await cancel.click();
  await expect(page.getByText('导出已取消')).toBeVisible();
  await expect(page.getByRole('button', {name: '导出 GIF'})).toBeEnabled();
});

test('completes five consecutive video exports and releases the UI each time', async ({page}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Repeated encoder stress test runs once');
  test.setTimeout(180_000);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const startedAt = Date.now();
    const downloadPromise = page.waitForEvent('download', {timeout: 60_000});
    await page.getByRole('button', {name: '导出视频'}).click();
    await downloadPromise;
    expect(Date.now() - startedAt).toBeLessThan(30_000);
    await expect(page.getByRole('button', {name: '导出视频'})).toBeEnabled();
  }
});
