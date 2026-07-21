# Admin Mini App auth loading hotfix

Date: 2026-07-21
Status: implementation branch

## Incident

The Telegram Admin Mini App stayed on the `ManClub Team` splash screen indefinitely on both Telegram Desktop and mobile.

The production backend was healthy and reachable at:

```text
https://llobychev-manproduction-networking-server-0fdf.twc1.net
```

The Admin Mini App still used the retired Timeweb hostname:

```text
https://llobychev-manproduction-networking-server-6f2d.twc1.net
```

The authentication request also had no timeout, so a request to an unreachable hostname could leave the splash visible forever.

## Root cause

`index.html` defined the stale `AUTH_SERVER` value and called:

```http
POST /auth/admin
```

against the retired hostname.

## Hotfix design

To avoid a destructive full replacement of the legacy monolithic Admin Mini App:

1. The original application is preserved byte-for-byte as `admin-app.html`.
2. A minimal `index.html` bootstrap loads `admin-app.html` from the same GitHub Pages origin.
3. Before execution, the bootstrap replaces only the retired backend hostname with the active production hostname.
4. The bootstrap injects a 10-second timeout into the `/auth/admin` XHR path.
5. A bootstrap failure renders a visible error state instead of an infinite spinner.

No parser runtime flag, Telegram send path, Firestore data, or Timeweb environment variable is changed by this hotfix.

## Validation

Static validation must confirm:

- `index.html` references `admin-app.html`;
- the active `-0fdf` production hostname is present;
- the auth timeout is present;
- the preserved application still contains the expected `/auth/admin` request marker;
- the preserved application blob is unchanged from the pre-hotfix `index.html`.

Operational validation after GitHub Pages deployment:

1. Open the Admin Mini App through Telegram.
2. Confirm the splash disappears.
3. Confirm the authenticated Admin UI opens for the super admin.
4. Confirm the active backend receives `POST /auth/admin`.
5. Confirm no parser feature flags are enabled as a side effect.

## Rollback

Restore the pre-hotfix `index.html` blob and remove `admin-app.html`.

Pre-hotfix application blob:

```text
b9c19c61024f29b6e49365ccdb70c5149304d353
```
