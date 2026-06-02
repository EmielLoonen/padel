# Avatar Upload Feature Setup

## What Was Added

### Backend Changes

1. **Database Schema** (`backend/prisma/schema.prisma`)
   - Added `avatarUrl` field to User model
   - Migration file created: `backend/prisma/migrations/add_avatar_url/migration.sql`

2. **File Upload Middleware** (`backend/src/middleware/upload.ts`)
   - Uses `multer` for handling multipart/form-data
   - Saves files to `backend/uploads/avatars/`
   - Validates file types (jpeg, jpg, png, gif, webp)
   - 5MB file size limit

3. **Updated Services**
   - `authService.ts`: Now returns `avatarUrl` in user data
   - `userService.ts`: Added `avatarUrl` parameter to `updateProfile`

4. **New API Endpoint** (`backend/src/routes/users.ts`)
   - `POST /api/users/avatar` - Upload avatar image

5. **Server Updates** (`backend/src/server.ts`)
   - Serves uploaded files statically from `/uploads`
   - Auto-creates `uploads/avatars` directory on startup

### Frontend Changes

1. **Avatar Component** (`frontend/src/components/Avatar.tsx`)
   - Displays user avatar or initials-based fallback
   - Supports multiple sizes (sm, md, lg, xl)
   - Gradient background for initials

2. **Auth Store** (`frontend/src/store/authStore.ts`)
   - Added `avatarUrl` to User interface

3. **Settings Page** (`frontend/src/pages/SettingsPage.tsx`)
   - New "Profile Picture" section at the top
   - File upload button with preview
   - Real-time avatar update after upload

## Setup Steps

### 1. Install Dependencies

```bash
cd backend
npm install multer
npm install -D @types/multer
```

Or if using pnpm:
```bash
cd backend
pnpm add multer
pnpm add -D @types/multer
```

### 2. Run Database Migration

```bash
cd backend
npm run prisma:migrate
# or
pnpm prisma migrate dev --name add_avatar_url
```

Or apply the migration manually:
```bash
npm run prisma:db:push
# or
pnpm prisma db push
```

### 3. Generate Prisma Client

```bash
cd backend
npm run prisma:generate
# or
pnpm prisma generate
```

### 4. Update .gitignore

Add to `backend/.gitignore`:
```
uploads/
```

### 5. Restart Backend Server

```bash
cd backend
npm run dev
# or
pnpm dev
```

## How It Works

1. **User uploads image** in Settings page
2. **Frontend sends** image via FormData to `/api/users/avatar`
3. **Backend saves** image to `backend/uploads/avatars/` with unique filename
4. **Database stores** relative URL path (e.g., `/uploads/avatars/avatar-1234567890.jpg`)
5. **Static file serving** makes images accessible at `http://localhost:3000/uploads/...`
6. **Avatar component** displays image or shows initials if no avatar

## Features

- ✅ Image upload with drag & drop
- ✅ File type validation (images only)
- ✅ File size limit (5MB)
- ✅ Auto-generated initials fallback
- ✅ Gradient background for initials
- ✅ Multiple avatar sizes
- ✅ Real-time preview after upload
- ✅ Persistent storage in database

## File Locations

- Uploaded avatars: `backend/uploads/avatars/`
- Avatar component: `frontend/src/components/Avatar.tsx`
- Upload middleware: `backend/src/middleware/upload.ts`
- Upload endpoint: `backend/src/routes/users.ts` (line ~100)

## Usage

In any component, use the Avatar component:

```tsx
import Avatar from '../components/Avatar';

<Avatar 
  src={user?.avatarUrl} 
  name={user?.name || 'User'} 
  size="lg" 
/>
```

Sizes: `'sm' | 'md' | 'lg' | 'xl'`

