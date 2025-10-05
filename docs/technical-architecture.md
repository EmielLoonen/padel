# Padel Match Coordinator - Technical Architecture Document

**Version:** 1.0  
**Date:** October 3, 2025  
**Author:** Winston (Solution Architect)  
**Status:** Initial Version

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Database Design](#database-design)
5. [API Specification](#api-specification)
6. [Frontend Architecture](#frontend-architecture)
7. [Authentication & Security](#authentication--security)
8. [Deployment Architecture](#deployment-architecture)
9. [Development Workflow](#development-workflow)
10. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

### Purpose

This Technical Architecture Document provides the blueprint for implementing the Padel Match Coordinator application. It translates the business requirements from the PRD into concrete technical specifications that can guide development.

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Architecture Pattern** | Monorepo Monolith | Simplifies development for solo developer; easy to refactor later |
| **Frontend Framework** | React 18+ with TypeScript | Modern, well-supported, excellent ecosystem |
| **Backend Framework** | Express.js with TypeScript | Lightweight, flexible, pairs well with React |
| **Database** | PostgreSQL 15+ | Relational data model fits requirements; free hosting available |
| **Authentication** | JWT with bcrypt | Stateless, scalable, industry standard |
| **API Style** | RESTful JSON API | Simple, well-understood, sufficient for requirements |
| **Real-time Updates** | Server-Sent Events (SSE) | Simpler than WebSockets for unidirectional updates |
| **Deployment** | Railway (all-in-one) | Free tier, PostgreSQL included, simple deployment |
| **CI/CD** | GitHub Actions | Free, integrated with GitHub, easy to configure |

### Architecture Principles

1. **Simplicity First**: Choose simple solutions over complex ones; optimize for developer velocity
2. **Production Ready**: Use proper patterns and practices even for MVP
3. **Extensible Design**: Architecture supports future multi-group capability without rewrite
4. **Type Safety**: TypeScript across the stack prevents runtime errors
5. **Security by Default**: Authentication, input validation, and HTTPS from day one

---

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  React PWA (TypeScript)                                      │
│  - UI Components                                             │
│  - State Management (Zustand)                                │
│  - API Client (Axios)                                        │
│  - Service Worker (Offline Support)                          │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS / JSON
                     │
┌────────────────────▼────────────────────────────────────────┐
│                      API GATEWAY LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  Express.js (TypeScript)                                     │
│  - Authentication Middleware                                 │
│  - Request Validation                                        │
│  - Error Handling                                            │
│  - Rate Limiting                                             │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Services                                     │
│  - Session Service                                           │
│  - RSVP Service                                              │
│  - Booking Service                                           │
│  - Notification Service                                      │
│  - Authentication Service                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                      DATA LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                         │
│  - Users                                                     │
│  - Sessions                                                  │
│  - RSVPs                                                     │
│  - Notifications                                             │
│  - (Future: Matches)                                         │
└─────────────────────────────────────────────────────────────┘
```

### Component Interactions

**Session Creation Flow:**
1. User submits session form → React component
2. React sends POST request → Express API
3. API validates JWT → Authentication middleware
4. API validates input → Express validator
5. Service layer creates session → Session Service
6. Database persists data → PostgreSQL
7. Notification created → Notification Service
8. Response returned → React UI updates

**Real-Time RSVP Updates:**
1. User RSVPs → POST /api/sessions/:id/rsvps
2. RSVP saved to database
3. Server-Sent Events push update to all connected clients viewing that session
4. React components re-render with new data

---

## Technology Stack

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2+ | UI framework |
| **TypeScript** | 5.0+ | Type safety and better DX |
| **Vite** | 5.0+ | Build tool and dev server |
| **React Router** | 6.20+ | Client-side routing |
| **Zustand** | 4.4+ | State management (lightweight) |
| **Axios** | 1.6+ | HTTP client |
| **React Hook Form** | 7.48+ | Form handling and validation |
| **date-fns** | 3.0+ | Date manipulation |
| **Tailwind CSS** | 3.4+ | Utility-first styling |

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20 LTS | Runtime environment |
| **Express.js** | 4.18+ | Web framework |
| **TypeScript** | 5.0+ | Type safety |
| **Prisma** | 5.7+ | ORM and database migrations |
| **bcryptjs** | 2.4+ | Password hashing |
| **jsonwebtoken** | 9.0+ | JWT generation/verification |
| **express-validator** | 7.0+ | Input validation |
| **express-rate-limit** | 7.1+ | Rate limiting |
| **cors** | 2.8+ | CORS handling |

### Database

| Technology | Version | Purpose |
|------------|---------|---------|
| **PostgreSQL** | 15+ (17 recommended) | Primary database |

### DevOps & Tooling

| Technology | Version | Purpose |
|------------|---------|---------|
| **pnpm** | 8.0+ | Package manager (faster than npm) |
| **ESLint** | 8.0+ | Code linting |
| **Prettier** | 3.0+ | Code formatting |
| **Vitest** | 1.0+ | Unit testing |
| **Supertest** | 6.3+ | API testing |
| **GitHub Actions** | - | CI/CD |
| **Railway** | - | Hosting platform |

### Rationale for Key Choices

**React over Vue/Svelte:**
- Largest ecosystem and community support
- Excellent TypeScript support
- Your stated preference

**Prisma over raw SQL/TypeORM:**
- Type-safe database queries
- Automatic migration generation
- Excellent developer experience
- Built-in query builder

**Zustand over Redux:**
- Much simpler API
- No boilerplate
- Sufficient for MVP scope
- Easy to migrate to Redux later if needed

**Express over Fastify/NestJS:**
- Simplicity and familiarity
- Massive ecosystem
- NestJS would be overkill for this project

**Tailwind CSS:**
- Rapid UI development
- Consistent design system
- Responsive utilities
- Small bundle size with purging

---

## Database Design

### Entity Relationship Diagram

```
┌─────────────────┐
│     Users       │
├─────────────────┤
│ id (PK)         │──┐
│ email (unique)  │  │
│ password_hash   │  │
│ name            │  │
│ phone           │  │
│ created_at      │  │
│ updated_at      │  │
└─────────────────┘  │
                     │
         ┌───────────┴────────────────────────────┐
         │                                        │
         │                                        │
┌────────▼────────┐                      ┌────────▼────────┐
│    Sessions     │                      │      RSVPs      │
├─────────────────┤                      ├─────────────────┤
│ id (PK)         │──────────────────────│ id (PK)         │
│ date            │                      │ session_id (FK) │
│ time            │                      │ user_id (FK)    │
│ venue_name      │                      │ status          │
│ venue_address   │                      │ created_at      │
│ total_cost      │                      │ updated_at      │
│ notes           │                      └─────────────────┘
│ booking_status  │                      UNIQUE(session_id, user_id)
│ booking_user_id │
│ booking_details │
│ booking_link    │
│ created_by_id   │
│ created_at      │
│ updated_at      │
└─────────────────┘
         │
         │
┌────────▼────────┐
│  Notifications  │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ type            │
│ title           │
│ message         │
│ session_id (FK) │
│ read            │
│ created_at      │
└─────────────────┘

FUTURE (Epic 5):
┌─────────────────┐
│     Matches     │
├─────────────────┤
│ id (PK)         │
│ session_id (FK) │
│ court_number    │
│ team1_player1   │
│ team1_player2   │
│ team2_player1   │
│ team2_player2   │
│ team1_score     │
│ team2_score     │
│ created_by_id   │
│ created_at      │
└─────────────────┘
```

### Database Schema (Prisma Schema)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String   @map("password_hash")
  name          String
  phone         String?
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  createdSessions      Session[]      @relation("SessionCreator")
  bookedSessions       Session[]      @relation("SessionBooker")
  rsvps                RSVP[]
  notifications        Notification[]

  @@map("users")
}

model Session {
  id                      String   @id @default(uuid())
  date                    DateTime
  time                    String   // Stored as "HH:MM" string for simplicity
  venueName               String   @map("venue_name")
  venueAddress            String?  @map("venue_address")
  totalCost               Decimal? @map("total_cost") @db.Decimal(10, 2)
  notes                   String?
  bookingStatus           String   @default("unassigned") @map("booking_status") // unassigned, assigned, booked
  bookingUserId           String?  @map("booking_user_id")
  bookingConfirmation     String?  @map("booking_confirmation")
  bookingExternalLink     String?  @map("booking_external_link")
  createdById             String   @map("created_by_id")
  createdAt               DateTime @default(now()) @map("created_at")
  updatedAt               DateTime @updatedAt @map("updated_at")

  // Relations
  creator                 User     @relation("SessionCreator", fields: [createdById], references: [id])
  bookingUser             User?    @relation("SessionBooker", fields: [bookingUserId], references: [id])
  rsvps                   RSVP[]
  notifications           Notification[]

  @@index([date, time])
  @@index([createdById])
  @@map("sessions")
}

model RSVP {
  id        String   @id @default(uuid())
  sessionId String   @map("session_id")
  userId    String   @map("user_id")
  status    String   // yes, no, maybe
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  session   Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([sessionId, userId])
  @@index([sessionId])
  @@index([userId])
  @@map("rsvps")
}

model Notification {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  type      String   // new_session, rsvp_change, booking_update, reminder
  title     String
  message   String
  sessionId String?  @map("session_id")
  read      Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  session   Session? @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([userId, read])
  @@index([createdAt])
  @@map("notifications")
}
```

### Database Design Rationale

**UUID vs Auto-Increment IDs:**
- Using UUIDs for flexibility and security (no sequential ID guessing)
- Easier to merge/migrate data in future

**Separate RSVP Table:**
- Allows unique constraint preventing duplicate RSVPs
- Easy to query attendance patterns
- Supports future features (RSVP history, analytics)

**Booking Fields on Session:**
- Denormalized for simplicity (booking is session property)
- Avoids unnecessary join table
- Status as string for easy extensibility

**Time as String:**
- Simple format "HH:MM" sufficient for requirements
- Avoids timezone complexity for local coordination
- Date stored as DateTime for proper sorting

**Soft Delete:**
- Not implemented in schema (can add `deletedAt` field if needed)
- For MVP, hard delete is acceptable
- Archive strategy can be added later

### Indexes

**Performance Considerations:**
- Index on `sessions(date, time)` for listing upcoming sessions
- Index on `rsvps(sessionId)` for fast attendance queries
- Index on `notifications(userId, read)` for unread count queries
- Composite unique index on `rsvps(sessionId, userId)` enforces business rule

---

## API Specification

### API Design Principles

1. **RESTful Resource-Based URLs**: `/api/sessions`, `/api/users`
2. **HTTP Methods for CRUD**: GET (read), POST (create), PUT (update), DELETE (delete)
3. **JSON Request/Response**: Content-Type: application/json
4. **Consistent Error Format**: Standard error response structure
5. **Authentication via JWT**: Authorization: Bearer <token>
6. **API Versioning**: Implicit v1 (URL prefix can be added later if needed)

### Authentication Endpoints

#### POST /api/auth/signup
**Description:** Register a new user account

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "+31612345678"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "+31612345678"
  },
  "token": "jwt-token-here"
}
```

**Validation Rules:**
- Email: valid format, unique
- Password: min 8 characters, mix of letters and numbers
- Name: required, 1-100 characters
- Phone: optional

---

#### POST /api/auth/login
**Description:** Authenticate user and receive JWT token

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "john@example.com",
    "name": "John Doe"
  },
  "token": "jwt-token-here"
}
```

**Error (401 Unauthorized):**
```json
{
  "error": "Invalid credentials"
}
```

---

#### GET /api/auth/me
**Description:** Get current authenticated user info

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "+31612345678"
  }
}
```

---

### Session Endpoints

#### GET /api/sessions
**Description:** List all sessions (upcoming and past)

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `type` (optional): "upcoming" | "past" | "all" (default: "all")
- `limit` (optional): number of results (default: 50)
- `offset` (optional): pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "sessions": [
    {
      "id": "uuid-here",
      "date": "2025-10-10T00:00:00Z",
      "time": "19:00",
      "venueName": "Court Central",
      "venueAddress": "123 Padel Street, Amsterdam",
      "totalCost": 40.00,
      "notes": "Bring your A-game!",
      "bookingStatus": "booked",
      "bookingUserId": "uuid-here",
      "bookingConfirmation": "Booking #12345",
      "bookingExternalLink": "https://courtbooking.com/confirm/12345",
      "creator": {
        "id": "uuid-here",
        "name": "John Doe"
      },
      "rsvpSummary": {
        "yes": 6,
        "no": 1,
        "maybe": 1,
        "noResponse": 0
      },
      "userRsvpStatus": "yes",
      "createdAt": "2025-10-03T10:00:00Z"
    }
  ],
  "total": 12,
  "hasMore": false
}
```

---

#### GET /api/sessions/:id
**Description:** Get single session details with all RSVPs

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "session": {
    "id": "uuid-here",
    "date": "2025-10-10T00:00:00Z",
    "time": "19:00",
    "venueName": "Court Central",
    "venueAddress": "123 Padel Street, Amsterdam",
    "totalCost": 40.00,
    "notes": "Bring your A-game!",
    "bookingStatus": "booked",
    "bookingUser": {
      "id": "uuid-here",
      "name": "Sarah Smith"
    },
    "bookingConfirmation": "Booking #12345",
    "bookingExternalLink": "https://courtbooking.com/confirm/12345",
    "creator": {
      "id": "uuid-here",
      "name": "John Doe"
    },
    "rsvps": [
      {
        "id": "uuid-here",
        "status": "yes",
        "user": {
          "id": "uuid-here",
          "name": "John Doe"
        },
        "updatedAt": "2025-10-03T11:00:00Z"
      }
    ],
    "createdAt": "2025-10-03T10:00:00Z",
    "updatedAt": "2025-10-04T15:30:00Z"
  }
}
```

---

#### POST /api/sessions
**Description:** Create a new session

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request:**
```json
{
  "date": "2025-10-10",
  "time": "19:00",
  "venueName": "Court Central",
  "venueAddress": "123 Padel Street, Amsterdam",
  "totalCost": 40.00,
  "notes": "Bring your A-game!"
}
```

**Response (201 Created):**
```json
{
  "session": {
    "id": "uuid-here",
    "date": "2025-10-10T00:00:00Z",
    "time": "19:00",
    "venueName": "Court Central",
    "venueAddress": "123 Padel Street, Amsterdam",
    "totalCost": 40.00,
    "notes": "Bring your A-game!",
    "bookingStatus": "unassigned",
    "creator": {
      "id": "uuid-here",
      "name": "John Doe"
    },
    "createdAt": "2025-10-03T10:00:00Z"
  }
}
```

**Validation Rules:**
- date: required, ISO date string, not in past
- time: required, format "HH:MM"
- venueName: required, 1-200 characters
- venueAddress: optional, max 500 characters
- totalCost: optional, decimal number >= 0
- notes: optional, max 1000 characters

---

#### PUT /api/sessions/:id
**Description:** Update session (only by creator)

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request:** (all fields optional)
```json
{
  "date": "2025-10-11",
  "time": "20:00",
  "venueName": "Updated Venue",
  "totalCost": 45.00
}
```

**Response (200 OK):**
```json
{
  "session": { /* updated session object */ }
}
```

**Error (403 Forbidden):**
```json
{
  "error": "Only the session creator can update this session"
}
```

---

#### DELETE /api/sessions/:id
**Description:** Delete session (only by creator)

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (204 No Content)**

**Error (403 Forbidden):**
```json
{
  "error": "Only the session creator can delete this session"
}
```

---

### RSVP Endpoints

#### POST /api/sessions/:sessionId/rsvps
**Description:** Create or update RSVP for current user

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request:**
```json
{
  "status": "yes"
}
```

**Response (200 OK):**
```json
{
  "rsvp": {
    "id": "uuid-here",
    "sessionId": "uuid-here",
    "userId": "uuid-here",
    "status": "yes",
    "updatedAt": "2025-10-03T11:00:00Z"
  }
}
```

**Validation:**
- status: required, must be "yes" | "no" | "maybe"

---

#### DELETE /api/sessions/:sessionId/rsvps
**Description:** Remove RSVP (return to no response state)

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (204 No Content)**

---

### Booking Endpoints

#### PUT /api/sessions/:sessionId/booking
**Description:** Update booking status and details

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request:**
```json
{
  "action": "claim" | "release" | "mark_booked" | "update_details",
  "bookingConfirmation": "Booking #12345",
  "bookingExternalLink": "https://courtbooking.com/confirm/12345"
}
```

**Actions:**
- `claim`: Assign current user as booking coordinator
- `release`: Unassign booking coordinator (only by assigned user)
- `mark_booked`: Change status to booked with details (only by assigned user)
- `update_details`: Update confirmation/link (only by assigned user or creator)

**Response (200 OK):**
```json
{
  "session": { /* updated session with booking info */ }
}
```

---

### Notification Endpoints

#### GET /api/notifications
**Description:** Get user's notifications

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `unreadOnly` (optional): boolean (default: false)
- `limit` (optional): number (default: 50)

**Response (200 OK):**
```json
{
  "notifications": [
    {
      "id": "uuid-here",
      "type": "new_session",
      "title": "New Session Created",
      "message": "John Doe created a session for Oct 10 at 19:00",
      "sessionId": "uuid-here",
      "read": false,
      "createdAt": "2025-10-03T10:05:00Z"
    }
  ],
  "unreadCount": 3
}
```

---

#### PATCH /api/notifications/:id/read
**Description:** Mark notification as read

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "notification": {
    "id": "uuid-here",
    "read": true
  }
}
```

---

#### POST /api/notifications/mark-all-read
**Description:** Mark all notifications as read

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "markedCount": 5
}
```

---

### User Endpoints

#### GET /api/users
**Description:** Get all group members

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "users": [
    {
      "id": "uuid-here",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+31612345678"
    }
  ]
}
```

