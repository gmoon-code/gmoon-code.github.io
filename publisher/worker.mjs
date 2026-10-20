/**
 * Moon portfolio proposal publisher, designed for Cloudflare Workers.
 *
 * Required runtime secrets:
 * GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, SESSION_KEY_B64 (32-byte AES key)
 *
 * Non-secret runtime settings:
 * ALLOWED_ORIGIN=https://gmoon-code.github.io
 * OAUTH_REDIRECT_URI=https://gmoon-code.github.io/editor.html
 * ALLOWED_GITHUB_LOGIN=gmoon-code
 *
 * Uses GitHub App user-to-server OAuth. The GitHub token is encrypted inside
 * a short-lived opaque session, never sent to browser JavaScript as plaintext.
 * All content changes become review-only pull requests on a new branch.
 */
const REPO="gmoon-code/gmoon-code.github.io";
const OWNER="gmoon-code";
const BASE_BRANCH="main";
const ALLOWED_PAGES=new Set([
  "index.html","research.html","projects.html","teaching.html","interests.html",
  "about.html","cv.html","pungmul.html","research-action.html",
  "research-scoping.html","writing-biological-classification.html",
  "research-methods-studio.html","story-method.html","teaching-ap-biology.html",
  "teaching-ap-chemistry.html","teaching-ap-evolution.html","teaching-osmosis-practice.html"
]);
const MAX_CONTENT=250000;
const API="https://api.github.com";
const enc=new TextEncoder();
const dec=new TextDecoder();
const SESSION_TTL_SECONDS=15*60;

