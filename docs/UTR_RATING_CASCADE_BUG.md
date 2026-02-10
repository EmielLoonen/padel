# UTR Rating Cascade Bug: Why Ratings Drop to ~1.0

## Problem

After recalculating ratings, most players' ratings drop to near 1.0 (the minimum), even though the chronological processing fix was applied.

## Root Cause

The issue was in the **historical recalculation script**, not the rating calculation function itself. The script had a critical flaw:

### The Cascade Effect

1. **Script processes sets chronologically** ✅ (correct)
2. **For each set, it recalculates ratings for all players** ✅ (correct)
3. **BUT**: When calculating a player's match rating, it uses opponents' **CURRENT ratings from the database** ❌ (wrong!)

### Why This Causes Ratings to Drop

**Example Scenario:**

1. **Set 1** (oldest): Players A, B, C, D play
   - All start at 5.0
   - Player A loses badly → rating drops to 3.0
   - Database updated: A=3.0, B=5.0, C=5.0, D=5.0

2. **Set 2** (newer): Players A, E, F, G play
   - Script recalculates Player A's rating
   - Uses Player A's historical rating (3.0) ✅
   - BUT uses Players E, F, G's **CURRENT ratings from database**
   - If E, F, G have already been recalculated and are low (e.g., 1.5), then:
     - Player A's expected win % against team with rating 1.5 is very high (~90%)
     - If Player A loses or performs poorly, actual performance is much worse than expected
     - Player A's rating drops further (e.g., to 2.0)

3. **Set 3**: Same issue repeats, ratings continue to drop
4. **Eventually**: All ratings cascade down to ~1.0

### The Feedback Loop

```
Player A's rating drops → Used as opponent rating for Player B
Player B's expected win % becomes too high → Player B performs worse than expected
Player B's rating drops → Used as opponent rating for Player C
...and so on
```

## Solution

The fix processes **ALL sets chronologically** and tracks **ALL players' ratings** as we go:

1. **Initialize all players** to 5.0
2. **Process sets chronologically** (oldest first)
3. **For each set:**
   - Get all players' ratings **BEFORE this match** (from our tracked map)
   - Calculate match ratings using these historical ratings
   - Update tracked ratings for use in next matches
4. **At the end:** Calculate final weighted averages and update database

### Key Changes

**Before (Buggy):**
```typescript
// Process sets chronologically
for (const set of sets) {
  // Recalculate each player independently
  await recalculateRatingsForSet(set.id);
  // This uses opponents' CURRENT database ratings ❌
}
```

**After (Fixed):**
```typescript
// Track all players' ratings as we go
const playerRatings = new Map<string, number>();

// Process sets chronologically
for (const set of sets) {
  // Get historical ratings for all players BEFORE this match
  const opponentRatingsAtMatchTime = new Map();
  userIds.forEach(userId => {
    opponentRatingsAtMatchTime.set(userId, playerRatings.get(userId));
  });
  
  // Calculate match ratings using historical ratings ✅
  const matchRatingData = await calculateMatchRating(
    userId,
    set,
    playerRatingBeforeMatch,
    opponentRatingsAtMatchTime  // ✅ Use historical ratings
  );
  
  // Update tracked ratings for next matches
  playerRatings.set(userId, newRating);
}
```

## Additional Fix

Also fixed a bug in `calculateMatchRating` where it used `playerRating` instead of `playerRatingAtMatchTime`:

```typescript
// Before (buggy):
const matchRating = playerRating + performanceDiff * ADJUSTMENT_FACTOR;

// After (fixed):
const matchRating = playerRatingAtMatchTime + performanceDiff * ADJUSTMENT_FACTOR;
```

## Testing the Fix

After running the updated script, you should see:

- **Ratings in reasonable ranges** (typically 3.0-7.0 for recreational players)
- **No players stuck at 1.0** (unless they truly performed very poorly)
- **Ratings reflect actual performance** relative to opponents

## Running the Fixed Script

```bash
cd backend
pnpm prisma:calculate-ratings
```

Or via API:
```bash
POST /api/ratings/calculate-historical
```

## Expected Results

After recalculation:
- Average rating should be around 4.0-5.5 (depending on your group's skill level)
- Ratings should be distributed across a range (not all clustered at 1.0)
- Better players should have higher ratings
- Ratings should stabilize after a few matches

## Related Documentation

- [UTR Rating Bug Fix](./UTR_RATING_BUG_FIX.md) - Original chronological processing fix
- [Recalculate Ratings](./RECALCULATE_RATINGS.md) - How to run the recalculation script
- [UTR Rating System](./UTR_RATING_SYSTEM.md) - How the rating system works
