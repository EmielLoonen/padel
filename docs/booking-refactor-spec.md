# Court Booking System Refactor - Technical Specification

## Executive Summary

Refactor the booking system from a "RSVP-first, book-later" model to a "book-first, assign-to-courts" model where session creators book courts upfront, and attendees select which court they want to play on.

**Status:** Planning  
**Date:** 2025-10-04  
**Author:** Solution Architect  

---

## 1. Current State Analysis

### Current Database Schema

```prisma
model Session {
  bookingStatus           String   @default("unassigned")  // TO REMOVE
  bookingUserId           String?                          // TO REMOVE
  bookingConfirmation     String?                          // TO REMOVE
  bookingExternalLink     String?                          // TO REMOVE
  // ... other fields
}

model RSVP {
  id        String
  sessionId String
  userId    String
  status    String   // 'yes', 'no', 'maybe'
  // NO court assignment
}
```

### Current Flow Issues
- Booking happens AFTER RSVPs (backward from real usage)
- Complex state machine (unassigned → assigned → booked)
- No court-level visibility
- No way to see spots per court
- Doesn't match actual user behavior

---

## 2. Target State Design

### New Database Schema

```prisma
model Session {
  id                      String   @id @default(uuid())
  date                    DateTime
  time                    String
  venueName               String
  totalCost               Decimal?
  notes                   String?
  numberOfCourts          Int      @default(1)  // NEW: 1-3
  createdById             String
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt

  // Relations
  creator                 User     @relation("SessionCreator", fields: [createdById], references: [id])
  courts                  Court[]  // NEW
  rsvps                   RSVP[]
  notifications           Notification[]
}

model Court {
  id                      String   @id @default(uuid())
  sessionId               String
  courtNumber             Int      // 1, 2, or 3
  startTime               String   // "19:00"
  duration                Int      @default(60)  // minutes
  maxPlayers              Int      @default(4)
  createdAt               DateTime @default(now())

  // Relations
  session                 Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  rsvps                   RSVP[]

  @@unique([sessionId, courtNumber])
  @@index([sessionId])
}

model RSVP {
  id        String   @id @default(uuid())
  sessionId String
  userId    String
  courtId   String?  // NEW: null = waitlist or "any"
  status    String   // 'yes', 'no', 'maybe'
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  session   Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  court     Court?   @relation(fields: [courtId], references: [id], onDelete: SetNull)

  @@unique([sessionId, userId])
  @@index([sessionId])
  @@index([userId])
  @@index([courtId])
}
```

---

## 3. Migration Strategy

### Phase 1: Database Migration (Breaking Change)

**Steps:**
1. Create new `Court` table
2. Add `numberOfCourts` to `Session`
3. Add `courtId` to `RSVP`
4. Remove old booking fields from `Session`:
   - `bookingStatus`
   - `bookingUserId`
   - `bookingConfirmation`
   - `bookingExternalLink`

**Data Migration:**
```sql
-- For existing sessions, create default courts based on RSVPs
-- Sessions with 1-4 RSVPs → 1 court
-- Sessions with 5-8 RSVPs → 2 courts
-- All existing RSVPs → assign to Court 1 (first available)
```

**Migration Script:**
```typescript
// backend/prisma/migrations/YYYYMMDD_court_refactor/migration.sql
```

### Phase 2: Backend API Changes

**New Endpoints:**

```typescript
// Create session with courts
POST /api/sessions
Body: {
  date: string
  time: string
  venueName: string
  totalCost?: number
  notes?: string
  courts: Array<{
    courtNumber: number
    startTime: string
    duration: number  // minutes
  }>
}

// Update RSVP with court selection
POST /api/rsvps/session/:sessionId
Body: {
  status: 'yes' | 'no' | 'maybe'
  courtId?: string  // null/undefined = waitlist
}

// Get session with court details
GET /api/sessions/:id
Response: {
  session: Session
  courts: Array<{
    id: string
    courtNumber: number
    startTime: string
    duration: string
    maxPlayers: number
    currentPlayers: number
    rsvps: Array<{ user, status }>
  }>
}
```

**Endpoints to Remove:**
- `POST /api/sessions/:id/claim-booking`
- `POST /api/sessions/:id/release-booking`
- `POST /api/sessions/:id/mark-booked`
- `POST /api/sessions/:id/unbook`

**Service Layer Changes:**

