# Quick Push Guide 🚀

## Your work credentials are cached. Here's how to fix it:

### Option 1: Manual Token in URL (Quick & Easy)

1. **Get your token** from: https://github.com/settings/tokens/new
   - Scopes: Check "repo"
   - Copy the token (starts with `ghp_...`)

2. **Run this command** (replace YOUR_TOKEN with your actual token):

```bash
git push https://YOUR_TOKEN@github.com/EmielLoonen/padel.git main
```

Example:
```bash
git push https://ghp_abc123xyz@github.com/EmielLoonen/padel.git main
```

Then set it as default:
```bash
git branch --set-upstream-to=origin/main main
```

---

### Option 2: Clear Keychain (More permanent)

1. Open **Keychain Access** app (search in Spotlight)
2. Search for "github"
3. Delete any entries related to `github.com` or `emiel_backbase`
4. Run: `git push -u origin main`
5. Enter:
   - Username: `EmielLoonen`
   - Password: Your Personal Access Token

---

### Option 3: Use GIT_ASKPASS (Override cached credentials)

```bash
GIT_ASKPASS= git push -u origin main
```

This will force Git to ask for credentials instead of using cached ones.

---

**Pick the method that works best for you!**

