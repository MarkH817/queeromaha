---
title: Local Queer Makers
layout: layouts/base.njk
---

<style>
.makers-intro { margin-bottom: 1.25rem; padding-bottom: .75rem; border-bottom: 3px dashed #6d28d9; }
.makers-grid { display: flex; flex-direction: column; gap: 1rem; }
.maker-card { background: linear-gradient(135deg,#111 0%,#2d1b4e 100%); border:2px solid #9333ea; border-radius:0; padding:1rem 1.25rem; color:#f5f5f5; box-shadow:4px 4px 0 #6d28d9; }
.maker-card:hover { transform: translate(-2px,-2px); box-shadow:6px 6px 0 #9333ea; }
.maker-biz { font-size:1.15rem; font-weight:700; color:#e9d5ff; margin:0 0 .25rem 0; letter-spacing:.02em; }
.maker-human { font-size:.9rem; color:#a78bfa; margin:0 0 .5rem 0; font-style:italic; }
.maker-desc { font-size:.95rem; line-height:1.5; color:#d4d4d4; margin:0 0 .75rem 0; }
.maker-links { display:flex; gap:.75rem; flex-wrap:wrap; }
.maker-links a { color:#c084fc !important; font-size:.85rem; font-weight:600; text-transform:uppercase; letter-spacing:.05em; border-bottom:2px solid #7c3aed !important; padding-bottom:1px; }
.makers-loading { text-align:center; padding:2rem; color:#6d28d9; font-weight:500; }
.makers-error { text-align:center; padding:2rem; color:#dc2626; background:#fef2f2; border:2px solid #dc2626; }
.makers-empty { text-align:center; padding:2rem; color:#6d28d9; font-style:italic; }
</style>

<div class="makers-intro" id="makers-intro">
  <h1>Local Queer Makers</h1>
  <p>Support local queers: artists, crafters, punks, creators — the weirdos making cool stuff.</p>
</div>

<div id="makers-container" class="makers-grid">
  <div class="makers-loading" role="status" aria-live="polite">
    <i class="bi bi-arrow-repeat" aria-hidden="true"></i> Loading makers...
  </div>
</div>

<script>
(async function() {
  // Show a success banner if redirected after submission
  try {
    const usp = new URLSearchParams(location.search);
    if (usp.get('submitted') === '1') {
      const intro = document.getElementById('makers-intro');
      if (intro) {
        const note = document.createElement('div');
        note.setAttribute('role', 'status');
        note.style.cssText = 'background:#ecfeff;color:#042f2e;border:2px solid #06b6d4;padding:.75rem 1rem;margin:.5rem 0 1rem 0;font-weight:600;';
        note.textContent = 'Thanks for your submission — it will appear once approved.';
        intro.after(note);
      }
    }
  } catch (_) {}
  const container = document.getElementById('makers-container');
  try {
    const res = await fetch('/api/makers');
    if (!res.ok) throw new Error('Bad status ' + res.status);
    const makers = await res.json();
    if (!makers || makers.length === 0) {
      container.innerHTML = '<p class="makers-empty">No makers yet. Know someone? <a href="/contact/">Tell us.</a></p>';
      return;
    }
    container.innerHTML = makers.map(m => {
      const esc = (t) => { const d=document.createElement('div'); d.textContent=String(t||''); return d.innerHTML; };
      const links = [];
      if (m.website) links.push(`<a href="${esc(m.website)}" aria-label="Website for ${esc(m.biz_name)}"><i class="bi bi-globe" aria-hidden="true"></i>Web</a>`);
      if (m.instagram) { const ig = m.instagram.startsWith('http')?m.instagram:`https://instagram.com/${m.instagram.replace('@','')}`; links.push(`<a href="${esc(ig)}" aria-label="Instagram for ${esc(m.biz_name)}"><i class="bi bi-instagram" aria-hidden="true"></i>IG</a>`); }
      if (m.facebook) { const fb = m.facebook.startsWith('http')?m.facebook:`https://facebook.com/${m.facebook}`; links.push(`<a href="${esc(fb)}" aria-label="Facebook for ${esc(m.biz_name)}"><i class="bi bi-facebook" aria-hidden="true"></i>FB</a>`); }
const title = m.biz_name ? esc(m.biz_name) : esc(m.human_name);
      const secondary = m.biz_name && m.human_name ? `<p class=\"maker-human\">${esc(m.human_name)}</p>` : '';
      return `
        <article class="maker-card">
          <h3 class="maker-biz">${title}</h3>
          ${secondary}
          ${m.description ? `<p class=\"maker-desc\">${esc(m.description)}</p>` : ''}
          ${links.length?`<div class=\"maker-links\">${links.join('')}</div>`:''}
        </article>`;
    }).join('');
  } catch (e) {
    console.error(e);
    container.innerHTML = '<p class="makers-error" role="alert">Couldn\'t load makers. Try again later.</p>';
  }
})();
</script>

<hr style="margin: 1.5rem 0; border: none; border-top: 3px dashed #6d28d9;" />

<h2 style="margin-top: 0;">Add a Maker</h2>
<p>Know a local queer maker? Submit them here. We review before listing to keep it real.</p>

<form name="maker" method="POST" data-netlify="true" data-netlify-honeypot="bot-field" action="/makers/?submitted=1">
  <input type="hidden" name="form-name" value="maker" />
  <p style="display:none;">
    <label>Don’t fill this out: <input name="bot-field" /></label>
  </p>

<p>
    <label for="human_name">Human name (required)</label><br />
    <input id="human_name" name="human_name" required maxlength="100" style="width:100%; padding:0.5rem; margin-top:0.25rem; border:1px solid #ddd; border-radius:4px;" />
  </p>

  <p>
    <label for="biz_name">Business name (optional)</label><br />
    <input id="biz_name" name="biz_name" maxlength="150" style="width:100%; padding:0.5rem; margin-top:0.25rem; border:1px solid #ddd; border-radius:4px;" />
  </p>

  <p>
    <label for="website">Website (optional)</label><br />
    <input id="website" name="website" inputmode="url" placeholder="https://example.com" style="width:100%; padding:0.5rem; margin-top:0.25rem; border:1px solid #ddd; border-radius:4px;" />
  </p>

  <p>
    <label for="instagram">Instagram (optional)</label><br />
    <input id="instagram" name="instagram" placeholder="@handle or full URL" style="width:100%; padding:0.5rem; margin-top:0.25rem; border:1px solid #ddd; border-radius:4px;" />
  </p>

  <p>
    <label for="facebook">Facebook (optional)</label><br />
    <input id="facebook" name="facebook" placeholder="page slug or full URL" style="width:100%; padding:0.5rem; margin-top:0.25rem; border:1px solid #ddd; border-radius:4px;" />
  </p>

<p>
    <label for="description">Short description (max 280 chars, optional)</label><br />
    <textarea id="description" name="description" maxlength="280" rows="4" placeholder="What do they make? Keep it punchy." style="width:100%; padding:0.5rem; margin-top:0.25rem; border:1px solid #ddd; border-radius:4px; font-family:inherit;"></textarea>
  </p>

  <p>
    <button type="submit" style="background:#6d28d9; color:#fff; padding:0.75rem 1.5rem; border:none; border-radius:6px; cursor:pointer; font-size:1rem; font-weight:600;">Submit</button>
  </p>

  <p style="font-size:0.85rem; color:#555;">We don’t sell your info. Submissions are moderated to avoid clout-chasers.</p>
</form>
