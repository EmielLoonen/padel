# GitHub Personal Access Token Setup

## Your remote is now configured!

Run the following command to push:

```bash
git push -u origin main
```

## When Prompted:

1. **Username**: `EmielLoonen`
2. **Password**: Paste your Personal Access Token (the long string starting with `ghp_...`)

## Don't have a token yet?

### Create a Personal Access Token:

1. Go to: https://github.com/settings/tokens/new
2. **Note**: "Padel Project"
3. **Expiration**: 90 days (or your preference)
4. **Scopes**: Check **"repo"** (Full control of private repositories)
5. Click **"Generate token"**
6. **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)

The token will look like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Optional: Store credentials so you don't have to enter them every time

After your first successful push, run:

```bash
git config credential.helper store
```

The next time you push, Git will remember your token.

## Alternative: Use SSH (More secure, no tokens needed)

If you prefer SSH authentication:

1. Generate SSH key:
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. Add key to GitHub: https://github.com/settings/keys

3. Update remote to use SSH:
   ```bash
   git remote set-url origin git@github.com:EmielLoonen/padel.git
   ```

---

**Ready to push!** 🚀

Run: `git push -u origin main`

