# feedback workflow and prototype checkpoints

branch: `fix/feedback-workflow-and-prototypes`, created from local `main`.

## response and workbench changes

summary generation now receives the existing issue catalog, including completed and deleted cards. the model returns an existing issue ID for the same problem, even if its wording changes. reconciliation keeps that card's title, human description, position, status and deletion flag. exact-title matching remains a fallback, and unsupported suggestions cannot create a new card.

each suggested issue carries supporting response IDs and verbatim answer excerpts. the server checks that each excerpt appears in that particular original response before accepting the link. the summary, workbench reconciliation and response tags commit in one database transaction. the evidence panel reads these stored links, without another model request.

responses display coloured issue links even when their accordion is closed. those links, and the links in the summary, open the exact workbench card. completed issues have muted, struck-through text. the colour stays stable for the issue's lifetime.

older summaries regenerate once to acquire the new evidence format. existing cards are retained, including previously created duplicates, because automatically deleting them could discard separate human plans or statuses. subsequent analysis receives their IDs and can reuse them. AI still decides whether two reports describe the same issue, and an exact excerpt verifies its source rather than guaranteeing the model's interpretation.

## installed radio visibility

the SDK supplied runtime colour variables but did not declare Tailwind theme colours, so its build omitted the selected radio's `bg-primary` and `border-primary` utilities. the SDK now declares those colours. the packed consumer check verifies the dot's paint and geometry, the border after its transition, and keyboard selection. this is a source fix, not a published npm release.

## pull requests

successful assessments queue a fix automatically and move the linked issue into progress. the existing worker handles the queued patch. legacy eligible runs can still use their existing action.

failed nodes expose a retry action in their modal. unpublished runs restart assessment against the current source before fixing, which avoids repeatedly attempting a stale base commit. failures with a saved publication branch use recovery to reconcile the existing draft instead of opening another one. requests remain guarded by ownership, issue fingerprints, one active run per project and a retry rate limit.

Groq requests retain strict JSON schemas. successful HTTP responses are also checked locally against the schema. truncated or malformed output gets one correction attempt with a larger output allowance, capped at 8,192 tokens. the shared client limits input to 64,000 UTF-8 bytes, and PR requests retain their tighter 22,000-character budget. a second invalid response stops the run and leaves a retryable error.

research:

- [Groq structured outputs](https://console.groq.com/docs/structured-outputs): strict schema support, required properties and closed objects. provider-level shape enforcement is paired with local validation, while patch correctness still requires source checks and human review.
- [Aider edit formats](https://aider.chat/docs/more/edit-formats.html): short search/replace edits avoid making the model regenerate whole files. Unified keeps that approach, with exact unique matches, immutable source hashes, a 3-file / 120-line bound, a separate scope review and a draft PR.

## email test delivery

the browser's default 20-second request timeout could expire before SMTP's connection, greeting and send timeouts completed. test requests now allow 60 seconds. transient Resend HTTP rejections get one retry with the same idempotency key. definite test rejections release the test cooldown, and safe delivery errors are visible instead of being replaced by a generic message. uncertain delivery still asks the owner to inspect the destination before resending.

the original first-attempt delivery failure could not be reproduced from the screenshot or local fixtures. no live email was sent during this work.

## response prototypes

open `/prototypes/responses` on the frontend. the picker supports number keys, arrow keys and `R` to replay. selection persists in `?v=1` through `?v=5`.

| route | direction | strongest use | cost |
| --- | --- | --- | --- |
| `/prototypes/responses?v=1` | ledger | scan customer, preview and date before expanding | less expressive |
| `/prototypes/responses?v=2` | notes | make the customer's words the focus | more scrolling |
| `/prototypes/responses?v=3` | evidence | start with an issue and inspect its supporting responses | adds a filtering rail |
| `/prototypes/responses?v=4` | inbox | read without losing the surrounding list | less room for long answers |
| `/prototypes/responses?v=5` | log | fit many responses in a small space | details need an extra click |

all five use the same sample responses. search, order, disclosures, issue filters, response selection and issue detail dialogs work. these are isolated explorations, with no winner applied to production.

## landing prototypes

the current hero, product preview and footer are reused. `/` keeps the existing production landing page.

| route | direction | strongest use | cost |
| --- | --- | --- | --- |
| `/1` | workbench | show the actual board, a patch preview and a digest | longest walkthrough |
| `/2` | isometric | explain the workflow with restrained illustrations and real UI | illustrations add less detail than product UI |
| `/3` | release story | follow one issue through an interactive chapter selector | visitors need to switch chapters |

Overflow's [free isometric set](https://www.overflow.design/isometric/?tier=free) includes Kanban, Mail, Browser and Branch drawings that fit the workbench, digest, widget and PR flow. the prototypes use local two-tone stills. their animated versions require Pro. asset sources and terms are recorded beside the files.

Emil Kowalski's [prototype skill](https://github.com/emilkowalski/skills/tree/main/skills/prototype) is installed in `.agents/skills/prototype`. its original picker styling, URL persistence, keyboard switching and replay behaviour are shared across both explorations.

## validation

- backend: 147 tests pass, including real MongoDB transactions for analysis reconciliation and tagging.
- frontend: 58 tests pass, lint passes, production build passes.
- packed SDK consumer: passes with visible radio paint, keyboard selection, theme switching and Shadow DOM isolation.
- PR workspace browser fixture: passes, including failed-node modal retry and responsive layouts.
- all eight prototypes: exercised at 1440px and 390px, including interactive controls, working local illustration files, picker persistence, no horizontal page overflow and no runtime errors. screenshots were reviewed locally.

no deployment, npm publication, live Groq generation, real GitHub PR or live email delivery was performed.
