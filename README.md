# 🎾 Padel Match Coordinator

A web application for coordinating weekly padel matches with your group.

**[🚀 Deploy to Production in 5 Minutes](DEPLOY_NOW.md)** | [📚 Full Deployment Guide](docs/DEPLOYMENT_GUIDE.md)

## Features

- 🎾 Session planning and management
- ✅ RSVP tracking with real-time updates
- 🏟️ Court booking coordination with guest players
- 🔔 In-app notifications
- 👤 User profiles with avatars
- 🔐 Password management
- 📱 Progressive Web App (mobile-first)
- 🚀 Production-ready deployment

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL 17 + Prisma ORM
- **Deployment:** Render.com + Neon (or Docker)
- **File Storage:** Local (upgradeable to Cloudinary)

## Prerequisites

- Node.js 20 LTS
- pnpm 8+
- PostgreSQL 15+ (or Docker)

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your database URL and JWT secret

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your API URL
```

### 3. Setup Database

```bash
# Start PostgreSQL (if using Docker)
docker run --name padel-db \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:15

# Run migrations
cd backend
pnpm prisma migrate dev

# Seed database with test users
pnpm prisma db seed
```

### 4. Start Development Servers

```bash
# From project root
pnpm run dev

# This starts:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:3000
```

## Project Structure

```
padel-coordinator/
├── frontend/          # React frontend application
├── backend/           # Express backend API
├── shared/            # Shared TypeScript types
├── docs/              # Documentation
│   ├── prd.md        # Product Requirements Document
│   └── technical-architecture.md
└── package.json       # Root package.json (monorepo)
```

## Available Scripts

### Development
- `pnpm run dev` - Start both frontend and backend
- `pnpm run dev:frontend` - Start only frontend
- `pnpm run dev:backend` - Start only backend

### Build
- `pnpm run build` - Build all packages
- `pnpm run build:frontend` - Build frontend only
- `pnpm run build:backend` - Build backend only

### Testing
- `pnpm run test` - Run all tests
- `pnpm run test:frontend` - Run frontend tests
- `pnpm run test:backend` - Run backend tests

### Code Quality
- `pnpm run lint` - Lint all code
- `pnpm run format` - Format all code with Prettier
- `pnpm run type-check` - TypeScript type checking

## Documentation

- [Product Requirements Document](./docs/prd.md)
- [Technical Architecture Document](./docs/technical-architecture.md)

## Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "feat(scope): description"`
3. Push and create PR: `git push origin feature/your-feature`
4. CI runs automatically
5. Merge to main (triggers deployment)

## Deployment

The application is deployed on Railway with automatic deployments from the `main` branch.

- Frontend: TBD
- Backend API: TBD
- Database: Railway PostgreSQL

## License

Private project - All rights reserved

## Contact

Your Name - emiel@emielloonen.nl


