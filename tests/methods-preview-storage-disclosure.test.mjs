import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../research-methods-studio.html', import.meta.url), 'utf8');
const previewJs = readFileSync(new URL('../site-previews.js', import.meta.url), 'utf8');
const previewSection = html.match(/<section class="section project-preview-section" id="preview">([\s\S]*?)<\/section>/)?.[1] ?? '';
const before = previewSection.match(/<div class="project-preview-before">([\s\S]*?)<\/div>/)?.[1] ?? '';
const active = previewSection.match(/<div class="project-preview-active"[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? '';

test('live preview warns about existing notebook visibility and edits before the opening control', () => {
  assert.ok(previewSection.length, 'preview section should exist');
  assert.match(before, /access to any Research Methods Studio project already saved in this browser/);
  assert.match(before, /Opening the preview can display earlier work/);
  assert.match(before, /editing here can change the project available in the full workspace/);
  assert.match(before, /private work/);
  assert.ok(before.indexOf('earlier work') < before.indexOf('data-preview-open'), 'storage warning must precede opener');
  assert.match(previewSection, /The preview opens the published Research Methods Studio workspace inside this page/);
  assert.doesNotMatch(previewSection, /may share a locally stored project/);
});

test('the active preview explains shared browser storage, saved edits and separate backups', () => {
  assert.match(previewSection, /same locally stored Research Methods Studio project when browser storage is available/);
  assert.match(previewSection, /Closing the preview does not undo saved edits/);
  assert.match(previewSection, /For extended writing and backups, use the full workspace/);
  assert.match(html, /Student notebooks are designed to remain in local browser storage/);
  assert.match(html, /Optional Research Chat uses a server/);
  assert.doesNotMatch(previewSection, /—/);
});

function harness() {
  const events = new Map();
  const node = () => ({
    dataset: {}, hidden: false, focused: false, events: new Map(), attrs: new Map(),
    addEventListener(name, fn) { this.events.set(name, fn); },
    focus() { this.focused = true; },
    setAttribute(name, value) { this.attrs.set(name, value); },
    replaceChildren(...children) { this.children = children; }
  });
  const open = node(), close = node(), before = node(), active = node(), stage = node();
  active.hidden = true;
  const desktop = node(), phone = node();
  desktop.dataset.previewDevice = 'desktop';
  phone.dataset.previewDevice = 'phone';
  const bySelector = new Map([
    ['[data-preview-open]', open], ['[data-preview-close]', close],
    ['.project-preview-before', before], ['[data-preview-active]', active],
    ['[data-preview-stage]', stage]
  ]);
  const panel = node();
  panel.dataset.livePreview = 'methods';
  panel.querySelector = selector => bySelector.get(selector);
  panel.querySelectorAll = selector => selector === '[data-preview-device]' ? [desktop, phone] : [];
  const frames = [];
  const document = {
    querySelectorAll(selector) { return selector === '[data-live-preview]' ? [panel] : []; },
    createElement(name) {
      assert.equal(name, 'iframe');
      const frame = node();
      frame.sandbox = { tokens: new Set(), add(value) { this.tokens.add(value); } };
      frames.push(frame);
      return frame;
    }
  };
  const window = { addEventListener(name, fn) { events.set(name, fn); } };
  vm.runInNewContext(previewJs, { document, window, location: { origin: 'https://gmoon-code.github.io' }, URL }, { filename: 'site-previews.js' });
  return { open, close, before, active, stage, desktop, phone, frames, panel };
}

test('actual preview script loads a same-origin, live iframe only after visitor action', () => {
  const h = harness();
  assert.equal(h.open.hidden, false);
  assert.equal(h.frames.length, 0, 'no iframe should load before opening');
  h.open.events.get('click')();
  assert.equal(h.frames.length, 1);
  assert.equal(h.stage.children[0], h.frames[0]);
  assert.equal(h.frames[0].src, 'https://gmoon-code.github.io/research-methods/');
  assert.equal(h.frames[0].sandbox.tokens.has('allow-scripts'), true);
  assert.equal(h.frames[0].sandbox.tokens.has('allow-same-origin'), true);
  assert.equal(h.active.hidden, false);
  assert.equal(h.before.hidden, true);
  h.phone.events.get('click')();
  assert.equal(h.stage.dataset.device, 'phone');
  h.close.events.get('click')();
  assert.equal(h.frames[0].src, 'https://gmoon-code.github.io/research-methods/');
  assert.equal(h.stage.children.length, 0);
  assert.equal(h.before.hidden, false);
  assert.equal(h.active.hidden, true);
  assert.equal(h.open.focused, true);
});