```typescript
// backend/src/services/sessionService.ts
export const sessionService = {
  async createSession(data) {
    // 1. Create session
    // 2. Create courts based on numberOfCourts
    // 3. Default court times from session time
    // 4. Notify users
  },

  async getSessionWithCourts(sessionId) {
    // Include courts with RSVP counts
    // Calculate spots available per court
    // Identify waitlist (RSVPs with courtId = null)
  },

  // Remove: claimBooking, releaseBooking, markAsBooked, unbook
}

// backend/src/services/rsvpService.ts
export const rsvpService = {
  async createOrUpdateRSVP(sessionId, userId, status, courtId?) {
    // Validate court exists and belongs to session
    // Allow RSVP even if court full (waitlist)
    // Update existing RSVP including court change
    // Notify session creator and court players
  },

  async getRSVPsForSession(sessionId) {
    // Group by court
    // Show waitlist separately
    // Calculate per-court availability
  },
}
```

### Phase 3: Frontend Changes

**Store Updates:**

```typescript
// frontend/src/store/sessionStore.ts
interface Court {
  id: string
  courtNumber: number
  startTime: string
  duration: number
  maxPlayers: number
  currentPlayers: number
  rsvps: Array<{
    id: string
    user: { id: string, name: string }
    status: 'yes' | 'no' | 'maybe'
  }>
}

interface Session {
  // ... existing fields
  numberOfCourts: number
  courts: Court[]
  // REMOVE: bookingStatus, bookingUser, bookingConfirmation, bookingExternalLink
}

// Remove: claimBooking, releaseBooking, markAsBooked, unbook
// Update: createSession to include courts
// Update: RSVP to include courtId
```

**UI Components to Update:**

1. **CreateSessionPage.tsx**
   ```tsx
   // Add court configuration
   - Number of courts selector (1-3)
   - If multiple courts: time/duration per court
   - Remove booking status fields
   ```

2. **SessionDetailPage.tsx**
   ```tsx
   // Replace booking section with court display
   - Show each court with time, spots, players
   - Remove: booking claim/assign/mark/unbook buttons
   - Update RSVP to include court selection
   ```

3. **RSVP Component (New)**
   ```tsx
   <RSVPCourtSelector>
     - Show available courts
     - Show spots per court (X/4)
     - Allow waitlist if all full
     - Allow switching courts
   </RSVPCourtSelector>
   ```

4. **App.tsx (Dashboard)**
   ```tsx
   // Update session cards
   - Show "X/Y spots filled" (total across courts)
   - Show per-court breakdown
   - Remove booking status badges
   ```

---

## 4. UI/UX Specifications

### Create Session Flow

```
┌─────────────────────────────────────────┐
│  🎾 Create New Session                  │
├─────────────────────────────────────────┤
│  Date: [Oct 10, 2025]                   │
│  Time: [19:00]                          │
│  Venue: [Court Central Amsterdam]       │
│  Cost: [€40]                            │
│  Notes: [Bring your A-game!]            │
│                                         │
│  📊 Number of Courts: ◯1 ◉2 ◯3         │
│                                         │
│  ┌─ Court 1 ──────────────────────┐    │
│  │ Time: 19:00                     │    │
│  │ Duration: 60 min                │    │
│  │ Max Players: 4                  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─ Court 2 ──────────────────────┐    │
│  │ Time: [19:00] ▼                 │    │
│  │ Duration: [60] min              │    │
│  │ Max Players: 4                  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [Create Session 🎾]                    │
└─────────────────────────────────────────┘
```

### RSVP with Court Selection

```
┌─────────────────────────────────────────┐
│  ✋ Your RSVP                            │
├─────────────────────────────────────────┤
│  ◯ I'm In! ✅                           │
│    Choose your court:                   │
│    ┌─────────────────────────────────┐  │
│    │ ◯ Court 1 (19:00-20:00)         │  │
│    │   3/4 spots filled              │  │
│    │   ✓ John, Sarah, Mike           │  │
│    ├─────────────────────────────────┤  │
│    │ ◯ Court 2 (19:00-20:00)         │  │
│    │   1/4 spots filled              │  │
│    │   ✓ Emma                        │  │
│    ├─────────────────────────────────┤  │
│    │ ◯ Waitlist (if courts full)    │  │
│    └─────────────────────────────────┘  │
│                                         │
│  ◯ Maybe 🤔                             │
│  ◯ Can't Make It ❌                     │
└─────────────────────────────────────────┘
```

### Session Detail Display

