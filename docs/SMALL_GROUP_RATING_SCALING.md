# Small Group Rating Scaling

## Problem

With a small group of players (~10 players), the UTR rating system tends to cluster ratings in the middle range (4.0-7.0) and rarely utilizes the full spectrum (1.0-16.5). This happens because:

1. **Relative Ratings**: Ratings are relative - if everyone is similar skill, ratings won't diverge much
2. **Low Volatility**: With `ADJUSTMENT_FACTOR = 2.0`, changes are gradual
3. **Even Matchups**: If teams are evenly matched, expected vs actual performance differences are small

## Solution: Dynamic Adjustment Factor

The system now **dynamically adjusts the adjustment factor** based on the number of active players:

### Scaling Formula

```
If players >= 20: Use base factor (2.0)
If players < 20: Scale factor = 2.0 + (5.0 - 2.0) × (1 - players/20)
```

### Examples

| Active Players | Adjustment Factor | Effect |
|----------------|-------------------|--------|
| 5 players | ~4.5 | High volatility - ratings spread quickly |
| 10 players | ~3.5 | Moderate volatility - good spread |
| 15 players | ~2.75 | Slightly increased volatility |
| 20+ players | 2.0 | Standard volatility (base factor) |

### How It Works

1. **Before each match rating calculation**, the system counts active players
2. **Calculates dynamic adjustment factor** based on group size
3. **Applies the factor** to rating changes
4. **Result**: Smaller groups get higher volatility, enabling ratings to spread across the full 1.0-16.5 range

## Benefits

✅ **Full Spectrum Utilization**: Small groups can now reach ratings from 1.0 to 16.5  
✅ **Better Differentiation**: Players in small groups are better differentiated  
✅ **Automatic Scaling**: System adapts automatically as group size changes  
✅ **Maintains Stability**: Large groups still use the stable base factor  

## Example Scenario

**10 Players Starting at 5.0:**

**Without Scaling (Factor 2.0):**
- After 50 matches: Ratings range 4.2 - 5.8 (clustered)
- Top player: ~5.8
- Bottom player: ~4.2

**With Scaling (Factor 3.5):**
- After 50 matches: Ratings range 3.5 - 7.2 (better spread)
- Top player: ~7.2
- Bottom player: ~3.5

**After 200 matches:**
- Ratings range: 2.5 - 9.5 (utilizing more of the spectrum)
- Top player: ~9.5
- Bottom player: ~2.5

## Configuration

The scaling can be adjusted via constants in `ratingService.ts`:

```typescript
const SMALL_GROUP_THRESHOLD = 20; // Groups below this get scaled adjustment
const MIN_ADJUSTMENT_FACTOR = 2.0; // Minimum factor (for large groups)
const MAX_ADJUSTMENT_FACTOR = 5.0; // Maximum factor (for very small groups)
```

### Adjusting for Your Group

**For a group of ~10 players:**
- Current: Factor ~3.5 (good balance)
- More spread: Increase `MAX_ADJUSTMENT_FACTOR` to 6.0
- Less spread: Decrease `MAX_ADJUSTMENT_FACTOR` to 4.0

**For a group of ~5 players:**
- Current: Factor ~4.5
- More spread: Increase `MAX_ADJUSTMENT_FACTOR` to 7.0-8.0

## Monitoring

To see the current adjustment factor being used:

1. Check the database for active player count:
   ```sql
   SELECT COUNT(*) FROM users WHERE rating IS NOT NULL;
   ```

2. Calculate expected factor:
   - If count >= 20: Factor = 2.0
   - If count < 20: Factor = 2.0 + 3.0 × (1 - count/20)

3. Check rating distribution:
   ```sql
   SELECT 
     MIN(rating) as min_rating,
     MAX(rating) as max_rating,
     AVG(rating) as avg_rating,
     MAX(rating) - MIN(rating) as range
   FROM users 
   WHERE rating IS NOT NULL;
   ```

## Future Enhancements

Potential improvements:

1. **Percentile-Based Normalization**: Periodically normalize ratings to use full range
2. **Skill Gap Amplification**: Detect skill gaps and amplify them
3. **Adaptive Thresholds**: Automatically adjust thresholds based on rating distribution
4. **Group Size History**: Track group size over time for better scaling

## Related Documentation

- [UTR Rating System](./UTR_RATING_SYSTEM.md) - Complete rating system overview
- [UTR Calculation Example](./UTR_CALCULATION_EXAMPLE.md) - Step-by-step examples
- [Rating Volatility Fix](./UTR_RATING_VOLATILITY_FIX.md) - Why factor was reduced
