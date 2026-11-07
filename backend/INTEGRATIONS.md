# feedback digests

users configure each project from **integrations**. Slack and email have separate hourly/daily schedules, delivery state and cursors. enabling starts a new collection period, pausing and resuming excludes feedback received while paused. tests send sample content without consuming real feedback.

## what you need to configure

use Node.js 20 or newer for the backend. keep these variables server-side, with no `VITE_` prefix.

### shared

- `FRONTEND_URL`: your public frontend origin, used for response links and the Slack installation return page.
- `INTEGRATION_ENCRYPTION_KEY`: 32 random bytes encoded as 64 hex characters, stable across deployments and identical across replicas. generate it with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
- `GROQ_API_KEYS`: the existing summary-generation credentials. scheduled digests generate their own summaries and do not need someone to open the responses page.

local development persists an encryption key in `backend/.data/integration-key` if no environment key exists. back it up if you rely on it - losing or changing it makes stored project keys and Slack connections unreadable. when moving a local database to production, preserve the same key (the file bytes encoded as hex), or replace affected keys and reconnect Slack.

### email - choose one transport

email goes to the project owner’s account address. users don’t need to connect their personal mailbox.

for SMTP through Nodemailer:

```dotenv
EMAIL_TRANSPORT=smtp
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
FROM_EMAIL=Unified <feedback@your-domain.com>
```

use the host, port and credentials from your email provider. `FROM_EMAIL` is the visible sender, and `DIGEST_EMAIL_FROM` remains supported as an older alias. Gmail SMTP can send as your own Gmail account without a custom domain, using `smtp.gmail.com`, port `587`, and a Google app password. port 587 uses STARTTLS, port 465 normally uses `SMTP_SECURE=true`. Gmail may require an app password or a provider-specific authentication setup; your normal account password generally won't work. authorize the sender address and configure the provider’s required DNS records for your domain.

for Resend:

```dotenv
EMAIL_TRANSPORT=resend
RESEND_API_KEY=your-sending-key
FROM_EMAIL=Unified <feedback@your-verified-domain.com>
```

Nodemailer is a sending library, not an email service with a free unlimited quota. SMTP keeps the provider configurable; its quotas, costs and deliverability rules still apply. Resend’s free transactional allowance is 3,000 emails/month with a 100/day cap at the time of implementation. test messages also count toward provider quotas.

### Slack - configure one app, then users install it

1. create an app at <https://api.slack.com/apps>, using `backend/slack-app-manifest.json` if helpful. replace `YOUR_BACKEND_HOST` with the deployed backend host before importing it.
2. enable incoming webhooks and ensure OAuth & Permissions includes the `incoming-webhook` bot scope.
3. add the exact HTTPS redirect URL `https://YOUR_BACKEND_HOST/api/slack/callback` under OAuth & Permissions.
4. copy the client ID and client secret from Basic Information into the backend environment:

```dotenv
SLACK_CLIENT_ID=your-client-id
SLACK_CLIENT_SECRET=your-client-secret
SLACK_REDIRECT_URI=https://YOUR_BACKEND_HOST/api/slack/callback
```

5. for installations outside the app’s development workspace, complete Slack’s app distribution setup. workspace policies may still require administrator approval.
6. redeploy the backend. users can now click **install in workspace**, choose a workspace and channel in Slack, then return to Unified to enable their digest schedule.

Slack requires an HTTPS callback. for local development, use an HTTPS tunnel to your backend and register that exact URL. no signing secret, event subscription, mail-reading permission or per-user webhook copy/paste is needed for this flow.

OAuth state is random, project-bound, expires in 10 minutes and is consumed once. webhook credentials are encrypted and never returned to the browser. disconnecting a project removes its stored destination and stops delivery; it does not uninstall the shared Slack app from the whole workspace. an already accepted provider request cannot be recalled.

project submission keys are encrypted for owner retrieval and hashed separately for authentication. legacy hashed-only keys require replacement once.

## delivery

the backend scans due projects every minute after MongoDB connects. persistent servers run this automatically. the schedule survives restarts, but needs a running backend process; do not deploy the worker solely as a request-scoped/serverless function. database leases avoid concurrent sends for one project/channel.

feedback batches use `(since, cutoff]` timestamps. no new feedback means no AI request and no message. new batches get a freshly generated summary, independently of the dashboard summary cache. the worker compares normalized overview/action content with the last delivered digest, ignoring timestamps, whitespace, case and action order. unchanged content advances the cursor without sending. this is a text-content comparison, not a guarantee of semantic equivalence between AI paraphrases.

failed batches retain their cutoff, generated content and cursor for a retry in 15 minutes. retries reuse the frozen message so Resend’s batch idempotency key remains valid. Slack and SMTP do not provide equivalent exactly-once delivery guarantees: a timeout after acceptance can result in a duplicate on retry. SMTP uses a stable message ID, but recipient servers may still deliver duplicates.

delivery errors exclude provider payloads and secrets. tests are limited to one per project/channel per minute.

## references

- [Slack OAuth installation](https://docs.slack.dev/authentication/installing-with-oauth/)
- [Slack incoming webhooks](https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/)
- [Nodemailer SMTP](https://nodemailer.com/smtp)
- [Resend pricing](https://resend.com/pricing)
- [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys)
- [Slack logo from SVGL](https://svgl.app/)
