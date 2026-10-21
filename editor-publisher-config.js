/* Public connection settings only. No secret belongs in this file.
 * Fill both values after deploying the private publisher and registering
 * its GitHub App user-to-server callback.
 */
window.MoonEditorPublisherConfig = Object.freeze({
  apiBase: "",
  clientId: "",
  redirectUri: "https://gmoon-code.github.io/editor.html"
});