---
name: 'JavaScript Security Rules'
description: 'OWASP security rules for all JS files in the portal'
applyTo: '**/*.js'
---

## Security — apply to every JS file

- Never write unescaped user-controlled data to `innerHTML`, `outerHTML`, `document.write`, or `insertAdjacentHTML`. Always call `escHtml()` or `_esc()` first.
- Never use `eval()`, `new Function()`, `setTimeout(string)`, or `setInterval(string)`.
- Never log sensitive data (tokens, passwords, session cookies) to `console.log` or `console.error`.
- HTTP responses must never include raw `Error.message` or stack traces.
- All new API route handlers must verify `verifySession()` before executing logic.
- Input validation: validate type and shape at the boundary (`typeof x !== 'string'`, array checks, etc.).
- Use `crypto.timingSafeEqual` for any constant-time comparison of secrets or signatures.
- Dependencies: prefer built-in Node.js `crypto` over third-party for hashing/signing.
