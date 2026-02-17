
[![Netlify Status](https://api.netlify.com/api/v1/badges/eb46506c-ce32-4485-ae05-ae4872ac953c/deploy-status)](https://app.netlify.com/projects/queeromaha/deploys)

# queeromaha.com

Also queeromaha.net

The place for queer spaces in omaha

## Moderation

•  DB schema
◦  Added approved boolean (default false, NOT NULL).
◦  Generated and applied migration (0002_…).
•  API
◦  GET /api/makers now returns only approved rows, ordered by COALESCE(biz_name, human_name).
•  Form submission flow
◦  Netlify form still captures all fields; backend insertion now sets approved=false.
◦  Added success banner after submit: redirects to /makers/?submitted=1 and shows “will appear once approved.”
•  Event function
◦  netlify/functions/submission-created.js now:
▪  Requires human_name only.
▪  Inserts approved=false.
▪  Declared as an event handler with export const config = { event: 'submission-created' } so Netlify runs it on form submissions.
•  Admin approval options
◦  Admin HTTP endpoint: POST /api/makers/approve with header X-Admin-Token set to $MAKERS_ADMIN_TOKEN.
▪  Body: { "id": 123, "approved": true } (approved defaults to true).
▪  Set MAKERS_ADMIN_TOKEN in Netlify env vars.
◦  CLI helper: scripts/approve-maker.mjs
▪  Approve by ID locally or via Netlify env injection:
▪  netlify dev:exec -- node scripts/approve-maker.mjs 123
▪  netlify dev:exec -- node scripts/approve-maker.mjs 123 false  # to unapprove

What you should do
•  Set an admin token for the endpoint:
◦  netlify env:set MAKERS_ADMIN_TOKEN "a-long-random-token"
•  Test locally:
◦  netlify dev
◦  Submit the maker form; it should not appear yet.
◦  Approve it:
▪  curl -X POST https://localhost:8888/api/makers/approve -H "x-admin-token: YOUR_TOKEN" -H "content-type: application/json" -d '{"id":123,"approved":true}'
▪  or: netlify dev:exec -- node scripts/approve-maker.mjs 123
◦  Refresh /makers and you should see it.