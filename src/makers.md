---
title: Omaha Queer Makers
layout: layouts/base.njk
public: true
items:
  - type: section
    label: Omaha Makers
    id: omaha

  - type: item
    name: Gabi Ghoul Art
    public: true
    description: Gabi identifies as a Queer, Disabled and BIPOC artist with a love for mixed medium works, often blending a use of acrylic painted scenes highlighted by hand stitched beads.
    links:
      - label: Insta
        url: https://instagram.com/gabighoul.art

  - type: item
    name: Cryptid Creations
    public: true
    description: Artists Morgue and Stromer (both they/them) create sexy animal-skull pinup girls, reclaimed stained glass art and amazing cat-skull queer pride pins. I love my 'gendervoid' one from them. Find them at punk and queer markets.
    links:
      - label: Insta
        url: https://www.instagram.com/morstro98_hg
      - label: RedBubble
        url: https://www.redbubble.com/people/F12F3Horses2/shop
      - label: ThreadLess
        url: https://cryptcreations.threadless.com/
      - label: Linktree
        url: https://linktr.ee/crypt.creations

  - type: item
    name: Cyberpunk Tarot Decks
    public: true
    description: Haidyn Sosalla-Bahr (they/them) created a full Tarot Deck based on their original cyberpunk universe. Find them at the BFF Art Market, Omaha Arts Festival Aksarben June 12-14, and Rockbrook Arts Festival September 12 from 10-6 and September 13 from 10-5
    links:
      - label: Website
        url: https://meridiancitytarot.carrd.co/#howtopurchase
      - label: Online Store
        url: https://www.inprnt.com/gallery/blueranyk/
      - label: Insta
        url: https://instagram.com/blueranyk

  - type: item
    name: Things By Thor
    public: true
    description: Kayla Thor creates Gifts & Glasses for Every Ghoul. Glass tumblers, mugs, earrings, notebooks and other accessories for the dark and spooky.
    links:
      - label: Insta
        url: https://www.instagram.com/thingsbythor
      - label: FB
        url: https://www.facebook.com/thingsbythor/
      - label: Website
        url: https://thingsbythor.com
      - label: Linktree
        url: https://linktr.ee/Thingsbythor

  - type: section
    label: Submit A Maker
    id: signup
---

<br/>
<form id="maker-form" name="maker" method="POST" data-netlify="true" data-netlify-honeypot="bot-field" action="/makers/">
  <input type="hidden" name="form-name" value="maker" />
  <p style="display:none;">
    <label>Don't fill this out: <input name="bot-field" /></label>
  </p>

<p>
    <label for="name">Name (required)</label><br />
    <input id="name" name="name" required aria-required="true" placeholder="Maker's Name" maxlength="100" style="width:100%; padding:0.5rem; margin-top:0.25rem; border:1px solid #ddd; border-radius:4px;" />
  </p>

  <p>
    <label for="email">Email (required)</label><br />
    <input type="email" id="email" name="email" required aria-required="true" placeholder="maker@cool.gay" maxlength="255" style="width:100%; padding:0.5rem; margin-top:0.25rem; border:1px solid #ddd; border-radius:4px;" />
  </p>

  <p>
    <label for="biz_name">Business Name (optional)</label><br />
    <input id="biz_name" name="biz_name" placeholder="Cool Gay Biz" maxlength="150" style="width:100%; padding:0.5rem; margin-top:0.25rem; border:1px solid #ddd; border-radius:4px;" />
  </p>

  <p>
    <label for="instagram">Instagram Link (optional)</label><br />
    <input id="instagram" name="instagram" placeholder="@username or full URL" style="width:100%; padding:0.5rem; margin-top:0.25rem; border:1px solid #ddd; border-radius:4px;" />
  </p>

  <p>
    <label for="facebook">Facebook Link (optional)</label><br />
    <input type="text" id="facebook" name="facebook" placeholder="facebook page or full URL" style="width:100%; padding:0.5rem; margin-top:0.25rem; border:1px solid #ddd; border-radius:4px;" />
  </p>

  <p>
    <label for="website">Website Link (optional)</label><br />
    <input type="text" id="website" name="website" inputmode="url" placeholder="cool.gay" style="width:100%; padding:0.5rem; margin-top:0.25rem; border:1px solid #ddd; border-radius:4px;" />
  </p>

<p>
    <label for="description">Short description (optional)</label><br />
    <textarea id="description" name="description" maxlength="280" rows="4" placeholder="What do they make?" style="width:100%; padding:0.5rem; margin-top:0.25rem; border:1px solid #ddd; border-radius:4px; font-family:inherit;"></textarea>
  </p>

  <p>
    <button type="submit" style="background:#6d28d9; color:#fff; padding:0.75rem 1.5rem; border:none; border-radius:6px; cursor:pointer; font-size:1rem; font-weight:600;">Signup</button>
  </p>

</form>
