# UTR Rating System Documentation

## Overview

The Universal Tennis Rating (UTR) system provides a standardized way to measure player skill levels on a scale from 1.00 to 16.50. This system automatically calculates and updates player ratings based on their match performance in doubles games.

## Key Concepts

- **Rating Scale**: 1.00 (beginner) to 16.50 (professional)
- **Default Rating**: New players start at 5.0
- **Automatic Updates**: Ratings update automatically when sets are created, updated, or deleted
- **Historical Data**: Only considers matches from the past 12 months (up to 30 most recent matches)
- **Weighted System**: Recent matches and competitive matches carry more weight

## How UTR is Calculated

The UTR rating is calculated through a multi-step process that considers:
1. Expected performance vs actual performance
2. Match competitiveness (how close the score was)
3. Match format (number of games played)
4. Recency (more recent matches matter more)

---

## Step-by-Step Calculation Process

### Step 1: Calculate Expected Win Percentage

Before a match, we calculate how likely a player is to win based on their current rating and their opponent's rating.

**Formula:**
```
expectedWinPct = 1 / (1 + 10^((opponentRating - playerRating) / 2.5))
```

**For Doubles Matches:**
- Calculate team rating as the average of the two players' ratings
- Player's team rating = (player1Rating + player2Rating) / 2
- Opponent team rating = (opponent1Rating + opponent2Rating) / 2
- Use team ratings in the formula above

#### Example 1: Expected Win Percentage

**Scenario:**
- Player A rating: 5.0
- Player B rating (teammate): 4.5
- Player C rating (opponent): 6.0
- Player D rating (opponent): 5.5

**Calculation:**
1. Team A rating = (5.0 + 4.5) / 2 = **4.75**
2. Team B rating = (6.0 + 5.5) / 2 = **5.75**
3. Rating difference = 5.75 - 4.75 = **1.0**
4. Exponent = 1.0 / 2.5 = **0.4**
5. Expected win % = 1 / (1 + 10^0.4) = 1 / (1 + 2.512) = **0.285 (28.5%)**

**Interpretation:** Team A is expected to win approximately 28.5% of games against Team B.

---

### Step 2: Calculate Match Rating

After a match, we calculate a new rating based on how the player actually performed compared to expectations.

**Formula:**
```
matchRating = playerRating + (actualWinPct - expectedWinPct) × ADJUSTMENT_FACTOR
```

Where:
- `actualWinPct` = games won / total games played
- `expectedWinPct` = calculated from Step 1
- `ADJUSTMENT_FACTOR` = 8.0 (controls how much ratings change per match)

**Rating Bounds:**
- Minimum: 1.0
- Maximum: 16.5
- Ratings are clamped to these bounds

#### Example 2: Match Rating Calculation

**Continuing from Example 1:**

**Match Result:**
- Team A won 6 games
- Team B won 4 games
- Total games: 10

**Calculation:**
1. Actual win % = 6 / 10 = **0.60 (60%)**
2. Expected win % = **0.285 (28.5%)**
3. Performance difference = 0.60 - 0.285 = **0.315**
4. Match rating adjustment = 0.315 × 8.0 = **2.52**
5. New match rating for Player A = 5.0 + 2.52 = **7.52**

**Interpretation:** Player A performed much better than expected (60% vs 28.5%), so their rating increases significantly.

#### Example 3: Underperformance

**Same scenario, different result:**

**Match Result:**
- Team A won 2 games
- Team B won 6 games
- Total games: 8

**Calculation:**
1. Actual win % = 2 / 8 = **0.25 (25%)**
2. Expected win % = **0.285 (28.5%)**
3. Performance difference = 0.25 - 0.285 = **-0.035**
4. Match rating adjustment = -0.035 × 8.0 = **-0.28**
5. New match rating for Player A = 5.0 - 0.28 = **4.72**

**Interpretation:** Player A performed slightly worse than expected, so their rating decreases slightly.

---

### Step 3: Calculate Match Weight

Not all matches are equally important. The system weights matches based on:
- **Competitiveness**: Closer matches get higher weight
- **Format**: Longer matches (more games) get higher weight

**Competitiveness Factor:**
```
competitivenessFactor = max(0.5, 1.0 - |scoreDiff| / 12.0)
```
- Score difference of 0 games = 1.0 (maximum weight)
- Score difference of 6+ games = 0.5 (minimum weight)
- Closer matches are more indicative of true skill

**Format Factor:**
```
formatFactor = min(1.5, 0.5 + totalGames / 20.0)
```
- 10 games = 1.0 (baseline)
- 20+ games = 1.5 (maximum weight)
- Longer matches provide more data points

**Total Match Weight:**
```
matchWeight = baseWeight × competitivenessFactor × formatFactor
```
- Base weight: 1.0
- Typical range: 0.5 to 1.5

#### Example 4: Match Weight Calculation

**Scenario A: Close Match**
- Score: 6-4 (score difference = 2, total games = 10)

