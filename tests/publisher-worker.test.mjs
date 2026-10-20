import test from "node:test";
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import worker,{__testing as util} from "../publisher/worker.mjs";

const origin="https://gmoon-code.github.io";
const env={
 ALLOWED_ORIGIN:origin,
 GITHUB_CLIENT_ID:"test-client",
 GITHUB_CLIENT_SECRET:"test-client-secret",
 ALLOWED_GITHUB_LOGIN:"gmoon-code",
 OAUTH_REDIRECT_URI:origin+"/editor.html",
 SESSION_KEY_B64:randomBytes(32).toString("base64url")
};
const page="<!doctype html><html><head><script src=\"appearance.js\"></script>"+
 "<link rel=\"stylesheet\" href=\"site-theme.css\"><meta charset=\"utf-8\"></head>"+
 "<body><main id=\"main\"><h1>Original title</h1></main></body></html>";
const edited=page.replace("Original title","Revised title");
function request(endpoint,body,token,requestOrigin=origin,method="POST"){
 return new Request("https://private-editor.example.test"+endpoint,{
  method,headers:{"Origin":requestOrigin,
   ...(method==="POST"?{"Content-Type":"application/json"}:{}),
   ...(token?{"Authorization":"Bearer "+token}:{})},
  ...(method==="POST"?{body:JSON.stringify(body)}:{})
 });
}
function json(value,status=200){return new Response(JSON.stringify(value),{
 status,headers:{"Content-Type":"application/json"}});}
