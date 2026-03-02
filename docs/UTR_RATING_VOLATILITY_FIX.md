# UTR Rating Volatility Fix

## Problem

After entering match scores where Team A won decisively (6-2, 7-5, 5-3), Team A players' ratings were **decreasing** instead of increasing. For example:
- Team A players dropped from 5.0 to ~3.4
- Team B players dropped from 5.0 to ~3.5

This was counterintuitive and incorrect behavior.

## Root Cause

The issue was caused by two factors:

### 1. Sets Processed Individually

Each set in a match is processed **individually**, and ratings are updated **after each set**. This creates a cascading effect:

**Set 1: 6-2**
- Both teams start at 5.0
- Expected win %: 50%
- Actual win %: 75% (6/8)
- Performance diff: +25%
- Rating change: +25% × 8.0 = **+2.0**
- **New Team A rating: 7.0**
- **New Team B rating: 3.0**

**Set 2: 7-5** (Team A now at 7.0, Team B at 3.0)
- Expected win % for Team A: ~97.6% (due to large rating gap)
- Actual win %: 58.3% (7/12)
- Performance diff: 58.3% - 97.6% = **-39.3%**
- Rating change: -39.3% × 8.0 = **-3.144**
- **New Team A rating: 7.0 - 3.144 = 3.856**

**Set 3: 5-3**
- Continues the downward spiral

### 2. ADJUSTMENT_FACTOR Too High

The `ADJUSTMENT_FACTOR` of **8.0** was causing massive rating swings. When combined with individual set processing, this created extreme volatility:
- A single set could change ratings by ±2.0 points
- After one set, the rating gap becomes so large that the next set's expectations become unrealistic
- Teams that win but don't meet inflated expectations get penalized heavily

## Solution

### Immediate Fix: Reduce ADJUSTMENT_FACTOR

Changed `ADJUSTMENT_FACTOR` from **8.0** to **2.0**:

```typescript
const ADJUSTMENT_FACTOR = 2.0; // Reduced from 8.0 to prevent volatility
```

This reduces the impact of each set:
- Set 1: +25% × 2.0 = +0.5 (instead of +2.0)
- Set 2: -39.3% × 2.0 = -0.786 (instead of -3.144)

### Expected Behavior After Fix

**Set 1: 6-2**
- Rating change: +25% × 2.0 = **+0.5**
- New Team A rating: 5.5
- New Team B rating: 4.5

**Set 2: 7-5** (Team A at 5.5, Team B at 4.5)
- Expected win %: ~60% (more reasonable gap)
- Actual win %: 58.3%
- Performance diff: -1.7%
- Rating change: -1.7% × 2.0 = **-0.034**
- New Team A rating: 5.466

**Set 3: 5-3**
- Continues with more stable ratings

**Final Result:** Team A players should end up around **5.3-5.5** (slight increase), Team B around **4.5-4.7** (slight decrease).

## Future Improvements

### Option 1: Group Sets into Matches

Process all sets from the same court created within a short time window (e.g., 30 minutes) as a **single match**:
- Calculate combined game totals across all sets
- Apply rating adjustment once per match, not per set
- Prevents cascading effects

### Option 2: Use Match-Level Expected Win Percentage

Instead of calculating expected win % per set, calculate it once for the entire match based on initial ratings, then compare actual performance across all sets.

### Option 3: Progressive Weighting

Weight sets within a match differently:
- First set: Full weight (establishes baseline)
- Subsequent sets: Reduced weight (refinements)
- Prevents over-correction

## Testing

After this fix, test with:
1. **Decisive win:** Team A wins 6-2, 7-5, 5-3 → Team A ratings should **increase**
2. **Close match:** Team A wins 7-5, 6-7, 6-4 → Ratings should change minimally
3. **Upset:** Lower-rated team wins → Ratings should adjust appropriately

## Related Files

- `backend/src/services/ratingService.ts` - Rating calculation logic
- `docs/UTR_CALCULATION_EXAMPLE.md` - Example calculations (needs update for new factor)
