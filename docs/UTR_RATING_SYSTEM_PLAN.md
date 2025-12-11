# UTR Rating System Implementation Plan

## Overview

Implement a Universal Tennis Rating (UTR) algorithm that calculates individual player ratings (1.00-16.50 scale) based on doubles match performance. The system will automatically update ratings when sets are created/updated/deleted, recalculate all historical matches, and display ratings throughout the app.

## Architecture

The UTR system consists of:

- **Rating Storage**: Player ratings stored in database with history tracking
- **Rating Calculator**: Service that implements UTR algorithm (expected performance, match rating, weighting)
- **Rating Updater**: Automatically recalculates affected players when sets change
- **Backfill Script**: Calculates ratings for all historical matches
- **Frontend Integration**: Display ratings in stats, leaderboard, and player profiles

## Database Schema Changes

### 1. Add rating fields to User model

- Add `rating` field (Decimal, default null) to `backend/prisma/schema.prisma`
- Add `ratingUpdatedAt` field (DateTime) to track last rating update

### 2. Create RatingHistory model

- Track rating changes over time for analytics
- Fields: `id`, `userId`, `rating`, `previousRating`, `setId`, `matchRating`, `createdAt`
- Index on `userId` and `createdAt` for efficient queries

### 3. Create MatchRating model (optional, for debugging/transparency)

- Store calculated match rating for each set participation
- Fields: `id`, `userId`, `setId`, `matchRating`, `expectedWinPct`, `actualWinPct`, `matchWeight`, `createdAt`
- Helps with debugging and showing rating breakdowns

## Core Algorithm Implementation

### Rating Calculation Service (`backend/src/services/ratingService.ts`)

The service implements the UTR algorithm based on Universal Tennis Rating principles, adapted for doubles matches.

## How UTR is Calculated

### Step-by-Step Calculation Process

#### 1. Expected Win Percentage Calculation

For each match, we calculate how likely a player is to win based on rating differences.

**Formula:**
```
expectedWinPct = 1 / (1 + 10^((opponentRating - playerRating) / 2.5))
```

**For Doubles Matches:**
- Calculate team rating as the average of the two players' ratings
- Player's team rating = (player1Rating + player2Rating) / 2
- Opponent team rating = (opponent1Rating + opponent2Rating) / 2
- Use team ratings in the formula above

**Example:**
- Player A rating: 5.0
- Player B rating (teammate): 4.5
- Team rating: (5.0 + 4.5) / 2 = 4.75
- Opponent team rating: 5.5
- Expected win % = 1 / (1 + 10^((5.5 - 4.75) / 2.5)) = 1 / (1 + 10^0.3) = 1 / (1 + 2.0) = 0.333 (33.3%)

#### 2. Match Rating Calculation

After a match, we calculate a new rating based on actual performance vs expected performance.

**Formula:**
```
matchRating = playerRating + (actualWinPct - expectedWinPct) * ADJUSTMENT_FACTOR
```

Where:
- `actualWinPct` = games won / total games played
- `expectedWinPct` = calculated from step 1
- `ADJUSTMENT_FACTOR` = 8.0 (controls how much ratings change per match)

**Example:**
- Player's current rating: 5.0
- Expected win %: 33.3% (0.333)
- Actual win %: 50% (0.50) - they won 6 games out of 12
- Match rating = 5.0 + (0.50 - 0.333) * 8.0 = 5.0 + 1.336 = 6.336

**Rating Bounds:**
- Minimum: 1.0
- Maximum: 16.5
- Ratings are clamped to these bounds

#### 3. Match Weighting

Not all matches are equally important. We weight matches based on:
- **Competitiveness**: Closer matches get higher weight
- **Format**: Longer matches (more games) get higher weight

**Competitiveness Factor:**
```
competitivenessFactor = max(0.5, 1.0 - |scoreDiff| / 12.0)
```
- Score difference of 0 games = 1.0 (maximum weight)
- Score difference of 6 games = 0.5 (minimum weight)
- Closer matches are more indicative of true skill

