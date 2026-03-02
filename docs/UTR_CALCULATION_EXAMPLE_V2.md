# UTR Rating Calculation Example (with ADJUSTMENT_FACTOR = 2.0)

This document recalculates the scenario from `UTR_CALCULATION_EXAMPLE.md` using the **new ADJUSTMENT_FACTOR of 2.0** instead of 8.0, showing how ratings are more stable and less volatile.

## Scenario

**Players:**
- Player A1 (Team A)
- Player A2 (Team A)
- Player B1 (Team B)
- Player B2 (Team B)

**Initial Ratings:** All players start at **5.0** (DEFAULT_RATING)

**Constants Used:**
- `DEFAULT_RATING = 5.0`
- `ADJUSTMENT_FACTOR = 2.0` ⬅️ **REDUCED from 8.0**
- `RATING_DIFF_DIVISOR = 2.5`
- `MIN_RATING = 1.0`
- `MAX_RATING = 16.5`

---

## Match 1: Team A vs Team B

**Scores:** 6-2, 7-5, 5-3 (Team A wins all 3 sets)

**Total Games:**
- Team A: 6 + 7 + 5 = **18 games**
- Team B: 2 + 5 + 3 = **10 games**
- **Total: 28 games**

### Step 1: Calculate Team Ratings (Before Match)

Since all players start at 5.0:
- **Team A Rating** = (5.0 + 5.0) / 2 = **5.0**
- **Team B Rating** = (5.0 + 5.0) / 2 = **5.0**

### Step 2: Calculate Expected Win Percentage

Formula: `expectedWinPct = 1 / (1 + 10^((opponentRating - playerRating) / 2.5))`

For Team A:
- Rating difference = 5.0 - 5.0 = 0.0
- Exponent = 0.0 / 2.5 = 0.0
- Expected Win % = 1 / (1 + 10^0) = 1 / (1 + 1) = **0.5 (50%)**

For Team B:
- Same calculation = **0.5 (50%)**

### Step 3: Calculate Actual Win Percentage

- **Team A Actual Win %** = 18 / 28 = **0.643 (64.3%)**
- **Team B Actual Win %** = 10 / 28 = **0.357 (35.7%)**

### Step 4: Calculate Match Rating for Each Player

Formula: `matchRating = playerRating + (actualWinPct - expectedWinPct) × ADJUSTMENT_FACTOR`

**For Player A1:**
- Starting rating = 5.0
- Performance difference = 0.643 - 0.5 = +0.143
- Match rating = 5.0 + (0.143 × **2.0**) = 5.0 + 0.286 = **5.286** ⬅️ Much smaller change!

**For Player A2:**
- Same calculation = **5.286**

**For Player B1:**
- Starting rating = 5.0
- Performance difference = 0.357 - 0.5 = -0.143
- Match rating = 5.0 + (-0.143 × **2.0**) = 5.0 - 0.286 = **4.714**

**For Player B2:**
- Same calculation = **4.714**

### Step 5: Calculate Match Weight

Formula: `matchWeight = baseWeight × competitivenessFactor × formatFactor`

- Base weight = 1.0
- Score difference = |18 - 10| = 8 games
- Competitiveness factor = max(0.5, 1.0 - 8/12) = max(0.5, 0.333) = **0.5**
- Total games = 28
- Format factor = min(1.5, 0.5 + 28/20) = min(1.5, 1.9) = **1.5**
- **Match weight = 1.0 × 0.5 × 1.5 = 0.75**

### After Match 1 - Updated Ratings:
- **Player A1:** 5.0 → **5.286** (was 6.144 with factor 8.0)
- **Player A2:** 5.0 → **5.286** (was 6.144 with factor 8.0)
- **Player B1:** 5.0 → **4.714** (was 3.856 with factor 8.0)
- **Player B2:** 5.0 → **4.714** (was 3.856 with factor 8.0)

**Key Difference:** With factor 2.0, ratings change by only **±0.286** instead of **±1.144**. Much more stable!

---

## Match 2: Team A vs Team B (Same Players)

**Scores:** 7-5, 6-4, 3-6 (Team A wins 2 sets, Team B wins 1 set)

**Total Games:**
- Team A: 7 + 6 + 3 = **16 games**
- Team B: 5 + 4 + 6 = **15 games**
- **Total: 31 games**

### Step 1: Calculate Team Ratings (Before Match)

Using ratings from **after Match 1**:
- **Team A Rating** = (5.286 + 5.286) / 2 = **5.286**
- **Team B Rating** = (4.714 + 4.714) / 2 = **4.714**

### Step 2: Calculate Expected Win Percentage

For Team A:
- Rating difference = 4.714 - 5.286 = -0.572
- Exponent = -0.572 / 2.5 = -0.229
- Expected Win % = 1 / (1 + 10^(-0.229)) = 1 / (1 + 0.590) = **0.629 (62.9%)**

For Team B:
- Rating difference = 5.286 - 4.714 = 0.572
- Exponent = 0.572 / 2.5 = 0.229
- Expected Win % = 1 / (1 + 10^0.229) = 1 / (1 + 1.695) = **0.371 (37.1%)**

### Step 3: Calculate Actual Win Percentage

- **Team A Actual Win %** = 16 / 31 = **0.516 (51.6%)**
- **Team B Actual Win %** = 15 / 31 = **0.484 (48.4%)**

### Step 4: Calculate Match Rating for Each Player

