import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
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
const cv=read('cv.html');
const chrome=read('studio/studio-chrome.js');
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
  assert.match(studio,/let canonical=doc\.querySelector\('link\[rel="canonical"\]'\)/);
  assert.match(studio,/canonical=doc\.createElement\("link"\)/);
  assert.match(studio,/doc\.head\.appendChild\(canonical\)/);
  assert.match(studio,/canonical\.setAttribute\("href",ROOT\+path\)/);
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

test('Every existing root HTML address is either editable or reserved from new page creation',()=>{
  const rootHtml=readdirSync(root).filter(file=>file.endsWith('.html'));
  const reservedMatch=studio.match(/const RESERVED_PAGES = (\[[^\n]+\]);/);
  assert.ok(reservedMatch,'Studio must declare reserved legacy and non-editable HTML routes');
  const reserved=JSON.parse(reservedMatch[1]);
  const declared=new Set([...pages.map(page=>page.path),...reserved]);
  assert.deepEqual(rootHtml.filter(file=>!declared.has(file)),[]);
  for(const name of ['404.html','about.html','pungmul.html','writing-biological-classification.html']){
    assert.ok(reserved.includes(name),name+' must be reserved');
  }
  assert.match(studio,/RESERVED_PAGES\.includes\(path\)/);
});

test('Duplicated pages with no source canonical receive their own, with inherited indexing disclosed',()=>{
  const osmosis=read('teaching-osmosis-practice.html');
  assert.doesNotMatch(osmosis,/<link[^>]+rel="canonical"/);
  assert.match(osmosis,/name="robots" content="noindex, follow"/);
  assert.match(studio,/doc\.head\.appendChild\(canonical\)/);
  assert.match(studio,/canonical\.setAttribute\("href",ROOT\+path\)/);
  assert.match(studio,/Check inherited citations, image credits, links, and search-indexing settings before publishing/);
});

test('shared footer publishing warns when tailored CV and Contact messages will be replaced',()=>{
  assert.ok(pages.some(p=>p.path==='contact.html'));
  assert.ok(pages.some(p=>p.path==='cv.html'));
  assert.match(contact, /<footer\b[\s\S]*?Thank you for stopping by\./);
  assert.match(cv, /<footer\b[\s\S]*?<a href="contact\.html">get in touch<\/a>/);
  assert.match(chrome, /Publishing updates the header and footer on Studio-listed pages and the 404 page/);
  assert.match(chrome, /It replaces the Contact page’s current thank-you footer and the CV footer’s link to Contact/);
  assert.match(chrome, /for\(const path of new Set\(\[\.\.\.pages,"404\.html"\]\)\)/);
  assert.match(chrome, /paragraph\.replaceChildren\(\.\.\.fragments\)/);
  new vm.Script(chrome);
});

test('Studio idle status describes local drafts rather than claiming all website changes are published',()=>{
  assert.match(studio,/const dirty=hasChanges\(\);\s*el\.textContent=dirty\?"Unpublished changes":"No pending changes in this Studio session";/);
  assert.doesNotMatch(studio,/Everything published/);
  assert.match(studio,/await github\(prefix\+"\/git\/refs\/heads\/main",\{/);
  assert.match(studio,/toast\("All changes were published together\. GitHub Pages may need a few minutes to refresh\."\)/);
});
