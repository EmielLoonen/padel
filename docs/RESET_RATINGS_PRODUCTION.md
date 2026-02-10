# Reset Ratings on Production Database

Quick guide for resetting all player ratings to 5.0 on your live/production database.

## Method 1: Via API Endpoint (Recommended)

This is the easiest way since Render doesn't provide shell access on the free plan.

### Step 1: Get Your Admin Token

**Option A: From Browser**
1. Log in to your app at `https://your-app.onrender.com`
2. Open DevTools (F12)
3. Go to Application → Local Storage → Your domain
4. Copy the `token` value

**Option B: Via Login API**
```bash
curl -X POST https://your-backend-url.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-admin-email@example.com","password":"your-password"}'
```

Copy the `token` from the response.

### Step 2: Call the Reset Endpoint

**Using curl:**
```bash
curl -X POST https://your-backend-url.onrender.com/api/ratings/reset \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Using Browser Console:**
1. Log in to your app
2. Open DevTools Console (F12)
3. Paste and run:
```javascript
fetch('/api/ratings/reset', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log('✅ Reset successful!', data);
})
.catch(err => console.error('❌ Error:', err));
```

### Expected Response

```json
{
  "success": true,
  "message": "All ratings reset to 5.0 (historical data preserved)",
  "summary": {
    "playersReset": 15,
    "totalPlayers": 15,
    "historicalDataPreserved": {
      "ratingHistoryEntries": 234,
      "matchRatingEntries": 234
    }
  }
}
```

## Method 2: Run Script Locally Against Production DB

If you prefer to run the script locally but target your production database:

### Step 1: Get Your Production DATABASE_URL

From your Render dashboard:
1. Go to your database service
2. Copy the "Internal Database URL" or "External Database URL"
3. Format: `postgresql://user:password@host:port/database?sslmode=require`

### Step 2: Run the Script

```bash
cd backend
DATABASE_URL="your-production-database-url" pnpm tsx prisma/reset-ratings.ts
```

**⚠️ Warning:** Make sure you're targeting the correct database! Double-check the URL before running.

## What Gets Reset

✅ **Reset:**
- All player ratings → 5.0
- `ratingUpdatedAt` timestamp → current time

✅ **Preserved:**
- All `RatingHistory` entries
- All `MatchRating` entries
- All other data (users, sessions, sets, etc.)

## After Reset

- All players will have a rating of 5.0
- New matches will update ratings based on performance
- Ratings will converge to reflect actual skill levels over time
- Historical rating data remains available for reference

## Troubleshooting

**Error: "Admin access required"**
- Make sure you're logged in as an admin user
- Check that your token is valid (not expired)

**Error: "Unauthorized"**
- Your token may have expired
- Log in again and get a new token

**Error: Connection timeout**
- Check your internet connection
- Verify the API endpoint URL is correct
- Try again (Render free tier may have cold starts)

## Related

- [Full Reset Documentation](./RESET_RATINGS.md) - Complete guide with all options
- [Recalculate Ratings](./RECALCULATE_RATINGS.md) - Recalculate using historical data
