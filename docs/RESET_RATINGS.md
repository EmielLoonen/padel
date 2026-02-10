# Reset All Ratings to 5.0

This guide explains how to reset all player ratings to 5.0 and clear all historical rating data, giving you a fresh start.

## Overview

The reset operation will:
1. **Set all player ratings to 5.0** (default starting rating)
2. **Preserve all historical data** (RatingHistory and MatchRating tables remain intact)

After resetting, ratings will be calculated from **new matches going forward**. Historical rating data is preserved for reference but won't affect future rating calculations.

## When to Use

Use this when:
- You want to reset ratings to 5.0 but keep historical records
- Ratings seem incorrect and you want a fresh start
- You're implementing a new rating system but want to preserve old data
- You want to test the rating system from scratch while keeping history

## Running the Reset

### Option 1: Local Development (Recommended for Testing)

```bash
cd backend
pnpm prisma:reset-ratings
```

Or directly with tsx:

```bash
cd backend
pnpm tsx prisma/reset-ratings.ts
```

### Option 2: Production (via API Endpoint)

Since Render's free plan doesn't include shell access, use the HTTP endpoint:

1. **Get your authentication token:**
   - Log in to your app
   - Open browser DevTools → Application/Storage → Local Storage
   - Copy the `token` value

   OR use the login API:
   ```bash
   curl -X POST https://your-backend-url.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your-email@example.com","password":"your-password"}'
   ```

2. **Call the reset endpoint (admin only):**
   ```bash
   curl -X POST https://your-backend-url.onrender.com/api/ratings/reset \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/json"
   ```

   Or using browser console:
   ```javascript
   fetch('https://your-backend-url.onrender.com/api/ratings/reset', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${localStorage.getItem('token')}`,
       'Content-Type': 'application/json'
     }
   })
   .then(res => res.json())
   .then(data => console.log(data))
   .catch(err => console.error('Error:', err));
   ```

## Expected Output

```
Resetting all ratings to 5.0...
ℹ️  Historical rating data will be preserved.

Resetting all player ratings to 5.0...
✓ Reset X player ratings to 5.0

✅ Reset complete!
   X players now have a rating of 5.0
   Historical data preserved:
   - X rating history entries
   - X match rating entries

📝 Next steps:
   - Ratings will be calculated from new matches going forward
   - Each match will update player ratings based on performance
   - Ratings will converge to reflect actual skill levels over time
   - Historical data remains available for reference
```

## What Happens After Reset

1. **All players start at 5.0** - This is the default starting rating
2. **New matches update ratings** - As players compete, their ratings will adjust based on performance
3. **Ratings converge over time** - After several matches, ratings will reflect actual skill levels
4. **Historical data preserved** - Old rating history and match ratings remain in the database for reference

## Important Notes

✅ **Historical data is preserved** - Rating history and match ratings remain in the database for reference.

✅ **Safe to run multiple times** - You can reset ratings as many times as needed without losing historical data.

🔒 **Admin only** - The API endpoint requires admin authentication for security.

💡 **To clear historical data** - If you need to clear historical data as well, you would need to manually delete from the `RatingHistory` and `MatchRating` tables, or modify the script.

## Related Documentation

- [Recalculate Ratings](./RECALCULATE_RATINGS.md) - How to recalculate ratings using historical data
- [UTR Rating System](./UTR_RATING_SYSTEM.md) - How the rating system works
- [Rating Update Verification](./RATING_UPDATE_VERIFICATION.md) - Verification of rating update mechanism
