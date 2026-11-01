import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const dataText=readFileSync(new URL('../connection-studio/data.js',import.meta.url),'utf8');
const appText=readFileSync(new URL('../connection-studio/app.js',import.meta.url),'utf8');
const indexText=readFileSync(new URL('../connection-studio/index.html',import.meta.url),'utf8');
const names=['RELATIONS','TECHNIQUES','DIAGNOSE','CHOOSE','REWRITE','PARAGRAPHS','SIGNAL_BANK'];
const data=vm.runInNewContext(dataText+'\n({'+names.join(',')+'})');
const relationIds=new Set(data.RELATIONS.map(x=>x.id));
const techniqueIds=new Set(data.TECHNIQUES.map(x=>x.id));

test('all authored lesson banks have consistent sizes and unique IDs',()=>{
  assert.equal(data.RELATIONS.length,12);
  assert.equal(data.TECHNIQUES.length,26);
  assert.equal(data.DIAGNOSE.length,20);
  assert.equal(data.CHOOSE.length,20);
  assert.equal(data.REWRITE.length,20);
  assert.equal(data.PARAGRAPHS.length,10);
  assert.equal(data.SIGNAL_BANK.reduce((sum,x)=>sum+x.items.length,0),96);
  for(const [name,rows] of Object.entries(data)){
    assert.equal(new Set(rows.map(x=>x.id)).size,rows.length,name);
  }
});

test('answer keys resolve to available choices and their explanations are present',()=>{
  for(const x of data.DIAGNOSE){
    assert.ok(x.options.includes(x.answer),x.id);
    assert.ok(x.options.every(id=>relationIds.has(id)),x.id);
    assert.ok(x.why?.trim(),x.id);
  }
  for(const x of data.CHOOSE){
    assert.ok(Number.isInteger(x.answer)&&x.answer>=0&&x.answer<x.options.length,x.id);
    assert.ok(relationIds.has(x.focus),x.id);
    assert.ok(x.why?.trim(),x.id);
    assert.equal(x.wrong.length,x.options.length,x.id);
  }
});

test('writing challenges contain model text and methodological rationales',()=>{
  for(const x of [...data.REWRITE,...data.PARAGRAPHS]){
    assert.ok(x.models?.length>=2,x.id);
    assert.ok(x.models.every(m=>m.text?.trim()&&m.why?.trim()),x.id);
  }
  for(const x of data.REWRITE)assert.ok(relationIds.has(x.focus)||techniqueIds.has(x.focus),x.id);
});

test('visitor wording identifies examples as constructed practice and uses readable lexical label',()=>{
  assert.match(appText,/Classroom and research scenarios are illustrative writing exercises/);
  assert.match(appText,/TECHNIQUES\.find\(t=>t\.id===id\)\?\.name/);
  assert.match(indexText,/lang="en-CA"/);
  new vm.Script(appText);
});