---

### Error Response Format

All error responses follow this format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "email",
    "message": "Email already exists"
  }
}
```

**Common HTTP Status Codes:**
- 200: Success
- 201: Created
- 204: No Content (successful deletion)
- 400: Bad Request (validation error)
- 401: Unauthorized (invalid/missing token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 409: Conflict (e.g., duplicate email)
- 429: Too Many Requests (rate limit exceeded)
- 500: Internal Server Error

---

## Frontend Architecture

### Project Structure

```
frontend/
├── src/
│   ├── api/              # API client and service layer
│   │   ├── client.ts     # Axios instance with interceptors
│   │   ├── auth.ts       # Authentication API calls
│   │   ├── sessions.ts   # Session API calls
│   │   ├── rsvps.ts      # RSVP API calls
│   │   └── notifications.ts
│   ├── components/       # Reusable React components
│   │   ├── common/       # Generic UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Loading.tsx
│   │   ├── layout/       # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── Layout.tsx
│   │   ├── session/      # Session-specific components
│   │   │   ├── SessionCard.tsx
│   │   │   ├── SessionForm.tsx
│   │   │   ├── SessionDetail.tsx
│   │   │   └── AttendanceList.tsx
│   │   ├── rsvp/
│   │   │   └── RSVPSelector.tsx
│   │   └── notifications/
│   │       └── NotificationCenter.tsx
│   ├── pages/            # Page components (routes)
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── SessionDetailPage.tsx
│   │   └── CreateSessionPage.tsx
│   ├── store/            # Zustand stores
│   │   ├── authStore.ts
│   │   ├── sessionStore.ts
│   │   └── notificationStore.ts
│   ├── hooks/            # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useSessions.ts
│   │   └── useNotifications.ts
│   ├── utils/            # Utility functions
│   │   ├── date.ts       # Date formatting helpers
│   │   ├── validation.ts # Form validation
│   │   └── signal.ts     # Signal message formatter
│   ├── types/            # TypeScript type definitions
│   │   ├── api.ts        # API response types
│   │   ├── models.ts     # Domain model types
│   │   └── forms.ts      # Form types
│   ├── App.tsx           # Root component
│   ├── main.tsx          # Entry point
│   └── router.tsx        # Route definitions
├── public/
│   ├── manifest.json     # PWA manifest
│   └── service-worker.js # Service worker for offline
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

