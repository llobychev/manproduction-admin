# Admin App auth endpoint migration

Status: draft; production code is unchanged.

## Required code change

In `index.html`, inside `firebaseAuth`, replace:

```js
xhr.open('POST', AUTH_SERVER + '/auth', true);
```

with:

```js
xhr.open('POST', AUTH_SERVER + '/auth/admin', true);
```

## Required backend behavior

The endpoint must:

1. validate `initData` only with `ADMIN_BOT_TOKEN`;
2. extract the Telegram user ID;
3. verify `admin_users/{uid}` or the configured owner identity;
4. reject pending, rejected and unknown users;
5. return a Firebase Custom Token with the admin contour and role claims.

## Client hardening required before strict Rules

- do not initialize Firestore after failed authentication;
- do not treat a hardcoded Telegram ID in browser code as authorization;
- do not allow the client to assign roles, permissions or approved status without backend authorization;
- migrate critical administrative writes to protected backend endpoints.

## Rollout order

1. Deploy and test `/auth/admin` while legacy `/auth` remains available.
2. Verify owner and approved staff login.
3. Verify pending, rejected and Main Bot `initData` are denied.
4. Merge the endpoint migration.
5. Migrate role changes, subscriptions, promo codes and finance writes to backend.
