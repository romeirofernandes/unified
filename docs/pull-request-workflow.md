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

## response reset

there is no response-reset control or endpoint in this checkout, and none appeared in the local branch history search. resetting responses is separate from this feature - deleting evidence while a run is active needs an explicit policy first.
