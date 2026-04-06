---
name: "HTML/CSS Security"
description: "Security and CSP rules for HTML files in all modules"
applyTo: "**/*.html"
---

## HTML security rules

### Content Security Policy

The server sets a 10-directive CSP header. Never add `unsafe-inline` or `unsafe-eval` to HTML meta tags.
Approved CDN sources: `cdnjs.cloudflare.com`, `cdn.jsdelivr.net`, `unpkg.com`, `basemaps.cartocdn.com`.

### No inline scripts allowed

- All JavaScript must live in external `.js` files — not `<script>` tags in HTML.
- No inline event handlers: never `onclick="..."`, `onload="..."`, etc. — use `addEventListener` in external JS.
- No `<style>` blocks containing dynamic CSS — use external `.css` files.

### Meta tags

Always include: `<meta charset="UTF-8">` and `<meta name="viewport" content="width=device-width, initial-scale=1.0">`.

### Module auth guard

Every restricted module HTML file should include:

```html
<script src="/xcelias-auth.js"></script>
```

And its companion guard script but NOT inline logic.

### Firebase config

Reference: `<script src="/firebase-config.js"></script>` — never hardcode the Firebase config object inline.
