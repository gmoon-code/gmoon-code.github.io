import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../story-method.html',import.meta.url),'utf8');
const previewJs=readFileSync(new URL('../site-previews.js',import.meta.url),'utf8');
const section=html.match(/<section class="section project-preview-section" id="preview">([\s\S]*?)<\/section>/)?.[1]??'';
const before=section.match(/<div class="project-preview-before">([\s\S]*?)<\/div>/)?.[1]??'';

test('shared Story Method progress and first-open unit reset are disclosed before opening',()=>{
  assert.match(before,/same saved progress as the full-size Story Method/);
  assert.match(before,/Opening it can change your last-opened unit and journey/);
  assert.match(before,/even before you answer a question/);
  assert.match(before,/Completing scenes or reviews here can also change your saved progress/);
  assert.ok(before.indexOf('last-opened unit')<before.indexOf('data-preview-open'));
  assert.match(section,/Closing the preview does not undo saved changes/);
  assert.match(section,/same locally stored progress when browser storage is available/);
  assert.doesNotMatch(section,/—/);
});

test('actual Story Method preview script loads live Unit 1 within this website origin only after a click',()=>{
  const makeNode=()=>({
    dataset:{},hidden:false,events:{},focusCalled:false,attributes:{},
    addEventListener(name,fn){this.events[name]=fn},
    setAttribute(name,value){this.attributes[name]=value},
    replaceChildren(...items){this.children=items},
    focus(){this.focusCalled=true}
  });
  const open=makeNode(),close=makeNode(),beforeNode=makeNode(),active=makeNode(),stage=makeNode();
  active.hidden=true;
  const desktop=makeNode(),phone=makeNode();
  desktop.dataset.previewDevice='desktop';
  phone.dataset.previewDevice='phone';
  const map={
    '[data-preview-open]':open,'[data-preview-close]':close,
    '.project-preview-before':beforeNode,'[data-preview-active]':active,
    '[data-preview-stage]':stage
  };
  const panel=makeNode();panel.dataset.livePreview='story';
  panel.querySelector=selector=>map[selector];
  panel.querySelectorAll=selector=>selector==='[data-preview-device]'?[desktop,phone]:[];
  const frames=[];
  const document={
    querySelectorAll:selector=>selector==='[data-live-preview]'?[panel]:[],
    createElement(name){
      assert.equal(name,'iframe');
      const frame=makeNode();frame.sandbox={tokens:[],add(x){this.tokens.push(x)}};
      frames.push(frame);return frame;
    }
  };
  const window={addEventListener(){}};
  vm.runInNewContext(previewJs,{document,window,location:{origin:'https://gmoon-code.github.io'},URL},{filename:'site-previews.js'});
  assert.equal(open.hidden,false);
  assert.equal(frames.length,0);
  open.events.click();
  assert.equal(frames.length,1);
  assert.equal(frames[0].src,'https://gmoon-code.github.io/memory-palace-u1-8/?unit=unit-1');
  assert.ok(frames[0].sandbox.tokens.includes('allow-same-origin'));
  assert.ok(frames[0].sandbox.tokens.includes('allow-scripts'));
  assert.equal(active.hidden,false);
  phone.events.click();
  assert.equal(stage.dataset.device,'phone');
  close.events.click();
  assert.deepEqual(stage.children,[]);
  assert.equal(open.focusCalled,true);
});
