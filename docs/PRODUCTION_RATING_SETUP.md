# Production Rating Setup

After deploying to production, you need to calculate historical ratings for all players.

## Option 1: Run via Render Shell (Recommended)

1. **Go to your Render dashboard** → Backend service
2. **Click on "Shell" tab**
3. **Run the following commands:**

```bash
cd backend
npm run prisma:calculate-ratings
```

This will:
- Process all historical sets chronologically
- Calculate UTR ratings for all players
- Create rating history records
- Display a summary of results

## Option 2: Run via SSH/Remote Access

If you have SSH access to your production server:

```bash
# Navigate to your app directory
cd /path/to/your/app/backend

# Run the calculation script
npm run prisma:calculate-ratings
```

## Option 3: Add to Deployment Script (Optional)

If you want to automate this, you can modify your deployment process. However, **be careful** - you typically only want to run this once, not on every deployment.

### For Render (render.yaml)

You could add a post-deploy script, but this would run on every deployment:

```yaml
# NOT RECOMMENDED - would recalculate on every deploy
# Instead, run manually once after initial deployment
```

### Better Approach: One-Time Migration Script

Create a script that checks if ratings have been calculated:

```bash
# backend/scripts/calculate-ratings-once.sh
#!/bin/bash
if [ "$(psql $DATABASE_URL -tAc "SELECT COUNT(*) FROM users WHERE rating IS NOT NULL")" -eq "0" ]; then
  echo "No ratings found. Calculating historical ratings..."
  npm run prisma:calculate-ratings
else
  echo "Ratings already calculated. Skipping."
fi
```

## What the Script Does

The `calculate-historical-ratings.ts` script:

1. **Fetches all sets** ordered by creation date (oldest first)
2. **Processes each set chronologically** to simulate how ratings would have evolved
3. **Calculates UTR ratings** for each player based on their match performance
4. **Updates player ratings** and creates rating history records
5. **Displays a summary** showing:
   - Total users with ratings
   - Average rating
   - Top 10 players by rating

## Expected Output

```
Starting historical rating calculation...
Found X sets to process
Processed 10/X sets...
Processed 20/X sets...

Completed! Processed X sets.

Summary:
- Users with ratings: Y
- Average rating: Z.XX

Top 10 players by rating:
1. Player Name: X.XX
2. Player Name: X.XX
...

Historical rating calculation completed successfully!
```

## Important Notes

- **Run this once** after initial deployment or after importing production data
- **Don't run on every deployment** - it will recalculate all ratings from scratch
- **New sets** will automatically update ratings when created/updated/deleted
- **Safe to re-run** if needed (it recalculates everything), but it may take time with large datasets

## Troubleshooting

### "No ratings found" after running
- Check that sets exist in the database
- Verify the script completed successfully
- Check database connection

### Ratings seem incorrect
- Ratings start at 5.0 and adjust based on performance
- With limited historical data, ratings may be lower initially
- As players continue playing, ratings will stabilize

### Script takes too long
- For large datasets (1000+ sets), consider running during off-peak hours
- The script processes sets sequentially to maintain chronological order
