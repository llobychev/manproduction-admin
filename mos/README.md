# MOS Overview UI v1

Standalone read-only prototype for the MenClub Operating System overview screen.

## Files

- `overview.html` — visual shell;
- `overview.js` — authenticated read-only loader for `/mos/v1/overview`.

## Security model

- requires an existing Firebase Admin session;
- sends only a Firebase ID token in the `Authorization: Bearer` header;
- performs GET requests only;
- never reads Telegram bot tokens, service-account JSON or environment variables;
- renders all remote text through HTML escaping;
- fails closed when authorization or API access is unavailable.

## Integration order

1. Validate backend auth contour PR.
2. Validate MOS read-only API PR.
3. Switch Admin App auth to `/auth/admin`.
4. Add `mos.view` permission to approved roles.
5. Embed this screen into the Admin navigation.

This branch does not modify the production `index.html`.