async function withMockFetch(mock,fn) {
 const previous=globalThis.fetch;
 globalThis.fetch=mock;
 try{return await fn()} finally{globalThis.fetch=previous}
}
test("approve only portfolio HTML pages and preserve protected resources",()=>{
 assert.equal(util.ALLOWED_PAGES.size,17);
 assert.doesNotThrow(()=>util.validateEdit("index.html",page,edited));
 assert.throws(()=>util.validateEdit("../index.html",page,edited),/approved/);
 assert.throws(()=>util.validateEdit("editor.js",page,edited),/approved/);
 assert.throws(()=>util.validateEdit("index.html",page,page),/no changes/);
 assert.throws(()=>util.validateEdit("index.html",page,
  edited.replace("appearance.js","malicious.js")),/Scripts/);
 assert.throws(()=>util.validateEdit("index.html",page,
  edited.replace("site-theme.css","untrusted.css")),/Scripts/);
 assert.throws(()=>util.validateEdit("index.html",page,
  edited.replace("</main>","<img onerror=\"alert(1)\"></main>")),/executable/);
 assert.throws(()=>util.validateEdit("index.html",page,
  edited.replace("</main>","<img src=x onerror=alert(1)></main>")),/executable/,
  "Unquoted event handlers must be blocked");
 assert.throws(()=>util.validateEdit("index.html",page,
  edited.replace("</main>",'<a href=javascript:alert(1)>bad</a></main>')),/executable/,
  "Dangerous unquoted URL schemes must be blocked");
 assert.throws(()=>util.validateEdit("index.html",page,
  edited.replace("</main>",'<iframe srcdoc=hello></iframe></main>')),/executable/,
  "Added active embedded documents must be blocked");
 assert.throws(()=>util.validateEdit("index.html",page,
  edited.replace("</main>",'<div style="width:expression(alert(1))">unsafe</div></main>')),/executable/,
  "Executable style expressions must be blocked");
});
test("encrypt, authenticate, expire and reject tampered publishing sessions",async()=>{
 const token=await util.issueSession(env,"gmoon-code","private-github-token");
 assert(!token.includes("private-github-token"));
 const claim=await util.verifySession(env,token);
 assert.equal(claim.login,"gmoon-code");
 assert.equal(claim.githubToken,"private-github-token");
 assert.equal(await util.verifySession(env,token+"x"),null);
 assert.equal(await util.verifySession(env,"no-such-session"),null);
 const unauthorized=await util.issueSession(env,"other-owner","abc");
 assert.equal(await util.verifySession(env,unauthorized),null);
});
test("reject foreign origins, unavailable publishing and missing sessions",async()=>{
 const status=await worker.fetch(request("/status",null,null,origin,"GET"),env);
 assert.equal(status.status,200);
 assert.equal((await status.json()).configured,true);
 const forbidden=await worker.fetch(request("/status",null,null,"https://example.com","GET"),env);
 assert.equal(forbidden.status,403);
 const unauthorized=await worker.fetch(request("/proposals",{},null),env);
 assert.equal(unauthorized.status,401);
 const disabled=await worker.fetch(request("/status",null,null,origin,"GET"),{
  ...env,GITHUB_CLIENT_SECRET:""
 });
 assert.equal((await disabled.json()).configured,false);
});
test("exchange GitHub App user authorization only for allowed owner",async()=>{
 await withMockFetch(async(input,options={})=>{
  const u=String(input);
  if(u.endsWith("/login/oauth/access_token"))return json({access_token:"user-test-token"});
  if(u.endsWith("/user"))return json({login:"gmoon-code"});
  throw new Error("Unexpected request "+u);
 },async()=>{
  const result=await worker.fetch(request("/oauth/exchange",{code:"VALID-code-123"}),env);
  assert.equal(result.status,200);
  const data=await result.json();
  assert.equal(data.login,"gmoon-code");
  assert.equal((await util.verifySession(env,data.session)).githubToken,"user-test-token");
 });
 await withMockFetch(async(input)=>{
  if(String(input).endsWith("/login/oauth/access_token"))return json({access_token:"another-token"});
  if(String(input).endsWith("/user"))return json({login:"not-gmoon-code"});
  throw new Error("Unexpected request");
 },async()=>{
  const result=await worker.fetch(request("/oauth/exchange",{code:"OTHER-code-123"}),env);
  assert.equal(result.status,403);
 });
});
test("create draft PR on new branch without modifying main and reject stale pages",async()=>{
 const token=await util.issueSession(env,"gmoon-code","test-token");
 const sha=await util.digest(page);
 const calls=[];
 await withMockFetch(async(input,options={})=>{
  const url=String(input);
  const method=options.method||"GET";
  const body=options.body?JSON.parse(options.body):null;
  calls.push({url,method,body});
  const path=url.replace("https://api.github.com","");
  if(method==="GET"&&path.endsWith("/git/ref/heads/main"))
    return json({object:{sha:"a".repeat(40)}});
  if(method==="GET"&&path.includes("/contents/index.html?ref="))
    return json({type:"file",sha:"b".repeat(40),content:Buffer.from(page).toString("base64")});
  if(method==="POST"&&path.endsWith("/git/refs"))
    return json({ref:body.ref},201);
  if(method==="PUT"&&path.endsWith("/contents/index.html"))
    return json({content:{sha:"c".repeat(40)}},201);
  if(method==="POST"&&path.endsWith("/pulls"))
    return json({number:42,html_url:"https://github.com/gmoon-code/gmoon-code.github.io/pull/42"},201);
  throw Error(method+" "+path);
 },async()=>{
  const result=await worker.fetch(request("/proposals",{
    path:"index.html",sourceHash:sha,content:edited,summary:"Update home title"
  },token),env);
  assert.equal(result.status,201,await result.clone().text());
  assert.equal((await result.json()).number,42);
  const createRef=calls.find(x=>x.url.endsWith("/git/refs")&&x.method==="POST");
  assert.match(createRef.body.ref,/^refs\/heads\/editor\/review-/);
  const put=calls.find(x=>x.method==="PUT");
  assert.equal(put.body.branch,createRef.body.ref.replace("refs/heads/",""));
  assert.equal(Buffer.from(put.body.content,"base64").toString("utf8"),edited);
  const pr=calls.find(x=>x.url.endsWith("/pulls")&&x.method==="POST");
  assert.equal(pr.body.draft,true);
  assert.equal(pr.body.base,"main");
  assert.equal(pr.body.head,put.body.branch);
  assert(!calls.some(x=>x.method==="PUT"&&x.body?.branch==="main"));
  const stale=await worker.fetch(request("/proposals",{
    path:"index.html",sourceHash:"0".repeat(64),content:edited,summary:"Stale"
  },token),env);
  assert.equal(stale.status,409);
 });
});


