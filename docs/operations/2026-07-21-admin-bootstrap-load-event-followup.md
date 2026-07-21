# Admin bootstrap load-event follow-up

Date: 2026-07-21
Status: implementation follow-up

## Smoke result

After PR #23 was merged and the Telegram Mini App was reopened, the `ManClub Team` splash still remained visible after 30 seconds.

## Additional root cause

The preserved application registers its startup logic only through:

```js
window.addEventListener('load', function () { ... });
```

The PR #23 bootstrap fetched the preserved HTML asynchronously and then replaced the current document with `document.open()`, `document.write()`, and `document.close()`.

Because the outer bootstrap document could already have completed its native `load` lifecycle before the fetched application registered its listener, the application startup callback was not guaranteed to run. In that state:

- `/auth/admin` was never called;
- the auth timeout was irrelevant because no auth request started;
- the splash remained visible indefinitely.

## Follow-up fix

The bootstrap now transforms the preserved startup listener into an explicit idempotent `__adminAppBoot()` function and appends a valid call to that function at the end of the transformed document.

The fix also validates all required source markers before replacing the document. A missing marker produces a visible bootstrap error rather than silently publishing a non-starting app.

## Safety

This follow-up does not change:

- Timeweb environment variables;
- parser runtime flags;
- Telegram send behavior;
- Firestore data;
- backend routes.

The preserved `admin-app.html` blob remains unchanged for rollback and forensic comparison.
