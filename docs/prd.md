# Padel Match Coordinator Product Requirements Document (PRD)

## Goals and Background Context

### Goals
- Enable seamless coordination of weekly padel sessions for a group of 8 players
- Prevent important logistics from getting buried in Signal chat conversations
- Provide clear visibility on session attendance and court booking status
- Display court costs for transparency (payment tracking handled externally)
- Reduce coordination overhead and miscommunication

### Background Context

A group of 8 padel enthusiasts plays together weekly, coordinating through Signal. The current process suffers from information overload - important logistics like attendance confirmations, court booking status, and cost information get lost in regular chat conversations. This leads to confusion about who's attending, whether courts are booked, and who's handling the booking (resulting in potential double-bookings). 

The Padel Match Coordinator app will provide a dedicated space for session logistics, separate from social conversations, ensuring everyone has clear visibility on attendance and bookings. Court costs are displayed for transparency, while actual payment tracking happens through external payment apps. The app will integrate with Signal to post summaries back to the chat, keeping the group informed without cluttering the conversation.

### Success Metrics

The MVP will be considered successful if the following criteria are met after 4 weeks of use:

- **Adoption:** All 8 group members actively use the app (create sessions or RSVP at least once)
- **Engagement:** 80%+ of group members RSVP within 48 hours of session creation
- **Efficiency:** Reduce coordination overhead from 10+ Signal messages per session to fewer than 5
- **Coordination Quality:** Zero double-bookings over the first 8 sessions
- **User Satisfaction:** Positive feedback from at least 7 out of 8 group members
- **Session Success Rate:** 90%+ of created sessions have sufficient attendance (4+ confirmed players)

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-10-03 | 0.1 | Initial PRD draft | John (PM) |
| 2025-10-03 | 0.2 | Added success metrics and enhanced NFRs | John (PM) |

---

## Requirements

### Functional Requirements

**Session Management:**
- FR1: Any user in the group can create a new padel session with date, time, and venue details
- FR2: Users can view all upcoming and past sessions
- FR3: Users can RSVP to a session (Yes/No/Maybe attendance status)
- FR4: The system displays current attendance count and shows if minimum players (4) are met
- FR5: The system indicates court capacity status (e.g., "6/8 players - need 1 court, could use 2")

**Court Booking Management:**
- FR6: Users can indicate they are handling the court booking for a session
- FR7: The system shows who is responsible for booking (if assigned)
- FR8: Users can mark courts as booked with booking confirmation details
- FR9: Users can enter the total court cost for the session
- FR10: The system displays booking status clearly (Not Assigned, Assigned to [Name], Booked)

**Notifications & Communication:**
- FR11: Users receive in-app notifications when a new session is created
- FR12: Users receive in-app notifications when someone RSVPs or booking status changes
- FR13: The system can post session summaries to the Signal group (attendance, booking status)
- FR14: Users can manually trigger a Signal update/reminder for a session

**User Management:**
- FR15: The app supports a fixed group of users (initially 8 members)
- FR16: Users can view all group members and their typical attendance patterns

**Match Score Tracking (Nice-to-Have):**
- FR17: Users can optionally enter match scores after playing
- FR18: The system tracks individual player statistics and win/loss records
- FR19: Users can view personal and group match history

### Non-Functional Requirements

**Usability:**
- NFR1: The app must be mobile-responsive as users will primarily access it on their phones
- NFR2: Key actions (RSVP, view session) should be accessible within 2 taps from the home screen
- NFR3: The interface should be simple and intuitive, requiring no training

**Performance:**
- NFR4: Session data should load within 2 seconds on standard mobile connections
- NFR5: The app should function offline for viewing existing session data, with sync when connection returns

**Reliability:**
- NFR6: The system should prevent double-booking by showing real-time booking status
- NFR7: RSVP changes should be immediately visible to all users

**Integration:**
- NFR8: Signal integration should be simple and not require complex bot setup (consider webhook or similar lightweight approach)

**Scalability:**
- NFR9: The system should be designed to support multiple independent groups in the future (though MVP is single-group)

**Security:**
- NFR10: Only authenticated group members can view and modify session data
- NFR10a: Passwords must meet minimum requirements (8+ characters, mix of letters and numbers)
- NFR10b: JWT tokens expire after 7 days, requiring re-authentication
- NFR10c: HTTPS enforced for all API and frontend traffic
- NFR10d: Input sanitization on all user-provided data to prevent XSS and SQL injection
- NFR10e: Rate limiting on authentication endpoints (max 5 login attempts per minute per IP)
- NFR11: User data should be stored securely with appropriate access controls

**Operational:**
- NFR12: Error logging and tracking system integrated (e.g., Sentry, LogRocket)
- NFR13: API request logging for debugging and audit purposes
- NFR14: Automated daily database backups with weekly restore verification
- NFR15: Uptime monitoring with alerts for service degradation (e.g., UptimeRobot, Pingdom)

---

## User Interface Design Goals

### Overall UX Vision