### State Management Strategy

**Zustand Stores:**

1. **Auth Store** (`authStore.ts`):
   - Current user
   - JWT token
   - Authentication status
   - Login/logout actions

2. **Session Store** (`sessionStore.ts`):
   - Sessions list
   - Current session detail
   - CRUD actions
   - Optimistic updates

3. **Notification Store** (`notificationStore.ts`):
   - Notifications list
   - Unread count
   - Mark read actions
   - Real-time updates via SSE

### Routing Structure

```typescript
// Route Definitions
/                        → DashboardPage (requires auth)
/login                   → LoginPage
/signup                  → SignupPage
/sessions/new            → CreateSessionPage (requires auth)
/sessions/:id            → SessionDetailPage (requires auth)
/sessions/:id/edit       → EditSessionPage (requires auth)
/notifications           → NotificationsPage (requires auth)
/profile                 → ProfilePage (requires auth)
```

### Component Patterns

**Smart vs Presentational Components:**
- **Smart (Container) Components**: Pages that connect to stores and handle logic
- **Presentational Components**: Reusable UI components with props

**Example:**
```typescript
// Smart Component (Page)
const SessionDetailPage: React.FC = () => {
  const { id } = useParams();
  const { session, loading } = useSessions(id);
  
  return <SessionDetail session={session} loading={loading} />;
};

// Presentational Component
interface SessionDetailProps {
  session: Session | null;
  loading: boolean;
}

const SessionDetail: React.FC<SessionDetailProps> = ({ session, loading }) => {
  if (loading) return <Loading />;
  if (!session) return <NotFound />;
  
  return (
    <div>
      <h1>{session.venueName}</h1>
      {/* ... */}
    </div>
  );
};
```

