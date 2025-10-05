# Padel Match Coordinator - Complete Setup Guide

This guide will walk you through setting up your development environment and getting the project running locally.

---

## 📋 Table of Contents

1. [Prerequisites Installation](#prerequisites-installation)
2. [Project Initialization](#project-initialization)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Database Setup](#database-setup)
6. [Running the Application](#running-the-application)
7. [Verification & Testing](#verification--testing)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites Installation

### Step 1: Install Homebrew (if not already installed)

Homebrew is a package manager for macOS that makes installing software easy.

```bash
# Check if Homebrew is already installed
which brew

# If not installed, run this command:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Follow the on-screen instructions
# After installation, you may need to add Homebrew to your PATH (the installer will tell you how)
```

### Step 2: Install Node.js 20 LTS

```bash
# Install Node.js 20
brew install node@20

# Verify installation
node --version
# Should output: v20.x.x

npm --version
# Should output: 10.x.x
```

### Step 3: Install pnpm

pnpm is a fast, disk-efficient package manager.

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
# Should output: 8.x.x or higher
```

### Step 4: Install PostgreSQL

You have two options: local installation or Docker (Docker is recommended for easier management).

#### Option A: PostgreSQL via Docker (Recommended)

```bash
# Install Docker Desktop from https://www.docker.com/products/docker-desktop
# Or install via Homebrew:
brew install --cask docker

# Open Docker Desktop application once to complete setup

# Start PostgreSQL container
docker run --name padel-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=padel \
  -p 5432:5432 \
  -d postgres:17

# Verify container is running
docker ps
# You should see padel-db in the list

# To stop the database:
# docker stop padel-db

# To start it again:
# docker start padel-db
```

#### Option B: Local PostgreSQL Installation

```bash
# Install PostgreSQL 17
brew install postgresql@17

# Start PostgreSQL service
brew services start postgresql@17

# Create database
createdb padel

# Verify installation
psql --version
# Should output: psql (PostgreSQL) 17.x
```

### Step 5: Install Git (if not already installed)

```bash
# Check if Git is installed
git --version

# If not installed:
brew install git
```

---

## Project Initialization

### Step 1: Navigate to Project Directory

```bash
cd /Users/emiel@backbase.com/Sites/projects/Padel
```

### Step 2: Install Root Dependencies

```bash
# Install dependencies defined in the root package.json
pnpm install

# This will install:
# - concurrently (to run multiple commands)
# - prettier (code formatter)
# - typescript (type checking)
```

**Expected output:** You'll see pnpm downloading packages. This may take 1-2 minutes.

---

## Backend Setup

### Step 1: Create Backend Directory Structure

```bash
# From project root
mkdir -p backend/src/{routes,services,middleware,utils,types}
mkdir -p backend/prisma
```

### Step 2: Create Backend package.json

Create `backend/package.json`:

```json
{
  "name": "backend",
  "version": "1.0.0",
  "description": "Padel Coordinator Backend API",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest",
    "lint": "eslint src --ext .ts",
    "type-check": "tsc --noEmit",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.7.1",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/node": "^20.10.5",
    "@types/supertest": "^6.0.2",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "eslint": "^8.56.0",
    "prisma": "^5.7.1",
    "supertest": "^6.3.3",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "vitest": "^1.0.4"
  }
}
```

### Step 3: Create Backend TypeScript Configuration

Create `backend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 4: Create Backend ESLint Configuration

Create `backend/.eslintrc.json`:

```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "plugins": ["@typescript-eslint"],
  "env": {
    "node": true,
    "es2022": true
  },
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

### Step 5: Create Environment File Template

Create `backend/.env.example`:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/padel?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-min-32-characters"

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN="http://localhost:5173"
```

Create your actual `backend/.env` (copy from example):

```bash
cd backend
cp .env.example .env
# Edit .env if you need to change database credentials
```

### Step 6: Install Backend Dependencies

```bash
cd backend
pnpm install
```

### Step 7: Create Prisma Schema

Create `backend/prisma/schema.prisma`:

```prisma
// This is your Prisma schema file
// Learn more: https://pris.ly/d/prisma-schema

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
  time                    String   // Stored as "HH:MM" string
  venueName               String   @map("venue_name")
  venueAddress            String?  @map("venue_address")
  totalCost               Decimal? @map("total_cost") @db.Decimal(10, 2)
  notes                   String?
  bookingStatus           String   @default("unassigned") @map("booking_status")
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

### Step 8: Create Basic Server File

Create `backend/src/server.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Padel Coordinator API is running!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
```

---

## Frontend Setup

### Step 1: Create Frontend with Vite

```bash
# From project root
pnpm create vite frontend --template react-ts

# When prompted:
# - Select: React
# - Select: TypeScript
```

### Step 2: Navigate to Frontend and Install Dependencies

```bash
cd frontend
pnpm install
```

### Step 3: Install Additional Frontend Dependencies

```bash
pnpm add zustand axios react-router-dom date-fns
pnpm add -D @types/node tailwindcss postcss autoprefixer
```

### Step 4: Setup Tailwind CSS

```bash
# Initialize Tailwind
npx tailwindcss init -p
```

Update `frontend/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'padel-green': '#16a34a',
        'padel-blue': '#0284c7',
        'padel-orange': '#ea580c',
      },
    },
  },
  plugins: [],
}
```

Update `frontend/src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### Step 5: Create Environment File

