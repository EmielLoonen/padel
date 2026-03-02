# Recalculate Ratings with Dynamic Adjustment Factor

This guide explains how to recalculate all player ratings using the new dynamic adjustment factor system that adapts to your group size.

## What's New

The rating system now uses a **dynamic adjustment factor** that scales based on your group size:

- **20+ players**: Uses base factor of **2.0** (stable ratings)
- **~10 players**: Uses factor of **~3.5** (moderate volatility for better spread)
- **~5 players**: Uses factor of **~4.5** (higher volatility to utilize full rating range)

This ensures that small groups can utilize the full 1.0-16.5 rating spectrum, while large groups maintain stable ratings.

## Running the Script

### Option 1: Local Development

```bash
cd backend
pnpm prisma:calculate-ratings
```

Or directly:

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
     -d '{"email":"your-admin-email@example.com","password":"your-password"}'
   ```

2. **Call the endpoint:**
   ```bash
   curl -X POST https://your-backend-url.onrender.com/api/ratings/calculate-historical \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/json"
   ```

   Or from browser console:
   ```javascript
   fetch('/api/ratings/calculate-historical', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${localStorage.getItem('token')}`,
       'Content-Type': 'application/json'
     }
   })
   .then(res => res.json())
   .then(data => {
     console.log('Recalculation complete:', data);
     console.log('Top players:', data.summary.topPlayers);
   })
   .catch(err => console.error('Error:', err));
   ```

## What the Script Does

1. **Resets all ratings** to 5.0
2. **Clears rating history** and match ratings
3. **Shows adjustment factor** being used based on your group size
4. **Processes all sets chronologically** (oldest first)
5. **Recalculates ratings** using the dynamic adjustment factor
6. **Displays summary statistics** including:
   - Rating range utilization (% of full 1.0-16.5 range used)
   - Top 10 players
   - Bottom 5 players
   - Min/Max/Average ratings

## Expected Output

```
Starting historical rating calculation...
⚠️  This will reset all player ratings and recalculate from scratch.
📊 Uses dynamic adjustment factor based on group size for better rating spread.

Step 1: Resetting all player ratings to default (5.0)...
✓ Reset 10 player ratings to 5.0

Step 2: Clearing existing rating history...
✓ Deleted 234 rating history entries

Step 3: Clearing existing match ratings...
✓ Deleted 234 match rating entries

Step 4: Fetching all sets chronologically...
✓ Found 78 sets to process
   Using dynamic adjustment factor: 3.50 (10 players - small group scaling enabled)

Step 5: Processing sets chronologically with proper historical tracking...
  Processed 10/78 sets (2.3s)...
  Processed 20/78 sets (4.1s)...
  ...

Step 5b: Calculating final weighted averages...

✓ Completed! Processed 78 sets in 12.5s.

Step 6: Calculating summary statistics...

📊 Summary Statistics:
   Users with ratings: 10
   Average rating: 5.12
   Minimum rating: 3.45
   Maximum rating: 7.89
   Rating range: 4.44 (28.6% of full 1.0-16.5 range)

🏆 Top 10 players by rating:
   1. Player A: 7.89
   2. Player B: 7.23
   ...

📉 Bottom 5 players by rating:
   1. Player X: 3.45
   2. Player Y: 3.67
   ...
```

## Understanding the Results

### Rating Range Utilization

The script shows what percentage of the full 1.0-16.5 range is being used:

- **< 20%**: Ratings are clustered - consider increasing `MAX_ADJUSTMENT_FACTOR`
- **20-40%**: Good spread for small groups
- **40-60%**: Excellent utilization
- **> 60%**: Very wide spread (may be too volatile)

### For ~10 Players

With the default settings, you should see:
- **Rating range**: 3-4 points (e.g., 3.5-7.5)
- **Range utilization**: 20-30% of full range
- **Top players**: Can reach 7.0-8.0+
- **Bottom players**: Can drop to 3.0-4.0

### Adjusting for Your Group

If you want more spread, edit `backend/src/services/ratingService.ts`:

```typescript
const MAX_ADJUSTMENT_FACTOR = 5.0; // Increase to 6.0-7.0 for more spread
```

Then rerun the script.

## After Recalculation

- All ratings are recalculated from scratch using historical data
- Ratings use the dynamic adjustment factor appropriate for your group size
- Rating history and match ratings are cleared (fresh start)
- New matches will continue to use the dynamic adjustment factor

## Related Documentation

- [Small Group Rating Scaling](./SMALL_GROUP_RATING_SCALING.md) - Details on dynamic adjustment factor
- [UTR Rating System](./UTR_RATING_SYSTEM.md) - Complete rating system overview
- [Rating Volatility Fix](./UTR_RATING_VOLATILITY_FIX.md) - Why factor was reduced