test("validate staged image signatures, sizes and file hashes",async()=>{
 const binary=Buffer.alloc(45);
 Buffer.from([137,80,78,71,13,10,26,10]).copy(binary,0);
 binary.write("IHDR",12,"ascii");
 binary.writeUInt32BE(16,16);
 binary.writeUInt32BE(16,20);
 const base64=binary.toString("base64");
 const actual=Buffer.from(await crypto.subtle.digest("SHA-256",binary))
   .toString("hex");
 const media={
   path:"assets/editor-testupload-abcdef1234.png",
   mime:"image/png",base64,sha256:actual
 };
 const updated=edited.replace("</main>",'<img src="'+media.path+'" alt="New photograph"></main>');
 const checked=await util.validateMedia(media,updated);
 assert.equal(checked.bytes,binary.length);
 assert.equal(checked.path,media.path);
 await assert.rejects(util.validateMedia({...media,sha256:"0".repeat(64)},updated),/checksum/);
 await assert.rejects(util.validateMedia({...media,mime:"image/jpeg"},updated),/type/);
 await assert.rejects(util.validateMedia({...media,path:"assets/../../escape.png"},updated),/path/);
 await assert.rejects(util.validateMedia({...media,base64:Buffer.from("not an image").toString("base64")},updated),/signature|limit/);
});
test("create a two-file draft PR with a new image and updated page",async()=>{
 const binary=Buffer.alloc(45);
 Buffer.from([137,80,78,71,13,10,26,10]).copy(binary,0);
 binary.write("IHDR",12,"ascii");
 binary.writeUInt32BE(18,16);binary.writeUInt32BE(18,20);
 const media={
  path:"assets/editor-photo-abcdef1234.png",
  mime:"image/png",
  base64:binary.toString("base64"),
  sha256:Buffer.from(await crypto.subtle.digest("SHA-256",binary)).toString("hex")
 };
 const updated=page.replace("Original title","Revised title").replace("</main>",
   '<img src="'+media.path+'" alt="Sample image"></main>');
 const sourceHash=await util.digest(page);
 const token=await util.issueSession(env,"gmoon-code","test-token");
 const calls=[];
 await withMockFetch(async(input,options={})=>{
  const uri=String(input),method=options.method||"GET",body=options.body?JSON.parse(options.body):null;
  calls.push({uri,method,body});
  if(uri.endsWith("/git/ref/heads/main"))return json({object:{sha:"a".repeat(40)}});
  if(uri.includes("/contents/index.html?ref="))
   return json({type:"file",sha:"b".repeat(40),content:Buffer.from(page).toString("base64")});
  if(uri.includes("/contents/"+media.path+"?ref="))return json({message:"Not Found"},404);
  if(method==="POST"&&uri.endsWith("/git/refs"))return json({ref:body.ref},201);
  if(method==="PUT"&&uri.includes("/contents/"))return json({content:{sha:"d".repeat(40)}},201);
  if(method==="POST"&&uri.endsWith("/pulls"))
   return json({number:51,html_url:"https://github.com/gmoon-code/gmoon-code.github.io/pull/51"},201);
  throw Error("Unexpected "+method+" "+uri);
 },async()=>{
  const response=await worker.fetch(request("/proposals",{
   path:"index.html",sourceHash,content:updated,summary:"Add one photograph",media
  },token),env);
  assert.equal(response.status,201,await response.clone().text());
  const puts=calls.filter(x=>x.method==="PUT");
  assert.equal(puts.length,2,"Binary and HTML files must be committed on the review branch");
  assert(puts[0].uri.includes("/contents/"+media.path));
  assert.equal(puts[0].body.content,media.base64);
  assert(puts[1].uri.includes("/contents/index.html"));
  assert.equal(puts[0].body.branch,puts[1].body.branch);
  const pr=calls.find(x=>x.method==="POST"&&x.uri.endsWith("/pulls"));
  assert.equal(pr.body.draft,true);
  assert.equal(pr.body.head,puts[1].body.branch);
 });
});