**Calculation:**
1. Competitiveness factor = max(0.5, 1.0 - 2/12) = max(0.5, 0.833) = **0.833**
2. Format factor = min(1.5, 0.5 + 10/20) = min(1.5, 1.0) = **1.0**
3. Match weight = 1.0 × 0.833 × 1.0 = **0.833**

**Scenario B: Blowout Match**
- Score: 6-0 (score difference = 6, total games = 6)

**Calculation:**
1. Competitiveness factor = max(0.5, 1.0 - 6/12) = max(0.5, 0.5) = **0.5**
2. Format factor = min(1.5, 0.5 + 6/20) = min(1.5, 0.8) = **0.8**
3. Match weight = 1.0 × 0.5 × 0.8 = **0.4**

**Scenario C: Long Competitive Match**
- Score: 6-5 (score difference = 1, total games = 11)

**Calculation:**
1. Competitiveness factor = max(0.5, 1.0 - 1/12) = max(0.5, 0.917) = **0.917**
2. Format factor = min(1.5, 0.5 + 11/20) = min(1.5, 1.05) = **1.05**
3. Match weight = 1.0 × 0.917 × 1.05 = **0.963**

**Interpretation:** Close, longer matches carry more weight in the rating calculation.

---

### Step 4: Calculate Recency Weight

More recent matches are weighted higher than older matches.

**Formula:**
```
recencyWeight = 1.0 - (daysSinceMatch / 365)
```

Where:
- Matches older than 365 days are not considered (weight = 0)
- Today's match: weight = 1.0
- 6 months ago: weight ≈ 0.5
- 12 months ago: weight = 0.0 (excluded)

#### Example 5: Recency Weight

**Match Dates:**
- Match 1: Today → recency weight = **1.0**
- Match 2: 3 months ago (90 days) → recency weight = 1.0 - (90/365) = **0.753**
- Match 3: 6 months ago (180 days) → recency weight = 1.0 - (180/365) = **0.507**
- Match 4: 9 months ago (270 days) → recency weight = 1.0 - (270/365) = **0.260**
- Match 5: 13 months ago (390 days) → recency weight = **0.0** (excluded)

---

### Step 5: Calculate Overall UTR Rating

The final UTR rating is a weighted average of recent match ratings.

**Formula:**
```
UTR = Σ(matchRating × matchWeight × recencyWeight) / Σ(matchWeight × recencyWeight)
```

**Process:**
1. Get up to 30 most recent matches from past 12 months
2. For each match:
   - Calculate match rating (Step 2)
   - Get match weight (Step 3)
   - Get recency weight (Step 4)
3. Calculate weighted average

#### Example 6: Complete UTR Calculation

**Player's Match History:**

| Match | Date | Match Rating | Match Weight | Recency Weight | Contribution |
|-------|------|--------------|--------------|----------------|--------------|
| 1 | Today | 6.0 | 1.0 | 1.0 | 6.0 × 1.0 × 1.0 = **6.0** |
| 2 | 1 month ago | 5.5 | 0.8 | 0.917 | 5.5 × 0.8 × 0.917 = **4.03** |
| 3 | 2 months ago | 5.0 | 1.2 | 0.836 | 5.0 × 1.2 × 0.836 = **5.02** |
| 4 | 3 months ago | 4.8 | 0.9 | 0.753 | 4.8 × 0.9 × 0.753 = **3.25** |

**Calculation:**
1. Weighted sum = 6.0 + 4.03 + 5.02 + 3.25 = **18.30**
2. Total weight = (1.0 × 1.0) + (0.8 × 0.917) + (1.2 × 0.836) + (0.9 × 0.753)
   = 1.0 + 0.734 + 1.003 + 0.678 = **3.415**
3. UTR = 18.30 / 3.415 = **5.36**

**Final Rating:** 5.36

---

## Complete Example: Full Match Flow

Let's walk through a complete example from start to finish.

### Initial State
- **Player A**: Rating = 5.0 (new player, default rating)
- **Player B**: Rating = 4.5
- **Player C**: Rating = 6.0
- **Player D**: Rating = 5.5

### Match Details
- **Date**: Today
- **Result**: Team A (A+B) wins 6-4 against Team B (C+D)
- **Total games**: 10

### Step-by-Step Calculation for Player A

#### Step 1: Expected Win Percentage
- Team A rating = (5.0 + 4.5) / 2 = **4.75**
- Team B rating = (6.0 + 5.5) / 2 = **5.75**
- Expected win % = 1 / (1 + 10^((5.75-4.75)/2.5)) = **0.285 (28.5%)**

#### Step 2: Match Rating
- Actual win % = 6 / 10 = **0.60 (60%)**
- Performance difference = 0.60 - 0.285 = **0.315**
- Match rating = 5.0 + (0.315 × 8.0) = **7.52**

#### Step 3: Match Weight
- Score difference = |6 - 4| = **2**
- Competitiveness factor = max(0.5, 1.0 - 2/12) = **0.833**
- Format factor = min(1.5, 0.5 + 10/20) = **1.0**
- Match weight = 1.0 × 0.833 × 1.0 = **0.833**

#### Step 4: Recency Weight
- Days since match = 0
- Recency weight = 1.0 - (0/365) = **1.0**

