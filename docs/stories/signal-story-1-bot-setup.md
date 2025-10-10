# Story 1: Signal Bot Setup & Basic Integration

<!-- Source: epic-signal-integration.md -->
<!-- Context: Brownfield enhancement to Padel coordination app -->

## Status: Draft

---

## Story

As a **Padel app administrator**,  
I want **automatic notifications posted to our Signal group when key events occur**,  
so that **all players stay informed in real-time without needing to log into the app**.

---

## Context Source

- **Source Document:** docs/epic-signal-integration.md (Story 1 of 3)
- **Enhancement Type:** New integration - Signal Messenger API
- **Existing System Impact:** Extends notification system, does not modify existing in-app notifications
- **Epic Goal:** Enable real-time Signal group notifications for session events

---

## Acceptance Criteria

### New Functionality

1. ✅ Signal bot account is created and linked to the Signal group
2. ✅ signal-cli-rest-api is deployed and accessible to the backend
3. ✅ Backend can successfully send messages to the Signal group
4. ✅ When a session is created, a formatted message posts to Signal
5. ✅ When a player RSVPs (joins/leaves court), a formatted message posts to Signal
6. ✅ When match results are recorded, a formatted message posts to Signal
7. ✅ Feature flag (`SIGNAL_ENABLED`) allows easy enable/disable
8. ✅ Error logs capture all Signal integration events

### Existing Functionality Protection

9. ✅ In-app notification system continues working unchanged
10. ✅ Notification API endpoints (`GET /api/notifications/*`) function normally
11. ✅ NotificationBell component displays notifications correctly
12. ✅ If Signal API fails, app continues operating normally (graceful degradation)
13. ✅ No performance degradation in existing notification flow

### Technical Quality

14. ✅ Comprehensive error handling with try-catch blocks
15. ✅ Signal failures are logged but don't throw errors
16. ✅ Environment variables documented in README
17. ✅ Code follows existing TypeScript/Express patterns

---

## Dev Technical Guidance

### Existing System Context

**Current Notification System:**
- **Location:** `backend/src/services/notificationService.ts`
- **Database:** Notifications stored in PostgreSQL via Prisma
- **Notification Types:**
  - `session_created` - New session added
  - `session_updated` - Session details changed
  - `rsvp_update` - Player joined/left a court
  - `match_result` - Match score recorded
- **Creation Points:**
  - SessionService creates session notifications
  - RSVPService creates RSVP notifications
  - MatchService creates match result notifications
- **Current Flow:**
  ```
  Event occurs → Service calls notificationService.createNotification()
  → Saves to DB → Frontend polls for new notifications
  ```

**Technology Stack:**
- Backend: Node.js 18+, Express 4.x, TypeScript 5.x
- ORM: Prisma 5.x with PostgreSQL
- Deployment: Render.com (Docker containers)
- Environment: `.env` file for local, Render dashboard for production

**Existing Patterns:**
- Service-based architecture (`backend/src/services/`)
- Environment variable configuration
- Async/await for all async operations
- Try-catch with console.error for error handling
- Exported service objects with methods

---

### Integration Approach

**Architecture Decision:**
Create a new `SignalService` that `NotificationService` calls after saving to database.

**Dual-Delivery Pattern:**
```typescript
async createNotification(data) {
  // 1. Existing: Save to database (unchanged)
  const notification = await prisma.notification.create({...});
  
  // 2. NEW: Also send to Signal (additive)
  await signalService.sendNotification(notification);
  
  return notification;
}
```

**Key Implementation Files:**
1. **NEW:** `backend/src/services/signalService.ts` - Signal API client
2. **MODIFY:** `backend/src/services/notificationService.ts` - Add Signal calls
3. **NEW:** `backend/src/types/signal.ts` - Type definitions (optional)
4. **MODIFY:** `backend/.env.example` - Document new environment variables
5. **MODIFY:** `README.md` - Signal setup instructions

---

### Technical Constraints

1. **Must use signal-cli-rest-api** (not direct signal-cli)
   - Easier HTTP integration vs CLI commands
   - Better suited for Docker deployment
   
2. **Must be non-blocking**
   - Use async/await properly
   - Signal failures cannot break notification creation
   
3. **Must be feature-flaggable**
   - Check `SIGNAL_ENABLED` environment variable
   - Allow easy disable without code changes
   
4. **Must handle API failures gracefully**
   - Wrap all Signal calls in try-catch
   - Log errors but don't throw
   - Return success even if Signal fails

5. **Must follow existing service patterns**
   - Export single service object
   - Use Prisma types where applicable
   - Follow project TypeScript configuration

---

### Signal API Integration Details

