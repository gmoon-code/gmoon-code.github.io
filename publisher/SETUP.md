# Secure visual-editor publishing setup

The visual editor includes an **optional** private proposal service implemented in `publisher/worker.mjs`. No private service is currently connected. The public editor remains useful for local drafting and HTML export until the owner chooses to configure publishing.

## What it does

After a verified GitHub sign-in from the approved owner, the service accepts a replacement for **one of the 17 explicitly allowlisted portfolio HTML pages**. It checks that the submitted page was edited from the current `main` version, verifies document structure and unchanged scripts, stylesheets and metadata, creates a **new branch**, and opens a **draft pull request**. It never commits directly to `main`, merges, or modifies a second repository.

The server requires HTTPS and verifies the exact origin `https://gmoon-code.github.io`. Its OAuth code exchange and GitHub token are performed on the server. It sends an AES-GCM encrypted, 15-minute session credential to the browser and never sends the GitHub token in plaintext. The encrypted session remains in JavaScript memory and is lost when the page reloads. The browser stores only an OAuth anti-CSRF state value temporarily in session storage.

A draft PR still requires inspection and approval in GitHub. The file itself is a public website file, so do not use the editor for private or identifying content before publication.

## Owner configuration required

The following steps must be performed by the repository owner. **None of them has been carried out automatically.**

1. Register a GitHub App under the owner account. Set its **web application authorization callback** to `https://gmoon-code.github.io/editor.html`. Enable user-to-server authorization. Install it for **only** the `gmoon-code/gmoon-code.github.io` repository. Grant repository **Contents Read & Write**, **Pull requests Read & Write**, and **Metadata Read**. No organization access is needed.
2. Deploy a Cloudflare Worker using `publisher/worker.mjs` as its entry point. A template is provided at `publisher/wrangler.toml`.
3. In the Worker's secret settings, configure
   - `GITHUB_CLIENT_ID`, the GitHub App's public client ID (also used by the editor)
   - `GITHUB_CLIENT_SECRET`, its private client secret
   - `SESSION_KEY_B64`, an independently generated **32-byte** random AES-GCM key, base64url encoded
4. Set the non-secret Worker variables to
   - `ALLOWED_ORIGIN=https://gmoon-code.github.io`
   - `OAUTH_REDIRECT_URI=https://gmoon-code.github.io/editor.html`
   - `ALLOWED_GITHUB_LOGIN=gmoon-code`
5. Verify the Worker is available at a trusted HTTPS address. From the website's origin, `GET /status` must return `configured:true`, without exposing any secrets.
6. Update only the public values in `editor-publisher-config.js`. Set `apiBase` to the HTTPS Worker origin and `clientId` to the GitHub App client ID. Do not add the client secret, AES key, installation token, or an API access token to the frontend.
7. Re-run the automated browser tests and the mocked Worker tests. Then follow the editor's **Connect GitHub → Review changes → Create draft pull request** flow. Verify the draft PR changes only the intended file, its base is `main`, and the public website remains unchanged until merge.

If the private Worker is not configured, GitHub sign-in and proposing changes remain disabled. **HTML export still works.** No arbitrary endpoint or credentials are requested from visitors.

## Publishing service API

- `GET /status` responds with the configured state and no credentials.
- `POST /oauth/exchange` accepts a single GitHub authorization code and returns an encrypted session only after GitHub identifies the exact authorized owner.
- `POST /proposals` requires `Authorization: Bearer SESSION` and JSON `{path,sourceHash,content,summary}`; `sourceHash` is a SHA-256 digest of the HTML source fetched when the page was opened. A mismatch returns HTTP 409 so the editor cannot overwrite newer work.

All mutation endpoints require `Origin: https://gmoon-code.github.io` and JSON content. The resulting PR is created as a draft.

## Security boundaries

- **No auto-merge and no production write**. The GitHub App may create a proposed branch and draft PR, but approval happens through GitHub.
- **No public API secrets**. OAuth exchange uses the Worker-only client secret.
- **No access to other repos**. Install the App only for the portfolio, and the Worker code hardcodes that repository and all approved page paths.
- **No cross-origin publishing**. The service checks and returns CORS headers for the single approved Pages origin.
- **Expired-session rejection**. Browser sessions expire after 15 minutes and are neither placed in local storage nor kept after reload.
- **Concurrent editing protection**. Changed baseline content is rejected before creating a branch.
- **Reviewable diff**. The editor shows a before-and-after review, and the GitHub PR allows final diff inspection, build checks and manual merge.
- **Changed scripts and unsafe inserts blocked**. The service compares scripts, style tags, stylesheets and document metadata and rejects newly introduced executable tags and attributes.

The service is suitable for a private, owner-operated authoring workflow. Additional safeguards such as authenticated per-user audit logging, rate limiting, PR linting, and protection against malformed legacy HTML are recommended before granting more accounts access.

## Testing and operational notes

The pure publishing checks and a mocked GitHub API flow are exercised by `node --test tests/publisher-worker.test.mjs` using synthetic tokens. These tests do not require any production secrets. The GitHub Actions workflow `editor-publisher-tests.yml` runs them automatically on relevant pull requests.

The existing Chromium smoke test remains `tests/editor-smoke.mjs`. It tests editing without a publisher connection. Server-side OAuth and pull-request creation must additionally be tested against a real GitHub App installation before a production launch.

If GitHub OAuth or the Worker is unavailable, the editor should fail closed and retain the original local draft. Publishing a new content release must never be necessary for students or public visitors.

## Research Methods Studio and The Story Method

The shared editor should eventually use the same page selection, inspector, draft review and responsive preview. **It should not use this HTML-patching publisher for either application.**

Research Methods Studio already has an authenticated Content Studio backed by versioned content publication. Its content schema and validation must remain the authoritative publishing layer.

The Story Method uses frozen structured curriculum files, with cross-referenced scenes and review targets. A visual authoring adapter must preserve record identities and pass its established curricular QA gates before publishing.

The current publisher is intentionally limited to the portfolio to avoid weakening those systems.