Create `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:3000
```

Create `frontend/.env`:

```bash
cp .env.example .env
```

### Step 6: Update Frontend App

Replace `frontend/src/App.tsx`:

```typescript
import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [health, setHealth] = useState<{ status: string; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/health')
      .then((res) => res.json())
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to connect to backend:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-padel-green to-padel-blue flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎾 Padel Match Coordinator
          </h1>
          <p className="text-gray-600 mb-6">
            Your weekly padel session organizer
          </p>
          
          {loading ? (
            <div className="text-gray-500">Connecting to backend...</div>
          ) : health ? (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <p className="font-bold">✅ Backend Connected!</p>
              <p className="text-sm">{health.message}</p>
            </div>
          ) : (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p className="font-bold">❌ Backend Connection Failed</p>
              <p className="text-sm">Make sure the backend server is running</p>
            </div>
          )}
          
          <div className="mt-6 text-sm text-gray-500">
            <p>Frontend: <span className="font-mono">localhost:5173</span></p>
            <p>Backend: <span className="font-mono">localhost:3000</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
```

---

## Database Setup

### Step 1: Generate Prisma Client

```bash
cd backend
pnpm prisma generate
```

### Step 2: Create Initial Migration

```bash
pnpm prisma migrate dev --name init
```

This will:
- Create the database tables
- Apply the migration
- Generate Prisma Client

### Step 3: Create Seed File