#### Step 5: Overall UTR (if this is Player A's first match)
- Since this is the first match, UTR = match rating = **7.52**
- However, this will be clamped to reasonable bounds if needed

### After Multiple Matches

After Player A plays more matches, their UTR will be calculated as a weighted average:

**Match History:**
1. Match 1 (today): matchRating=7.52, weight=0.833, recency=1.0 → contribution = **6.26**
2. Match 2 (1 week ago): matchRating=6.0, weight=0.9, recency=0.981 → contribution = **5.30**
3. Match 3 (2 weeks ago): matchRating=5.5, weight=1.0, recency=0.962 → contribution = **5.29**

**New UTR:**
- Weighted sum = 6.26 + 5.30 + 5.29 = **16.85**
- Total weight = (0.833 × 1.0) + (0.9 × 0.981) + (1.0 × 0.962) = **2.70**
- UTR = 16.85 / 2.70 = **6.24**

---

## Special Cases

### New Players
- Start with default rating of **5.0**
- After first few matches, ratings adjust based on performance
- If they perform better than expected → rating increases
- If they perform worse than expected → rating decreases

### Guest Players
- Guest players (not registered users) don't have persistent ratings
- Temporary rating = average rating of other registered players in the match
- This allows fair calculations for the match
- Rating is not saved or persisted

**Example:**
- Match has 3 registered players: ratings 5.0, 4.5, 6.0
- Guest player temporary rating = (5.0 + 4.5 + 6.0) / 3 = **5.17**

### Tied Sets (5-5, 6-6, etc.)
- Tied sets are valid and included in calculations
- Both teams get the same score, so actual win % = 0.5 (50%)
- Rating adjustments depend on expected win percentage

**Example:**
- Player A (rating 5.0) and teammate (rating 4.5) tie 5-5 against opponents (ratings 6.0 and 5.5)
- Team A expected win % = 28.5%
- Actual win % = 50%
- Performance difference = 0.50 - 0.285 = 0.215
- Match rating = 5.0 + (0.215 × 8.0) = **6.72**

---

## Rating Update Triggers

Ratings are automatically recalculated when:
- A new set is created
- An existing set is updated (scores changed)
- A set is deleted

When a set changes:
1. System identifies all affected players (registered users only)
2. For each player:
   - Fetches their last 30 matches from past 12 months
   - Recalculates match ratings for each match
   - Calculates new overall UTR rating
3. Updates player's rating in database
4. Creates rating history entry

---

## Key Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `DEFAULT_RATING` | 5.0 | Starting rating for new players |
| `MIN_RATING` | 1.0 | Minimum possible rating |
| `MAX_RATING` | 16.5 | Maximum possible rating |
| `RATING_DIFF_DIVISOR` | 2.5 | Controls sensitivity of expected win % to rating differences |
| `ADJUSTMENT_FACTOR` | 8.0 | Controls how much ratings change per match |
| `MAX_MATCHES_TO_CONSIDER` | 30 | Maximum matches to include in rating calculation |
| `MATCH_AGE_LIMIT_DAYS` | 365 | Only consider matches from past 12 months |

---

## Understanding Your Rating

### Rating Ranges (Approximate)
- **1.0 - 3.0**: Beginner/Recreational
- **3.0 - 5.0**: Intermediate
- **5.0 - 7.0**: Advanced
- **7.0 - 9.0**: Competitive
- **9.0 - 12.0**: High-level competitive
- **12.0 - 16.5**: Professional/Elite

### Rating Changes
- **Small changes (±0.1-0.3)**: Normal fluctuation, expected
- **Medium changes (±0.4-0.8)**: Significant performance difference
- **Large changes (±0.9+)**: Major performance difference or limited match history

### Factors Affecting Rating
1. **Performance vs Expectations**: Performing better/worse than expected based on opponent ratings
2. **Match Competitiveness**: Close matches carry more weight
3. **Match Length**: Longer matches provide more data
4. **Recency**: Recent matches matter more than old ones
5. **Number of Matches**: Players with fewer matches see larger swings

---

## Tips for Players

1. **Play Regularly**: More matches = more stable and accurate ratings
2. **Play Competitive Matches**: Close matches help establish your true skill level
3. **Don't Worry About Small Fluctuations**: Ratings naturally fluctuate based on recent performance
4. **Focus on Improvement**: Consistent improvement will show in your rating over time
5. **Understand the System**: Ratings reflect performance relative to opponents, not absolute performance

---

## Technical Notes

- Ratings are stored as decimal numbers in the database
- Rating history is tracked for analytics and transparency
- The system handles edge cases like:
  - Players with fewer than 3 matches
  - Deleted sets
  - Guest players
  - Tied sets
- Calculations use database transactions to ensure data consistency

---

## Further Reading

- [UTR Rating System Plan](./UTR_RATING_SYSTEM_PLAN.md) - Technical implementation details
- [Update Ratings via API](./UPDATE_RATINGS_VIA_API.md) - How to recalculate historical ratings
- [Production Rating Setup](./PRODUCTION_RATING_SETUP.md) - Setting up ratings in production
