---
title: Contact Page
description: Get in touch with the Queer Omaha project.
layout: layouts/base.njk
public: true
---

### Send a note

<form name="contact" method="POST" data-netlify="true" data-netlify-honeypot="bot-field">
  <p style="display: none;">
    <label>Don't fill this out if you're human: <input name="bot-field" /></label>
  </p>
  
  <p>
    <label for="email"></label><br / >
    <input type="email" id="email" name="email" placeholder="Your email address (optional)" style="width: 100%; padding: 0.5rem; margin-top: 0.25rem; border: 1px solid #ddd; border-radius: 4px;">
  </p>
  
  <p>
    <label for="message"></label><br / >
    <textarea id="message" name="message" required rows="8" placeholder="Suggest an event, group, venue - or ask for edit access to the site" style="width: 100%; padding: 0.5rem; margin-top: 0.25rem; border: 1px solid #ddd; border-radius: 4px; font-family: inherit;"></textarea>
    </label>
  </p>
  
  <p>
    <button type="submit" style="background: #6d28d9; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; font-weight: 500;">Send</button>
  </p>
</form>
