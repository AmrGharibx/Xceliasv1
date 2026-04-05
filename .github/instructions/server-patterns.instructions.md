---
name: 'Express Server Patterns'
description: 'Patterns and anti-patterns for server.js and Express route handlers'
applyTo: '**/server.js'
---

## Express server conventions

### Route handler skeleton
```js
app.METHOD('/api/route-name', (req, res) => {
  // 1. Auth first
  const session = verifySession(parseCookies(req).xc_session);
  if (!session) return res.status(401).json({ error: 'Authentication required' });

  // 2. Input validation
  const { field } = req.body;
  if (!field || typeof field !== 'string') return res.status(400).json({ error: 'Invalid input' });

  // 3. Logic wrapped in try/catch
  try {
    // do work
    res.json({ ok: true });
  } catch (err) {
    console.error('[route-name]', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Error response rules
- `400`: Bad request (invalid input shape)
- `401`: No or invalid session
- `403`: Valid session but insufficient role
- `429`: Rate limit exceeded (already handled by `rateLimitCheck`)
- `500`: Unexpected server error — NEVER echo `err.message`
- `502`: Upstream proxy error — NEVER echo upstream response details

### Middleware order
Guards must be applied BEFORE `express.static()` for the same path prefix.
Always place `studentGuardMiddleware` directly before `express.static()`.

### New module guard pattern
```js
const MY_MODULE_DIR = path.join(DIST, 'mymodule');
app.use('/mymodule', studentGuardMiddleware, express.static(MY_MODULE_DIR));
```
