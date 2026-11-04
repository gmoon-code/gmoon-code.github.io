// Non-destructive smoke test of the ACTUAL GitHub Pages Editor V2 delivery.
// The editor HTML/CSS/JS load from public HTTPS. GitHub Contents API requests
// are intercepted with exact checkout HTML for reproducibility. This tests
// deployed editor interactions, not authenticated GitHub publication.
const {test,expect}=require('@playwright/test');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const {createHash}=require('node:crypto');

const BASE='https://gmoon-code.github.io';
const ROOT=join(__dirname,'..');
const PAGES=['index.html','research.html','contact.html'];
const html=new Map(PAGES.map(p=>[p,readFileSync(join(ROOT,p))]));
const gitSha=bytes=>createHash('sha1')
  .update(Buffer.from('blob '+bytes.length+'\0'))
  .update(bytes).digest('hex');
test.setTimeout(90000);

for(const name of PAGES){
  test('Deployed Editor V2 can edit, save and preview '+name+' without publishing',
    async({page})=>{
      const writes=[];
      await page.route(/^https:\/\/api\.github\.com\/repos\/gmoon-code\/gmoon-code\.github\.io\//,
        async route=>{
          const req=route.request(),url=new URL(req.url());
          if(req.method()!=='GET'){
            writes.push({method:req.method(),url:req.url()});
            await route.abort();return;
          }
          const file=url.pathname.split('/contents/')[1],bytes=file&&html.get(file);
          if(!bytes||url.searchParams.get('ref')!=='main'){
            await route.fulfill({status:404,contentType:'application/json',
              headers:{'access-control-allow-origin':'*'},body:'{}'});
            return;
          }
          await route.fulfill({status:200,contentType:'application/json',
            headers:{'access-control-allow-origin':'*'},
            body:JSON.stringify({type:'file',name:file,sha:gitSha(bytes),
              encoding:'base64',content:bytes.toString('base64')})});
        });
      const response=await page.goto(BASE+'/editor-v2.html?page='+name,
        {waitUntil:'domcontentloaded',timeout:45000});
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(/Academic Editor/i);
      await expect(page.locator('#liveAssetStatus'))
        .toContainText('GitHub main source verified',{timeout:35000});
      await expect(page.locator('#page')).toHaveValue(name);
      await expect(page.locator('#publish')).toHaveText('Publish live website');
      const frame=page.frameLocator('#livePageFrame');
      const heading=frame.locator('main h1:visible,main h2:visible').first();
      await expect(heading).toBeVisible();
      const original=await heading.evaluate(node=>
        node.ownerDocument.defaultView.getComputedStyle(node).textAlign);
      const desired=original==='right'?'center':'right';
      await heading.click();
      await expect(page.locator('#liveTextAlign')).toBeVisible();
      await page.locator('#liveTextAlign').selectOption(desired);
      await expect(heading).toHaveCSS('text-align',desired);
      await page.locator('#save').click();
      const saved=await page.evaluate(file=>
        localStorage.getItem('moon-academic-editor-v2:source:'+file),name);
      expect(JSON.parse(saved).length).toBeGreaterThan(0);
      await page.locator('#preview').click();
      await expect(page.locator('#previewDialog')).toBeVisible({timeout:20000});
      await expect(page.frameLocator('#previewFrame')
        .locator('main h1:visible,main h2:visible').first())
        .toHaveCSS('text-align',desired);
      await page.locator('#closePreview').click();
      expect(writes).toEqual([]);
      await page.reload({waitUntil:'domcontentloaded'});
      await expect(page.locator('#liveAssetStatus'))
        .toContainText('GitHub main source verified',{timeout:35000});
      await expect(frame.locator('main h1:visible,main h2:visible').first())
        .toHaveCSS('text-align',desired);
      expect(writes).toEqual([]);
    });
}
