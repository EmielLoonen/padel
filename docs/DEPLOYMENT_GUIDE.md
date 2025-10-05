# Deployment Guide - Padel Coordinator

This guide covers deploying your Padel Coordinator app to production using modern, free/affordable hosting services.

## 🎯 Recommended Stack

### Option 1: Full-Stack (Easiest - Recommended)
- **Frontend & Backend**: [Render.com](https://render.com) (Free tier available)
- **Database**: [Neon](https://neon.tech) or [Supabase](https://supabase.com) (Free PostgreSQL)
- **File Storage**: Keep using local storage or upgrade to [Cloudinary](https://cloudinary.com) (Free tier)

### Option 2: Separate Services
- **Frontend**: [Vercel](https://vercel.com) or [Netlify](https://netlify.com) (Free)
- **Backend**: [Railway](https://railway.app) or [Fly.io](https://fly.io)
- **Database**: [Neon](https://neon.tech) (Free PostgreSQL)

## 📋 Pre-Deployment Checklist

- [ ] All features working locally
- [ ] Environment variables documented
- [ ] Database migrations tested
- [ ] Avatar uploads working
- [ ] Build commands verified
- [ ] Production environment variables prepared

## 🚀 Deployment Steps (Option 1 - Render + Neon)

### Step 1: Prepare Your Code

1. **Update package.json scripts** (already done ✅)
2. **Add production build configurations**

Create `backend/render.yaml`:
```yaml
services:
  - type: web
    name: padel-coordinator-api
    env: node
    buildCommand: cd backend && npm install && npx prisma generate
    startCommand: cd backend && npm run start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: CORS_ORIGIN
        sync: false
```

Create `frontend/.env.production`:
```env
VITE_API_URL=https://your-backend-url.onrender.com
```

### Step 2: Set Up Database (Neon)

1. **Sign up at [Neon.tech](https://neon.tech)**
2. **Create a new project** → Name it "padel-coordinator"
3. **Copy your connection string** (it looks like this):
   ```
   postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **Save this for later** - you'll need it for Render

### Step 3: Deploy Backend (Render)

1. **Sign up/Login at [Render.com](https://render.com)**

2. **Create a new Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your Padel project repository

3. **Configure the service**:
   ```
   Name: padel-coordinator-api
   Region: Oregon (US West) or Frankfurt (Europe) - choose closest to you
   Branch: main (or your default branch)
   Root Directory: backend
   Runtime: Node
   Build Command: npm install && npx prisma generate
   Start Command: npm run start
   ```

4. **Add Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=<your-neon-connection-string>
   JWT_SECRET=<generate-a-random-string-min-32-chars>
   CORS_ORIGIN=https://your-frontend-url.onrender.com
   ```

   **To generate JWT_SECRET**, run in terminal:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Deploy!**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes first time)
   - Note your backend URL: `https://padel-coordinator-api.onrender.com`

6. **Run Database Migrations**:
   - Go to Render Dashboard → Your Service → Shell
   - Run:
     ```bash
     cd backend
     npx prisma migrate deploy
     npx prisma db seed
     ```

### Step 4: Deploy Frontend (Render)

1. **Create another Web Service** (or use Static Site):
   - Click "New +" → "Static Site"
   - Select same repository

2. **Configure**:
   ```
   Name: padel-coordinator
   Branch: main
   Root Directory: frontend
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

3. **Add Environment Variables**:
   ```
   VITE_API_URL=https://padel-coordinator-api.onrender.com
   ```

4. **Deploy!**
   - Click "Create Static Site"
   - Your app will be live at: `https://padel-coordinator.onrender.com`

### Step 5: Update CORS

1. **Go back to Backend service on Render**
2. **Update CORS_ORIGIN environment variable**:
   ```
   CORS_ORIGIN=https://padel-coordinator.onrender.com
   ```
3. **Service will auto-redeploy**

### Step 6: File Upload Configuration

Since we're using local file storage, we need to make some adjustments:

**Option A: Keep using Render (files will reset on redeploy)**
- Current setup will work but avatars are lost on redeploy
- Good for testing

**Option B: Upgrade to Cloudinary (Recommended)**
1. Sign up at [Cloudinary.com](https://cloudinary.com)
2. Get your API credentials
3. Update avatar upload to use Cloudinary SDK

I can help you implement Option B if needed!

## 🔧 Alternative: Docker Deployment

If you prefer using Docker, here's a quick setup:

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: padel
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: padel
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://padel:${DB_PASSWORD}@postgres:5432/padel
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: ${FRONTEND_URL}
    ports:
      - "3000:3000"
    depends_on:
      - postgres

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: ${BACKEND_URL}
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## 📱 PWA Considerations

Your app is already PWA-ready! To improve mobile experience:

1. **Add to manifest** (`frontend/public/manifest.json`):
   ```json
   {
     "name": "Padel Coordinator",
     "short_name": "Padel",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#0a0e1a",
     "theme_color": "#00d9a3",
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

2. **Add service worker** for offline support (optional)

## 🔒 Security Checklist

Before going live:

- [ ] Use strong JWT_SECRET (min 32 characters)
- [ ] Enable HTTPS only (Render does this automatically)
- [ ] Verify CORS settings
- [ ] Rate limiting on API endpoints (consider adding)
- [ ] Input validation on all endpoints (already done ✅)
- [ ] SQL injection protection (Prisma handles this ✅)

## 📊 Monitoring

Free monitoring options:
- **Render Dashboard**: Built-in metrics and logs
- **Sentry**: Error tracking (free tier)
- **BetterStack**: Uptime monitoring (free tier)

## 💰 Cost Estimates

**Free Tier (Perfect for starting):**
- Neon DB: Free (0.5 GB storage, 3 GB data transfer/month)
- Render: Free (750 hours/month, spins down after 15 min inactivity)
- Total: **$0/month**

**Paid Tier (Better performance):**
- Neon DB: $19/month (3 GB storage, unlimited data transfer)
- Render: $7/month (always-on, no spin-down)
- Total: **$26/month**

## 🚨 Important Notes

### Free Tier Limitations:
1. **Backend spins down after 15 minutes** of inactivity
   - First request after spin-down takes ~30 seconds
   - Not ideal for production, but fine for demo

2. **File uploads** need persistent storage
   - Use Cloudinary or similar for avatars
   - Or upgrade to Render paid tier with persistent disk

3. **Database connections**
   - Neon free tier: 100 connections max
   - Should be plenty for your use case

## 🔄 Continuous Deployment

Render auto-deploys on git push:
1. Push to your main branch
2. Render detects changes
3. Automatically builds and deploys
4. Takes 2-5 minutes

## 📝 Environment Variables Summary

**Backend (.env on Render):**
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=your-long-random-string
CORS_ORIGIN=https://your-frontend.onrender.com
```

**Frontend (.env.production):**
```env
VITE_API_URL=https://your-backend.onrender.com
```

## ❓ Need Help?

Common issues:
1. **"Cannot connect to database"** → Check DATABASE_URL format
2. **"CORS error"** → Verify CORS_ORIGIN matches frontend URL
3. **"Service unavailable"** → Backend is spinning up (free tier)
4. **"Prisma error"** → Run migrations on Render Shell

---

## 🎉 Quick Start Commands

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Test production build locally
cd frontend && npm run build && npm run preview
cd backend && npm run start

# Check environment
node -v  # Should be 18+
npm -v
```

Ready to deploy? Start with Step 2 (Database) and work through each step!

