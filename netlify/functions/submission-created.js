import { neon } from '@netlify/neon';

export default async function handler(event) {
  // Netlify sends a JSON body like { payload: { form_name, data: { ...fields } } }
  let payload;
  try {
    const body = JSON.parse(event.body || '{}');
    payload = body?.payload || body;
  } catch (_) {
    payload = {};
  }

  const formName = payload?.form_name || payload?.formName || payload?.data?.form_name;
  if (formName !== 'maker') {
    return { statusCode: 200, body: 'ignored' };
  }

  const data = payload?.data || {};
  const toStr = (v) => (v == null ? '' : String(v));
  const trim = (v) => toStr(v).trim();
  const orNull = (v) => { const t = trim(v); return t ? t : null; };

  const bizName = trim(data.biz_name || data.bizName || data.business);
  const humanName = orNull(data.human_name || data.humanName);
  const instagram = orNull(data.instagram);
  const facebook = orNull(data.facebook);
  const website = orNull(data.website);
  let description = trim(data.description || '');
  if (description.length > 280) description = description.slice(0, 280);

  if (!humanName) {
    return { statusCode: 400, body: 'Missing required field: human_name' };
  }

  try {
    const sql = neon();
    await sql`
      INSERT INTO makers (human_name, biz_name, instagram, facebook, website, description, approved)
      VALUES (${humanName}, ${bizName}, ${instagram}, ${facebook}, ${website}, ${description}, false)
    `;
    return { statusCode: 200, body: 'ok' };
  } catch (e) {
    console.error('submission-created error', e);
    return { statusCode: 500, body: 'db error' };
  }
}

export const config = { event: 'submission-created' };