### PWA Configuration

**Manifest (`public/manifest.json`):**
```json
{
  "name": "Padel Match Coordinator",
  "short_name": "Padel",
  "description": "Coordinate weekly padel matches with your group",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#16a34a",
  "theme_color": "#16a34a",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Service Worker Strategy:**
- Cache static assets (HTML, CSS, JS)
- Network-first for API calls
- Cache session data for offline viewing
- Background sync for RSVP actions when reconnected

---

## Authentication & Security

### Authentication Flow

```
┌──────────┐                ┌──────────┐                ┌──────────┐
│  Client  │                │   API    │                │ Database │
└────┬─────┘                └────┬─────┘                └────┬─────┘
     │                           │                           │
     │  POST /api/auth/login     │                           │
     ├──────────────────────────>│                           │
     │  { email, password }      │                           │
     │                           │  Query user by email      │
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │<──────────────────────────┤
     │                           │  User record              │
     │                           │                           │
     │                           │  bcrypt.compare()         │
     │                           │  password vs hash         │
     │                           │                           │
     │                           │  Generate JWT             │
     │                           │  (7 day expiry)           │
     │                           │                           │
     │<──────────────────────────┤                           │
     │  { user, token }          │                           │
     │                           │                           │
     │  Store token in           │                           │
     │  localStorage             │                           │
     │                           │                           │
     │  GET /api/sessions        │                           │
     │  Authorization: Bearer... │                           │
     ├──────────────────────────>│                           │
     │                           │  Verify JWT               │
     │                           │  Extract user ID          │
     │                           │                           │
     │                           │  Query sessions           │
     │                           ├──────────────────────────>│
     │                           │                           │
     │<──────────────────────────┤<──────────────────────────┤
     │  { sessions: [...] }      │                           │
     │                           │                           │
