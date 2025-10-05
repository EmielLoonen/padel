# 📤 Upload Your Project to GitHub

## 🎯 Choose Your Method:

### Method 1: GitHub Desktop (Easiest - No Terminal) ⭐ RECOMMENDED

Perfect if you're not comfortable with command line.

#### Steps:

1. **Download & Install GitHub Desktop**
   - Go to: https://desktop.github.com
   - Download for macOS
   - Install and open it

2. **Sign In to GitHub**
   - If you don't have a GitHub account, create one at: https://github.com/signup
   - In GitHub Desktop: GitHub Desktop → Preferences → Accounts → Sign In

3. **Add Your Project**
   - File → Add Local Repository
   - Click "Choose..."
   - Navigate to: `/Users/emiel@backbase.com/Sites/projects/Padel`
   - Click "Add Repository"

4. **Make Initial Commit** (if needed)
   - If you see files in "Changes" tab, add a commit message:
     ```
     Initial commit - Padel Match Coordinator
     ```
   - Click "Commit to main"

5. **Publish to GitHub**
   - Click "Publish repository" (top of window)
   - Repository name: `padel-coordinator`
   - Description: `Web app for coordinating padel matches`
   - Uncheck "Keep this code private" (if you want public)
   - Click "Publish Repository"

6. **Done!** 🎉
   - Your code is now on GitHub!
   - URL will be: `https://github.com/YOUR-USERNAME/padel-coordinator`

---

### Method 2: Command Line (Fast - 2 Minutes) 🚀

Perfect if you're comfortable with terminal.

#### Quick Steps:

1. **Run the setup script:**
   ```bash
   chmod +x scripts/github-setup.sh
   ./scripts/github-setup.sh
   ```

2. **Create repository on GitHub:**
   - Go to: https://github.com/new
   - Name: `padel-coordinator`
   - Description: `Web app for coordinating padel matches`
   - **Don't** initialize with README
   - Click "Create repository"

3. **Push your code:**
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/padel-coordinator.git
   git branch -M main
   git push -u origin main
   ```
   (Replace `YOUR-USERNAME` with your GitHub username)

4. **Done!** 🎉

---

### Method 3: Manual Terminal Steps (Step-by-Step)

If you prefer to understand each command:

#### Step 1: Initialize Git (if not already done)
```bash
cd /Users/emiel@backbase.com/Sites/projects/Padel
git init
```

#### Step 2: Add all files
```bash
git add .
```

#### Step 3: Create initial commit
```bash
git commit -m "Initial commit - Padel Match Coordinator

Features:
- User authentication & profiles with avatars
- Session management with court coordination
- RSVP system with waitlist support
- Guest player invitations
- In-app notifications
- Dark theme UI
- Production-ready deployment"
```

#### Step 4: Create GitHub repository
1. Go to: https://github.com/new
2. Repository name: `padel-coordinator`
3. Description: `Web app for coordinating padel matches with friends`
4. Choose: Public or Private
5. **DON'T** check any initialization options
6. Click "Create repository"

#### Step 5: Connect and push
```bash
# Add GitHub as remote (replace YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/padel-coordinator.git

# Rename branch to main (if needed)
git branch -M main

# Push code to GitHub
git push -u origin main
```

#### Step 6: Enter credentials
- If prompted, enter your GitHub username
- For password, use a **Personal Access Token** (not your account password)
  - Create one at: https://github.com/settings/tokens
  - Or use GitHub CLI/Desktop for easier authentication

---

## ✅ After Upload - Verify It Works

1. **Visit your repository:**
   - `https://github.com/YOUR-USERNAME/padel-coordinator`

2. **Check these files are there:**
   - ✅ `README.md`
   - ✅ `DEPLOY_NOW.md`
   - ✅ `backend/` folder
   - ✅ `frontend/` folder
   - ✅ `docs/` folder

3. **Make sure `.env` files are NOT uploaded** (they're in .gitignore)
   - Should NOT see: `backend/.env`
   - This is correct! (secrets stay local)

---

## 🚀 Ready to Deploy from GitHub?

Once your code is on GitHub:

1. **Go to Render.com**
2. Click "New" → "Blueprint"
3. Connect your GitHub account
4. Select your `padel-coordinator` repository
5. Render reads `render.yaml` and deploys automatically!

See `DEPLOY_NOW.md` for detailed deployment steps.

---

## 🔒 Security Note

These files are automatically excluded (in `.gitignore`):
- ❌ `.env` files (contains secrets)
- ❌ `node_modules/` (too large)
- ❌ `uploads/` (user data)
- ❌ `dist/` and `build/` (generated files)

**Never commit:**
- Database passwords
- JWT secrets
- API keys
- Personal data

---

## 🆘 Troubleshooting

### "Permission denied (publickey)"
**Solution:** Use GitHub Desktop OR create a Personal Access Token:
- Go to: https://github.com/settings/tokens
- Generate new token → Repo access
- Use token as password when pushing

### "Repository already exists"
**Solution:** Either:
- Delete the repo on GitHub and try again
- Or use: `git remote set-url origin https://github.com/YOUR-USERNAME/padel-coordinator.git`

### "Nothing to commit"
**Solution:** You might have already committed. Run:
```bash
git status
git log  # See if commits exist
```

### "Failed to push"
**Solution:** Make sure you:
1. Created the repository on GitHub first
2. Used correct username in the URL
3. Have proper authentication (token/SSH)

---

## 📱 Next Steps After GitHub

1. ✅ **Share your code** with collaborators
2. ✅ **Deploy to production** (see `DEPLOY_NOW.md`)
3. ✅ **Enable GitHub Actions** for CI/CD (optional)
4. ✅ **Set up branch protection** for main branch (optional)

---

## 💡 Pro Tips

1. **Make commits often:**
   ```bash
   git add .
   git commit -m "Add guest player feature"
   git push
   ```

2. **Check what's changed:**
   ```bash
   git status
   git diff
   ```

3. **See commit history:**
   ```bash
   git log --oneline
   ```

4. **Create a development branch:**
   ```bash
   git checkout -b dev
   # Make changes
   git push -u origin dev
   ```

---

## ⭐ Recommended: Method 1 (GitHub Desktop)

For the easiest experience, use **GitHub Desktop**. It handles all the Git complexity for you with a nice visual interface!

**Ready?** Pick your method above and get your code on GitHub! 🚀