**Format Factor:**
```
formatFactor = min(1.5, 0.5 + totalGames / 20.0)
```
- 10 games = 1.0 (baseline)
- 20 games = 1.5 (maximum weight)
- Longer matches provide more data points

**Total Match Weight:**
```
matchWeight = baseWeight * competitivenessFactor * formatFactor
```
- Base weight: 1.0
- Typical range: 0.5 to 1.5

**Example:**
- Match: 6-4 (score diff = 2, total games = 10)
- Competitiveness: 1.0 - 2/12 = 0.833
- Format: 0.5 + 10/20 = 1.0
- Match weight: 1.0 * 0.833 * 1.0 = 0.833

#### 4. Recency Weighting

More recent matches are weighted higher than older matches.

**Formula:**
```
recencyWeight = 1.0 - (daysSinceMatch / MATCH_AGE_LIMIT_DAYS)
```

Where:
- `MATCH_AGE_LIMIT_DAYS` = 365 (12 months)
- Matches older than 365 days are not considered
- Today's match: weight = 1.0
- 6 months ago: weight = 0.5
- 12 months ago: weight = 0.0 (excluded)

#### 5. Overall UTR Calculation

The final UTR rating is a weighted average of recent match ratings.

**Formula:**
```
UTR = Σ(matchRating * matchWeight * recencyWeight) / Σ(matchWeight * recencyWeight)
```

**Process:**
1. Get up to 30 most recent matches from past 12 months
2. For each match:
   - Calculate match rating (step 2)
   - Get match weight (step 3)
   - Get recency weight (step 4)
3. Calculate weighted average

**Example:**
- Match 1: rating=6.0, weight=1.0, recency=1.0 → contribution = 6.0
- Match 2: rating=5.5, weight=0.8, recency=0.9 → contribution = 3.96
- Match 3: rating=5.0, weight=1.2, recency=0.7 → contribution = 4.2
- Total weight = 1.0 + 0.72 + 0.84 = 2.56
- UTR = (6.0 + 3.96 + 4.2) / 2.56 = 5.53

#### 6. Initial Rating for New Players

Players without match history start with a default rating.

**Default Rating:** 5.0

After their first few matches:
- Ratings adjust based on performance
- If they perform better than expected → rating increases
- If they perform worse than expected → rating decreases

#### 7. Guest Player Handling

Guest players (not registered users) don't have persistent ratings.

**Temporary Rating:**
- Use average rating of other registered players in the match
- This allows fair calculations for the match
- Rating is not saved or persisted

**Example:**
- Match has 3 registered players: ratings 5.0, 4.5, 6.0
- Guest player temporary rating: (5.0 + 4.5 + 6.0) / 3 = 5.17

### Complete Calculation Flow

1. **When a set is created/updated/deleted:**
   - Identify all affected players (registered users only)
   - For each player:
     - Fetch their last 30 matches from past 12 months
     - Calculate match rating for each match
     - Calculate match weight for each match
     - Calculate recency weight for each match
     - Compute weighted average = new UTR rating
   - Update player's rating in database
   - Create rating history entry

2. **For match predictions:**
   - Get current ratings for all 4 players
   - Calculate team ratings (average of 2 players)
   - Calculate expected win percentage
   - Estimate expected scores for 3 sets
   - Calculate match weight

### Key Constants

- `DEFAULT_RATING = 5.0` - Starting rating for new players
- `MIN_RATING = 1.0` - Minimum possible rating
- `MAX_RATING = 16.5` - Maximum possible rating
- `RATING_DIFF_DIVISOR = 2.5` - Controls sensitivity of expected win % to rating differences
- `ADJUSTMENT_FACTOR = 8.0` - Controls how much ratings change per match
- `MAX_MATCHES_TO_CONSIDER = 30` - Maximum matches to include in rating calculation
- `MATCH_AGE_LIMIT_DAYS = 365` - Only consider matches from past 12 months