```

### JWT Token Structure

**Payload:**
```json
{
  "userId": "uuid-here",
  "email": "john@example.com",
  "iat": 1696320000,
  "exp": 1696924800
}
```

**Token Expiry:** 7 days  
**Signing Algorithm:** HS256  
**Secret:** Environment variable `JWT_SECRET` (min 32 characters)

### Password Security

**Hashing:**
- Algorithm: bcrypt
- Salt rounds: 10
- Minimum password requirements:
  - 8+ characters
  - Mix of letters and numbers
  - (Optional: special characters for future enhancement)

**Storage:**
- Never store plaintext passwords
- Hash generated on signup
- Compare on login using `bcrypt.compare()`

### Input Validation & Sanitization

**Server-Side Validation:**
```typescript
// Example: Session creation validation
const createSessionValidation = [
  body('date').isISO8601().toDate(),
  body('time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body('venueName').trim().isLength({ min: 1, max: 200 }),
  body('venueAddress').optional().trim().isLength({ max: 500 }),
  body('totalCost').optional().isDecimal({ min: 0 }),
  body('notes').optional().trim().isLength({ max: 1000 })
];
```

**XSS Prevention:**
- All user input sanitized before storage
- React escapes output by default
- Additional sanitization for rich text (if added)

**SQL Injection Prevention:**
- Prisma ORM uses parameterized queries
- No raw SQL string concatenation

### HTTPS & Transport Security

**Requirements:**
- All traffic over HTTPS (enforced by hosting platform)
- HTTP Strict Transport Security (HSTS) header
- Secure cookies (httpOnly, secure flags)

**Security Headers:**
```typescript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

### Rate Limiting

**Configuration:**
```typescript
// Authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later'
});

// General API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests
  message: 'Too many requests, please slow down'
});
```

### Authorization Rules

**Session Operations:**
- Create: Any authenticated user
- Read: Any authenticated user
- Update: Only session creator
- Delete: Only session creator

**RSVP Operations:**
- Create/Update: Only for own user
- Read: Any authenticated user (can see all RSVPs)
- Delete: Only for own user

**Booking Operations:**
- Claim: Any authenticated user
- Mark Booked: Only assigned booking coordinator
- Update Details: Booking coordinator or session creator
- Release: Only assigned booking coordinator or session creator

**Notification Operations:**
- Read: Only own notifications
- Mark Read: Only own notifications

### Future Security Enhancements

For production at scale, consider:
1. Refresh token mechanism (extend session without re-login)
2. Password reset flow (email verification)
3. Two-factor authentication (optional)
4. Session management (view/revoke active sessions)
5. Audit logging (track sensitive operations)
6. Content Security Policy (CSP) headers
7. Rate limiting per user (not just per IP)

---

## Deployment Architecture

### Infrastructure Overview

```
┌────────────────────────────────────────────────────────────┐
│                      Railway Platform                       │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐        ┌──────────────────────┐  │
│  │  Frontend Service   │        │  Backend Service     │  │
│  │  (Static Files)     │        │  (Express.js)        │  │
│  │  Port: 443 (HTTPS)  │        │  Port: 443 (HTTPS)   │  │
│  │                     │        │                      │  │
│  │  - React Build      │        │  - API Endpoints     │  │
│  │  - Service Worker   │        │  - WebSocket/SSE     │  │
│  │  - Static Assets    │        │  - Background Jobs   │  │
│  └─────────────────────┘        └──────────┬───────────┘  │
│                                             │               │
│                                             │               │
│                                  ┌──────────▼───────────┐  │
│                                  │  PostgreSQL Database │  │
│                                  │  (Managed)           │  │
│                                  │                      │  │
│                                  │  - Automated Backups │  │
│                                  │  - Connection Pool   │  │
│                                  └──────────────────────┘  │
│                                                             │
└────────────────────────────────────────────────────────────┘
                             │
                             │ HTTPS
                             │
                ┌────────────▼────────────┐
                │  Users (Mobile/Desktop) │
                │  Progressive Web App    │
                └─────────────────────────┘
```

### Hosting Platform: Railway

**Why Railway:**
- Free tier includes PostgreSQL
- Simple git-based deployment
- Built-in CI/CD
- Environment variable management
- One platform for everything (simpler than multiple services)
- Automatic HTTPS

**Alternative Considered:**
- **Vercel + Supabase**: Vercel for frontend/API, Supabase for DB
  - More complexity (two platforms)
  - Supabase free tier is generous
  - Good alternative if Railway limits are hit

### Environment Configuration

**Environment Variables:**

```bash
# Backend (.env)
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-super-secret-key-min-32-chars
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://padel.yourapp.com
CORS_ORIGIN=https://padel.yourapp.com

# Frontend (.env)
VITE_API_URL=https://api.padel.yourapp.com
```

### Deployment Process

**1. Initial Setup:**
```bash
# Create Railway project
railway init

# Link GitHub repository
railway link

# Add PostgreSQL database
railway add postgresql

# Set environment variables
railway variables set JWT_SECRET=your-secret
```

**2. Build Configuration:**

**Backend (`package.json`):**
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "migrate": "prisma migrate deploy"
  }
}
```

**Frontend (`package.json`):**
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**Railway Config (`railway.json`):**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run migrate && npm run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### CI/CD Pipeline (GitHub Actions)

**Workflow (`.github/workflows/deploy.yml`):**
```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install pnpm
        run: npm install -g pnpm
        
      - name: Install dependencies
        run: pnpm install
        
      - name: Lint
        run: pnpm run lint
        
      - name: Type check
        run: pnpm run type-check
        
      - name: Run tests
        run: pnpm run test
        
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: padel-backend
```

### Database Migrations

**Migration Strategy:**
```bash
# Development: Create migration
npx prisma migrate dev --name add_booking_fields

