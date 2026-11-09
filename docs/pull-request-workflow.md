# feedback to draft PR

Unified attempts small React UI and documentation fixes. an owner picks an issue, supplies acceptance criteria, connects a GitHub repository and names an existing CI check. assessment reads the repository before deciding whether to attempt a patch.

```
workbench issue + acceptance criteria
  -> repository tree at an immutable commit
  -> select and cache relevant files by blob SHA
  -> assess scope against those files
  -> owner chooses attempt
  -> exact replacements in at most 3 existing files
  -> deterministic patch validation
  -> new branch + draft PR
  -> named GitHub CI check
  -> human review + merge
  -> owner marks shipped
  -> existing shipping notifications
```

## boundaries

- one active job per project, persisted in MongoDB, claimed with a lease
- no customer code executes on the API server
- no automatic merge or shipping notifications on PR creation or merge
- no dependencies, secrets, backend, auth, payments, migrations, infrastructure or workflow edits
- no file creation, deletion, rename, binary edits or test edits in this first version
- at most 8 context files, 48 KiB per file, 160 KiB combined, 3 edited files and 120 changed lines
- a changed base branch or issue requires a fresh assessment
- a failed or missing CI check leaves the draft available for a human, it never counts as verified

## saved context

each run freezes the issue title and description, acceptance criteria, repository identity, base branch and commit, selected file paths and blob hashes, assessment, exact patch, lifecycle events, branch/PR identity and verification results. source file bodies are encrypted using the integration encryption key and cached per project/repository/blob SHA for 7 days. run details expose file metadata and the patch, never credentials or cached source bodies. cached context is bounded and expires, so we do not need a vector database or an unbounded chat history.

## checkpoints

1. this workflow and scope
2. GitHub connection, assessment and draft PR backend with lifecycle tests
3. sidebar page, issue handoff and run detail UI
4. verification and setup instructions

## setup

you need a GitHub App and an existing CI workflow in each connected repository. no GitHub credentials go into the frontend or into Groq prompts.

1. register a GitHub App with the callback URL `https://YOUR_BACKEND/api/github/callback`. for local work, the callback can use `http://localhost:8000/api/github/callback`.
2. grant repository permissions: Contents read/write, Pull requests read/write, Checks read-only, Commit statuses read-only, and Metadata read-only. do not request Actions, Administration or Workflows write access.
3. leave webhooks disabled, this implementation polls GitHub. leave “request user authorization during installation” off, authorization happens separately through our single-use state flow. an optional setup URL can point back to `/dashboard/pull-requests` on the frontend.
4. generate the app's private key and set `GITHUB_APP_ID`, `GITHUB_APP_SLUG`, `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`, `GITHUB_APP_PRIVATE_KEY` and `GITHUB_APP_CALLBACK_URL` in the backend environment. the PEM key accepts literal `\n` line separators. set `FRONTEND_URL` to the dashboard origin and share `INTEGRATION_ENCRYPTION_KEY` across backend replicas.
5. keep the existing Groq configuration. new jobs save the configured model so later changes to `GROQ_MODEL` do not silently change a queued run's model.
6. use a MongoDB replica set, already required by feedback/account deletion. creating a run shares a transactional project lock with deletion. the queue worker starts with the backend, scans every 15 seconds and claims jobs atomically. expired 10-minute leases stop for recovery, they never replay publication automatically.
7. open **Pull requests** and select a project. the page shows one setup step at a time: **Allow access on GitHub**, **Connect repository**, then **Choose the test check**. paste a repository link or `owner/repository` in step 2. authorize GitHub, then pick a check from the names GitHub reports. PR-only checks can be entered manually. the connecting GitHub user must have write access and be able to see this app's installation on that repository.
8. the repository's CI must run on `pull_request` or matching `push` events for `unified/fix-*` branches. it must run for drafts and report the exact configured check name. a skipped, neutral, cancelled or failed check does not pass verification. missing checks stop for human attention after an hour.

OAuth user tokens are used only to prove repository access during connection and are never saved. workers mint short-lived installation tokens scoped to one repository. disconnect removes the connection and cached blobs, and stops status access. it leaves branches, drafts and historical run records intact. uninstall the app in GitHub to revoke its GitHub-side grant as well.

installation callbacks do not consume OAuth state. expired links return to the setup page with the repository entry preserved, and revisiting a completed callback returns to the connected project without exchanging the code again. the page gates issue assessment until the repository and test check are configured.

## using it

open an issue in the workbench and choose **Assess for a PR**, or pick an issue from the new page. describe the exact behavior you want and the existing check that should verify it. assessment selects files at an immutable source commit and explains whether the change fits our limits. you can inspect the file paths and hashes before choosing **Attempt fix & open draft**.

the worker generates one exact patch, checks its scope mechanically, and asks for a separate model preflight review. that review is not a test result. GitHub executes the repository's existing CI after publication. inspect the proposed patch and actual CI output on GitHub before merging - this first version does not repair a failed CI run automatically.

**Recover publication** reconciles a stopped publication against its deterministic branch name. it reuses a PR that GitHub already created, creates a missing draft only when the branch still points to the exact generated commit, or closes the run when no branch exists. it never force-pushes or deletes a branch. a changed recovery branch needs a human.

after merging and releasing, choose **Mark shipped** and confirm. this marks the unchanged linked workbench issue done. the existing shipping worker processes opted-in reporters and its existing delivery deduplication. a closed, unmerged PR never triggers those notifications. editing the issue after generation prevents an old PR from silently resolving the new request.

## validation

```
npm test
npm run lint
npm run build
npm run test:pr-workspace --prefix frontend
```

the browser check uses local fixtures and the existing SDK Playwright dependency. build the frontend first. it checks assessment actions, saved context, release confirmation and overflow at 1440, 1024, 768 and 390px, and saves screenshots in a temporary directory. backend tests cover GitHub token scope, OAuth ownership, source caching, patch boundaries, worker concurrency, stale commits, cancelled jobs, publication recovery, CI states and the shipping gate.

a real GitHub/Groq end-to-end run still needs the app credentials and a test repository with CI. no real repository was connected or PR opened while building this feature.

API references: [GitHub installation tokens](https://docs.github.com/en/rest/apps/apps#create-an-installation-access-token-for-an-app), [Git trees](https://docs.github.com/en/rest/git/trees#create-a-tree), [draft pull requests](https://docs.github.com/en/rest/pulls/pulls#create-a-pull-request), and [Groq JSON output](https://console.groq.com/docs/structured-outputs).

## response reset

open a project's feedback page and choose **Reset responses** beside the response count. confirmation deletes that project's responses, shipping email opt-ins and AI summary. it clears response links on existing workbench issues and invalidates pending summary/digest work. the form, issues, PR runs and repository connection stay. a transaction serializes the reset with new submissions and project deletion, and a generation counter prevents older summaries from being saved afterward. a new response that arrives after the reset remains available.
