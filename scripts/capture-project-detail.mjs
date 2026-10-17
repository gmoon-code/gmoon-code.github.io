/**
 * Genuine detailed interface capture from public learning applications.
 * A new browser context is created for each app; no student data is loaded.
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ headless: true });
await mkdir('assets', { recursive: true });

async function contextPage() {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'reduce'
  });
  return { context, page: await context.newPage() };
}
async function exportImage(page, file, requireText) {
  await page.waitForFunction(
    text => document.body?.innerText?.includes(text),
    requireText,
    { timeout: 30000 }
  );
  await page.waitForTimeout(700);
  const screenshot = await page.screenshot({ fullPage: false, animations: 'disabled' });
  await sharp(screenshot).resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 85, effort: 6 }).toFile('assets/' + file);
  const metadata = await sharp('assets/' + file).metadata();
  if (metadata.width !== 1280 || metadata.height !== 800) throw new Error('Unexpected output dimensions for ' + file);
  console.log(JSON.stringify({ file, width: metadata.width, height: metadata.height, checkedText: requireText }));
}

const report = { status: 'started', files: [], capturedAt: new Date().toISOString() };
try {
  {
    const { context, page } = await contextPage();
    const res = await page.goto('https://gmoon-code.github.io/memory-palace-u1-8/?unit=unit-1', { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (!res || res.status() !== 200) throw new Error('Story Method public site unavailable');
    await page.waitForSelector('[data-action="learn"]', { timeout: 60000 });
    await page.locator('[data-action="learn"]').first().click();
    await page.locator('.scene-orientation h2').getByText('Observation Window').waitFor({ timeout: 45000 });
    await page.locator('.scene-orientation').scrollIntoViewIfNeeded();
    if ((await page.locator('.scene-stage .stage-zone').count()) < 2) throw new Error('Story layout did not render');
    await exportImage(page, 'story-method-observation-window.webp', 'Observation Window');
    report.files.push('assets/story-method-observation-window.webp');
    await context.close();
  }
  {
    const { context, page } = await contextPage();
    const res = await page.goto('https://gmoon-code.github.io/research-methods/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (!res || res.status() !== 200) throw new Error('Research Methods Studio public site unavailable');
    await page.locator('#projectName').fill('Illustrative research notebook');
    await page.locator('#projectContext').fill('Demonstration only; no research data');
    await page.locator('#beginProject').click();
    // Legacy tool hook is visually hidden. Calling its genuine click handler opens the same application laboratory.
    await page.locator('#dataLab').evaluate(button => button.click());
    await page.locator('#dataBackdrop h3').getByText('Data Analysis & Statistics Laboratory').waitFor({ timeout: 45000 });
    if ((await page.locator('[data-dtab]').count()) !== 7) throw new Error('Seven-step analysis workflow did not render');
    await exportImage(page, 'research-methods-data-lab.webp', 'Data Analysis & Statistics Laboratory');
    report.files.push('assets/research-methods-data-lab.webp');
    await context.close();
  }
  report.status = 'success';
} catch (error) {
  report.status = 'failed';
  report.error = String(error?.message || error).slice(0, 1500);
  console.error(report.error);
} finally {
  await browser.close();
  await mkdir('docs', { recursive: true });
  await writeFile('docs/capture-detail-status.json', JSON.stringify(report, null, 2) + '\n');
}