```
┌─────────────────────────────────────────┐
│  🎾 Court Central Amsterdam             │
│  📅 Oct 10, 2025 at 19:00              │
│  💰 €40 • By John Doe                   │
├─────────────────────────────────────────┤
│  📊 2 Courts Booked (6/8 spots)         │
│                                         │
│  ┌─ Court 1 (19:00-20:00) ──────────┐  │
│  │ ████ 4/4 FULL                     │  │
│  │ ✅ John Doe                        │  │
│  │ ✅ Sarah Smith                     │  │
│  │ ✅ Mike Johnson                    │  │
│  │ ✅ Emma Davis                      │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─ Court 2 (19:00-20:00) ──────────┐  │
│  │ ██░░ 2/4 (2 spots left)           │  │
│  │ ✅ Alex Brown                      │  │
│  │ ✅ Lisa Wilson                     │  │
│  └───────────────────────────────────┘  │
│                                         │
│  📋 Not Coming:                         │
│  ❌ Tom Anderson                        │
│                                         │
│  ⏳ Maybe:                              │
│  🤔 Anna Martinez                       │
└─────────────────────────────────────────┘
```

---

## 5. Implementation Checklist

### Backend Tasks
- [ ] Create Prisma migration for Court model
- [ ] Update Session model (add numberOfCourts, remove booking fields)
- [ ] Update RSVP model (add courtId)
- [ ] Write data migration script for existing sessions
- [ ] Update sessionService (remove booking methods, add court logic)
- [ ] Update rsvpService (add court selection)
- [ ] Update session routes (remove booking endpoints)
- [ ] Update RSVP routes (add court parameter)
- [ ] Update notification messages (remove booking notifications)
- [ ] Add validation for court assignment
- [ ] Update TypeScript types

### Frontend Tasks
- [ ] Update Session interface (add courts, remove booking fields)
- [ ] Update RSVP interface (add courtId)
- [ ] Update sessionStore (remove booking methods)
- [ ] Update CreateSessionPage (add court configuration)
- [ ] Create CourtSelector component for RSVP
- [ ] Update SessionDetailPage (replace booking section with courts)
- [ ] Update dashboard session cards (show court availability)
- [ ] Remove booking UI components (EditSessionModal booking logic)
- [ ] Update NotificationBell (no booking notifications)
- [ ] Add court switching UI
- [ ] Add waitlist display

### Testing Tasks
- [ ] Test session creation with 1, 2, 3 courts
- [ ] Test RSVP with court selection
- [ ] Test court switching after RSVP
- [ ] Test waitlist when courts full
- [ ] Test "no" and "maybe" RSVPs (no court assignment)
- [ ] Test edge cases (delete court with RSVPs, etc.)
- [ ] Test migration script with existing data

---

## 6. Breaking Changes & Risks

### Breaking Changes
1. **Database schema change** - requires migration
2. **API contract change** - incompatible with old frontend
3. **Existing sessions** need data migration
4. **All booking-related features removed**

### Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | HIGH | Test migration script thoroughly, backup DB |
| Users confused by new flow | MEDIUM | Clear UI labels, keep it simple |
| Court assignment conflicts | LOW | Allow overbooking (waitlist), let users sort it out |
| Performance with many courts/RSVPs | LOW | Add DB indexes, optimize queries |

### Rollback Plan
- Keep old schema in separate branch
- Ability to restore from backup
- Feature flag to enable/disable new court system (not practical for this refactor)

---

## 7. Timeline Estimate

| Phase | Task | Estimated Time |
|-------|------|----------------|
| **Phase 1** | Database migration & models | 1-2 hours |
| **Phase 2** | Backend API refactor | 2-3 hours |
| **Phase 3** | Frontend store & components | 3-4 hours |
| **Phase 4** | Testing & bug fixes | 2-3 hours |
| **Total** | | **8-12 hours** |

---

## 8. Success Criteria

✅ Session creator can specify 1-3 courts with different times  
✅ Users can select which court when RSVPing  
✅ Users can switch courts after RSVPing  
✅ System shows spots available per court  
✅ Waitlist works when all courts full  
✅ Dashboard shows total spots across all courts  
✅ Session detail shows per-court breakdown  
✅ No more "claim booking" or booking status flow  
✅ Existing data migrated successfully  

---

## 9. Future Enhancements (Out of Scope)

- Court rebalancing (move people to even out courts)
- Automatic team generation (balanced skill levels)
- Court preference memory (user always picks Court 1)
- Multi-day recurring sessions
- Court availability integration (venue API)
- Payment splitting per court
- Match scoring per court

---

## 10. Questions & Decisions Log

| Question | Decision | Rationale |
|----------|----------|-----------|
| Allow switching courts? | YES | Real-world flexibility needed |
| Allow overbooking? | YES (waitlist) | Better than hard blocking |
| Auto-assign to courts? | NO | Let users choose |
| Show court times? | YES | Courts can have different slots |
| Max courts per session? | 3 | Covers typical group size |

---

**Spec Status:** ✅ APPROVED - Ready for Implementation  
**Next Step:** Developer review and begin Phase 1 (Database Migration)

