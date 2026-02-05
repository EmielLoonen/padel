# UTR Rating Bug Fix: Ratings Dropping to ~1.0

## Problem

Players' ratings were dropping to near 1.0 (the minimum) due to a critical bug in the rating calculation algorithm.

## Root Cause

The `calculatePlayerRating` function had a fundamental flaw:

1. **It processed matches in reverse chronological order** (newest first)
2. **It used the player's CURRENT rating** for all historical matches
3. This created a **feedback loop**:
   - Player starts at 5.0 (default)
   - They lose a match → rating drops to 4.0
   - When recalculating older matches, those matches now use 4.0 instead of 5.0
   - This makes their historical performance look worse than it actually was
   - Rating drops further
   - Eventually hits the minimum of 1.0

### Example of the Bug

**Scenario:**
- Player starts at 5.0
- Match 1 (oldest): Player loses badly → rating should drop to 4.0
- Match 2 (newer): Player plays okay → rating should stay around 4.0

**With the bug:**
1. Process Match 2 first (newest): Uses current rating 4.0 → calculates rating 4.0
2. Process Match 1 (oldest): Uses current rating 4.0 → calculates rating 3.0 (because historical performance looks worse)
3. Overall rating = 3.5
4. Next recalculation: Match 2 uses 3.5 → calculates 3.5, Match 1 uses 3.5 → calculates 2.5
5. Rating continues to drop → eventually hits 1.0

**Correct behavior:**
1. Process Match 1 first (oldest): Uses starting rating 5.0 → calculates rating 4.0
2. Process Match 2 (newer): Uses rating 4.0 (from after Match 1) → calculates rating 4.0
3. Overall rating = 4.0 (weighted average)
4. Rating stabilizes correctly

## Solution

The fix processes matches **chronologically** (oldest first) and uses the player's rating **BEFORE each match**:

1. **Process matches chronologically** (oldest first)
2. **Start with DEFAULT_RATING (5.0)** for the first match
3. **For each match:**
   - Use the player's rating BEFORE that match
   - Calculate the match rating based on actual vs expected performance
   - Use that match rating as the baseline for the next match
4. **Calculate weighted average** of all match ratings (with recency weighting)

### Key Changes

1. Changed match ordering from `'desc'` (newest first) to `'asc'` (oldest first)
2. Track player's rating chronologically as we process matches
3. Use historical rating (before match) instead of current rating
4. Calculate weighted average at the end

## Code Changes

### Before (Buggy)
```typescript
orderBy: {
  set: {
    createdAt: 'desc', // NEWEST FIRST - WRONG!
  },
}

// Uses current rating for all matches
const playerRating = await getPlayerRating(userId);
const matchRatingData = await calculateMatchRating(userId, set, playerRating);
```

### After (Fixed)
```typescript
orderBy: {
  set: {
    createdAt: 'asc', // OLDEST FIRST - CORRECT!
  },
}

// Track rating chronologically
let playerRatingBeforeMatch = DEFAULT_RATING;
for (const match of matches) {
  const matchRatingData = await calculateMatchRating(
    userId, 
    set, 
    playerRatingBeforeMatch // Use rating BEFORE match
  );
  playerRatingBeforeMatch = matchRatingData.matchRating; // Update for next match
}
```

## Impact

- **Before fix**: Ratings dropped to ~1.0 due to feedback loop
- **After fix**: Ratings calculate correctly based on actual historical performance
- **Note**: Existing players with low ratings will need to have their ratings recalculated using the historical calculation script

## Next Steps

1. **Recalculate all historical ratings** using the fixed algorithm:
   ```bash
   # Via API endpoint (recommended for production)
   POST /api/ratings/calculate-historical
   ```

2. **Verify ratings** are now in reasonable ranges (typically 3.0-7.0 for recreational players)

3. **Monitor** that new matches update ratings correctly

## Technical Notes

- The fix uses an approximation for opponent ratings (current ratings) which is acceptable for real-time updates
- For perfect historical accuracy, all players' ratings should be recalculated simultaneously chronologically (which the historical calculation script does)
- The weighted average calculation remains the same - only the match rating calculation order changed
