# 🚀 Quick Production Setup

## Option 1: One-Click Deploy with Render (Easiest)

1. **Create Database**:
   - Go to [Neon.tech](https://neon.tech) → Sign up (free)
   - Create project → Copy connection string

2. **Deploy on Render**:
   - Go to [Render.com](https://render.com) → Sign up
   - Click "New" → "Blueprint"
   - Connect your GitHub repo
   - Select this repository
   - Render will read `render.yaml` and create both services

3. **Add Database URL**:
   - In Render dashboard → Backend service
   - Environment → Add:
     ```
     DATABASE_URL=postgresql://...your-neon-url...
     ```

4. **Run Migrations**:
   - Backend service → Shell tab
   - Run:
     ```bash
     cd backend
     npx prisma migrate deploy
     npx prisma db seed
     ```

5. **Calculate Historical Ratings** (One-time setup):
   - Backend service → Shell tab
   - Run:
     ```bash
     cd backend
     npm run prisma:calculate-ratings
     ```
   - This calculates UTR ratings for all players based on historical match data
   - See `docs/PRODUCTION_RATING_SETUP.md` for details

6. **Done!** 🎉
   - Frontend: `https://padel-coordinator-frontend.onrender.com`
   - Backend: `https://padel-coordinator-api.onrender.com`

## Option 2: Manual Setup

See detailed guide in: `docs/DEPLOYMENT_GUIDE.md`

## Pre-Deployment Check

Run this script to verify everything is ready:

```bash
chmod +x scripts/deploy-check.sh
./scripts/deploy-check.sh
```

## Environment Variables Needed

### Backend (Render):
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=<run deploy-check.sh to generate>
CORS_ORIGIN=<your-frontend-url>
```

### Frontend (Render):
```env
VITE_API_URL=<your-backend-url>
```

## After Deployment

1. **Test your app**: Visit your frontend URL
2. **Login**: Use one of the seeded accounts (e.g., `john@test.com` / `password123`)
3. **Upload avatars**: Test avatar upload feature
4. **Create a session**: Test all features

## Free Tier Limitations

- **Spin-down**: Backend sleeps after 15 min (30s wake-up time)
- **Storage**: Avatar uploads reset on redeploy
- **Database**: 0.5 GB storage, 3 GB transfer/month

### Upgrade Path ($7/month):
- Always-on backend (no spin-down)
- 512 MB persistent disk
- Better performance

## Troubleshooting

### "Cannot connect to database"
- Check DATABASE_URL format
- Ensure it includes `?sslmode=require` for Neon

### "CORS error"
- Update CORS_ORIGIN to match frontend URL
- No trailing slash

### "Service unavailable"
- Free tier: Backend is waking up (wait 30s)
- Check Render logs for errors

### "Avatars not showing"
- Check if uploads directory exists
- Consider upgrading to Cloudinary

## Cost Calculator

**Free (Demo/Testing)**:
- Neon: $0
- Render: $0
- **Total: $0/month**

**Paid (Production)**:
- Neon: $19/month
- Render Backend: $7/month
- Render Frontend: $0 (free)
- **Total: $26/month**

## Support

- Deployment issues? Check `docs/DEPLOYMENT_GUIDE.md`
- Technical issues? Check GitHub Issues
- Questions? Contact your team

---

**Ready to deploy?** Start with Option 1 above! 🚀