**signal-cli-rest-api Endpoints:**
```
POST /v2/send
Body: {
  "message": "Text content",
  "number": "+31612345678",
  "recipients": ["group.abc123..."]
}
```

**Environment Variables Needed:**
```bash
SIGNAL_ENABLED=true                    # Feature flag
SIGNAL_API_URL=http://localhost:8080   # signal-cli-rest-api URL
SIGNAL_NUMBER=+31612345678             # Bot phone number
SIGNAL_GROUP_ID=group.abc123...        # Target group ID
```

**Docker Deployment (signal-cli-rest-api):**
```yaml
# Add to your docker-compose.yml or Render blueprint
signal-api:
  image: bbernhard/signal-cli-rest-api:latest
  ports:
    - "8080:8080"
  volumes:
    - signal-data:/home/.local/share/signal-cli
```

---

### Message Format Specifications

**Session Created:**
```
🎾 New Session Created!
📅 Friday, Oct 11 at 20:30
📍 Padel Next
🏟️ 2 courts available
👤 Created by: John Doe
```

**RSVP Update:**
```
✅ John Doe joined Court 1
🏟️ Court 1: 3/4 spots filled
```

**Match Result:**
```
🎾 Match Result - Court 1
Team 1: 6-4, 6-3 ✅
Team 2: 4-6, 3-6
```

---

## Tasks / Subtasks

### Task 1: Signal Bot Account Setup (Manual - Prerequisites)

**Note:** These are manual steps to be completed before implementation.

- [ ] Create Signal account for bot (use dedicated phone number)
- [ ] Install Signal on device and register the number
- [ ] Join the bot account to your Padel group
- [ ] Deploy signal-cli-rest-api:
  - [ ] Option A: Docker locally for development
  - [ ] Option B: Deploy to Render.com alongside backend
- [ ] Link bot account to signal-cli-rest-api
- [ ] Test basic message sending with curl/Postman
- [ ] Obtain group ID from signal-cli-rest-api
- [ ] Document credentials in secure location

**Acceptance:** Bot can manually send test message to group via signal-cli-rest-api

---

### Task 2: Create SignalService

- [ ] Create `backend/src/services/signalService.ts`
- [ ] Implement `SignalService` class/object:
  - [ ] `sendMessage(text: string): Promise<void>` - Core send function
  - [ ] `formatSessionCreated(notification)` - Format session notification
  - [ ] `formatRsvpUpdate(notification)` - Format RSVP notification
  - [ ] `formatMatchResult(notification)` - Format match notification
  - [ ] `sendNotification(notification)` - Main entry point
- [ ] Add environment variable validation
- [ ] Implement feature flag check (`SIGNAL_ENABLED`)
- [ ] Add comprehensive error handling (try-catch)
- [ ] Add logging for success and failure cases
- [ ] Use `axios` or `fetch` for HTTP requests to signal-cli-rest-api

**Acceptance:** SignalService can send formatted messages to Signal group

---

### Task 3: Integrate SignalService with NotificationService

- [ ] Open `backend/src/services/notificationService.ts`
- [ ] Import the new `signalService`
- [ ] Modify `createNotification` method:
  - [ ] After successful database save
  - [ ] Call `await signalService.sendNotification(notification)`
  - [ ] Wrap in try-catch to prevent failures from breaking notification creation
  - [ ] Log Signal send success/failure
- [ ] Ensure existing notification flow is unchanged
- [ ] Verify no breaking changes to method signatures

**Acceptance:** Notifications save to DB and send to Signal (if enabled)

---

### Task 4: Environment Configuration

- [ ] Add new environment variables to `backend/.env.example`:
  ```bash
  # Signal Integration
  SIGNAL_ENABLED=false
  SIGNAL_API_URL=http://localhost:8080
  SIGNAL_NUMBER=
  SIGNAL_GROUP_ID=
  ```
- [ ] Update local `.env` file with actual values
- [ ] Document required variables in `README.md`:
  - [ ] How to get SIGNAL_NUMBER
  - [ ] How to get SIGNAL_GROUP_ID
  - [ ] How to set up signal-cli-rest-api
- [ ] Add Render.com deployment notes

**Acceptance:** Environment variables are documented and configured

---

### Task 5: Testing & Verification

**Manual Testing:**
- [ ] Start signal-cli-rest-api locally
- [ ] Set `SIGNAL_ENABLED=true` in `.env`
- [ ] Test session creation:
  - [ ] Create a new session via app
  - [ ] Verify notification saves to database (existing behavior)
  - [ ] Verify message appears in Signal group (new behavior)
  - [ ] Check message formatting is correct
- [ ] Test RSVP update:
  - [ ] Join a court
  - [ ] Verify notification in DB and Signal
- [ ] Test match result:
  - [ ] Record a match score
  - [ ] Verify notification in DB and Signal

