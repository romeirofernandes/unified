# feedback digests

users configure each project from **integrations** in the workspace. Slack and email have separate hourly/daily schedules, delivery state and cursors. enabling a channel starts a new collection period, pausing and resuming excludes feedback received while paused. tests send sample content without consuming real feedback.

## server setup

- `RESEND_API_KEY`: a Resend sending key, server only.
- `DIGEST_EMAIL_FROM`: a sender on a verified Resend domain, such as `Unified <feedback@your-domain.com>`.
- `FRONTEND_URL`: the public frontend origin used for response links.
- `INTEGRATION_ENCRYPTION_KEY`: 32 random bytes encoded as 64 hex characters. keep it stable across deployments and identical across backend replicas. generate it with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.

local development creates a persistent key in `backend/.data/integration-key` when no environment key exists. this file is ignored by git. back it up if you rely on it - losing or changing the key makes stored project keys and Slack connections unreadable. when moving a local database to production, preserve the same key (the file bytes encoded as hex), or replace affected keys and reconnect Slack.

email goes to the project owner’s account address. users connect Slack by saving an incoming webhook for their chosen channel. webhook URLs are encrypted and never returned to the browser. project submission keys are encrypted for owner retrieval and hashed separately for submission authentication. legacy hashed-only keys require replacement once.

## delivery

the backend scans due projects every minute after MongoDB connects. persistent servers run this automatically. the schedule survives restarts, but delivery needs a running backend process; do not deploy this worker solely as a request-scoped/serverless function. production replicas use database leases to avoid concurrent sends for the same project and channel. a process interrupted during delivery can retry after the lease expires.

feedback batches use `(since, cutoff]` timestamps. successful sends advance the cursor; empty batches advance without sending. failed batches keep their cutoff and cursor and retry in 15 minutes. each channel handles its own failures. Resend retries use a stable idempotency key for the batch. Slack webhooks have no idempotency support, so a network timeout after Slack accepts a message can result in a duplicate on retry.

AI summaries use the existing Groq configuration. generation failures leave the batch pending. delivery errors shown in the UI exclude provider payloads and secrets. tests are limited to one per project/channel per minute.

## references

- [Slack incoming webhooks](https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/)
- [Resend send email](https://resend.com/docs/api-reference/emails/send-email)
- [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys)
