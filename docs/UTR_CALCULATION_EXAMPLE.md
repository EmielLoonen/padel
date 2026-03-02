# UTR Rating Calculation Example

This document shows a detailed step-by-step example of how UTR ratings are calculated for individual players in doubles matches.

## Scenario

**Players:**
- Player A1 (Team A)
- Player A2 (Team A)
- Player B1 (Team B)
- Player B2 (Team B)

**Initial Ratings:** All players start at **5.0** (DEFAULT_RATING)

**Constants Used:**
- `DEFAULT_RATING = 5.0`
- `ADJUSTMENT_FACTOR = 8.0`
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
- Match rating = 5.0 + (0.143 × 8.0) = 5.0 + 1.144 = **6.144**

**For Player A2:**
- Same calculation = **6.144**

**For Player B1:**
- Starting rating = 5.0
- Performance difference = 0.357 - 0.5 = -0.143
- Match rating = 5.0 + (-0.143 × 8.0) = 5.0 - 1.144 = **3.856**

**For Player B2:**
- Same calculation = **3.856**

### Step 5: Calculate Match Weight

Formula: `matchWeight = baseWeight × competitivenessFactor × formatFactor`

- Base weight = 1.0
- Score difference = |18 - 10| = 8 games
- Competitiveness factor = max(0.5, 1.0 - 8/12) = max(0.5, 0.333) = **0.5**
- Total games = 28
- Format factor = min(1.5, 0.5 + 28/20) = min(1.5, 1.9) = **1.5**
- **Match weight = 1.0 × 0.5 × 1.5 = 0.75**

### After Match 1 - Updated Ratings:
- **Player A1:** 5.0 → **6.144**
- **Player A2:** 5.0 → **6.144**
- **Player B1:** 5.0 → **3.856**
- **Player B2:** 5.0 → **3.856**

---

## Match 2: Team A vs Team B (Same Players)

**Scores:** 7-5, 6-4, 3-6 (Team A wins 2 sets, Team B wins 1 set)

**Total Games:**
- Team A: 7 + 6 + 3 = **16 games**
- Team B: 5 + 4 + 6 = **15 games**
- **Total: 31 games**

### Step 1: Calculate Team Ratings (Before Match)

Using ratings from **after Match 1**:
- **Team A Rating** = (6.144 + 6.144) / 2 = **6.144**
- **Team B Rating** = (3.856 + 3.856) / 2 = **3.856**

### Step 2: Calculate Expected Win Percentage

For Team A:
- Rating difference = 6.144 - 3.856 = 2.288
- Exponent = 2.288 / 2.5 = 0.915
- Expected Win % = 1 / (1 + 10^0.915) = 1 / (1 + 8.22) = **0.108 (10.8%)**

Wait, this seems wrong. Let me recalculate...

Actually, the formula uses `opponentRating - playerRating`:
- Rating difference = 3.856 - 6.144 = -2.288
- Exponent = -2.288 / 2.5 = -0.915
- Expected Win % = 1 / (1 + 10^(-0.915)) = 1 / (1 + 0.122) = **0.891 (89.1%)**

For Team B:
- Rating difference = 6.144 - 3.856 = 2.288
- Exponent = 2.288 / 2.5 = 0.915
- Expected Win % = 1 / (1 + 10^0.915) = 1 / (1 + 8.22) = **0.109 (10.9%)**

### Step 3: Calculate Actual Win Percentage

- **Team A Actual Win %** = 16 / 31 = **0.516 (51.6%)**
- **Team B Actual Win %** = 15 / 31 = **0.484 (48.4%)**

### Step 4: Calculate Match Rating for Each Player

**For Player A1:**
- Rating before match = 6.144
- Performance difference = 0.516 - 0.891 = **-0.375** (underperformed expectations!)
- Match rating = 6.144 + (-0.375 × 8.0) = 6.144 - 3.0 = **3.144**

**For Player A2:**
- Same calculation = **3.144**

**For Player B1:**
- Rating before match = 3.856
- Performance difference = 0.484 - 0.109 = **+0.375** (overperformed expectations!)
- Match rating = 3.856 + (0.375 × 8.0) = 3.856 + 3.0 = **6.856**

**For Player B2:**
- Same calculation = **6.856**

### Step 5: Calculate Match Weight

- Score difference = |16 - 15| = 1 game
- Competitiveness factor = max(0.5, 1.0 - 1/12) = max(0.5, 0.917) = **0.917**
- Total games = 31
- Format factor = min(1.5, 0.5 + 31/20) = min(1.5, 2.05) = **1.5**
- **Match weight = 1.0 × 0.917 × 1.5 = 1.376**

### After Match 2 - Updated Ratings:
- **Player A1:** 6.144 → **3.144**
- **Player A2:** 6.144 → **3.144**
- **Player B1:** 3.856 → **6.856**
- **Player B2:** 3.856 → **6.856**

---

## Final Rating Calculation

After both matches, the system calculates a **weighted average** of all match ratings, considering:

1. **Match Weight** (competitiveness and format)
2. **Recency Weight** (more recent matches weighted higher)

### For Player A1:

**Match 1:**
- Match rating: 6.144
- Match weight: 0.75
- Recency weight: 0.5 (assuming Match 1 is older)
- Total weight: 0.75 × 0.5 = 0.375
- Weighted contribution: 6.144 × 0.375 = 2.304

**Match 2:**
- Match rating: 3.144
- Match weight: 1.376
- Recency weight: 1.0 (most recent match)
- Total weight: 1.376 × 1.0 = 1.376
- Weighted contribution: 3.144 × 1.376 = 4.326

**Final Rating:**
- Weighted sum = 2.304 + 4.326 = 6.630
- Total weight = 0.375 + 1.376 = 1.751
- **Final Rating = 6.630 / 1.751 = 3.787**

### For Player B1:

**Match 1:**
- Match rating: 3.856
- Match weight: 0.75
- Recency weight: 0.5
- Weighted contribution: 3.856 × 0.375 = 1.446

**Match 2:**
- Match rating: 6.856
- Match weight: 1.376
- Recency weight: 1.0
- Weighted contribution: 6.856 × 1.376 = 9.434

**Final Rating:**
- Weighted sum = 1.446 + 9.434 = 10.880
- Total weight = 1.751
- **Final Rating = 10.880 / 1.751 = 6.214**

---

## Key Insights

1. **Team Performance Matters:** Individual ratings are calculated based on team performance, not individual performance.

2. **Expectations vs Reality:** The system compares expected performance (based on ratings) vs actual performance. If you win more than expected, your rating goes up; if you win less than expected, it goes down.

3. **Rating Volatility:** Early matches cause larger rating swings because the system is still calibrating player skill levels.

4. **Match Weight:** Closer matches (like Match 2) have higher weight, meaning they influence the final rating more than blowouts.

5. **Recency:** More recent matches are weighted higher, so recent performance has more impact on current rating.

6. **Symmetry:** In Match 1, Team A's gain equals Team B's loss. In Match 2, the roles reversed - Team B gained what Team A lost.

---

## Summary Table

| Player | Initial | After Match 1 | After Match 2 | Final Rating |
|--------|---------|---------------|---------------|--------------|
| A1     | 5.000   | 6.144         | 3.144         | ~3.787       |
| A2     | 5.000   | 6.144         | 3.144         | ~3.787       |
| B1     | 5.000   | 3.856         | 6.856         | ~6.214       |
| B2     | 5.000   | 3.856         | 6.856         | ~6.214       |

**Note:** Final ratings shown are approximate and depend on recency weighting. In practice, if both matches are equally recent, the final rating would be closer to the simple average of the two match ratings.