The Padel Match Coordinator should feel like a lightweight, purpose-built tool rather than a complex app. The interface prioritizes speed and clarity - users should be able to check session details or update their RSVP in seconds. The design should feel modern and clean, with a focus on information hierarchy that makes the most important details (Who's coming? Are courts booked?) immediately visible. Think "utility app" rather than "social network" - efficient, straightforward, and reliable.

### Key Interaction Paradigms

- **Dashboard-First Approach:** Home screen shows the next upcoming session prominently, with quick-action buttons (RSVP, View Details)
- **Status-at-a-Glance:** Use clear visual indicators (icons, colors, badges) to show session status without requiring users to read text
- **Progressive Disclosure:** Show essential info upfront (date, attendance count, booking status), with details available on tap
- **Optimistic UI:** Actions like RSVPs update immediately in the UI while syncing in background
- **Pull-to-Refresh:** Standard mobile pattern for checking latest updates

### Core Screens and Views

1. **Session Dashboard** - Main screen showing upcoming session(s) with attendance and booking status
2. **Session Detail** - Full session information including all RSVPs, court details, costs, venue info
3. **Create/Edit Session** - Form for creating a new session or editing existing one
4. **Group Members View** - List of all group members with contact info
5. **Match History** (Future) - View past sessions and scores
6. **User Profile/Settings** - Basic user preferences and notification settings
7. **Signal Integration** - Interface for posting updates to Signal group

### Accessibility

**WCAG AA** - The app should meet WCAG 2.1 AA standards including:
- Sufficient color contrast for readability
- Touch targets of adequate size (minimum 44x44 points)
- Clear focus indicators
- Support for screen reader navigation
- Text scaling support

### Branding

**Fun, Casual, and Vibrant**
- Energetic, vibrant color palette with bold accent colors (think padel court greens, bright blues, energetic oranges)
- Playful yet readable typography with personality
- Fun micro-interactions and animations (bouncing confirmations, smooth transitions)
- Emoji support in notifications and updates to keep it light and friendly 🎾
- Simple, recognizable app icon with a fun twist (padel racket or ball with vibrant colors)
- Overall vibe: "Fun sports activity with friends" not "serious business tool"

### Target Device and Platforms

**Web Responsive (Mobile-First)**
- Primary target: Mobile phones (iOS and Android browsers)
- Secondary support: Tablet and desktop views
- Progressive Web App (PWA) approach allows installation to home screen without app store deployment
- Responsive breakpoints optimized for:
  - Mobile: 320px - 767px (primary focus)
  - Tablet: 768px - 1024px
  - Desktop: 1025px+ (basic support)

---

## Technical Assumptions

### Repository Structure

**Monorepo**

Given that you're building a full-stack web application (frontend + backend) as a solo developer, a monorepo approach will simplify development, deployment, and code sharing. This allows you to:
- Share TypeScript types between frontend and backend
- Manage dependencies in one place
- Deploy as a single unit for MVP
- Easier to navigate and maintain as a solo developer

### Service Architecture

**Monolith (with potential for future modularity)**

For your MVP with a single group of 8 users, a monolithic architecture makes the most sense:
- Simpler deployment and infrastructure management
- Lower operational complexity (single server/container)
- Faster development velocity for solo work
- Easy to refactor into microservices later if needed

**Technical Stack:**
- **Frontend:** React with TypeScript
- **Backend:** Node.js/Express API (or Next.js API routes for simplicity)
- **Database:** PostgreSQL (reliable, supports complex queries for future features)
- **Real-time Updates:** WebSockets or Server-Sent Events for live RSVP updates
- **PWA:** Service workers for offline capability and home screen installation

**Rationale:** This stack allows you to use TypeScript across the entire application, share code easily, and leverage the Node.js ecosystem. Next.js could provide an all-in-one solution with API routes, SSR, and excellent PWA support.

### Testing Requirements

**Unit + Integration Testing (Pragmatic approach for solo development)**

- **Unit Tests:** Core business logic (RSVP calculations, capacity logic, date handling)
- **Integration Tests:** API endpoints and database operations
- **Manual E2E Testing:** For critical user flows (create session, RSVP, booking status)
- **Testing Tools:** Jest/Vitest for unit tests, Supertest for API testing
- **Coverage Goal:** 70%+ for core business logic (not aiming for 100% given solo context)

**Rationale:** Balance between code quality and development speed. Focus automated testing on high-risk areas, rely on manual testing for UI since you're the primary developer and can iterate quickly.

### Additional Technical Assumptions and Requests

**Deployment & Infrastructure:**
- **Hosting:** Cloud platform with free tier (Vercel, Netlify, Railway, or similar for MVP)
- **Database Hosting:** Managed PostgreSQL service (Supabase, Railway, or Neon for free tier)
- **CI/CD:** GitHub Actions for automated testing and deployment
- **Cost Target:** Stay within free tiers for MVP phase

**Authentication & Security:**
- Simple email/password authentication (or magic link for passwordless)
- JWT-based session management
- Consider Auth0, Supabase Auth, or Clerk for managed authentication to reduce development time

**Signal Integration:**
- Initial approach: Generate formatted message text that users can copy/paste to Signal
- Future enhancement: Explore Signal bot API if copy/paste becomes cumbersome
- Keep integration lightweight and optional (app should work standalone)

**Data Management:**
- **Database Migrations:** Use a migration tool (Prisma, Drizzle, or raw SQL migrations)
- **Backup Strategy:** Automated daily backups (most managed DB services provide this)
- **Data Retention:** Keep all historical session data indefinitely (storage is cheap)
- **Privacy:** If a user leaves the group, provide data deletion capability

**Development Environment:**
- **Package Manager:** npm or pnpm
- **Code Quality:** ESLint + Prettier for consistent formatting
- **Git Workflow:** Simple main branch with feature branches, no complex GitFlow needed for solo work
- **TypeScript:** Strict mode enabled for type safety

**Performance Considerations:**
- Target < 2s page load on 3G connections
- Optimize images and assets
- Implement caching strategies for session data
- Progressive enhancement (core functionality works without JavaScript where possible)

---

## Epic List

**Epic 1: Foundation & Core Session Management**
Establish project infrastructure, authentication, and basic session creation/viewing capability. Delivers a working app where users can create and view padel sessions.

**Epic 2: RSVP & Attendance Tracking**
Enable users to RSVP to sessions and see who's attending. Delivers the core coordination feature that solves the "who's coming?" problem.

**Epic 3: Notifications**
Implement in-app notifications to keep users informed of session updates, RSVPs, and changes. Delivers the communication layer for real-time updates.

**Epic 4: Court Booking Coordination**
Add booking assignment, status tracking, and cost display. Delivers the solution to "who's booking?" and "are courts secured?" problems.

**Epic 5: Signal Integration**
Add Signal group posting capabilities and session reminders. Delivers the external communication layer that keeps everyone informed without cluttering chat.

**Epic 6: Match Score Tracking (Future Enhancement)**
Optional score entry and player statistics. Delivers the nice-to-have feature for competitive fun within the group.

---

## Epic 1: Foundation & Core Session Management

**Epic Goal:** Establish the foundational project infrastructure (monorepo setup, database, authentication, CI/CD) and deliver the first piece of tangible functionality - the ability to create, view, and manage padel sessions. This epic sets up everything needed for future epics while proving the core concept works end-to-end.

### Story 1.1: Project Setup & Development Environment

**As a** developer,  
**I want** a fully configured monorepo with frontend and backend scaffolding,  
**so that** I have a solid foundation to build features efficiently.

**Acceptance Criteria:**
1. Monorepo is initialized with appropriate structure (frontend/, backend/, shared/)
2. TypeScript is configured for both frontend and backend with strict mode enabled
3. React app is scaffolded with Vite or Next.js
4. Node.js/Express backend (or Next.js API routes) is set up with basic health check endpoint
5. ESLint and Prettier are configured with consistent rules across the repo
6. Package.json scripts exist for: dev (run both), build, test, lint
7. Git repository is initialized with .gitignore and README
8. Local development environment runs successfully with hot reload

### Story 1.2: Database Setup & User Schema

**As a** developer,  
**I want** PostgreSQL database configured with initial user schema,  
**so that** I can store user data and authenticate users.

**Acceptance Criteria:**
1. PostgreSQL database is set up (locally and on hosting service)
2. Database migration tool is configured (Prisma, Drizzle, or similar)
3. Users table is created with fields: id, email, name, phone (optional), created_at, updated_at
4. Initial migration successfully runs and creates schema
5. Database connection is established from backend with connection pooling
6. Environment variables are used for database credentials
7. Seed script exists to populate initial 8 group members for testing

### Story 1.3: User Authentication

**As a** user,  
**I want** to sign up and log in securely,  
**so that** only my padel group can access the app.

**Acceptance Criteria:**
1. Sign up endpoint accepts email and password, creates user account with hashed password
2. Login endpoint validates credentials and returns JWT token
3. JWT token includes user ID and email in payload
4. Protected API routes validate JWT and reject unauthorized requests
5. Frontend has Login and Sign Up pages with form validation
6. Authentication state is managed in frontend (Context/Redux/Zustand)
7. User session persists across page refreshes (token stored in localStorage/cookie)
8. Logout functionality clears token and redirects to login

### Story 1.4: Sessions Database Schema & API

**As a** developer,  
**I want** sessions table and CRUD API endpoints,  
**so that** I can create and retrieve session data.

**Acceptance Criteria:**
1. Sessions table is created with fields: id, date, time, venue_name, total_cost (optional), notes, created_by_user_id, created_at, updated_at
2. Migration successfully adds sessions table with foreign key to users
3. POST /api/sessions endpoint creates a new session (authenticated)
4. GET /api/sessions endpoint returns all sessions ordered by date
5. GET /api/sessions/:id endpoint returns single session details
6. PUT /api/sessions/:id endpoint updates session (only creator can edit)
7. DELETE /api/sessions/:id endpoint soft-deletes session (only creator can delete)
8. API returns proper error responses (400, 401, 404, 500) with meaningful messages

### Story 1.5: Create Session UI

**As a** user,  
**I want** to create a new padel session with all relevant details,  
**so that** my group knows when and where we're playing.

**Acceptance Criteria:**
1. "Create Session" button is prominently displayed on home screen
2. Create session form includes: date picker, time picker, venue name, cost (optional), notes (optional)
3. Form validation ensures date/time/venue are required
4. Form prevents selecting dates in the past
5. Successful submission shows success message and redirects to session detail
6. Failed submission displays error message without losing form data
7. Form has clean, vibrant UI matching the fun/casual design vision
8. Mobile-responsive layout works well on small screens

### Story 1.6: Session List & Detail Views

**As a** user,  
**I want** to view all upcoming and past sessions,  
**so that** I can see what's scheduled and what happened previously.

**Acceptance Criteria:**
1. Home screen displays list of upcoming sessions sorted by date (soonest first)
2. Each session card shows: date, time, venue name, creator name
3. Sessions are visually separated into "Upcoming" and "Past" sections
4. Tapping a session card navigates to session detail page
5. Session detail page shows all session information (date, time, venue, cost, notes, creator)
6. Detail page has "Edit" and "Delete" buttons (only visible to creator)
7. Empty state is shown when no sessions exist with prompt to create one
8. Pull-to-refresh updates the session list

### Story 1.7: Deployment & CI/CD Pipeline

**As a** developer,  
**I want** automated deployment pipeline,  
**so that** changes are automatically deployed to production.

**Acceptance Criteria:**
1. GitHub Actions workflow is configured to run on push to main branch
2. CI pipeline runs linting and tests before deployment
3. Frontend is deployed to hosting service (Vercel, Netlify, or similar)
4. Backend API is deployed with database connection working
5. Environment variables are securely configured in hosting platform
6. HTTPS is enabled for both frontend and API
7. Deployment succeeds and app is accessible via public URL
8. README includes deployment instructions and environment variable documentation

---

## Epic 2: RSVP & Attendance Tracking

**Epic Goal:** Enable users to RSVP to sessions and view real-time attendance status. This epic delivers the core coordination feature that solves the "who's coming this week?" problem by providing clear visibility into attendance for each session.

### Story 2.1: RSVP Database Schema & API

**As a** developer,  
**I want** RSVPs table and API endpoints for managing attendance,  
**so that** users can indicate their attendance status for sessions.

**Acceptance Criteria:**
1. RSVPs table is created with fields: id, session_id, user_id, status (enum: 'yes', 'no', 'maybe'), created_at, updated_at
2. Unique constraint ensures one RSVP per user per session (no duplicates)
3. Foreign keys link to sessions and users tables with cascade delete
4. POST /api/sessions/:sessionId/rsvps endpoint creates or updates user's RSVP
5. GET /api/sessions/:sessionId/rsvps endpoint returns all RSVPs for a session with user details
6. DELETE /api/sessions/:sessionId/rsvps endpoint removes user's RSVP (returns to "no response")
7. Database migration successfully runs and creates schema
8. API endpoints are protected (require authentication)

### Story 2.2: RSVP UI Component

**As a** user,  
**I want** to indicate my attendance status for a session,  
**so that** everyone knows if I'm coming.

**Acceptance Criteria:**
1. Session detail page displays RSVP selector with three options: "I'm In! ✅", "Can't Make It ❌", "Maybe 🤔"
2. Current user's RSVP status is highlighted/selected when page loads
3. Clicking an RSVP option immediately updates status with optimistic UI
4. Success feedback is shown (animation, color change, or toast notification)
5. Failed RSVP displays error message and reverts to previous state
6. RSVP component has vibrant, fun styling matching design vision
7. Touch targets are large enough for easy mobile interaction (min 44x44 points)
8. Loading state is shown while RSVP is being saved

### Story 2.3: Attendance List Display

**As a** user,  
**I want** to see who's attending each session,  
**so that** I know who will be playing.

**Acceptance Criteria:**
1. Session detail page displays three sections: "Coming" (yes), "Not Coming" (no), "Maybe"
2. Each section shows user names/avatars in a clear list
3. User count is displayed for each section (e.g., "Coming (6)")
4. Users who haven't RSVP'd are shown in a separate "No Response" section
5. Current user is visually distinguished in the list (e.g., "(You)" label)
6. List updates in real-time when RSVPs change (WebSocket or polling)
7. Empty states show helpful messages (e.g., "Nobody has RSVP'd yet")
8. Mobile layout displays lists in a space-efficient manner

### Story 2.4: Session Card Attendance Summary

**As a** user,  
**I want** to see attendance summary on session cards,  
**so that** I can quickly assess participation without opening details.

**Acceptance Criteria:**
1. Session list cards display attendance count (e.g., "6 going, 1 maybe, 1 not coming")
2. Visual indicator shows if minimum players met (4+ for one court)
3. Color coding indicates session viability: green (8+ players), yellow (4-7 players), red (<4 players)
4. Icon/badge shows if current user has RSVP'd and their status
5. Counts update when RSVPs change without requiring page refresh
6. Summary is concise and readable on small mobile screens
7. Summary uses fun, casual language matching app vibe
8. Tapping the summary navigates to full attendance details

### Story 2.5: Court Capacity Calculator

**As a** user,  
**I want** to see how many courts are needed based on attendance,  
**so that** I know if we should book 1 or 2 courts.

**Acceptance Criteria:**
1. Session detail displays court calculation: "X players confirmed → Y courts needed"
2. Calculation logic: 1-4 players = 1 court, 5-8 players = 2 courts, 9+ = 3 courts
3. Calculation only counts "yes" RSVPs (not "maybe")
4. Visual indicator shows if we have enough for balanced games (multiples of 4 ideal)
5. Helpful message shown: e.g., "Perfect! 8 players for 2 full courts 🎾"
6. Warning shown if odd number: e.g., "6 players - we'll have uneven teams"
7. Calculator updates in real-time as RSVPs change
8. Fun, encouraging tone in messaging ("Almost there!", "We're on!")

### Story 2.6: RSVP Notifications Foundation

**As a** developer,  
**I want** notification system infrastructure in place,  
**so that** users can be informed of RSVP changes (preparation for Epic 4).

**Acceptance Criteria:**
1. Notifications table is created with fields: id, user_id, type, title, message, read, session_id (optional), created_at
2. Database migration successfully creates notifications schema
3. Backend service function creates notification records when RSVP changes
4. GET /api/notifications endpoint returns user's notifications (unread first)
5. PATCH /api/notifications/:id/read endpoint marks notification as read
6. Notification records are created for: new session, RSVP changes (for session creator)
7. Foundation is in place but UI display is deferred to Epic 4
8. Background job or trigger handles notification creation automatically

---

## Epic 3: Notifications

**Epic Goal:** Implement in-app notifications to keep users informed of session updates, RSVPs, and changes in real-time. This epic delivers the communication layer that ensures no one misses important updates about sessions they're involved in.

### Story 3.1: Notification Database Schema ✅ COMPLETED

**As a** developer,  
**I want** notifications table and API endpoints,  
**so that** I can store and retrieve user notifications.

**Acceptance Criteria:**
1. Sessions table is updated with new fields: booking_assigned_to_user_id (nullable), booking_status (enum: 'unassigned', 'assigned', 'booked'), booking_confirmation_details (text, nullable), booking_external_link (text, nullable)
2. Foreign key links booking_assigned_to_user_id to users table
3. Database migration successfully adds new columns
4. Default booking_status is 'unassigned' for new sessions
5. API endpoints are updated to include booking fields in responses
6. PUT /api/sessions/:id/booking endpoint updates booking-related fields
7. Only authenticated users can update booking information
8. Booking assignment can be claimed or assigned by session creator

### Story 3.2: Claim/Assign Booking Responsibility

**As a** user,  
**I want** to volunteer to book the courts,  
**so that** others know I'm handling it and won't duplicate the booking.

**Acceptance Criteria:**
1. Session detail page displays booking status section prominently
2. When unassigned, "I'll Book the Courts!" button is displayed
3. Clicking button assigns current user as booking coordinator
4. Assigned user's name is displayed: "🎾 [Name] is booking the courts"
5. "Release Booking" button allows assigned user to unassign themselves
6. Session creator can reassign booking to another user via dropdown
7. Optimistic UI updates immediately with success/error feedback
8. Visual distinction shows booking assignment (icon, color, badge)

### Story 3.3: Update Booking Status

**As a** user who is assigned to book courts,  
**I want** to mark the booking as complete and add confirmation details,  
**so that** everyone knows the courts are secured.

**Acceptance Criteria:**
1. When user is assigned as booking coordinator, "Mark as Booked" button is displayed
2. Clicking button opens form with fields: confirmation details (text), external booking link (optional)
3. Confirmation details field supports multi-line text for notes/reference numbers
4. External link field validates URL format
5. Submitting form updates status to "booked" and saves details
6. Booked status displays prominently: "✅ Courts Booked!" with confirmation details
7. Assigned user can edit booking details after marking as booked
8. "Unmark as Booked" option allows reverting to assigned status if needed

### Story 3.4: Booking Status Display & Visibility

**As a** user,  
**I want** to see the booking status at a glance,  
**so that** I know if courts are secured without digging through details.

**Acceptance Criteria:**
1. Session list cards display booking status badge: "Not Assigned", "Assigned to [Name]", "✅ Booked"
2. Color coding: red (unassigned), yellow (assigned), green (booked)
3. Session detail page has dedicated booking status section with clear visual hierarchy
4. Booking confirmation details are displayed when status is "booked"
5. External booking link is clickable and opens in new tab
6. Status updates appear immediately for all users viewing the session
7. Mobile-optimized layout ensures booking info is easily scannable
8. Fun iconography and vibrant colors match the app's casual vibe

### Story 3.5: Court Cost Display

**As a** user,  
**I want** to see the total cost for the courts,  
**so that** I know how much we're spending (payment handled externally).

**Acceptance Criteria:**
1. Session creation/edit form includes optional "Total Court Cost" field
2. Cost field accepts decimal numbers with currency formatting (€)
3. Session detail page displays cost prominently if provided: "💰 Total Cost: €40"
4. Cost can be updated by session creator or booking coordinator
5. Session list cards show cost badge/icon if cost is set
6. When cost is not set, placeholder shows "Cost not yet determined"
7. No payment tracking or splitting logic (just display)
8. Cost display is clearly separated from booking status (different visual sections)

### Story 3.6: Booking Coordination Notifications

**As a** user,  
**I want** to be notified of booking status changes,  
**so that** I stay informed about court arrangements.

**Acceptance Criteria:**
1. Notification is created when someone claims booking responsibility
2. Notification is created when booking status changes to "booked"
3. Notification is created when booking is reassigned or released
4. Session creator receives all booking-related notifications
5. All users who RSVP'd "yes" receive notification when courts are booked
6. Notifications include session name, date, and action taken
7. Notification records are stored in database (UI display in Epic 4)
8. Notification service handles async creation without blocking user actions

### Story 3.7: Booking Workflow Edge Cases

**As a** user,  
**I want** the booking system to handle edge cases gracefully,  
**so that** coordination remains clear even in unusual situations.

**Acceptance Criteria:**
1. If assigned user hasn't marked as booked 24 hours before session, reminder notification is created
2. If assigned user is deleted or leaves group, booking status reverts to "unassigned"
3. Session creator can override/reassign booking at any time
4. When session is edited (date/time changed), booking coordinator receives notification
5. Confirmation dialog shown before releasing/reassigning bookings to prevent accidents
6. Booking external link is validated and sanitized to prevent XSS
7. Booking history is logged (who assigned, who booked, when) for audit trail
8. System prevents race conditions if multiple users try to claim simultaneously

---

## Epic 4: Notifications & Signal Integration

**Epic Goal:** Implement in-app notifications and Signal group posting capabilities. This epic delivers the communication layer that keeps everyone informed without cluttering the Signal chat, bringing critical updates directly to users and allowing session summaries to be posted back to the group.

### Story 4.1: In-App Notification Center UI

**As a** user,  
**I want** to see all my notifications in one place,  
**so that** I don't miss important updates about sessions.

**Acceptance Criteria:**
1. Notification bell icon is displayed in app header/navigation with unread count badge
2. Tapping bell opens notification center panel/page
3. Notifications are displayed in reverse chronological order (newest first)
4. Each notification shows: icon, title, message, timestamp (relative: "2 hours ago")
5. Unread notifications are visually distinguished (bold, background color, dot indicator)
6. Tapping a notification marks it as read and navigates to related session (if applicable)
7. "Mark All as Read" button clears all unread indicators
8. Empty state shows friendly message: "You're all caught up! 🎉"

### Story 4.2: Real-Time Notification Delivery

**As a** user,  
**I want** notifications to appear immediately without refreshing,  
**so that** I stay informed in real-time.

**Acceptance Criteria:**
1. WebSocket connection is established when user logs in
2. New notifications are pushed to client via WebSocket in real-time
3. Notification bell badge updates immediately when new notification arrives
4. Toast/banner notification appears briefly for important updates (optional: with sound)
5. Notifications persist in notification center after toast disappears
6. Connection handles reconnection gracefully if network drops
7. Missed notifications are fetched on reconnection
8. System works with polling fallback if WebSocket unavailable

### Story 4.3: Notification Preferences

**As a** user,  
**I want** to control which notifications I receive,  
**so that** I'm not overwhelmed by updates I don't care about.

**Acceptance Criteria:**
1. Settings/Profile page includes notification preferences section
2. Toggle switches for each notification type: new sessions, RSVP changes, booking updates, reminders
3. Preferences are saved to database and persist across sessions
4. Disabling a notification type prevents both in-app and future Signal notifications
5. Default preferences are sensible (all enabled except minor updates)
6. Changes take effect immediately without requiring logout
7. Clear descriptions explain what each notification type includes
8. Mobile-friendly toggle UI with good touch targets

### Story 4.4: Session Summary Generator

**As a** user,  
**I want** to generate a formatted summary of session details,  
**so that** I can easily share it with the Signal group.

**Acceptance Criteria:**
1. Session detail page has "Share to Signal" or "Generate Summary" button
2. Clicking button generates formatted text summary including: session date/time, venue, attendance (names of confirmed players), booking status, court cost
3. Summary uses emojis and formatting for readability in Signal
4. Summary text is automatically copied to clipboard with success feedback
5. Example format: "🎾 Padel Session - Oct 10, 7pm @ Court Central\n✅ Playing (6): John, Sarah, Mike...\n📍 Courts Booked by Sarah\n💰 Cost: €40"
6. Summary adapts based on data (e.g., omits cost if not set)
7. "Copy Summary" button available for manual copy if auto-copy fails
8. Helpful message instructs user to paste into Signal

### Story 4.5: Automated Signal Posting (Optional Copy-Paste Method)

**As a** user,  
**I want** key updates to be easily shareable to Signal,  
**so that** the group stays informed without manual effort.

**Acceptance Criteria:**
1. When session is created, creator sees prompt: "Share this session to Signal?" with generated summary
2. When courts are marked as booked, booking coordinator sees share prompt
3. When session is 24 hours away, reminder summary is generated for sharing
4. Each prompt includes pre-formatted message and copy button
5. User can dismiss prompts if they don't want to share
6. Sharing is manual (copy-paste) to avoid complexity of Signal bot integration
7. Share prompts are contextual and don't feel spammy
8. Settings option to disable automatic share prompts

### Story 4.6: Session Reminder System

**As a** user,  
**I want** reminders before upcoming sessions,  
**so that** I don't forget to show up.

**Acceptance Criteria:**
1. Background job runs hourly to check for sessions within reminder windows
2. Notification sent 24 hours before session to all "yes" RSVPs
3. Notification sent 2 hours before session to all "yes" RSVPs
4. Reminder includes session details and RSVP status
5. Reminder for session creator includes booking status and attendance summary
6. Option to disable reminders in notification preferences
7. Reminders are not duplicated if already sent
8. Time zone handling ensures reminders are timely for all users

### Story 4.7: Signal Bot Integration (Future Enhancement - Optional)

**As a** user,  
**I want** automatic posting to Signal without copy-paste,  
**so that** sharing is completely seamless.

**Acceptance Criteria:**
1. Research Signal Bot API capabilities and authentication requirements
2. Configuration page allows admin to connect Signal bot credentials
3. Bot can post messages to configured Signal group
4. Automatic posting option in session settings (opt-in per session)
5. Bot posts include formatted summary with session link back to app
6. Error handling if bot fails to post (fallback to copy-paste method)
7. Bot connection status displayed in settings
8. Security considerations documented for bot token storage

---

## Epic 5: Match Score Tracking (Future Enhancement)

**Epic Goal:** Add optional match score tracking and player statistics features. This epic delivers the "nice-to-have" competitive fun element, allowing players to record match results and view individual performance stats over time. This is explicitly a future enhancement and not required for MVP.

### Story 5.1: Match Results Database Schema

**As a** developer,  
**I want** database schema for storing match results and scores,  
**so that** we can track game outcomes and player performance.

**Acceptance Criteria:**
1. Matches table is created with fields: id, session_id, court_number, team1_player1_id, team1_player2_id, team2_player1_id, team2_player2_id, team1_score, team2_score, created_by_user_id, created_at
2. Foreign keys link all player fields to users table
3. Validation ensures 4 unique players per match
4. Match scores are stored as integers (games won per team)
5. Multiple matches can be recorded per session (multiple games played)
6. Database migration successfully creates schema
7. GET /api/sessions/:id/matches endpoint returns all matches for a session
8. POST /api/matches endpoint creates new match result

### Story 5.2: Record Match Score UI

**As a** user,  
**I want** to enter match scores after playing,  
**so that** we can track who won and build statistics over time.

**Acceptance Criteria:**
1. Session detail page (after session date) displays "+ Add Match Result" button
2. Match entry form includes: court selector (1 or 2), team 1 player selection (2 dropdowns), team 2 player selection (2 dropdowns), team 1 score input, team 2 score input
3. Player dropdowns only show users who RSVP'd "yes" to the session
4. Form validation prevents duplicate players across teams
5. Score inputs accept integers only
6. Submitting form saves match and displays success feedback
7. Newly added match appears in session's match list immediately
8. Option to edit/delete matches created by current user

### Story 5.3: Match History Display

**As a** user,  
**I want** to see all matches played in a session,  
**so that** I can review the results and outcomes.

**Acceptance Criteria:**
1. Session detail page displays "Matches Played" section (when matches exist)
2. Each match shows: court number, team compositions, final score, winner highlighted
3. Match cards use fun, vibrant design with team vs team layout
4. Score is prominently displayed: "Team A: 6 - Team B: 4"
5. Winning team is visually distinguished (color, badge, trophy emoji 🏆)
6. Empty state when no matches recorded: "No matches recorded yet. Add scores after playing!"
7. Matches are ordered by creation time (most recent first)
8. Mobile-optimized layout for readability

### Story 5.4: Player Statistics Calculation

**As a** developer,  
**I want** to calculate individual player statistics,  
**so that** users can see their performance over time.

**Acceptance Criteria:**
1. Backend service calculates player stats: total matches played, wins, losses, win rate, total sessions attended
2. GET /api/users/:id/stats endpoint returns calculated statistics
3. Stats include all-time and recent (last 10 sessions) breakdowns
4. Win rate is calculated as: (wins / total matches) * 100
5. Stats are cached and recalculated when new matches are added
6. Database query performance is optimized for statistics calculation
7. Stats handle edge cases: new players (0 matches), ties if applicable
8. API returns stats in JSON format ready for frontend display

### Story 5.5: Player Profile & Stats Page

**As a** user,  
**I want** to view my personal statistics and performance,  
**so that** I can track my improvement and have fun comparing with friends.

**Acceptance Criteria:**
1. Profile page displays personal stats dashboard with key metrics
2. Stats shown: total matches, wins, losses, win rate percentage, total sessions attended
3. Visual representation of win rate (progress bar, pie chart, or similar)
4. "Recent Form" section shows last 5-10 match results with W/L indicators
5. Fun, encouraging messaging based on performance (e.g., "On fire! 🔥", "Keep practicing!")
6. Option to view other players' stats (tap on name in match history)
7. Stats update immediately after new matches are recorded
8. Mobile-friendly card layout with vibrant colors and icons

### Story 5.6: Group Leaderboard

**As a** user,  
**I want** to see a leaderboard of all players,  
**so that** we can have friendly competition and bragging rights.

**Acceptance Criteria:**
1. Leaderboard page accessible from main navigation
2. Players ranked by win rate (minimum 5 matches to qualify)
3. Leaderboard displays: rank, player name, matches played, wins, losses, win rate
4. Top 3 players have special badges/icons (🥇🥈🥉)
5. Current user is highlighted in the leaderboard
6. Filter options: all-time, last month, last 3 months
7. Ties are handled gracefully (shared rank or secondary sort by total wins)
8. Fun, casual presentation with playful language ("Padel Champions")

### Story 5.7: Match Statistics & Insights (Optional)

**As a** user,  
**I want** advanced statistics and insights,  
**so that** I can discover patterns and interesting facts about our games.

**Acceptance Criteria:**
1. Stats page shows additional insights: most frequent partners, opponents faced most, best winning streak
2. "Head-to-head" view compares record between two specific players
3. Team combination analysis shows which pairs win most together
4. Court preference stats (if court number is tracked consistently)
5. Time-based trends: performance over weeks/months
6. Fun facts generated: "You've played 50 matches!", "3-game winning streak!"
7. Insights are opt-in (can be hidden if user finds them overwhelming)
8. Data visualizations are simple and mobile-friendly

---

## Checklist Results Report

### Executive Summary

**Overall PRD Completeness:** 90% ✅

**MVP Scope Appropriateness:** Just Right 🎯

**Readiness for Architecture Phase:** Ready ✅

### Category Statuses

| Category                         | Status  | Critical Issues |
| -------------------------------- | ------- | --------------- |
| 1. Problem Definition & Context  | PASS    | None - Success metrics added |
| 2. MVP Scope Definition          | PASS    | None - Clear MVP boundaries with Epic 5 as optional |
| 3. User Experience Requirements  | PASS    | None - Comprehensive UI goals and user flows implied |
| 4. Functional Requirements       | PASS    | None - Well-defined FRs with clear scope |
| 5. Non-Functional Requirements   | PASS    | None - Enhanced security and operational NFRs added |
| 6. Epic & Story Structure        | PASS    | None - Excellent epic sequencing and story breakdown |
| 7. Technical Guidance            | PASS    | None - Clear tech stack decisions documented |
| 8. Cross-Functional Requirements | PASS    | None - Operational requirements now included |
| 9. Clarity & Communication       | PASS    | None - Clear, well-structured documentation |

### Final Decision

✅ **READY FOR ARCHITECT** - The PRD is comprehensive, well-structured, and provides excellent guidance for the Solution Architect.

---

## Next Steps

### UX Expert Prompt

You are now transitioning to work with the **UX Expert** to design the user interface and experience for the Padel Match Coordinator app. Please review the complete PRD above, paying special attention to the "User Interface Design Goals" section. Your task is to create:

1. **Wireframes** for the 7 core screens identified
2. **User flow diagrams** showing the primary user journeys
3. **Visual design mockups** reflecting the fun, casual, vibrant aesthetic
4. **Component library** defining reusable UI elements
5. **Responsive design specifications** for mobile, tablet, and desktop

Focus on mobile-first design since that's the primary use case. Ensure the design prioritizes speed and clarity - users should be able to RSVP or check session details in under 5 seconds.

### Architect Prompt

You are now transitioning to work with the **Solution Architect** to design the technical architecture for the Padel Match Coordinator app. Please review the complete PRD above, paying special attention to the "Technical Assumptions" and all Epic stories with their acceptance criteria. Your task is to create:

1. **System Architecture Diagram** showing frontend, backend, database, and integrations
2. **Database Schema Design** with all tables, relationships, and indexes
3. **API Specification** defining all endpoints with request/response formats
4. **Technology Stack Selection** with specific framework/library choices and rationale
5. **Deployment Architecture** including hosting, CI/CD, and environment strategy
6. **Security Architecture** covering authentication, authorization, and data protection

The architecture should support the MVP (Epics 1-4) while being extensible for Epic 5 and future multi-group support. Prioritize simplicity and developer velocity for the solo developer context while maintaining production-quality standards.