function responseJson(object,status=200,extraHeaders={}) {
  return new Response(JSON.stringify(object),{
    status,headers:{"Content-Type":"application/json; charset=utf-8",
      "Cache-Control":"no-store","X-Content-Type-Options":"nosniff",...extraHeaders}
  });
}
function errorJson(message,status=400) {
  return responseJson({ok:false,error:message},status);
}
function base64url(bytes) {
  let s="";for(const b of bytes)s+=String.fromCharCode(b);
  return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function fromBase64url(s) {
  const b64=s.replace(/-/g,"+").replace(/_/g,"/");
  const raw=atob(b64+"=".repeat((4-b64.length%4)%4));
  return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
async function aesKey(env) {
  const secret=fromBase64url(env.SESSION_KEY_B64||"");
  if(secret.length!==32)throw new Error("Publisher session key must be 32 bytes");
  return crypto.subtle.importKey("raw",secret,"AES-GCM",false,["encrypt","decrypt"]);
}
async function issueSession(env,login,githubToken) {
  const issued=Math.floor(Date.now()/1000);
  const body=enc.encode(JSON.stringify({
    version:1,login,githubToken,issued,exp:issued+SESSION_TTL_SECONDS
  }));
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ciphertext=await crypto.subtle.encrypt(
    {name:"AES-GCM",iv,additionalData:enc.encode("moon-publisher-session-v1")},
    await aesKey(env),body
  );
  return base64url(iv)+"."+base64url(new Uint8Array(ciphertext));
}
async function verifySession(env,token) {
  if (!token||token.length>4096||!token.includes("."))return null;
  try{
    const [ivText,dataText,...rest]=token.split(".");
    if(rest.length)return null;
    const iv=fromBase64url(ivText);
    if(iv.length!==12)return null;
    const data=fromBase64url(dataText);
    const raw=await crypto.subtle.decrypt(
      {name:"AES-GCM",iv,additionalData:enc.encode("moon-publisher-session-v1")},
      await aesKey(env),data
    );
    const claim=JSON.parse(dec.decode(raw));
    const now=Math.floor(Date.now()/1000);
    if(claim.version!==1||typeof claim.githubToken!=="string"||
      !claim.githubToken||claim.login!==(env.ALLOWED_GITHUB_LOGIN||OWNER)||
      !Number.isSafeInteger(claim.exp)||claim.exp<=now||
      !Number.isSafeInteger(claim.issued)||claim.issued>now+30||
      claim.exp-claim.issued>SESSION_TTL_SECONDS)return null;
    return claim;
  }catch{return null;}
}
function headers(token) {
  return {"Accept":"application/vnd.github+json",
    "X-GitHub-Api-Version":"2026-03-10",
    "User-Agent":"moon-portfolio-editor-publisher",
    ...(token?{"Authorization":"Bearer "+token}:{})};
}
async function github(path,token,options={}) {
  const result=await fetch(API+path,{
    method:options.method||"GET",
    headers:{...headers(token),...(options.body?{"Content-Type":"application/json"}:{})},
    body:options.body?JSON.stringify(options.body):undefined
  });
  const payload=await result.json().catch(()=>({}));
  if(!result.ok) {
    const description=typeof payload.message==="string"?payload.message:"GitHub rejected the request";
    const error=new Error("GitHub "+result.status+": "+description.slice(0,160));
    error.status=result.status;throw error;
  }
  return payload;
}
function decodeGithubContent(content) {
  if(typeof content!=="string")throw new Error("Invalid GitHub content payload");
  const raw=atob(content.replace(/\s/g,""));
  return dec.decode(Uint8Array.from(raw,c=>c.charCodeAt(0)));
}
function encodeGithubContent(text) {
  return base64url(enc.encode(text)).replace(/-/g,"+").replace(/_/g,"/")+
    "=".repeat((4-base64url(enc.encode(text)).length%4)%4);
}
async function digest(text) {
  const hash=new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(text)));
  return Array.from(hash,b=>b.toString(16).padStart(2,"0")).join("");
}
function protectedTokens(text) {
  return [
    [...text.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map(m=>m[0]),
    [...text.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/gi)].map(m=>m[0]),
    [...text.matchAll(/<link\b[^>]*>/gi)].map(m=>m[0]),
    [...text.matchAll(/<meta\b[^>]*>/gi)].map(m=>m[0])
  ];
}
function validateEdit(path,previous,edited) {
  if(!ALLOWED_PAGES.has(path))throw new Error("This page is not an approved editorial target");
  if(typeof edited!=="string"||edited.length<100||enc.encode(edited).length>MAX_CONTENT)
    throw new Error("The edited page exceeds the size limits");
  if(previous===edited)throw new Error("The submitted page has no changes");
  if(!/^<!doctype html>/i.test(edited.trimStart())||
    !/<main\b/i.test(edited)||!/<\/main>/i.test(edited))
    throw new Error("The edited HTML must preserve the page structure");
  const oldTokens=protectedTokens(previous),newTokens=protectedTokens(edited);
  if(JSON.stringify(oldTokens)!==JSON.stringify(newTokens))
    throw new Error("Scripts, stylesheets, and document metadata must stay unchanged");
  /* Compare full risky attribute values, including unquoted handlers.
     This also prevents swapping handler code while keeping the same name. */
  const riskyPatterns=[
    /\bon[a-z][a-z0-9_-]*\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
    /\b(?:href|src|srcset|action|formaction|xlink:href)\s*=\s*["']?\s*(?:javascript|data|vbscript)\s*:/gi,
    /\bsrcdoc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
    /<\s*(?:iframe|object|embed|form|svg|math|template|base)\b[^>]*>/gi,
    /(?:expression\s*\(|url\s*\(\s*["']?\s*javascript\s*:)/gi
  ];
  for(const pattern of riskyPatterns){
    const oldMatches=previous.match(pattern)||[];
    const newMatches=edited.match(pattern)||[];
    if(JSON.stringify(oldMatches)!==JSON.stringify(newMatches))
      throw new Error("New executable HTML or active embeds are not permitted");
  }
}
function originAllowed(origin,env) {
  return origin===(env.ALLOWED_ORIGIN||"https://gmoon-code.github.io");
}
function corsHeaders(origin) {
  return {"Access-Control-Allow-Origin":origin,
    "Access-Control-Allow-Methods":"POST,GET,OPTIONS",
    "Access-Control-Allow-Headers":"Authorization, Content-Type",
    "Access-Control-Max-Age":"600",
    "Vary":"Origin",
    "Referrer-Policy":"no-referrer"};
}
async function parseJson(request) {
  const length=Number(request.headers.get("Content-Length")||"0");
  if(length>MAX_CONTENT*2)throw new Error("Request too large");
  const text=await request.text();
  if(enc.encode(text).length>MAX_CONTENT*2)throw new Error("Request too large");
  try{return JSON.parse(text);}catch{throw new Error("Invalid request JSON");}
}
async function exchangeOAuth(body,env) {
  if(!body||typeof body.code!=="string"||
    !/^[\w-]{4,256}$/.test(body.code))throw new Error("Invalid authorization code");
  if(!env.GITHUB_CLIENT_ID||!env.GITHUB_CLIENT_SECRET)
    throw new Error("GitHub authorization is not configured");
  const redirect=env.OAUTH_REDIRECT_URI||"https://gmoon-code.github.io/editor.html";
  const result=await fetch("https://github.com/login/oauth/access_token",{
    method:"POST",
    headers:{"Accept":"application/json","Content-Type":"application/json"},
    body:JSON.stringify({client_id:env.GITHUB_CLIENT_ID,
      client_secret:env.GITHUB_CLIENT_SECRET,code:body.code,redirect_uri:redirect})
  });
  const auth=await result.json().catch(()=>({}));
  if(!result.ok||!auth.access_token)throw new Error("GitHub authorization failed");
  const user=await github("/user",auth.access_token);
  if(user.login!==(env.ALLOWED_GITHUB_LOGIN||OWNER))
    throw new Error("This GitHub account is not authorized to publish");
  const token=await issueSession(env,user.login,auth.access_token);
  return {ok:true,login:user.login,session:token,expiresIn:SESSION_TTL_SECONDS};
}
async function propose(body,session) {
  const path=body?.path;
  if(typeof path!=="string"||!ALLOWED_PAGES.has(path))
    throw new Error("Unsupported page");
  if(!/^[a-f0-9]{64}$/i.test(body?.sourceHash||""))
    throw new Error("Missing source version checksum");
  const content=body?.content;
  const summary=typeof body?.summary==="string"?body.summary.trim():"";
  if(!summary||summary.length>140||/[\u0000-\u001f]/.test(summary))
    throw new Error("Provide a short change summary");
  const token=session.githubToken;
  const base=await github("/repos/"+REPO+"/git/ref/heads/"+BASE_BRANCH,token);
  const baseSha=base.object?.sha;
  if(!/^[a-f0-9]{40}$/.test(baseSha||""))
    throw new Error("Could not identify the current release");
  const current=await github("/repos/"+REPO+"/contents/"+encodeURIComponent(path)+
    "?ref="+encodeURIComponent(BASE_BRANCH),token);
  if(!current.sha||current.type!=="file")throw new Error("Cannot read the current page");
  const oldContent=decodeGithubContent(current.content);
  if(await digest(oldContent)!==body.sourceHash.toLowerCase())
    throw new Error("The live page has changed since this draft was created. Reload and review the differences.");
  validateEdit(path,oldContent,content);
  const branchName="editor/review-"+Date.now().toString(36)+"-"+
    base64url(crypto.getRandomValues(new Uint8Array(5))).toLowerCase();
  await github("/repos/"+REPO+"/git/refs",token,{
    method:"POST",body:{ref:"refs/heads/"+branchName,sha:baseSha}
  });
  await github("/repos/"+REPO+"/contents/"+encodeURIComponent(path),token,{
    method:"PUT",body:{message:"Propose website edit: "+path,
      content:encodeGithubContent(content),sha:current.sha,branch:branchName}
  });
  const pr=await github("/repos/"+REPO+"/pulls",token,{
    method:"POST",body:{
      title:"Website edit: "+path+" · "+summary,
      head:branchName,base:BASE_BRANCH,draft:true,
      body:"## Visual editor proposal\n\n"+summary+
        "\n\nEdited page: \`"+path+"\`\n\nCreated by the owner through the visual editor. "+
        "Review the GitHub diff and test the page before merging.\n\n"+
        "This pull request does not publish changes automatically."
    }
  });
  if(typeof pr.html_url!=="string"||!/^https:\/\/github\.com\/gmoon-code\/gmoon-code\.github\.io\/pull\/\d+$/.test(pr.html_url))
    throw new Error("GitHub did not return a valid review link");
  return {ok:true,url:pr.html_url,number:pr.number,branch:branchName};
}
function configured(env) {
  return !!(env.GITHUB_CLIENT_ID&&env.GITHUB_CLIENT_SECRET&&env.SESSION_KEY_B64);
}
export default {
  async fetch(request,env) {
    const origin=request.headers.get("Origin")||"";
    if(!originAllowed(origin,env))return errorJson("Origin not allowed",403);
    const cors=corsHeaders(origin);
    const method=request.method.toUpperCase();
    if(method==="OPTIONS")return new Response(null,{status:204,headers:cors});
    const url=new URL(request.url);
    const finish=(result)=>{
      const headersNew=new Headers(result.headers);
      for(const [name,value] of Object.entries(cors))headersNew.set(name,value);
      return new Response(result.body,{status:result.status,headers:headersNew});
    };
    if(method==="GET"&&url.pathname==="/status"){
      return finish(responseJson({ok:true,configured:configured(env)}));
    }
    if(!configured(env))return finish(errorJson("Publisher has not been configured",503));
    if(method!=="POST"||!["/oauth/exchange","/proposals"].includes(url.pathname))
      return finish(errorJson("Unknown endpoint",404));
    if(!/application\/json/i.test(request.headers.get("Content-Type")||""))
      return finish(errorJson("Expected JSON",415));
    try {
      const body=await parseJson(request);
      if(url.pathname==="/oauth/exchange"){
        const data=await exchangeOAuth(body,env);
        return finish(responseJson(data));
      }
      const bearer=request.headers.get("Authorization")||"";
      if(!bearer.startsWith("Bearer "))return finish(errorJson("Authentication required",401));
      const session=await verifySession(env,bearer.slice(7));
      if(!session)return finish(errorJson("Session expired. Connect GitHub again.",401));
      const result=await propose(body,session);
      return finish(responseJson(result,201));
    } catch(error) {
      const message=error?.message||"Unable to process request";
      const status=message.includes("GitHub 403")?403:
        message.includes("GitHub 401")?401:
        message.includes("not authorized")?403:
        message.includes("live page has changed")?409:
        message.includes("Request too large")?413:
        /GitHub [45]\d\d/.test(message)?502:400;
      return finish(errorJson(message,status));
    }
  }
};
export const __testing={digest,validateEdit,issueSession,verifySession,encodeGithubContent,decodeGithubContent,ALLOWED_PAGES};