Create `backend/prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create 8 test users (your padel group)
  const users = [
    { email: 'john@test.com', name: 'John Doe', phone: '+31612345678' },
    { email: 'sarah@test.com', name: 'Sarah Smith', phone: '+31612345679' },
    { email: 'mike@test.com', name: 'Mike Johnson', phone: '+31612345680' },
    { email: 'emma@test.com', name: 'Emma Davis', phone: '+31612345681' },
    { email: 'alex@test.com', name: 'Alex Brown', phone: '+31612345682' },
    { email: 'lisa@test.com', name: 'Lisa Wilson', phone: '+31612345683' },
    { email: 'tom@test.com', name: 'Tom Anderson', phone: '+31612345684' },
    { email: 'anna@test.com', name: 'Anna Martinez', phone: '+31612345685' },
  ];

  // Password: "password123" for all test users
  const passwordHash = await bcrypt.hash('password123', 10);

  for (const userData of users) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        passwordHash,
      },
    });
    console.log(`✅ Created user: ${userData.name} (${userData.email})`);
  }

  console.log('✨ Seeding complete!');
  console.log('📝 Test credentials: Any email above with password "password123"');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Step 4: Add Seed Script to package.json

The seed script is already in `backend/package.json` from earlier.

Update `backend/package.json` to include seed config:

```json
{
  ...
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### Step 5: Run Seed

```bash
cd backend
pnpm prisma db seed
```

### Step 6: Verify Database (Optional)

```bash
pnpm prisma studio
```

This opens a browser-based database viewer at `http://localhost:5555`

---

## Running the Application

### Option 1: Run Everything at Once (Recommended)

From the project root:

```bash
pnpm run dev
```

This starts both frontend and backend simultaneously.

**You should see:**
```
[backend] 🚀 Backend server running on http://localhost:3000
[backend] 📊 Health check: http://localhost:3000/health
[frontend] VITE v5.x.x ready in xxx ms
[frontend] ➜ Local: http://localhost:5173/
```

### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
cd backend
pnpm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
pnpm run dev
```

### Step 3: Open in Browser

1. Open your browser to: **http://localhost:5173**
2. You should see the Padel Match Coordinator welcome page
3. It should show "✅ Backend Connected!" if everything is working

---

## Verification & Testing

### Check 1: Backend Health

```bash
curl http://localhost:3000/health
```

**Expected response:**
```json
{"status":"ok","message":"Padel Coordinator API is running!"}
```

### Check 2: Database Connection

```bash
cd backend
pnpm prisma studio
```

- Open http://localhost:5555
- Click on "User" table
- You should see 8 users

### Check 3: Frontend Loading

- Visit http://localhost:5173
- Should see green "Backend Connected" message
- No console errors

### Check 4: Run Tests (After adding tests)

```bash
# From root
pnpm run test
```

---

## Troubleshooting

### Problem: "command not found: node"

**Solution:** Node.js is not installed. Follow Step 2 in Prerequisites.

### Problem: "command not found: pnpm"

**Solution:**
```bash
npm install -g pnpm
```

### Problem: Database connection error

**Solution:**

1. Check if PostgreSQL is running:
```bash
# For Docker:
docker ps

# For local PostgreSQL:
brew services list | grep postgresql
```

2. Verify DATABASE_URL in `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/padel?schema=public"
```

3. Test connection:
```bash
cd backend
pnpm prisma db pull
```

### Problem: Port 3000 or 5173 already in use

**Solution:**

Find and kill the process:
```bash
# Find process using port 3000
lsof -ti:3000 | xargs kill -9

# Find process using port 5173
lsof -ti:5173 | xargs kill -9
```

### Problem: "Cannot find module" errors

**Solution:**

Delete node_modules and reinstall:
```bash
# From root
rm -rf node_modules backend/node_modules frontend/node_modules
pnpm install
cd backend && pnpm install
cd ../frontend && pnpm install
```

### Problem: Prisma migration fails

**Solution:**

Reset the database (WARNING: deletes all data):
```bash
cd backend
pnpm prisma migrate reset
```

### Problem: CORS errors in browser

**Solution:**

1. Check `backend/.env` has correct CORS_ORIGIN:
```env
CORS_ORIGIN="http://localhost:5173"
```

2. Restart backend server

---

## Next Steps

Once everything is running successfully:

1. ✅ **Story 1.1 Complete!** - You now have a working development environment
2. 📝 **Start Story 1.2** - Begin building authentication
3. 🎨 **Explore the code** - Familiarize yourself with the structure
4. 📚 **Read the docs** - Check out `docs/prd.md` and `docs/technical-architecture.md`

---

## Quick Reference

### Common Commands

```bash
# Start everything
pnpm run dev

# Backend only
pnpm run dev:backend

# Frontend only
pnpm run dev:frontend

# Database GUI
cd backend && pnpm prisma studio

# Run tests
pnpm run test

# Format code
pnpm run format

# Type check
pnpm run type-check

# View logs
docker logs padel-db

# Reset database
cd backend && pnpm prisma migrate reset
```

### URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Health Check: http://localhost:3000/health
- Prisma Studio: http://localhost:5555

### Test Credentials

- Email: Any from the seed (e.g., `john@test.com`)
- Password: `password123`

---

## Need Help?

If you encounter any issues not covered in this guide:

1. Check the error message carefully
2. Search for the error online
3. Check the project's GitHub issues
4. Ask Winston (Solution Architect) for help!

Happy coding! 🎾🚀

