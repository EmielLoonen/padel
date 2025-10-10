# Epic: Admin Role & Permissions

**Status:** Draft  
**Created:** 2025-10-09  
**Epic Type:** Brownfield Enhancement  
**Estimated Effort:** 4-6 hours (1 story initially)

---

## Epic Goal

Add an admin role that allows a designated user to edit and delete any session or match result (not just their own creations), providing god-mode oversight for managing the Padel group's data.

---

## Epic Description

### Existing System Context

**Current functionality:**
- Users can only edit/delete their own sessions
- Users can only edit/delete match results they created
- No concept of roles or elevated permissions
- Authentication via JWT tokens

**Technology stack:**
- Backend: Node.js/Express, TypeScript, Prisma ORM, PostgreSQL
- Frontend: React, TypeScript, Zustand state management
- Auth: JWT with user ID in payload

**Authorization pattern:**
- Currently: `if (session.createdById === userId) { allow }`
- Currently: `if (match.createdById === userId) { allow }`

---

### Enhancement Details

**What's being added:**
- `isAdmin` boolean field on User model
- Admin bypass for edit/delete authorization checks
- Visual indicator (🛡️ badge) for admin users
- One user (you) will be set as admin initially

**How it integrates:**
- Extends existing authorization checks
- No special admin UI needed
- Admin sees same interface, but with edit/delete buttons on all content

**Success criteria:**
- ✅ Admin can edit any session (not just their own)
- ✅ Admin can delete any session
- ✅ Admin can edit any match result
- ✅ Admin can delete any match result
- ✅ Admin badge visible on profile
- ✅ Non-admin users still restricted to their own content

---

## Stories

### Story 1: Admin Role with Session & Match Management

**Goal:** Add admin role to User model and enable admin to edit/delete any session or match result.

**Scope:**
- Add `isAdmin` boolean to User schema
- Database migration
- Update authorization middleware/checks
- Update frontend to show edit/delete for admins on all content
- Add admin badge (🛡️) to user display
- Set your account as admin via seed/migration script

**Estimated effort:** 4-6 hours

**Acceptance Criteria:**
- Admin user can edit any session
- Admin user can delete any session
- Admin user can edit any match result
- Admin user can delete any match result
- Admin badge shows on admin's profile/name
- Non-admin users still restricted to their own content
- Existing functionality unchanged for non-admins

---

### Story 2: User Management (Future)

**Goal:** Allow admin to manage users (disable accounts, reset passwords, assign admin role).

**Scope:**
- Admin panel or user list page
- Disable/enable user accounts
- Password reset capability
- Assign/revoke admin role to others

**Estimated effort:** 4-6 hours

**Status:** NOT STARTED - Future enhancement

---

### Story 3: RSVP & Advanced Management (Future)

**Goal:** Allow admin to manage RSVPs and override system limits.

**Scope:**
- Change anyone's RSVP status
- Move players between courts
- Override full court limits
- Cancel sessions with notifications

**Estimated effort:** 3-4 hours

**Status:** NOT STARTED - Future enhancement

---

## Compatibility Requirements

- ✅ Existing authorization logic unchanged for non-admins
- ✅ Database schema change is additive (new field, defaults to false)
- ✅ JWT token unchanged (no need to re-login)
- ✅ Frontend UI unchanged except for admin-specific buttons
- ✅ API endpoints remain backward compatible

---

## Risk Mitigation

### Primary Risk: Authorization bypass bug could expose data

**Mitigation:**
- Use consistent authorization pattern across all endpoints
- Test both admin and non-admin scenarios
- Add logging for admin actions (optional)

### Secondary Risk: Accidentally making wrong user admin

**Mitigation:**
- Admin assignment via database script (not UI initially)
- Easy to revoke by setting `isAdmin = false`

**Rollback Plan:**
1. Set all `isAdmin = false` in database
2. Revert authorization checks if needed
3. Non-admin functionality remains unchanged

---

## Technical Architecture

### Database Schema Change

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String
  phone     String?
  avatarUrl String?
  isAdmin   Boolean  @default(false)  // NEW
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // ... existing relations
}
```

### Authorization Pattern

**Before:**
```typescript
if (session.createdById !== userId) {
  return res.status(403).json({ error: 'Unauthorized' });
}
```

**After:**
```typescript
const user = await prisma.user.findUnique({ where: { id: userId } });
if (session.createdById !== userId && !user?.isAdmin) {
  return res.status(403).json({ error: 'Unauthorized' });
}
```

### Frontend Changes

**Session Detail Page:**
- Show edit/delete buttons if: `session.createdById === userId || user.isAdmin`

**Match Results:**
- Show edit/delete buttons if: `match.createdById === userId || user.isAdmin`

**User Display:**
- Add admin badge: `{user.isAdmin && '🛡️'}`

---

## Environment Configuration

No new environment variables needed.

---

## Definition of Done

- ✅ User schema includes `isAdmin` field
- ✅ Database migration applied
- ✅ Your account set as admin
- ✅ Authorization checks updated in:
  - Session edit endpoint
  - Session delete endpoint
  - Match edit endpoint
  - Match delete endpoint
- ✅ Frontend shows edit/delete for admin on:
  - Any session detail page
  - Any match result
- ✅ Admin badge (🛡️) displays for admin users
- ✅ Manual testing completed (admin and non-admin scenarios)
- ✅ No regression in existing authorization
- ✅ Non-admin users still restricted appropriately

---

## Implementation Order

**Story 1 Tasks:**
1. Update Prisma schema (add `isAdmin` field)
2. Run migration
3. Set your account as admin (script or manual SQL)
4. Update backend authorization checks (4 endpoints)
5. Update frontend to show buttons conditionally
6. Add admin badge to user display
7. Test both admin and non-admin scenarios

---

## Future Enhancements (Out of Scope for Story 1)

- User management (disable accounts, assign admin)
- RSVP management (move players, override limits)
- Audit log for admin actions
- Admin analytics dashboard
- Bulk operations (delete old sessions, etc.)

---

## References

- Current authorization: Check `backend/src/routes/sessions.ts` and `backend/src/routes/matches.ts`
- User model: `backend/prisma/schema.prisma`
- Frontend session detail: `frontend/src/pages/SessionDetailPage.tsx`

---

**Epic created by:** BMad Orchestrator  
**Next step:** Transform to Story Manager to create detailed Story 1