# Production: Apply migrations
npx prisma migrate deploy
```

**Deployment Flow:**
1. Run migrations before starting server
2. Zero-downtime migrations (additive changes first)
3. Rollback plan for breaking changes

### Monitoring & Logging

**Railway Built-in:**
- Application logs (stdout/stderr)
- Resource usage metrics (CPU, memory)
- Request/response logging

**Additional Tools (Future):**
- **Sentry**: Error tracking and monitoring
- **Logtail**: Centralized log management
- **UptimeRobot**: Uptime monitoring and alerts

### Backup Strategy

**Database Backups:**
- Railway provides automatic daily backups
- Retention: 7 days (free tier)
- Manual backup command: `pg_dump`

**Backup Schedule:**
- Automated: Daily at 2 AM UTC (Railway default)
- Manual: Before major schema changes

### Disaster Recovery

**Recovery Time Objective (RTO):** 1 hour  
**Recovery Point Objective (RPO):** 24 hours (daily backup)

**Recovery Steps:**
1. Restore database from latest backup
2. Redeploy application from git
3. Verify data integrity
4. Notify users of service restoration

### Scaling Strategy (Future)

**When to Scale:**
- Response times > 2 seconds
- CPU usage consistently > 80%
- Support for multiple groups (100+ users)

**Scaling Options:**
1. **Vertical Scaling**: Upgrade Railway plan (more CPU/memory)
2. **Horizontal Scaling**: Multiple backend instances with load balancer
3. **Database Optimization**: Connection pooling, query optimization, caching
4. **CDN**: Cloudflare for static assets

---

## Development Workflow

### Getting Started (Local Development)

**Prerequisites:**
- Node.js 20 LTS
- pnpm 8+
- PostgreSQL 15+ (or Docker)
- Git

**Initial Setup:**
```bash
# Clone repository
git clone https://github.com/yourusername/padel-coordinator.git
cd padel-coordinator

