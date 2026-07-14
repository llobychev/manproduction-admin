# Admin user API client migration

This branch migrates approve, reject, and delete operations for `admin_users` from direct browser-to-Firestore writes to the protected backend API.

Production must not restrict Firestore writes until the client migration is merged and smoke-tested.

The client now obtains the Firebase ID Token and sends protected mutations through the backend API.
