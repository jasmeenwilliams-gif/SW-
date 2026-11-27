# Southern Well Senior Concierge — Security Specification

## 1. Data Invariants
1. **Authenticated & Verified Identity**: All user-owned profiles, Digital Care Dossiers, Family Launch Kits, and Consultation Requests require `request.auth != null` and `request.auth.token.email_verified == true`.
2. **Ownership Binding**: Every `CareDossierRecord`, `LaunchKitRecord`, and `ConsultationRequest` must store `ownerId == request.auth.uid` on creation, and `ownerId` and `createdAt` are immutable across updates.
3. **Master Gate for Subcollections**: Documents in `/users/{userId}/dossiers/{dossierId}` and `/users/{userId}/launchKits/{kitId}` require the parent `/users/{userId}` document to exist (`exists(...)`), and can only be accessed by `userId == request.auth.uid` or verified practice admin (`jasmeenwilliams@southernwellofsouthms.com` / `jwi4819@wgu.edu`).
4. **No Self-Assigned Privileges**: A user creating `/users/{userId}` can only set `role: 'client'` unless the verified account email matches the practice administrator (`jasmeenwilliams@southernwellofsouthms.com` / `jwi4819@wgu.edu`), and non-admin updates cannot alter `role` or `uid`.
5. **PII Isolation & Zero Blanket Reads**: No collection allows blanket `isSignedIn()` reads or `list` queries without `resource.data.ownerId == request.auth.uid` (or verified admin).
6. **Temporal Integrity**: `createdAt` and `updatedAt` must equal `request.time`.
7. **Terminal State Locking**: Once a `ConsultationRequest` reaches `'completed'` or `'archived'`, non-admin users cannot update it.

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Dossier Read**: `GET /users/uidA/dossiers/primary` with `auth = null`.
2. **Unverified Email Write**: `CREATE /consultations/c1` with `email_verified = false`.
3. **Cross-Tenant Dossier Read**: `GET /users/uidA/dossiers/primary` authenticated as `uidB` (non-admin).
4. **OwnerId Spoofing on Create**: `CREATE /consultations/c2` by `uidB` with `ownerId: "uidA"`.
5. **Self-Admin Privilege Escalation**: `CREATE /users/uidB` with `role: "admin"` where `email` is not a verified practice admin (`jasmeenwilliams@southernwellofsouthms.com` / `jwi4819@wgu.edu`).
6. **Role Tampering on Update**: `UPDATE /users/uidB` changing `role` from `"client"` to `"admin"`.
7. **Shadow Ghost Field Injection**: `CREATE /consultations/c3` including extra field `isApproved: true`.
8. **Invalid Document ID Poisoning**: `CREATE /users/uidA/dossiers/../../etc/passwd` or >128 char ID.
9. **Client Timestamp Forgery**: `CREATE /consultations/c4` with `createdAt` set to a client-chosen past timestamp instead of `request.time`.
10. **Terminal Consultation Tampering**: `UPDATE /consultations/c5` by owner changing `notes` after `status == "completed"`.
11. **Unbounded Array / Payload Exhaustion**: `CREATE /users/uidA/launchKits/default` with `checkedIds` > 20 items or `notes` > 2000 chars.
12. **Blanket Query Scraping**: `LIST /consultations` by `uidB` without filtering `where("ownerId", "==", "uidB")`.
