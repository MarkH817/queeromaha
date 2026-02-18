import { neon } from '@netlify/neon';

export default async function handler(request) {
  let body = {};
  try {
    const raw = await request.text();
    body = raw ? JSON.parse(raw) : {};
  } catch (_) {}

  const payload = body?.payload ?? body;
  const data = payload?.data ?? payload;
  const dataObj = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  const rawFormName =
    payload?.form_name ??
    payload?.formName ??
    payload?.['form-name'] ??
    dataObj?.form_name ??
    dataObj?.['form-name'];
  const formName = rawFormName != null ? String(rawFormName).trim().toLowerCase() : '';

  const hasMakerFields = dataObj && (dataObj.human_name != null || dataObj.humanName != null);
  const hasContactFields = dataObj && dataObj.message != null;
  const isMaker =
    formName === 'maker' ||
    (hasMakerFields && !hasContactFields);

  if (!isMaker) {
    console.log('submission-created: ignored', { formName, hasMakerFields, hasContactFields, payloadKeys: payload ? Object.keys(payload) : [], dataKeys: dataObj ? Object.keys(dataObj) : [] });
    return new Response('ignored', { status: 200 });
  }
  const toStr = (v) => (v == null ? '' : String(v));
  const trim = (v) => toStr(v).trim();
  const orNull = (v) => { const t = trim(v); return t ? t : null; };
  // If value looks like a URL with no protocol, assume http
  const ensureProtocol = (v) => {
    if (!v) return v;
    if (/^https?:\/\//i.test(v)) return v;
    if (v.startsWith('@')) return v; // e.g. @handle for instagram
    return 'http://' + v;
  };

  const bizName = trim(dataObj.biz_name || dataObj.bizName || dataObj.business);
  const humanName = orNull(dataObj.human_name || dataObj.humanName);
  const email = orNull(dataObj.email);
  if (!humanName) {
    return new Response('Missing required field: human_name', { status: 400 });
  }
  if (!email) {
    return new Response('Missing required field: email', { status: 400 });
  }
  const instagram = ensureProtocol(orNull(dataObj.instagram));
  const facebook = ensureProtocol(orNull(dataObj.facebook));
  const website = ensureProtocol(orNull(dataObj.website));
  let description = trim(dataObj.description || '');
  if (description.length > 280) description = description.slice(0, 280);

  try {
    const sql = neon();
    await sql`
      INSERT INTO makers (human_name, biz_name, email, instagram, facebook, website, description, approved)
      VALUES (${humanName}, ${bizName}, ${email}, ${instagram}, ${facebook}, ${website}, ${description}, false)
    `;
    return new Response('ok', { status: 200 });
  } catch (e) {
    console.error('submission-created error', e);
    return new Response('db error', { status: 500 });
  }
}

export const config = { event: 'submission-created' };
