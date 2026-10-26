const {test,expect}=require('@playwright/test');

test.beforeEach(async({page})=>{
  await page.goto('http://127.0.0.1:8765/editor-v2.html?page=research.html',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>localStorage.removeItem('moon-academic-editor-v2:research.html'));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#designMode').click();
});
async function setPosition(page,id,x,y){
  await page.locator('#layers [data-layer-id="'+id+'"]').click();
  await page.locator('#propX').fill(String(x));
  await page.locator('#propX').press('Tab');
  await page.locator('#propY').fill(String(y));
  await page.locator('#propY').press('Tab');
}
async function boxDrag(page,from,to,modifiers=[]){
  const stage=page.locator('#stage');
  const rect=await stage.boundingBox();
  const scale=rect.width/Number(await stage.evaluate(n=>parseFloat(n.style.width)));
  const convert=([x,y])=>({x:rect.x+x*scale,y:rect.y+y*scale});
  const a=convert(from),b=convert(to);
  for(const key of modifiers)await page.keyboard.down(key);
  await page.mouse.move(a.x,a.y);
  await page.mouse.down();
  await page.mouse.move(b.x,b.y,{steps:8});
  await page.mouse.up();
  for(const key of modifiers.reverse())await page.keyboard.up(key);
}
test('rubber-band selects fully enclosed objects and preserves them for a group move',async({page})=>{
  for(let i=0;i<3;i++)await page.locator('#addShape').click();
  await setPosition(page,1,150,150);
  await setPosition(page,2,420,150);
  await setPosition(page,3,700,500);
  await boxDrag(page,[35,40],[680,430]);
  await expect(page.locator('#stage .scene-object[aria-selected="true"]')).toHaveCount(2);
  await expect(page.locator('#stage [data-id="3"]')).toHaveAttribute('aria-selected','false');
  await expect(page.locator('#stage [data-v2-marquee]')).toHaveCount(0);
  const x1=await page.locator('#stage [data-id="1"]').evaluate(n=>parseInt(n.style.left));
  const x2=await page.locator('#stage [data-id="2"]').evaluate(n=>parseInt(n.style.left));
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#stage [data-id="1"]')).toHaveCSS('left',(x1+1)+'px');
  await expect(page.locator('#stage [data-id="2"]')).toHaveCSS('left',(x2+1)+'px');
});
test('right-to-left selection includes touched objects and Shift preserves previous selections',async({page})=>{
  for(let i=0;i<3;i++)await page.locator('#addShape').click();
  await setPosition(page,1,150,150);
  await setPosition(page,2,420,150);
  // Keep the crossing gesture fully inside the visible editor viewport.
  await setPosition(page,3,700,250);
  await boxDrag(page,[35,40],[395,430]);
  await expect(page.locator('#stage .scene-object[aria-selected="true"]')).toHaveCount(1);
  await boxDrag(page,[995,500],[855,385],['Shift']);
  await expect(page.locator('#stage [data-id="1"]')).toHaveAttribute('aria-selected','true');
  await expect(page.locator('#stage [data-id="3"]')).toHaveAttribute('aria-selected','true');
  await expect(page.locator('#stage [data-id="2"]')).toHaveAttribute('aria-selected','false');
  await expect(page.locator('#stage .canvas-marquee')).toHaveCount(0);
});
test('Escape cancels an in-progress marquee without moving or deselecting objects',async({page})=>{
  await page.locator('#addShape').click();
  await setPosition(page,1,150,150);
  const stage=page.locator('#stage');
  const rect=await stage.boundingBox();
  const scale=rect.width/1160;
  await page.mouse.move(rect.x+30*scale,rect.y+30*scale);
  await page.mouse.down();
  await page.mouse.move(rect.x+440*scale,rect.y+360*scale,{steps:5});
  await expect(page.locator('#stage .canvas-marquee')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('#stage .canvas-marquee')).toHaveCount(0);
  await page.mouse.up();
  await expect(page.locator('#stage [data-id="1"]')).toHaveCSS('left','150px');
});

test('clicking a canvas object restores arrow-key control after inspector editing',async({page})=>{
  await page.locator('#addShape').click();
  await setPosition(page,1,150,150);
  await page.locator('#propY').focus();
  await expect(page.locator('#propY')).toBeFocused();
  const shape=page.locator('#stage [data-id="1"]');
  await shape.click({position:{x:45,y:45}});
  await expect(page.locator('#stage')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(shape).toHaveCSS('left','149px');
  await page.keyboard.press('Shift+ArrowDown');
  await expect(shape).toHaveCSS('top','160px');
});
