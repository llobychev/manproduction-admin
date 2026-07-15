# Permission Matrix v1 — validation status

Date: 2026-07-15

## Verified commit

`f1be31cbbf5a7dd37339bbc88b30779042b25d2b`

`security: add role templates and full permission matrix`

## Manual production validation

Confirmed by Alexey in the Admin Mini App:

- role list renders correctly;
- choosing a role applies its permission template;
- individual permissions can override the template;
- overrides persist after saving and full reload;
- News access is actually blocked when `permissions.admin.news` is disabled;
- News access is restored when the permission is enabled again.

## Accepted baseline

Permission Matrix v1 is accepted as the working RBAC baseline for further module migration.

Current model:

`role -> default permissions -> individual overrides -> Firestore persistence`

## Next module order

1. Challenges
2. Tasks
3. Users
4. Subscriptions
5. Demo access
6. Lyova knowledge
7. Statistics
8. Team fund
9. Partners
10. Knowledge Base

## Security note

Client-side visibility and lock screens are not sufficient as the final security boundary. Each critical mutation must also be enforced by the protected backend API and detailed Firestore Rules. Add audit logging and negative authorization tests before production-ready status.