**Error Scenario Testing:**
- [ ] Stop signal-cli-rest-api
- [ ] Create a notification
- [ ] Verify app still works (no errors thrown)
- [ ] Verify notification still saves to database
- [ ] Check error is logged in console

**Feature Flag Testing:**
- [ ] Set `SIGNAL_ENABLED=false`
- [ ] Create notifications
- [ ] Verify no Signal messages sent
- [ ] Verify in-app notifications still work

**Acceptance:** All notification types post to Signal, errors are handled gracefully

---

### Task 6: Code Review & Cleanup

- [ ] Review code follows project patterns
- [ ] Remove any debug console.logs
- [ ] Ensure TypeScript types are correct
- [ ] Verify no linter errors
- [ ] Check all TODOs are addressed
- [ ] Verify imports are organized

**Acceptance:** Code is clean and follows project standards

---

## Risk Assessment

### Implementation Risks

**Primary Risk:** Signal API dependency could cause notification creation to fail or slow down

**Mitigation:**
- Wrap all Signal calls in try-catch blocks
- Don't throw errors from SignalService
- Use feature flag for easy disable
- Signal send happens after DB save (DB always succeeds first)

**Verification:**
- Test with Signal API offline
- Confirm notifications still save to database
- Check app performance with Signal enabled vs disabled

---

### Secondary Risk: Signal API rate limiting or downtime

**Mitigation:**
- Implement basic retry logic (optional for Story 1)
- Log all failures for monitoring
- Feature flag allows immediate disable

**Verification:**
- Monitor Signal send success rate
- Check logs for repeated failures

---

### Rollback Plan

If Signal integration causes issues:

1. Set `SIGNAL_ENABLED=false` in environment variables (immediate)
2. Restart backend service (if needed)
3. Remove Signal calls from NotificationService (if permanent rollback needed)
4. Delete `signalService.ts` file (if permanent rollback needed)

**Key:** In-app notifications remain unchanged, so users still get notified

---

### Safety Checks

- [x] Existing notification system tested before changes
- [x] Signal integration is additive (doesn't modify existing flow)
- [x] Feature flag allows changes to be isolated
- [x] Rollback procedure documented above

---

## Definition of Done Checklist

- [ ] Signal bot account created and linked to group
- [ ] signal-cli-rest-api deployed and accessible
- [ ] SignalService created and tested
- [ ] NotificationService integrated with SignalService
- [ ] All three notification types post to Signal:
  - [ ] Session created
  - [ ] RSVP update
  - [ ] Match result
- [ ] Error handling prevents Signal failures from breaking app
- [ ] Feature flag (`SIGNAL_ENABLED`) works correctly
- [ ] Environment variables documented
- [ ] README updated with Signal setup instructions
- [ ] Manual testing completed successfully
- [ ] Error scenario testing passed
- [ ] No regression in existing notification system
- [ ] Code reviewed and cleaned up

---

## File List

**Files to Create:**
- `backend/src/services/signalService.ts`
- `backend/src/types/signal.ts` (optional)

**Files to Modify:**
- `backend/src/services/notificationService.ts`
- `backend/.env.example`
- `README.md`

**Files to Reference (Read Only):**
- `backend/src/services/notificationService.ts` (understand existing patterns)
- `backend/prisma/schema.prisma` (Notification model structure)

---

## Dependencies

**Required Before Implementation:**
- Signal bot account created
- signal-cli-rest-api deployed and accessible
- Group ID obtained

**NPM Packages:**
- `axios` (already in project) or `node-fetch` for HTTP requests

**External Services:**
- signal-cli-rest-api (Docker container)

---

## References

- [signal-cli-rest-api Documentation](https://github.com/bbernhard/signal-cli-rest-api)
- [signal-cli-rest-api API Spec](https://bbernhard.github.io/signal-cli-rest-api/)
- Epic: `docs/epic-signal-integration.md`
- Existing: `backend/src/services/notificationService.ts`

---

## Notes for Dev Agent

1. **Start Simple:** Get basic message sending working first, then add formatting
2. **Test Early:** Manually test Signal sending before integrating with NotificationService
3. **Error Logging:** Be verbose with logging - helps debug Signal API issues
4. **Message Format:** Use the message format specifications provided, but feel free to adjust emojis/formatting for better readability
5. **Feature Flag:** Always check `SIGNAL_ENABLED` before attempting to send - this prevents accidents in production during setup
6. **Async Properly:** Don't await Signal send in a way that blocks notification creation - use fire-and-forget pattern with error handling

---

**Story created by:** Bob (Scrum Master Agent)  
**Date:** 2025-10-09  
**Ready for:** Dev Agent implementation