## Integration Points

### Set Service Integration (`backend/src/services/setService.ts`)

- After set creation: calculate and update ratings for all players
- After set update: recalculate affected players
- After set deletion: recalculate affected players
- Use transactions to ensure data consistency

### Rating Update Logic

- When a set changes, identify all affected players (users only, not guests)
- Recalculate their UTRs considering all their matches
- Update User.rating and create RatingHistory entries
- Handle edge cases: players with < 3 matches, deleted sets, etc.

## Backfill Script

### Historical Rating Calculator (`backend/prisma/calculate-historical-ratings.ts`)

- Script to calculate ratings for all historical matches
- Process sets chronologically by creation date
- Calculate ratings as if matches happened in order
- Update all user ratings and create rating history
- Can be run via: `npm run prisma:calculate-ratings`

## API Endpoints

### New Routes (`backend/src/routes/ratings.ts`)

- `GET /api/ratings/:userId` - Get current rating and history
- `GET /api/ratings/leaderboard` - Leaderboard sorted by rating
- `GET /api/ratings/:userId/history` - Get rating history over time
- `POST /api/ratings/calculate-historical` - Calculate historical ratings (admin, HTTP endpoint)
- `POST /api/ratings/predict-match` - Predict match outcome for two teams

### Update Existing Routes

- `GET /api/sets/stats/:userId` - Include rating in response
- `GET /api/sets/leaderboard` - Add rating as sort option

## Frontend Integration

### Display Ratings

- **PlayerStatsPage**: Show current UTR rating prominently
- **Leaderboard**: Add rating column, allow sorting by rating
- **SessionDetailPage**: Show player ratings next to names
- **Smart Balance Suggestion**: Use UTR ratings for team balancing
- **Match Prediction**: Show expected scores and match weight

### Components to Update

- `frontend/src/pages/PlayerStatsPage.tsx` - Add rating display
- `frontend/src/pages/SessionDetailPage.tsx` - Show ratings and predictions
- `frontend/src/components/RatingDisplay.tsx` - Reusable rating component

## Implementation Steps

1. **Database Migration**: Add rating fields and new tables ✅
2. **Rating Service**: Implement core UTR calculation logic ✅
3. **Set Service Integration**: Hook rating updates into set operations ✅
4. **Backfill Script**: Calculate historical ratings ✅
5. **API Endpoints**: Expose rating data ✅
6. **Frontend Updates**: Display ratings throughout UI ✅
7. **Testing**: Verify calculations with test data ✅

## Technical Considerations

- **Performance**: Rating recalculation can be expensive; consider batching or background jobs for large updates
- **Accuracy**: Ensure doubles matches properly average teammate/opponent ratings
- **Edge Cases**: Handle players with few matches, deleted sets, guest players
- **Data Integrity**: Use database transactions for rating updates
- **Caching**: Consider caching ratings if calculation becomes slow

## Constants

- `DEFAULT_RATING = 5.0` - Starting rating for new players
- `MIN_RATING = 1.0` - Minimum possible rating
- `MAX_RATING = 16.5` - Maximum possible rating
- `RATING_DIFF_DIVISOR = 2.5` - Used in expected win percentage calculation
- `ADJUSTMENT_FACTOR = 8.0` - Multiplier for rating adjustments
- `MAX_MATCHES_TO_CONSIDER = 30` - Maximum matches to include in rating calculation
- `MATCH_AGE_LIMIT_DAYS = 365` - Only consider matches from past 12 months

## Testing Strategy

- Unit tests for rating calculation formulas
- Integration tests for set creation/update triggering rating updates
- Test backfill script with sample historical data
- Verify edge cases (new players, guests, deleted sets)

## Status

✅ **Completed** - All features have been implemented and tested.

