# Local Development Setup

## Quick Start for Local Development

### 1. Create `.env` file

Create a file at `backend/.env` with this content:

```env
# Database - SQLite for local development
DATABASE_URL="file:./dev.db"

# JWT Secret
JWT_SECRET="local-dev-secret-key"

# CORS
CORS_ORIGIN="http://localhost:5173"

# Port
PORT=3000
```

### 2. Setup Database

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

### 3. Start Development Servers

**Backend:**
```bash
cd backend
pnpm dev
```

**Frontend:**
```bash
cd frontend
pnpm dev
```

### 4. Access the App

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Test Users

All users have password: `password123`

- john@test.com
- sarah@test.com  
- mike@test.com
- emma@test.com
- alex@test.com
- lisa@test.com
- david@test.com
- nina@test.com

---

## Switching Between Local and Production

### Local Development (SQLite)
```env
DATABASE_URL="file:./dev.db"
```

### Production Testing (Neon PostgreSQL)
```env
DATABASE_URL="postgresql://neondb_owner:npg_2urTebMlSkc4@ep-summer-pine-agwnecec-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
```

---

## Notes

- The SQLite database file (`dev.db`) is created automatically in the `backend/prisma/` directory
- SQLite is perfect for local development - no external database needed!
- The Prisma schema automatically adapts between SQLite and PostgreSQL

