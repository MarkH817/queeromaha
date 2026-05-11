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

---

## Gabi Ghoul Art

Gabi identifies as a Queer, Disabled and BIPOC artist with a love for mixed medium works, often blending a use of acrylic painted scenes highlighted by hand stitched beads.

I love her "cute ghost in pride flag colors" pieces and her femme-forward style.

[Insta](https://instagram.com/gabighoul.art)

## Cryptid Creations

Artists Morgue and Stromer (both they/them) create sexy animal-skull pinup girls, reclaimed stained glass art and amazing cat-skull queer pride pins. I love my 'gendervoid' one from them

Find them at punk and queer markets 

[Insta](https://www.instagram.com/morstro98_hg) | [RedBubble](https://www.redbubble.com/people/F12F3Horses2/shop) | [ThreadLess](https://cryptcreations.threadless.com/) | [Linktree](https://linktr.ee/crypt.creations)

## Cyberpunk Tarot Decks

Local artist Haidyn Sosalla-Bahr (they/them) creates Major Arcana cards with their original cyberpunk universe

Find them at the BFF art market 

[Website](https://meridiancitytarot.carrd.co/#howtopurchase) | [Online Store](https://www.inprnt.com/gallery/blueranyk/)


## Things By Thor

Kayla Thor creates Gifts & Glasses for Every Ghoul. Glass tumblers, mugs, earrings, notebooks and other accessories for the dark and spooky.

[Insta](https://www.instagram.com/thingsbythor) | [BookFace](https://www.facebook.com/thingsbythor/) | [Website](thingsbythor.com) | [Linktree](https://linktr.ee/Thingsbythor)

---

<h3 style="margin-top: 0;">Want to be showcased on this page?</h3></brs>

- I'll confirm your listing via email before posting.
- You can pull it at any time. [Contact me here](/contact)

<br/>
<form id="maker-form" name="maker" method="POST" data-netlify="true" data-netlify-honeypot="bot-field" action="/makers/">
  <input type="hidden" name="form-name" value="maker" />
  <p style="display:none;">
    <label>Don’t fill this out: <input name="bot-field" /></label>
  </p>

<p>
    <label for="human_name">Name (required)</label><br />
    <input id="human_name" name="human_name" required aria-required="true" placeholder="Your Real Human Name" maxlength="100" style="width:100%; padding:0.5rem; margin-top:0.25rem; border:1px solid #ddd; border-radius:4px;" />
  </p>

  <p>
    <label for="email">Email (required)</label><br />
    <input type="email" id="email" name="email" required aria-required="true" placeholder="you@cool.biz" maxlength="255" style="width:100%; padding:0.5rem; margin-top:0.25rem; border:1px solid #ddd; border-radius:4px;" />
  </p>

  <p>
    <label for="biz_name">Business Name (optional)</label><br />
    <input id="biz_name" name="biz_name" placeholder="Cool Biz" maxlength="150" style="width:100%; padding:0.5rem; margin-top:0.25rem; border:1px solid #ddd; border-radius:4px;" />
  </p>

  <p>
    <label for="instagram">Instagram Link (optional)</label><br />
    <input id="instagram" name="instagram" placeholder="@username or full URL" style="width:100%; padding:0.5rem; margin-top:0.25rem; border:1px solid #ddd; border-radius:4px;" />
  </p>

  <p>
    <label for="facebook">Facebook Link (optional)</label><br />
    <input type="text" id="facebook" name="facebook" placeholder="facebook page name or full URL" style="width:100%; padding:0.5rem; margin-top:0.25rem; border:1px solid #ddd; border-radius:4px;" />
  </p>


  <p>
    <label for="website">Website Link (optional)</label><br />
    <input type="text" id="website" name="website" inputmode="url" placeholder="cool.biz" style="width:100%; padding:0.5rem; margin-top:0.25rem; border:1px solid #ddd; border-radius:4px;" />
  </p>


<p>
    <label for="description">Short description (max 280 chars, optional)</label><br />
    <textarea id="description" name="description" maxlength="280" rows="4" placeholder="What do they make?" style="width:100%; padding:0.5rem; margin-top:0.25rem; border:1px solid #ddd; border-radius:4px; font-family:inherit;"></textarea>
  </p>

  <p>
    <button type="submit" style="background:#6d28d9; color:#fff; padding:0.75rem 1.5rem; border:none; border-radius:6px; cursor:pointer; font-size:1rem; font-weight:600;">Submit</button>
  </p>

  <p style="font-size:0.85rem; color:#555;">It will always be free to post your listing.</p>

</form>
