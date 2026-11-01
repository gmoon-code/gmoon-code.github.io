import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import vm from 'node:vm';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(join(root,path),'utf8');
const nav=JSON.parse(read('studio/navigation.json')).items;
const pages=JSON.parse(read('studio/pages.json')).pages;
const studio=read('studio/studio.js');
const studioHTML=read('studio/index.html');
const contact=read('contact.html');
const about=read('about.html');
const projects=read('projects.html');

test('Studio manifests use the public Contact destination instead of retired About page',()=>{
  assert.ok(nav.some(x=>x.path==='contact.html'&&x.label==='Contact'&&x.visible));
  assert.ok(!nav.some(x=>x.path==='about.html'&&x.visible));
  assert.ok(pages.some(x=>x.path==='contact.html'&&x.title==='Contact'&&x.locked));
  assert.ok(!pages.some(x=>x.path==='about.html'));
  assert.ok(nav.filter(x=>x.visible).every(x=>pages.some(y=>y.path===x.path)));
  assert.equal(new Set(pages.map(x=>x.path)).size,pages.length);
  assert.equal(new Set(nav.map(x=>x.path)).size,nav.length);
});

test('Default page creation cannot inherit the old About redirect or wrong canonical URL',()=>{
  assert.match(studio,/const BASE_PAGES = \[[^\]]*"contact\.html"/);
  assert.doesNotMatch(studio,/const BASE_PAGES = \[[^\]]*"about\.html"/);
  assert.match(studio,/ensureDraft\(duplicate\|\|"projects\.html"\)/);
  assert.doesNotMatch(studio,/ensureDraft\(duplicate\|\|"about\.html"\)/);
  assert.match(studio,/doc\.querySelector\('link\[rel="canonical"\]'\)\?\.setAttribute\("href",ROOT\+path\)/);
  assert.match(projects,/<main\b/);
  assert.match(projects,/<link rel="canonical"/);
  assert.doesNotMatch(projects,/http-equiv=["']refresh/i);
  assert.match(contact,/<main\b/);
  assert.match(about,/contact\.html/);
  assert.match(about,/http-equiv=["']refresh/i);
  new vm.Script(studio);
});

test('Duplicating a page is explicitly framed as inheriting text and search metadata',()=>{
  assert.match(studioHTML,/A duplicated page keeps its source content and may retain its search-indexing settings/);
  assert.match(studioHTML,/check citations, image credits and links before publishing/);
});
