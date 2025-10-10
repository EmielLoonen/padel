# Epic: Signal Messenger Integration for Notifications

**Status:** Draft  
**Created:** 2025-10-09  
**Epic Type:** Brownfield Enhancement  
**Estimated Effort:** 9-13 hours (3 stories)

---

## Epic Goal

Enable the Padel app to automatically send notification messages to a Signal group chat when key events occur, keeping all players informed in real-time through their preferred messaging platform.

---

## Epic Description

### Existing System Context

**Current functionality:**
- In-app notification system via REST API
- Notifications stored in PostgreSQL database
- NotificationBell component displays notifications in web app
- Users must be logged in to see notifications

**Technology stack:**
- Backend: Node.js/Express, TypeScript, Prisma ORM, PostgreSQL
- Frontend: React, TypeScript, Zustand state management
- Deployed on Render.com + Neon.tech

**Current notification types:**
- Session creation/updates
- RSVP updates (player joins/leaves court)
- Match results recorded
- General session announcements

**Integration points:**
- `NotificationService` (backend/src/services/notificationService.ts) creates notifications
- Various services trigger notification events (sessionService, rsvpService, matchService)
- Frontend `NotificationBell` component consumes notifications

---

### Enhancement Details

**What's being added:**
- Signal Messenger bot/account setup for app-to-group messaging
- Integration with Signal API (via signal-cli-rest-api)
- Automatic message posting to Signal group when notifications are created
- Message formatting for different notification types (emojis, clear structure)
- Scheduled notifications system (e.g., "Session tomorrow at 20:30!")
- Time-based reminders (2 days before session, day-of reminders)

**How it integrates:**
- Extends existing `NotificationService` to also send to Signal
- Keeps in-app notifications unchanged (dual delivery system)
- Uses job scheduler (node-cron) for time-based notifications
- Signal integration is additive - existing system remains primary

**Success criteria:**
- ✅ All key events automatically post to Signal group
- ✅ Messages are formatted clearly and consistently
- ✅ No disruption to existing in-app notification system
- ✅ Scheduled reminders work reliably
- ✅ Graceful error handling if Signal API is unavailable

---

## Stories

### Story 1: Signal Bot Setup & Basic Integration

**Goal:** Set up Signal bot account, integrate signal-cli-rest-api, and implement basic message sending to the group for immediate notifications.

**Scope:**
- Set up Signal bot account and link to group
- Deploy signal-cli-rest-api (Docker container)
- Create SignalService in backend
- Integrate with NotificationService for immediate notifications:
  - Session created/updated
  - Player RSVP'd (joined/left court)
  - Match results recorded
- Error handling and logging
- Feature flag for easy enable/disable

**Estimated effort:** 4-6 hours

**Acceptance Criteria:**
- Signal bot successfully sends messages to group
- All immediate notification types post to Signal
- In-app notifications continue working unchanged
- Signal failures don't break app functionality
- Logs capture all Signal integration events

---

### Story 2: Scheduled Notification System

**Goal:** Implement job scheduler for time-based notifications like session reminders.

**Scope:**
- Set up node-cron for scheduled jobs
- Create scheduled notification logic:
  - 2 days before session: "🎾 Session reminder: Friday at 20:30 at Padel Next"
  - Day-of reminder: "🎾 Today's session starts at 20:30!"
  - Custom time-based notifications
- Job persistence/recovery on server restart
- Admin controls to configure reminder timing
- Prevent duplicate notifications

**Estimated effort:** 3-4 hours

**Acceptance Criteria:**
- Scheduled jobs run at correct times
- Session reminders post to Signal automatically
- Jobs survive server restarts
- No duplicate reminders sent
- Easy configuration of reminder timing

---

### Story 3: Message Formatting & Enhancement

**Goal:** Improve message formatting for different notification types and add configurability.

**Scope:**
- Rich message formatting with emojis and structure:
  - 📅 Session created: "New session: Friday 8PM at Padel Next"
  - ✅ RSVP update: "John joined Court 1 (3/4 spots filled)"
  - 🎾 Match result: "Court 1 - Team 1 won 6-4, 6-3"
  - ⏰ Reminders: "Session in 2 days!"
- Message templates for each notification type
- Admin panel or config file to:
  - Enable/disable specific notification types
  - Customize message templates
  - Set reminder timing preferences
- Link back to app in messages (optional)

**Estimated effort:** 2-3 hours

**Acceptance Criteria:**
- All message types have clear, consistent formatting
- Emojis enhance readability
- Admin can configure which notifications post to Signal
- Message templates are easily customizable
- Users can identify notification type at a glance

---

## Compatibility Requirements

- ✅ Existing in-app notification system remains unchanged
- ✅ Database schema unchanged (no migrations needed)
- ✅ Notification API endpoints remain functional
- ✅ Frontend components unaffected
- ✅ Performance impact is minimal (async message sending)
- ✅ Signal integration can be disabled without code changes

---

## Risk Mitigation

### Primary Risk: Signal API dependency/downtime

