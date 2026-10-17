/**
 * Capture anonymous screenshots of the two actual released applications.
 * Run only inside GitHub Actions on a fresh, logged-out browser profile.
 * The screenshots are verifiable site renders, not mockups or invented screens.
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, readFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';

const targets = [
  {
    name: 'The Story Method, public AP Biology Unit 1',
    url: 'https://gmoon-code.github.io/memory-palace-u1-8/?unit=unit-1',
    expected: ['The Story Method', 'AP Biology'],
    filename: 'story-method-interface.webp'
  },
  {
    name: 'Research Methods Studio, public student workspace',
    url: 'https://gmoon-code.github.io/research-methods/',
    expected: ['Research Methods Studio'],
    filename: 'research-methods-studio-interface.webp'
  }
];

await mkdir('assets', { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const target of targets) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      colorScheme: 'light',
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    const response = await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (!response || response.status() >= 400) throw new Error(target.name + ': HTTP ' + response?.status());
    await page.waitForFunction(
      labels => labels.every(label => document.body?.innerText?.includes(label)),
      target.expected,
      { timeout: 40000 }
    );
    await page.waitForFunction(() => !document.querySelector('.loading-shell') && !document.querySelector('.error-shell'), null, { timeout: 45000 });
    await page.waitForTimeout(1200);
    const bodyText = (await page.locator('body').innerText()).trim();
    if (bodyText.length < 300 || /404\s+(?:file\s+)?not\s+found|application\s+error/i.test(bodyText.slice(0, 500))) {
      throw new Error(target.name + ': page does not show a valid application screen.');
    }
    const pageTitle = await page.title();
    const png = join('assets', target.filename.replace('.webp', '.capture.png'));
    const output = join('assets', target.filename);
    await page.screenshot({ path: png, fullPage: false, animations: 'disabled' });
    await sharp(await readFile(png))
      .resize({ width: 1280, withoutEnlargement: true })
      .webp({ quality: 82, effort: 6 })
      .toFile(output);
    await unlink(png);
    const meta = await sharp(output).metadata();
    if ((meta.width ?? 0) < 1000 || (meta.height ?? 0) < 600) throw new Error(target.name + ': unexpected screenshot dimensions');
    console.log(JSON.stringify({
      name: target.name,
      url: target.url,
      pageTitle,
      image: output,
      width: meta.width,
      height: meta.height,
      previewText: bodyText.slice(0, 350)
    }));
    await context.close();
  }
} finally {
  await browser.close();
}
