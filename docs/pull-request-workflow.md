# feedback to draft PR

Unified attempts small React UI and documentation fixes. an owner picks an issue, supplies acceptance criteria, connects a GitHub repository. GitHub checks are observed automatically when the repository reports them. assessment reads the repository before deciding whether to attempt a patch.

```
workbench issue + acceptance criteria
  -> repository tree at an immutable commit
  -> select and cache relevant files by blob SHA
  -> assess scope against those files
  -> owner chooses attempt
  -> exact replacements in at most 3 existing files
  -> deterministic patch validation
  -> new branch + draft PR
  -> GitHub review + reported checks
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
- a failed GitHub check leaves the draft for human attention. no checks means manual review, never a claim that tests passed

## saved context

each run freezes the issue title and description, acceptance criteria, repository identity, base branch and commit, selected file paths and blob hashes, assessment, exact patch, lifecycle events, branch/PR identity and verification results. source file bodies are encrypted using the integration encryption key and cached per project/repository/blob SHA for 7 days. run details expose file metadata and the patch, never credentials or cached source bodies. cached context is bounded and expires, so we do not need a vector database or an unbounded chat history.

## checkpoints

1. this workflow and scope
2. GitHub connection, assessment and draft PR backend with lifecycle tests
3. sidebar page, issue handoff and run detail UI
4. verification and setup instructions

## setup

you need a GitHub App. repositories can use their existing CI, with no check-name setup in Unified. no GitHub credentials go into the frontend or into Groq prompts.

1. register a GitHub App with the callback URL `https://YOUR_BACKEND/api/github/callback`. for local work, the callback can use `http://localhost:8000/api/github/callback`.
2. grant repository permissions: Contents read/write, Pull requests read/write, Checks read-only, Commit statuses read-only, and Metadata read-only. do not request Actions, Administration or Workflows write access.
3. leave webhooks disabled, this implementation polls GitHub. leave “request user authorization during installation” off, authorization happens separately through our single-use state flow. an optional setup URL can point back to `/dashboard/pull-requests` on the frontend.
4. generate the app's private key and set `GITHUB_APP_ID`, `GITHUB_APP_SLUG`, `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`, `GITHUB_APP_PRIVATE_KEY` and `GITHUB_APP_CALLBACK_URL` in the backend environment. the PEM key accepts literal `\n` line separators. set `FRONTEND_URL` to the dashboard origin and share `INTEGRATION_ENCRYPTION_KEY` across backend replicas.
5. keep the existing Groq configuration. new jobs save the configured model so later changes to `GROQ_MODEL` do not silently change a queued run's model.
6. use a MongoDB replica set, already required by feedback/account deletion. creating a run shares a transactional project lock with deletion. the queue worker starts with the backend, scans every 15 seconds and claims jobs atomically. expired 10-minute leases stop for recovery, they never replay publication automatically.
7. open **Pull requests** and select a project. install the app using **Install GitHub App**, then choose **Connect GitHub**. choose **All repositories** in GitHub for future projects, or keep existing selections when adding a new repository. after authorization, choose a repository and press **Use repository**. other project connections remain unchanged. **Refresh repositories** updates the available list after GitHub access changes.
8. existing CI can run on `pull_request` or matching `push` events for `unified/fix-*` branches. Unified observes the checks automatically. failed, skipped or cancelled checks need human attention. a repository without checks goes to manual review, and the UI makes the lack of automated verification explicit.

OAuth user tokens are used only to prove repository access during connection and are never saved. workers mint short-lived installation tokens scoped to one repository. disconnect removes the connection and cached blobs, and stops status access. it leaves branches, drafts and historical run records intact. uninstall the app in GitHub to revoke its GitHub-side grant as well.

installation callbacks do not consume OAuth state. expired links return to the setup page with the repository entry preserved, and revisiting a completed callback returns to the connected project without exchanging the code again. the page gates issue assessment until a repository is connected. the account-level repository catalog contains metadata only and expires after 24 hours, existing project mappings remain available. no OAuth user token is retained.

## using it

open an issue in the workbench and choose **Assess for a PR**, or pick an issue from the new page. describe the exact behavior you want and how you expect a reviewer to verify the result. assessment selects files at an immutable source commit and explains whether the change fits our limits. successful assessments automatically queue the fix. you can inspect the file paths, hashes and execution trace while it runs. if an unpublished step fails, open its node and choose **Retry this run** to reassess the latest source. publication failures use **Recover publication** to avoid duplicate branches or PRs.

the worker generates one exact patch, checks its scope mechanically, and asks for a separate model preflight review. that review is not a test result. GitHub executes any existing CI after publication. inspect the proposed patch and actual CI output on GitHub before merging - this first version does not repair a failed CI run automatically.

**Recover publication** reconciles a stopped publication against its deterministic branch name. it reuses a PR that GitHub already created, creates a missing draft only when the branch still points to the exact generated commit, or closes the run when no branch exists. it never force-pushes or deletes a branch. a changed recovery branch needs a human.

starting a fix moves its workbench issue to **In progress**. a cancellation or pre-publication failure returns issues moved by Unified to **To do**, while manually started issues keep their status. an unmerged, closed PR also releases the issue back to **To do**.

after merging and releasing, choose **Mark shipped** and confirm. this marks the unchanged linked workbench issue done. the existing shipping worker processes opted-in reporters and its existing delivery deduplication. a closed, unmerged PR never triggers those notifications. editing the issue after generation prevents an old PR from silently resolving the new request.

## validation

```
npm test
npm run lint
npm run build
npm run test:pr-workspace --prefix frontend
```

the browser check uses local fixtures and the existing SDK Playwright dependency. build the frontend first. it checks assessment actions, saved context, release confirmation and overflow at 1440, 1024, 768 and 390px, and saves screenshots in a temporary directory. backend tests cover GitHub token scope, OAuth ownership, source caching, patch boundaries, worker concurrency, stale commits, cancelled jobs, publication recovery, CI states and the shipping gate.

the interactive pipeline uses React Flow (`@xyflow/react`), with opaque surfaces and step dialogs for source context, patches, errors, PR links and email progress. compact run records are retained so you can revisit the process, source file bodies still expire from the encrypted cache after 7 days. notification progress uses existing delivery records and contains counts, never recipient addresses.

a real GitHub/Groq end-to-end run needs an authorized repository. no real repository was connected or PR opened while building this feature.

API references: [GitHub installation tokens](https://docs.github.com/en/rest/apps/apps#create-an-installation-access-token-for-an-app), [Git trees](https://docs.github.com/en/rest/git/trees#create-a-tree), [draft pull requests](https://docs.github.com/en/rest/pulls/pulls#create-a-pull-request), and [Groq JSON output](https://console.groq.com/docs/structured-outputs).

## response reset

open a project's feedback page and choose **Reset responses** beside the response count. confirmation deletes that project's responses, shipping email opt-ins and AI summary. it clears response links on existing workbench issues and invalidates pending summary/digest work. the form, issues, PR runs and repository connection stay. a transaction serializes the reset with new submissions and project deletion, and a generation counter prevents older summaries from being saved afterward. a new response that arrives after the reset remains available.
