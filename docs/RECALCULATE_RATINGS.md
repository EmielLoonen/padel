# Recalculate Historical Ratings

This guide explains how to recalculate all player ratings using the fixed UTR algorithm that processes matches chronologically.

## Overview

The rating calculation script will:
1. **Reset all player ratings** to the default (5.0)
2. **Clear rating history** and match ratings
3. **Process all sets chronologically** (oldest first)
4. **Recalculate ratings** for all players using the fixed algorithm
5. **Display summary statistics** including top/bottom players

## When to Use

Use this script when:
- After deploying the rating calculation bug fix
- Ratings seem incorrect (e.g., all players at ~1.0)
- You want to recalculate ratings from scratch
- After importing historical match data

## Running the Script

### Option 1: Local Development (Recommended for Testing)

```bash
cd backend
pnpm prisma:calculate-ratings
```

Or directly with tsx:

```bash
cd backend
pnpm tsx prisma/calculate-historical-ratings.ts
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

2. **Call the historical rating calculation endpoint:**
   ```bash
   curl -X POST https://your-backend-url.onrender.com/api/ratings/calculate-historical \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/json"
   ```

   Or using browser console:
   ```javascript
   fetch('https://your-backend-url.onrender.com/api/ratings/calculate-historical', {
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

## What the Script Does

### Step 1: Reset Ratings
- Sets all player ratings to 5.0 (default)
- Updates `ratingUpdatedAt` timestamp

### Step 2: Clear History
- Deletes all `RatingHistory` entries
- Deletes all `MatchRating` entries
- Ensures a clean slate for recalculation

### Step 3: Process Sets Chronologically
- Fetches all sets ordered by creation date (oldest first)
- For each set:
  - Identifies all players in the set
  - Recalculates ratings for all affected players
  - Uses the fixed algorithm that processes matches chronologically

### Step 4: Display Results
- Summary statistics (count, average, min, max)
- Top 10 players by rating
- Bottom 5 players by rating (to verify ratings aren't stuck at minimum)

## Expected Output

```
Starting historical rating calculation...
⚠️  This will reset all player ratings and recalculate from scratch.

Step 1: Resetting all player ratings to default (5.0)...
✓ Reset 15 player ratings to 5.0

Step 2: Clearing existing rating history...
✓ Deleted 234 rating history entries

Step 3: Clearing existing match ratings...
✓ Deleted 234 match rating entries

Step 4: Fetching all sets chronologically...
✓ Found 78 sets to process

Step 5: Processing sets chronologically...
  Processed 10/78 sets (2.3s)...
  Processed 20/78 sets (4.1s)...
  ...
  Processed 78/78 sets (12.5s)...

✓ Completed! Processed 78 sets in 12.5s.

Step 6: Calculating summary statistics...

📊 Summary Statistics:
   Users with ratings: 15
   Average rating: 4.85
   Minimum rating: 3.21
   Maximum rating: 6.47

🏆 Top 10 players by rating:
   1. Player A: 6.47
   2. Player B: 5.92
   ...

📉 Bottom 5 players by rating:
   1. Player X: 3.21
   2. Player Y: 3.45
   ...

Historical rating calculation completed successfully!
```

## Important Notes

⚠️ **Warning**: This script will **overwrite all existing ratings**. Make sure you want to recalculate from scratch before running.

- **Processing time**: Depends on number of sets (typically 1-2 seconds per 10 sets)
- **Safe to re-run**: You can run this script multiple times - it will reset and recalculate each time
- **No data loss**: Only affects ratings, not match data or user accounts
- **Idempotent**: Running multiple times produces the same results

## Troubleshooting

### "Database connection error"
- Ensure your database is running
- Check `DATABASE_URL` in `.env` file
- Verify database credentials

### "Ratings still showing ~1.0 after recalculation"
- Check that the fix has been deployed
- Verify the script completed successfully
- Check server logs for errors during processing

### "Request times out" (API endpoint)
- For large datasets, the request may take longer than typical timeout limits
- Consider running during off-peak hours
- The calculation continues on the server even if the request times out
- Check server logs to verify completion

### "Unauthorized" error (API endpoint)
- Make sure you're using a valid admin authentication token
- Token might have expired - log in again to get a new token
- Verify you're calling the correct endpoint URL

## Verification

After running the script, verify:

1. **Ratings are in reasonable ranges** (typically 3.0-7.0 for recreational players)
2. **No players stuck at 1.0** (minimum rating)
3. **Ratings reflect performance** (better players have higher ratings)
4. **New matches update ratings correctly** (test by creating a new set)

## Related Documentation

- [UTR Rating System](./UTR_RATING_SYSTEM.md) - How ratings are calculated
- [UTR Rating Bug Fix](./UTR_RATING_BUG_FIX.md) - Explanation of the bug and fix
- [Update Ratings via API](./UPDATE_RATINGS_VIA_API.md) - Alternative method using API