# Install dependencies
pnpm install

# Setup environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your values

# Start PostgreSQL (Docker option)
docker run --name padel-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15

# Run database migrations
cd backend
pnpm prisma migrate dev

# Seed database with test users
pnpm prisma db seed

# Start development servers (from root)
pnpm run dev
```

**Development Commands:**
```bash
# Start both frontend and backend
pnpm run dev

# Start only frontend (port 5173)
pnpm run dev:frontend

# Start only backend (port 3000)
pnpm run dev:backend

# Run tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Lint code
pnpm run lint

# Format code
pnpm run format

# Type check
pnpm run type-check

# Build for production
pnpm run build
```

### Git Workflow

**Branch Strategy:**
- `main`: Production-ready code
- `develop`: Integration branch (optional for solo dev)
- `feature/*`: Feature branches
- `fix/*`: Bug fix branches

**Commit Convention:**
```
type(scope): subject

Examples:
feat(sessions): add booking status field
fix(rsvp): prevent duplicate RSVPs
refactor(api): extract validation middleware
docs(readme): update setup instructions
test(sessions): add integration tests
```

**Pull Request Process:**
1. Create feature branch from `main`
2. Make changes and commit
3. Push branch and open PR
4. CI runs tests automatically
5. Review changes (self-review for solo dev)
6. Merge to `main` (triggers deployment)

### Code Quality Standards

**TypeScript:**
- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Explicit return types for functions
- Interface over type when possible

**ESLint Rules:**
- Airbnb style guide (modified)
- React hooks rules
- TypeScript recommended rules
- Prettier integration

**Testing Requirements:**
- Unit tests for business logic
- Integration tests for API endpoints
- 70%+ code coverage for services
- Test file naming: `*.test.ts` or `*.spec.ts`

### Database Management

**Prisma Workflow:**
```bash
# Update schema
# Edit prisma/schema.prisma

# Create migration
npx prisma migrate dev --name descriptive_name

# Generate Prisma Client
npx prisma generate

# View database in browser
npx prisma studio

# Reset database (dev only!)
npx prisma migrate reset
```

**Seed Data:**
Create `prisma/seed.ts` with 8 test users:
```typescript
async function main() {
  const users = [
    { email: 'john@test.com', name: 'John Doe' },
    { email: 'sarah@test.com', name: 'Sarah Smith' },
    // ... 6 more users
  ];
  
  for (const user of users) {
    await prisma.user.create({
      data: {
        ...user,
        passwordHash: await bcrypt.hash('password123', 10)
      }
    });
  }
}
```

### Testing Strategy

**Test Pyramid:**
```
       ╱╲
      ╱ E2E╲              Few (Manual for MVP)
     ╱──────╲
    ╱Integration╲         Some (API endpoints)
   ╱────────────╲
  ╱  Unit Tests  ╲        Many (Business logic)
 ╱────────────────╲
```

**Example Tests:**

**Unit Test (Service):**
```typescript
// services/session.service.test.ts
describe('SessionService', () => {
  it('should calculate court requirements correctly', () => {
    expect(calculateCourts(4)).toBe(1);
    expect(calculateCourts(8)).toBe(2);
    expect(calculateCourts(9)).toBe(3);
  });
});
```

**Integration Test (API):**
```typescript
// routes/sessions.test.ts
describe('POST /api/sessions', () => {
  it('should create a new session', async () => {
    const response = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2025-10-10',
        time: '19:00',
        venueName: 'Test Court'
      });
      
    expect(response.status).toBe(201);
    expect(response.body.session).toHaveProperty('id');
  });
  
  it('should reject past dates', async () => {
    const response = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2020-01-01',
        time: '19:00',
        venueName: 'Test Court'
      });
      
    expect(response.status).toBe(400);
  });
});
```

### Debugging

**Backend Debugging:**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["run", "dev:backend"],
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

**Frontend Debugging:**
- React DevTools browser extension
- Zustand DevTools integration
- Console logging with clear prefixes
- Network tab for API debugging

### Performance Profiling

**Backend:**
```typescript
// Simple performance logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
  });
  next();
});
```

**Frontend:**
- React DevTools Profiler
- Lighthouse audits (performance score)
- Chrome DevTools Performance tab

---

## Implementation Roadmap

### Epic 1: Foundation & Core Session Management
**Duration:** 2-3 weeks (30-40 hours)

**Week 1: Project Setup & Authentication**
- [ ] Initialize monorepo structure
- [ ] Configure TypeScript, ESLint, Prettier
- [ ] Setup Vite + React frontend
- [ ] Setup Express + TypeScript backend
- [ ] Configure Prisma with PostgreSQL
- [ ] Create User schema and migrations
- [ ] Implement user registration endpoint
- [ ] Implement login endpoint with JWT
- [ ] Create authentication middleware
- [ ] Build login/signup UI forms
- [ ] Implement auth state management (Zustand)
- [ ] Setup protected routes
- [ ] Deploy to Railway (initial deployment)

**Week 2: Session Management**
- [ ] Create Session schema and migrations
- [ ] Implement session CRUD endpoints
- [ ] Add request validation
- [ ] Build session creation form
- [ ] Build session list view
- [ ] Build session detail view
- [ ] Implement optimistic updates
- [ ] Add error handling and loading states
- [ ] Setup CI/CD with GitHub Actions
- [ ] Write tests for session endpoints

### Epic 2: RSVP & Attendance Tracking
**Duration:** 1.5-2 weeks (20-25 hours)

- [ ] Create RSVP schema and migrations
- [ ] Implement RSVP endpoints
- [ ] Add unique constraint validation
- [ ] Build RSVP selector component
- [ ] Build attendance list component
- [ ] Implement attendance summary on cards
- [ ] Add court capacity calculator
- [ ] Setup Server-Sent Events for real-time updates
- [ ] Create Notification schema (foundation)
- [ ] Write tests for RSVP functionality

### Epic 3: Court Booking Coordination
**Duration:** 1.5-2 weeks (20-25 hours)

- [ ] Add booking fields to Session schema
- [ ] Create booking status migration
- [ ] Implement booking endpoints
- [ ] Build booking assignment UI
- [ ] Build booking status display
- [ ] Add booking confirmation form
- [ ] Implement cost display
- [ ] Add booking notifications
- [ ] Handle edge cases (24hr reminder, etc.)
- [ ] Write tests for booking workflow

### Epic 4: Notifications & Signal Integration
**Duration:** 1.5-2 weeks (20-25 hours)

- [ ] Build notification center UI
- [ ] Implement real-time notification delivery
- [ ] Add notification preferences
- [ ] Build session summary generator
- [ ] Implement copy-to-clipboard for Signal
- [ ] Add automated share prompts
- [ ] Create reminder job system
- [ ] Setup background job scheduler
- [ ] Polish notification UX
- [ ] (Optional) Research Signal bot API

**Total MVP Time Estimate: 7-9 weeks (90-115 hours)**

### Epic 5: Match Score Tracking (Optional)
**Duration:** 2-3 weeks (30-40 hours)
- Defer until after MVP validation with user group

---

## Next Steps

### Immediate Actions

1. **Review & Validate Architecture**
   - Review this document with any technical advisors
   - Validate technology choices against your experience
   - Identify any concerns or questions

2. **Setup Development Environment**
   - Install prerequisites (Node.js, pnpm, PostgreSQL)
   - Initialize monorepo structure
   - Configure tooling (TypeScript, ESLint, etc.)

3. **Create GitHub Repository**
   - Initialize git repository
   - Push initial commit
   - Setup branch protection rules

4. **Start Epic 1, Story 1.1**
   - Follow implementation roadmap
   - Set up project scaffolding
   - Establish development workflow

### Questions to Consider

Before starting implementation:

1. **Hosting:** Confirm Railway as hosting choice or consider alternatives?
2. **Domain Name:** Purchase domain for production deployment?
3. **Team Growth:** Will you invite other developers to contribute?
4. **Timeline:** What's your target launch date with your padel group?
5. **Design:** Do you want to create mockups first or iterate as you build?

---

## Appendix

### Useful Resources

**Documentation:**
- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [Prisma Docs](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

**Tools:**
- [Railway Documentation](https://docs.railway.app/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Tailwind CSS](https://tailwindcss.com/docs)

**Community:**
- [React Discord](https://discord.gg/react)
- [TypeScript Discord](https://discord.gg/typescript)
- [Prisma Discord](https://discord.gg/prisma)

### Technology Evaluation Matrix

| Criteria | PostgreSQL | MongoDB | MySQL |
|----------|------------|---------|-------|
| Relational Model | ✅ Excellent | ❌ No | ✅ Good |
| Free Hosting | ✅ Yes | ✅ Yes | ✅ Yes |
| TypeScript ORM | ✅ Prisma | ✅ Mongoose | ✅ Prisma |
| JSON Support | ✅ Yes | ✅ Native | ⚠️ Limited |
| **Score** | **9/10** | 6/10 | 7/10 |

| Criteria | Express | Fastify | NestJS |
|----------|---------|---------|--------|
| Simplicity | ✅ High | ⚠️ Medium | ❌ Low |
| Performance | ⚠️ Good | ✅ Excellent | ⚠️ Good |
| Ecosystem | ✅ Huge | ⚠️ Growing | ✅ Large |
| Learning Curve | ✅ Easy | ⚠️ Medium | ❌ Steep |
| **Score** | **8/10** | 7/10 | 6/10 |

---

**End of Technical Architecture Document**

*This document is a living document and should be updated as architectural decisions evolve during implementation.*


