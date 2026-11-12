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

## selected response layout

the evidence direction is now the Responses page. the existing summary stays on top, followed by search and order controls, an issue filter rail and the original response cards. the cards show only fields that were actually submitted. issue counts, completion styling and workbench links use saved response tags. the five old response prototypes have been removed.

## selected landing direction

the isometric direction is now `/`. the hero, product preview, CTA and footer remain. the large workbench mockup section is removed. larger browser, kanban, PR and mail illustrations form a clockwise feedback loop. hovering or focusing a drawing starts its part-level animation, and tapping pins or stops it. reduced motion keeps a complete still illustration.

the PR illustration comes from the SVG supplied by the project owner, recoloured to match the other drawings. the other illustrations use Overflow's free stills with custom local animation. the retired landing variants and their routes have been removed.

## digest animation studies

the replacement digest section is awaiting a visual choice, so it is isolated at `/prototypes/digest`. the old email card mockup is removed. the prototype route uses the actual landing page as context and opens at the digest section.

| route | direction | strongest use | cost |
| --- | --- | --- | --- |
| `/prototypes/digest?v=1` | dispatch | show the digest travelling from the workbench to the inbox | the most literal delivery diagram |
| `/prototypes/digest?v=2` | signal | show several feedback notes becoming one useful issue | more emphasis on analysis than delivery |
| `/prototypes/digest?v=3` | orbit | show feedback being delivered on a repeating schedule | less explicit about digest contents |

all three loop only while the section is visible. they have pause controls, email/Slack destination switching and reduced-motion stills. the picker supports number keys, arrow keys and replay, and preserves selection in the URL. only this new prototype surface remains.

Emil Kowalski's [prototype skill](https://github.com/emilkowalski/skills/tree/main/skills/prototype) is installed in `.agents/skills/prototype`. asset sources are recorded beside the isometric files.

## validation

- backend: 147 tests pass, including real MongoDB transactions for analysis reconciliation and tagging.
- frontend: 58 tests pass, lint passes, production build passes.
- packed SDK consumer: passes with visible radio paint, keyboard selection, theme switching and Shadow DOM isolation.
- PR workspace browser fixture: passes, including failed-node modal retry and responsive layouts.
- live Groq checks on synthetic data: strict patch generation applies correctly, and rephrased feedback reuses an existing issue ID while excluding unrelated praise.
- selected UI: evidence filtering and workbench links, hover-driven SVG parts, the three digest studies, pause controls, reduced motion and picker persistence are checked in a browser. layouts are checked at 1440, 1024, 768 and 390px, and screenshots are reviewed locally.

no deployment, npm publication, real repository PR or live email delivery was performed. the live Groq checks used only small synthetic inputs, so they verify the configured request contract rather than every real-world issue.
