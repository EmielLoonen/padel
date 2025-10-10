# Story 1: Admin Role with Session & Match Management

<!-- Source: epic-admin-role.md -->
<!-- Context: Brownfield enhancement to Padel coordination app -->

## Status: Draft

---

## Story

As a **Padel app administrator (you)**,  
I want **the ability to edit and delete any session or match result**,  
so that **I can manage and correct group data regardless of who created it**.

---

## Context Source

- **Source Document:** docs/epic-admin-role.md (Story 1 of 3)
- **Enhancement Type:** Authorization enhancement - Admin role
- **Existing System Impact:** Extends authorization checks, no breaking changes
- **Epic Goal:** Enable admin oversight for all content

---

## Acceptance Criteria

### New Functionality

1. ✅ User model has `isAdmin` boolean field
2. ✅ Your account is set as admin (`isAdmin = true`)
3. ✅ Admin can edit any session (sees edit button on all sessions)
4. ✅ Admin can delete any session (sees delete button on all sessions)
5. ✅ Admin can edit any match result (sees edit button on all matches)
6. ✅ Admin can delete any match result (sees delete button on all matches)
7. ✅ Admin badge (🛡️) displays next to admin's name in UI
8. ✅ Authorization checks allow admin to bypass ownership checks

### Existing Functionality Protection

9. ✅ Non-admin users can still only edit/delete their own content
10. ✅ Existing sessions/matches remain unchanged
11. ✅ Authentication flow unchanged (no need to re-login)
12. ✅ API responses include `isAdmin` field for frontend
13. ✅ No breaking changes to existing authorization

### Technical Quality

14. ✅ Database migration runs successfully
15. ✅ Authorization pattern is consistent across all endpoints
16. ✅ TypeScript types updated for User model
17. ✅ Frontend conditionals correctly check admin status

---

## Dev Technical Guidance

### Existing System Context

**Current Authorization Pattern:**
- **Location:** Authorization checks in route handlers
- **Pattern:** Check if `createdById === userId`
- **Affected Endpoints:**
  - `PUT /api/sessions/:id` - Edit session
  - `DELETE /api/sessions/:id` - Delete session
  - `PUT /api/matches/:id` - Edit match
  - `DELETE /api/matches/:id` - Delete match

**Frontend Authorization:**
- **Session Detail Page:** Shows edit/delete only if user created the session
- **Match Results:** Shows edit/delete only if user created the match
- **Pattern:** `session.createdById === user.id`

**Technology Stack:**
- Backend: Node.js 18+, Express 4.x, TypeScript 5.x
- ORM: Prisma 5.x with PostgreSQL
- Frontend: React 18 + TypeScript + Zustand
- Auth: JWT tokens with user ID in payload

**User Model Location:**
- Schema: `backend/prisma/schema.prisma`
- Auth service: `backend/src/services/authService.ts`
- User store: `frontend/src/store/authStore.ts`

---

### Integration Approach

**Architecture Decision:**
Add `isAdmin` field to User model and check it in authorization logic.

**Authorization Pattern Change:**
```typescript
// BEFORE
if (session.createdById !== userId) {
  return res.status(403).json({ error: 'Unauthorized' });
}

// AFTER
const user = await prisma.user.findUnique({ where: { id: userId } });
if (session.createdById !== userId && !user?.isAdmin) {
  return res.status(403).json({ error: 'Unauthorized' });
}
```

**Frontend Pattern Change:**
```typescript
// BEFORE
{session.createdById === user?.id && (
  <button>Edit</button>
)}

// AFTER
{(session.createdById === user?.id || user?.isAdmin) && (
  <button>Edit</button>
)}
```

---

### Technical Constraints

1. **Must use database migration**
   - Add field via Prisma migration
   - Default value: `false`
   - Existing users remain non-admin
   
2. **Must fetch user for each authorization check**
   - Can't rely on JWT payload (doesn't include isAdmin)
   - Need to query database for user role
   - Consider caching if performance issue
   
3. **Must update all authorization checks**
   - Session edit/delete (2 endpoints)
   - Match edit/delete (2 endpoints)
   - Consistent pattern across all

4. **Must include isAdmin in API responses**
   - Auth endpoints return user with isAdmin
   - Frontend needs isAdmin to show buttons

5. **Must display admin badge**
   - Show 🛡️ next to admin names
   - Check in user display components

---

### Key Implementation Files

**Backend:**
1. **MODIFY:** `backend/prisma/schema.prisma` - Add `isAdmin Boolean @default(false)`
2. **CREATE:** Migration file via `prisma migrate dev`
3. **MODIFY:** `backend/src/routes/sessions.ts` - Update PUT and DELETE authorization
4. **MODIFY:** `backend/src/routes/matches.ts` - Update PUT and DELETE authorization
5. **MODIFY:** `backend/src/services/authService.ts` - Include isAdmin in responses (if needed)