**Mitigation Strategy:**
- Keep in-app notifications as primary system
- Signal integration is additive, not replacing existing system
- Implement try-catch with comprehensive logging for Signal failures
- Add feature flag (`SIGNAL_ENABLED=true/false`) to disable integration if needed
- Queue failed messages for retry (optional enhancement)

### Rollback Plan:
1. Set `SIGNAL_ENABLED=false` in environment variables
2. Remove Signal service calls from NotificationService
3. Disable scheduled jobs
4. In-app notifications continue working normally
5. No database changes to revert

### Testing Strategy:
- Unit tests for SignalService message formatting
- Integration tests for notification flow (with Signal mocked)
- Manual testing with real Signal group
- Error scenario testing (Signal API down, network issues)

---

## Technical Architecture

### Signal Integration Options

**Recommended: signal-cli-rest-api**
- Docker container with REST endpoints
- Easy to integrate with Node.js backend
- Well-maintained and documented
- Can run alongside existing services

**Alternative: signal-cli**
- Direct CLI tool (more complex integration)
- Requires shell command execution from Node.js

**Not Recommended: Third-party services**
- Paid options like Twilio (overkill for this use case)

### Scheduled Jobs Options

**Recommended: node-cron**
- Simple in-process scheduler
- No additional infrastructure needed
- Good for small-scale scheduling
- Easy to set up and maintain

**Future Migration Options (if needed):**
- **Agenda** - MongoDB-backed job queue (better persistence)
- **BullMQ** - Redis-backed job queue (enterprise-grade)

### Service Architecture

```
NotificationService (existing)
    ├── createNotification() (existing)
    │   ├── Save to database (existing)
    │   └── Send to Signal (NEW)
    │       └── SignalService.sendMessage()
    │
    └── (NEW) ScheduledNotificationService
        ├── setupReminderJobs()
        ├── sendSessionReminder()
        └── checkUpcomingSessions()
```

---

## Environment Configuration

New environment variables needed:

```bash
# Signal Integration
SIGNAL_ENABLED=true                           # Feature flag
SIGNAL_API_URL=http://signal-api:8080        # signal-cli-rest-api endpoint
SIGNAL_NUMBER=+31612345678                   # Bot phone number
SIGNAL_GROUP_ID=group.abc123...              # Target group ID

# Scheduled Notifications
REMINDER_2_DAYS_BEFORE=true                  # Enable 2-day reminder
REMINDER_DAY_OF=true                         # Enable same-day reminder
REMINDER_TIME_2_DAYS=09:00                   # Time to send 2-day reminder
REMINDER_TIME_DAY_OF=08:00                   # Time to send day-of reminder
```

---

## Definition of Done

- ✅ Signal bot account created and linked to group
- ✅ signal-cli-rest-api running and accessible to backend
- ✅ All immediate notifications (session, RSVP, match) post to Signal
- ✅ Scheduled reminders (2 days before, day-of) working correctly
- ✅ Message formatting is clear and consistent with emojis
- ✅ Error handling prevents Signal failures from breaking app
- ✅ Feature flag allows easy enable/disable
- ✅ Environment variables documented
- ✅ README updated with Signal setup instructions
- ✅ No regression in existing notification system
- ✅ Manual testing completed with real Signal group

---

## Implementation Order

1. **Story 1 first** - Get basic Signal integration working with immediate notifications
2. **Story 2 second** - Add scheduled reminders once basic flow is proven
3. **Story 3 last** - Polish formatting and add configurability

This order ensures we have a working integration early and can iterate on it.

---

## Story Manager Handoff

**Ready for Story Manager:**

"Please develop detailed user stories for this brownfield epic. Key considerations:

- This is an enhancement to an existing Node.js/Express/TypeScript system
- Integration points: NotificationService (backend/src/services/notificationService.ts)
- Existing patterns to follow: 
  - Service-based architecture
  - Async/await patterns
  - Error handling with try-catch and logging
  - Environment variable configuration
- Critical compatibility requirements: 
  - Must not disrupt existing notification system
  - Signal failures must be gracefully handled
  - Scheduled jobs must survive server restarts
  - Feature flag must allow easy disable
- Each story must include verification that existing in-app notifications remain intact

The epic should enhance communication while maintaining system integrity and the current notification system as the primary source of truth."

---

## Future Enhancements (Out of Scope)

- Two-way communication (users reply in Signal, app receives)
- Per-user Signal notifications (DMs instead of group)
- Rich media support (images, court diagrams)
- Message threading/replies
- Signal message analytics/tracking

---

## References

- [signal-cli-rest-api Documentation](https://github.com/bbernhard/signal-cli-rest-api)
- [signal-cli GitHub](https://github.com/AsamK/signal-cli)
- [node-cron Documentation](https://github.com/node-cron/node-cron)
- Existing: `backend/src/services/notificationService.ts`
- Existing: `backend/src/routes/notifications.ts`

---

**Epic created by:** BMad PM Agent  
**Next step:** Transform to Story Manager to create detailed stories