**For Player A1:**
- Rating before match = 5.286
- Performance difference = 0.516 - 0.629 = **-0.113** (slightly underperformed)
- Match rating = 5.286 + (-0.113 × **2.0**) = 5.286 - 0.226 = **5.060**

**For Player A2:**
- Same calculation = **5.060**

**For Player B1:**
- Rating before match = 4.714
- Performance difference = 0.484 - 0.371 = **+0.113** (slightly overperformed)
- Match rating = 4.714 + (0.113 × **2.0**) = 4.714 + 0.226 = **4.940**

**For Player B2:**
- Same calculation = **4.940**

### Step 5: Calculate Match Weight

- Score difference = |16 - 15| = 1 game
- Competitiveness factor = max(0.5, 1.0 - 1/12) = max(0.5, 0.917) = **0.917**
- Total games = 31
- Format factor = min(1.5, 0.5 + 31/20) = min(1.5, 2.05) = **1.5**
- **Match weight = 1.0 × 0.917 × 1.5 = 1.376**

### After Match 2 - Updated Ratings:
- **Player A1:** 5.286 → **5.060** (was 3.144 with factor 8.0 - huge drop avoided!)
- **Player A2:** 5.286 → **5.060** (was 3.144 with factor 8.0)
- **Player B1:** 4.714 → **4.940** (was 6.856 with factor 8.0 - huge jump avoided!)
- **Player B2:** 4.714 → **4.940** (was 6.856 with factor 8.0)

**Key Difference:** With factor 2.0, ratings adjust by only **±0.226** instead of **±3.0**. The ratings stay much closer to their starting values!

---

## Final Rating Calculation

After both matches, the system calculates a **weighted average** of all match ratings, considering:

1. **Match Weight** (competitiveness and format)
2. **Recency Weight** (more recent matches weighted higher)

### For Player A1:

**Match 1:**
- Match rating: 5.286
- Match weight: 0.75
- Recency weight: 0.5 (assuming Match 1 is older)
- Total weight: 0.75 × 0.5 = 0.375
- Weighted contribution: 5.286 × 0.375 = 1.982

**Match 2:**
- Match rating: 5.060
- Match weight: 1.376
- Recency weight: 1.0 (most recent match)
- Total weight: 1.376 × 1.0 = 1.376
- Weighted contribution: 5.060 × 1.376 = 6.963

**Final Rating:**
- Weighted sum = 1.982 + 6.963 = 8.945
- Total weight = 0.375 + 1.376 = 1.751
- **Final Rating = 8.945 / 1.751 = 5.108**

### For Player B1:

**Match 1:**
- Match rating: 4.714
- Match weight: 0.75
- Recency weight: 0.5
- Weighted contribution: 4.714 × 0.375 = 1.768

**Match 2:**
- Match rating: 4.940
- Match weight: 1.376
- Recency weight: 1.0
- Weighted contribution: 4.940 × 1.376 = 6.797

**Final Rating:**
- Weighted sum = 1.768 + 6.797 = 8.565
- Total weight = 1.751
- **Final Rating = 8.565 / 1.751 = 4.891**

---

## Comparison: Factor 8.0 vs Factor 2.0

| Player | Initial | After Match 1 (8.0) | After Match 1 (2.0) | After Match 2 (8.0) | After Match 2 (2.0) | Final (8.0) | Final (2.0) |
|--------|---------|---------------------|---------------------|---------------------|---------------------|-------------|-------------|
| A1     | 5.000   | 6.144               | **5.286**           | 3.144               | **5.060**           | ~3.787      | **~5.108**  |
| A2     | 5.000   | 6.144               | **5.286**           | 3.144               | **5.060**           | ~3.787      | **~5.108**  |
| B1     | 5.000   | 3.856               | **4.714**           | 6.856               | **4.940**           | ~6.214      | **~4.891**  |
| B2     | 5.000   | 3.856               | **4.714**           | 6.856               | **4.940**           | ~6.214      | **~4.891**  |

---

## Key Insights

### With ADJUSTMENT_FACTOR = 2.0:

1. **Stable Ratings:** Ratings change gradually (±0.286 in Match 1, ±0.226 in Match 2) instead of dramatically (±1.144, ±3.0).

2. **Realistic Expectations:** In Match 2, Team A was expected to win 62.9% (reasonable gap), not 89.1% (unrealistic gap). This prevents the "underperformance penalty" issue.

3. **Convergence:** After two matches, Team A players end at ~5.1 (slight increase) and Team B players at ~4.9 (slight decrease), which makes sense given Team A won both matches decisively.

4. **No Volatility:** Ratings don't swing wildly between matches. Team A's rating stays above 5.0 throughout, reflecting their consistent wins.

5. **Better Calibration:** The system can gradually learn player skill levels over multiple matches without overcorrecting.

### Why Factor 2.0 is Better:

- **Factor 8.0:** Created extreme volatility, causing ratings to swing wildly and creating unrealistic expectations
- **Factor 2.0:** Provides stable, gradual adjustments that better reflect actual skill differences

---

## Summary

With `ADJUSTMENT_FACTOR = 2.0`:
- **Team A players:** Start at 5.0 → End at ~5.1 (slight increase, as expected for winners)
- **Team B players:** Start at 5.0 → End at ~4.9 (slight decrease, as expected for losers)
- **Rating changes:** Small, gradual adjustments (±0.2-0.3 per match)
- **Result:** Ratings accurately reflect performance without extreme volatility

This demonstrates why reducing the adjustment factor from 8.0 to 2.0 fixes the volatility issue while maintaining accurate rating calculations.
