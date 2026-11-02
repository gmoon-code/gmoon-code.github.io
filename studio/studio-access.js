/* Recovery and access tests for Website Studio publishing.
   Never logs or persists tokens beyond the user's existing session preference.
   The write test creates one unreferenced Git blob; it cannot modify a page. */
(() => {
  "use strict";
  const api=window.WebsiteStudioAPI;
  if(!api)return;
  const {state,github,setAccessToken,toast}=api;
  const $=id=>document.getElementById(id);
  const button=$("accessSettingsBtn");
  const failure=$("publishFailurePanel");
  if(!button||!failure)return;
  const dialog=document.createElement("dialog");
  dialog.className="studio-dialog studio-access-dialog";
  dialog.id="studioAccessDialog";
  dialog.setAttribute("aria-labelledby","studioAccessTitle");
  dialog.innerHTML=[
    '<div class="dialog-heading"><h2 id="studioAccessTitle">GitHub publishing access</h2>',
    '<button type="button" id="accessClose" class="plain-button">Close</button></div>',
    '<p class="micro-help">You can update your token without signing out or clearing this session’s drafts. When browser recovery is available, a local draft copy may also be saved.</p>',
    '<p class="micro-help">A token may connect to GitHub without permission to write to this repository. Check its Git object access here without changing any published page.</p>',
    '<button type="button" id="accessTestBtn" class="small-button">Check current publishing permission</button>',
    '<p id="accessCheckResult" role="status" class="access-result" aria-live="polite"></p>',
    '<details class="access-token-details"><summary>Replace my GitHub access token</summary>',
    '<p class="micro-help">On GitHub, edit or create a fine-grained token owned by <strong>gmoon-code</strong>. Choose <strong>Only select repositories</strong> → <strong>gmoon-code.github.io</strong>. Set <strong>Repository permissions → Contents → Read and write</strong>.</p>',
    '<p><a href="https://github.com/settings/personal-access-tokens" target="_blank" rel="noopener noreferrer">Open my GitHub access token settings ↗</a></p>',
    '<label for="accessNewToken">New access token</label>',
    '<input id="accessNewToken" type="password" autocomplete="off" spellcheck="false"',
    'placeholder="Paste the new token here">',
    '<button type="button" id="accessReplaceBtn" class="primary-button">Verify and use new token</button>',
    '</details>',
    '<p class="micro-help">The permission test writes a small unattached Git object to check Contents access. It does not create a commit, move the main branch, publish files, or change your drafts.</p>'
  ].join("");
  document.body.appendChild(dialog);
  let testing=false;
  function showResult(msg,fail=false){
    const p=$("accessCheckResult");
    p.textContent=msg;
    p.classList.toggle("is-error",fail);
  }
  function clearToken(){
    $("accessNewToken").value="";
  }
  function open(){
    if(!state.connected)return;
    showResult("");
    dialog.showModal();
  }
  function close(){clearToken();dialog.close();}
  async function verifyCurrent(){
    if(testing||state.busy)return;
    testing=true;$("accessTestBtn").disabled=true;
    showResult("Checking repository writing access…");
    try{
      const repo=await github("/repos/gmoon-code/gmoon-code.github.io");
      if(!repo?.permissions?.push)
        throw Error("GitHub reports that this token cannot push changes to this repository.");
      const probe=await github("/repos/gmoon-code/gmoon-code.github.io/git/blobs",{
        method:"POST",
        body:{content:"Website Studio publishing permission check",encoding:"utf-8"}
      });
      if(!probe.sha)throw Error("GitHub did not confirm the permission check.");
      showResult("GitHub accepted an unattached Git object. This does not test the full publishing process. You can close this panel and try Publish changes again.");
    }catch(error){
      showResult("GitHub write test failed. "+(error?.message||String(error)),true);
    }finally{
      testing=false;$("accessTestBtn").disabled=false;
    }
  }
  async function replaceToken(){
    if(testing||state.busy)return;
    const next=$("accessNewToken").value.trim();
    if(!next){showResult("Paste a new access token first.",true);return;}
    const oldToken=state.token;
    testing=true;$("accessReplaceBtn").disabled=true;
    showResult("Verifying the new token and testing its write permission…");
    try{
      state.token=next;
      const owner=await github("/user");
      if(String(owner?.login).toLowerCase()!=="gmoon-code")
        throw Error("This token belongs to a different account. Use a token for gmoon-code.");
      const repo=await github("/repos/gmoon-code/gmoon-code.github.io");
      if(!repo?.permissions?.push)
        throw Error("The new token does not have write access to this repository.");
      const blob=await github("/repos/gmoon-code/gmoon-code.github.io/git/blobs",{
        method:"POST",
        body:{content:"Website Studio token replacement permission check",encoding:"utf-8"}
      });
      if(!blob.sha)throw Error("GitHub did not confirm write access for this token.");
      state.token=oldToken;
      setAccessToken(next);
      clearToken();
      showResult("New token passed the GitHub write check and is connected. Your current drafts are unchanged. Review your changes and try publishing.");
      toast("GitHub access updated without signing out or clearing your drafts.");
    }catch(error){
      state.token=oldToken;
      showResult("The new token was not applied. "+(error?.message||String(error)),true);
    }finally{
      testing=false;$("accessReplaceBtn").disabled=false;
    }
  }
  button.addEventListener("click",open);
  $("publishAccessBtn").addEventListener("click",open);
  $("publishRetryBtn").addEventListener("click",()=>$("publishBtn").click());
  $("publishFailureDismiss").addEventListener("click",()=>{failure.hidden=true;});
  $("accessTestBtn").addEventListener("click",verifyCurrent);
  $("accessReplaceBtn").addEventListener("click",replaceToken);
  $("accessClose").addEventListener("click",close);
  dialog.addEventListener("close",clearToken);
  window.WebsiteStudioAccess={
    onPublishFailure:(description)=>{
      $("publishFailureDetails").textContent=description;
      failure.hidden=false;
      failure.scrollIntoView({block:"nearest",behavior:"smooth"});
    },
    onPublished:()=>{
      failure.hidden=true;
      showResult("");
    }
  };
})();