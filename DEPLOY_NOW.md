# 🎾 Deploy Your Padel Coordinator App NOW!

## ⚡ 5-Minute Quick Start

### Step 1: Create Free Database (2 min)
1. Go to **[neon.tech](https://neon.tech)**
2. Click "Sign up" (use GitHub or email)
3. Click "Create Project"
   - Name: `padel-coordinator`
   - Region: Choose closest to you
4. **Copy the connection string** shown
   - Looks like: `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`
   - Save it somewhere safe!

### Step 2: Deploy to Render (3 min)
1. Go to **[render.com](https://render.com)**
2. Click "Sign up" (use GitHub - easier)
3. Click "New +" → "Blueprint"
4. Connect your GitHub account
5. Select your Padel repository
6. Render finds `render.yaml` and shows 2 services
7. Click "Apply"

### Step 3: Add Database URL (30 sec)
1. In Render dashboard → Find "padel-coordinator-api"
2. Click service → "Environment" tab
3. Add variable:
   - Key: `DATABASE_URL`
   - Value: Paste your Neon connection string
4. Click "Save" → Service redeploys

### Step 4: Initialize Database (1 min)
1. Still in backend service → Click "Shell" tab
2. Wait for terminal to load
3. Run these commands:
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma db seed
   ```
4. You should see "✨ Seeding complete!"

### Step 5: Open Your App! 🎉
1. Go back to Render dashboard
2. Click "padel-coordinator-frontend"
3. Click the URL at top (looks like: `https://padel-coordinator-frontend.onrender.com`)
4. **Your app is live!**

## 🎮 Test It Out

Login with any of these accounts:
- Email: `john@test.com` | Password: `password123`
- Email: `sarah@test.com` | Password: `password123`
- Email: `mike@test.com` | Password: `password123`

Then:
1. ✅ Create a session
2. ✅ RSVP to it
3. ✅ Upload an avatar
4. ✅ Add a guest player
5. ✅ Share the URL with friends!

## 📱 Share Your App

Your app URLs:
- **App**: `https://padel-coordinator-frontend.onrender.com`
- **API**: `https://padel-coordinator-api.onrender.com`

Share the App URL with your padel group!

## ⚠️ Important Notes

### Free Tier:
- ✅ **Free forever** - no credit card needed
- ⏰ Backend sleeps after 15 min of inactivity
- 🔄 First request after sleep takes ~30 seconds to wake up
- 💾 Avatar uploads reset when you redeploy

### Upgrade Later ($7/month):
- ⚡ No sleep - always fast
- 💾 Persistent file storage
- 📈 Better performance

## 🔧 Customize Your Deployment

Want to change the URLs? In Render:
1. Go to service settings
2. Update the name
3. New URL: `https://your-name.onrender.com`

## 🆘 Need Help?

### Common Issues:

**"Site is loading slowly"**
→ First load after inactivity takes 30s (free tier wakes up)

**"Can't login"**
→ Check Render logs - database might not be seeded
→ Run seed command again (Step 4)

**"CORS error in console"**
→ Backend is waking up, wait 30 seconds and refresh

**"Avatars not showing after redeploy"**
→ Free tier doesn't have persistent storage
→ Re-upload avatars or upgrade to $7/month plan

## 📚 Full Documentation

For advanced deployment options:
- `PRODUCTION_SETUP.md` - Manual setup guide
- `docs/DEPLOYMENT_GUIDE.md` - Complete deployment docs
- `docs/technical-architecture.md` - System architecture

## 🎯 Next Steps

After deployment:
1. **Invite your padel group** - share the app URL
2. **Upload profile pictures** - Settings → Upload avatar
3. **Create your first real session**
4. **Consider upgrading** if you use it regularly ($7/month for better performance)

## 💡 Pro Tips

1. **Bookmark your app** on mobile - works like a native app!
2. **Add to Home Screen** (iOS/Android) for even better experience
3. **Turn on notifications** in your browser for RSVP updates
4. **Invite everyone** - the app is free for unlimited users!

---

## ✅ Deployment Checklist

- [ ] Database created on Neon
- [ ] Services deployed on Render
- [ ] DATABASE_URL added
- [ ] Migrations run
- [ ] Database seeded
- [ ] Logged in successfully
- [ ] Created test session
- [ ] Shared with friends

**All done?** Congratulations! Your app is live! 🚀🎾

---

**Questions?** Check the full guides or contact your dev team.

**Ready to deploy?** Start with Step 1 above! The whole process takes about 5 minutes.