**Frontend:**
6. **MODIFY:** `frontend/src/store/authStore.ts` - Add isAdmin to User type
7. **MODIFY:** `frontend/src/pages/SessionDetailPage.tsx` - Update edit/delete conditionals
8. **MODIFY:** `frontend/src/components/Avatar.tsx` or user display - Add admin badge

**Script:**
9. **CREATE:** `backend/prisma/set-admin.ts` - Script to set your account as admin

---

### Admin Assignment

**Your Account Email:** (You'll need to provide this)

**Script to Set Admin:**
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function setAdmin() {
  const adminEmail = 'YOUR_EMAIL@example.com'; // Replace with your email
  
  const user = await prisma.user.update({
    where: { email: adminEmail },
    data: { isAdmin: true },
  });
  
  console.log(`✅ Set ${user.name} (${user.email}) as admin`);
}

setAdmin();
```

---

## Tasks / Subtasks

### Task 1: Update Database Schema & Migration

- [ ] Open `backend/prisma/schema.prisma`
- [ ] Add `isAdmin Boolean @default(false)` to User model
- [ ] Run `cd backend && pnpm prisma migrate dev --name add-admin-role`
- [ ] Verify migration created successfully
- [ ] Check migration file in `backend/prisma/migrations/`

**Acceptance:** User model has isAdmin field, migration applied

---

### Task 2: Set Your Account as Admin

- [ ] Create script `backend/prisma/set-admin.ts` (use template above)
- [ ] Update script with your actual email address
- [ ] Run: `cd backend && pnpm tsx prisma/set-admin.ts`
- [ ] Verify in database or Prisma Studio that your user has `isAdmin = true`

**Alternative (Manual SQL):**
```sql
UPDATE users SET is_admin = true WHERE email = 'YOUR_EMAIL@example.com';
```

**Acceptance:** Your user account has isAdmin = true in database

---

### Task 3: Update Backend Authorization - Sessions

- [ ] Open `backend/src/routes/sessions.ts`
- [ ] Find the `PUT /:id` (update session) route handler
- [ ] Update authorization check:
  ```typescript
  // Fetch user to check admin status
  const requestingUser = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  // Check authorization
  if (session.createdById !== userId && !requestingUser?.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  ```
- [ ] Find the `DELETE /:id` route handler
- [ ] Apply same authorization pattern
- [ ] Test TypeScript compilation

**Acceptance:** Session edit/delete routes check admin status

---

### Task 4: Update Backend Authorization - Matches

- [ ] Open `backend/src/routes/matches.ts`
- [ ] Find the `PUT /:id` (update match) route handler
- [ ] Update authorization check (same pattern as Task 3):
  ```typescript
  const requestingUser = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  if (match.createdById !== userId && !requestingUser?.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  ```
- [ ] Find the `DELETE /:id` route handler
- [ ] Apply same authorization pattern
- [ ] Test TypeScript compilation

**Acceptance:** Match edit/delete routes check admin status

---

### Task 5: Update Frontend User Type

- [ ] Open `frontend/src/store/authStore.ts`
- [ ] Update User interface to include `isAdmin?: boolean;`
- [ ] Verify no TypeScript errors
- [ ] Check that auth responses include isAdmin field

**Note:** Backend auth endpoints should already return full user object including isAdmin after migration.

**Acceptance:** Frontend User type includes isAdmin field

---

### Task 6: Update Frontend - Session Detail Page

- [ ] Open `frontend/src/pages/SessionDetailPage.tsx`
- [ ] Find the edit session button conditional (around line with `session.createdById === user?.id`)
- [ ] Update to: `(session.createdById === user?.id || user?.isAdmin)`
- [ ] Find the delete session button conditional
- [ ] Update with same pattern
- [ ] Test TypeScript compilation

**Acceptance:** Admin sees edit/delete buttons on all sessions

---

### Task 7: Update Frontend - Match Results

- [ ] In `frontend/src/pages/SessionDetailPage.tsx`
- [ ] Find match result edit/delete button conditionals
- [ ] Update to: `(match.createdById === user?.id || user?.isAdmin)`
- [ ] Apply to both edit and delete buttons for each match

**Acceptance:** Admin sees edit/delete buttons on all match results

---

### Task 8: Add Admin Badge to UI

- [ ] Decide where to show admin badge:
  - Option A: Next to user name in header
  - Option B: On user profile/settings
  - Option C: Both
- [ ] Add admin badge display:
  ```tsx
  {user?.isAdmin && (
    <span className="ml-2 text-yellow-500" title="Admin">
      🛡️
    </span>
  )}
  ```
- [ ] Choose appropriate location(s) for badge
- [ ] Test badge appears for admin user

**Acceptance:** 🛡️ badge displays for admin user

---

### Task 9: Testing & Verification

**Admin Testing (Your Account):**
- [ ] Log in with your admin account
- [ ] Navigate to a session you didn't create
- [ ] Verify edit button is visible
- [ ] Click edit and modify session
- [ ] Verify changes save successfully
- [ ] Verify delete button is visible
- [ ] Navigate to a match result you didn't create
- [ ] Verify edit/delete buttons visible
- [ ] Test editing match result
- [ ] Verify admin badge (🛡️) displays

**Non-Admin Testing (Test Account):**
- [ ] Log in with a test/non-admin account
- [ ] Navigate to a session created by someone else
- [ ] Verify NO edit/delete buttons visible
- [ ] Navigate to own session
- [ ] Verify edit/delete buttons ARE visible (normal behavior)
- [ ] Verify NO admin badge displays

**API Testing:**
- [ ] Test admin can PUT/DELETE any session (should succeed)
- [ ] Test non-admin trying to PUT/DELETE others' session (should fail with 403)

**Acceptance:** All admin and non-admin scenarios work correctly

---

### Task 10: Code Review & Cleanup

- [ ] Review all authorization checks for consistency
- [ ] Ensure error handling is proper
- [ ] Remove any debug console.logs
- [ ] Verify TypeScript has no errors
- [ ] Check linter passes
- [ ] Verify all imports are correct

**Acceptance:** Code is clean and follows project standards

---

## Risk Assessment

### Implementation Risks

**Primary Risk:** Authorization bypass bug could allow non-admins to edit others' content

**Mitigation:**
- Use consistent pattern across all endpoints
- Test both admin and non-admin scenarios thoroughly
- Double-check logical operators (`&&` vs `||`)

**Verification:**
- Manual testing with admin and non-admin accounts
- Test editing own content (should work for both)
- Test editing others' content (should only work for admin)

---

### Secondary Risk: Wrong user set as admin

**Mitigation:**
- Admin script requires explicit email
- Easy to verify in database
- Easy to revoke by setting `isAdmin = false`

**Verification:**
- Check database after running script
- Test with correct account

---

### Rollback Plan

If admin feature causes issues:

1. **Quick Fix:** Set all users to `isAdmin = false` in database
   ```sql
   UPDATE users SET is_admin = false;
   ```
2. **Revert Code:** Git revert the changes (frontend conditionals, backend checks)
3. **Keep Migration:** Can leave isAdmin field (harmless if all false)

**Key:** Non-admin authorization remains unchanged, so system degrades gracefully

---

## Definition of Done Checklist

- [ ] User schema includes `isAdmin` field with default false
- [ ] Database migration applied successfully
- [ ] Your account set as admin (isAdmin = true)
- [ ] Backend authorization updated for:
  - [ ] Session edit (PUT)
  - [ ] Session delete (DELETE)
  - [ ] Match edit (PUT)
  - [ ] Match delete (DELETE)
- [ ] Frontend User type includes isAdmin field
- [ ] Frontend conditionals updated for:
  - [ ] Session edit button
  - [ ] Session delete button
  - [ ] Match edit buttons
  - [ ] Match delete buttons
- [ ] Admin badge (🛡️) displays for admin user
- [ ] Manual testing completed:
  - [ ] Admin can edit any session
  - [ ] Admin can delete any session
  - [ ] Admin can edit any match
  - [ ] Admin can delete any match
  - [ ] Non-admin cannot edit others' content
  - [ ] Non-admin can still edit own content
- [ ] No TypeScript errors
- [ ] No linter errors
- [ ] Code reviewed and cleaned

---

## File List

**Files to Modify:**
- `backend/prisma/schema.prisma`
- `backend/src/routes/sessions.ts`
- `backend/src/routes/matches.ts`
- `frontend/src/store/authStore.ts`
- `frontend/src/pages/SessionDetailPage.tsx`

**Files to Create:**
- `backend/prisma/migrations/[timestamp]_add_admin_role/migration.sql` (auto-generated)
- `backend/prisma/set-admin.ts` (admin assignment script)

**Files to Reference (Read Only):**
- `backend/prisma/schema.prisma` (User model)
- `backend/src/middleware/auth.ts` (authentication pattern)

---

## Dependencies

**Required:**
- Prisma CLI (already in project)
- tsx (for running TypeScript scripts) - may need: `pnpm add -D tsx`

**Your Email Address:**
- Need to know which account to set as admin

---

## References

- Current session routes: `backend/src/routes/sessions.ts`
- Current match routes: `backend/src/routes/matches.ts`
- Session detail page: `frontend/src/pages/SessionDetailPage.tsx`
- User schema: `backend/prisma/schema.prisma`
- Epic: `docs/epic-admin-role.md`

---

## Notes for Dev Agent

1. **Email Address:** Ask user for their email to set as admin
2. **Authorization Pattern:** Be consistent - fetch user, check `!isAdmin` in all 4 endpoints
3. **Frontend Pattern:** Add `|| user?.isAdmin` to all ownership checks
4. **Badge Location:** Suggest header next to user name for visibility
5. **Testing:** Must test both admin and non-admin scenarios
6. **Migration:** Run `prisma migrate dev` not `prisma db push`

---

**Story created by:** Bob (Scrum Master Agent)  
**Date:** 2025-10-09  
**Ready for:** Dev Agent implementation

