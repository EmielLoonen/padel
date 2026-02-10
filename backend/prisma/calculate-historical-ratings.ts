import { PrismaClient } from '@prisma/client';
import { calculateMatchRating } from '../src/services/ratingService';

const prisma = new PrismaClient();

const DEFAULT_RATING = 5.0;

/**
 * Calculate ratings for all historical sets chronologically
 * This processes sets in order of creation to simulate how ratings would have evolved
 * 
 * IMPORTANT: This script resets all ratings to DEFAULT_RATING first, then recalculates
 * chronologically using the fixed algorithm that processes matches oldest-first.
 */
async function calculateHistoricalRatings() {
  console.log('Starting historical rating calculation...');
  console.log('⚠️  This will reset all player ratings and recalculate from scratch.\n');

  try {
    // Step 1: Reset all player ratings to DEFAULT_RATING
    console.log('Step 1: Resetting all player ratings to default (5.0)...');
    const resetResult = await prisma.user.updateMany({
      data: {
        rating: DEFAULT_RATING,
        ratingUpdatedAt: new Date(),
      },
    });
    console.log(`✓ Reset ${resetResult.count} player ratings to ${DEFAULT_RATING}\n`);

    // Step 2: Clear all rating history (optional, but keeps things clean)
    console.log('Step 2: Clearing existing rating history...');
    const deletedHistory = await prisma.ratingHistory.deleteMany({});
    console.log(`✓ Deleted ${deletedHistory.count} rating history entries\n`);

    // Step 3: Clear all match ratings (optional, but keeps things clean)
    console.log('Step 3: Clearing existing match ratings...');
    const deletedMatchRatings = await prisma.matchRating.deleteMany({});
    console.log(`✓ Deleted ${deletedMatchRatings.count} match rating entries\n`);

    // Step 4: Get all sets ordered by creation date (oldest first)
    console.log('Step 4: Fetching all sets chronologically...');
    const sets = await prisma.set.findMany({
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        createdAt: true,
        scores: {
          select: {
            userId: true,
          },
        },
      },
    });

    console.log(`✓ Found ${sets.length} sets to process\n`);

    // Step 5: Process each set chronologically and track all players' ratings
    console.log('Step 5: Processing sets chronologically with proper historical tracking...');
    let processed = 0;
    const startTime = Date.now();

    // Track all players' current ratings as we process sets chronologically
    // This is used for calculating expected win percentages in each match
    const playerRatings = new Map<string, number>(); // userId -> current rating
    
    // Track all match ratings for each player (for final weighted average calculation)
    const playerMatchRatings = new Map<string, Array<{
      matchRating: number;
      matchWeight: number;
      createdAt: Date;
    }>>(); // userId -> array of match ratings
    
    // Initialize all players' ratings to DEFAULT_RATING
    const allUsers = await prisma.user.findMany({
      select: { id: true },
    });
    allUsers.forEach((user) => {
      playerRatings.set(user.id, DEFAULT_RATING);
      playerMatchRatings.set(user.id, []);
    });

    // Process each set chronologically
    for (const set of sets) {
      try {
        // Get full set data with scores
        const fullSet = await prisma.set.findUnique({
          where: { id: set.id },
          include: {
            scores: {
              include: {
                user: {
                  select: {
                    id: true,
                    rating: true,
                  },
                },
              },
            },
          },
        });

        if (!fullSet) continue;

        // Get unique user IDs from this set
        const userIds = Array.from(
          new Set(
            fullSet.scores
              .map((s) => s.userId)
              .filter((id): id is string => id !== null)
          )
        );

        if (userIds.length === 0) continue;

        // Create opponent ratings map for this match (using historical ratings we've tracked)
        const opponentRatingsAtMatchTime = new Map<string, number>();
        userIds.forEach((userId) => {
          opponentRatingsAtMatchTime.set(userId, playerRatings.get(userId) ?? DEFAULT_RATING);
        });

        // Convert to SetWithScores format
        const setWithScores = {
          id: fullSet.id,
          createdAt: fullSet.createdAt,
          scores: fullSet.scores.map((score) => ({
            userId: score.userId,
            guestId: score.guestId,
            gamesWon: score.gamesWon,
            user: score.user ? {
              id: score.user.id,
              rating: score.user.rating ? Number(score.user.rating) : null
            } : null,
          })),
        };

        // Calculate match ratings for all players in this set
        for (const userId of userIds) {
          const playerRatingBeforeMatch = playerRatings.get(userId) ?? DEFAULT_RATING;
          
          // Calculate match rating using historical ratings
          const matchRatingData = await calculateMatchRating(
            userId,
            setWithScores,
            playerRatingBeforeMatch,
            opponentRatingsAtMatchTime
          );

          if (matchRatingData) {
            // Store match rating for this player
            const matchRatings = playerMatchRatings.get(userId) || [];
            matchRatings.push({
              matchRating: matchRatingData.matchRating,
              matchWeight: matchRatingData.matchWeight,
              createdAt: fullSet.createdAt,
            });
            playerMatchRatings.set(userId, matchRatings);

            // Update tracked rating for use in next matches
            // Use weighted average of all matches up to this point in time
            // For historical calculation, we use the match date as the "current" time
            const currentMatchDate = fullSet.createdAt;
            let weightedSum = 0;
            let weightSum = 0;
            
            for (const match of matchRatings) {
              // Calculate recency weight relative to the current match date
              const daysSinceMatch = (currentMatchDate.getTime() - match.createdAt.getTime()) / (1000 * 60 * 60 * 24);
              // For matches up to 365 days old, use recency weighting
              // For this match (daysSinceMatch = 0), recencyWeight = 1.0
              const recencyWeight = daysSinceMatch >= 365 ? 0 : Math.max(0, 1.0 - daysSinceMatch / 365);
              const totalWeight = match.matchWeight * recencyWeight;
              
              weightedSum += match.matchRating * totalWeight;
              weightSum += totalWeight;
            }
            
            // Use weighted average, or fall back to match rating if no weight
            const newRating = weightSum > 0 
              ? Math.max(1.0, Math.min(16.5, weightedSum / weightSum))
              : matchRatingData.matchRating;
            
            playerRatings.set(userId, newRating);
          }
        }

        processed++;

        if (processed % 10 === 0) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(`  Processed ${processed}/${sets.length} sets (${elapsed}s)...`);
        }
      } catch (error) {
        console.error(`  ✗ Error processing set ${set.id}:`, error);
        // Continue with next set
      }
    }

    // Step 5b: Calculate final weighted averages and update database
    console.log('\nStep 5b: Calculating final weighted averages...');
    const now = new Date();
    for (const [userId, matchRatings] of playerMatchRatings) {
      if (matchRatings.length === 0) continue;

      let weightedSum = 0;
      let weightSum = 0;

      for (const match of matchRatings) {
        const daysSinceMatch = (now.getTime() - match.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        const recencyWeight = daysSinceMatch >= 365 ? 0 : Math.max(0, 1.0 - daysSinceMatch / 365);
        const totalWeight = match.matchWeight * recencyWeight;

        weightedSum += match.matchRating * totalWeight;
        weightSum += totalWeight;
      }

      const finalRating = weightSum > 0
        ? Math.max(1.0, Math.min(16.5, weightedSum / weightSum))
        : DEFAULT_RATING;

      await prisma.user.update({
        where: { id: userId },
        data: {
          rating: finalRating,
          ratingUpdatedAt: new Date(),
        },
      });
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✓ Completed! Processed ${processed} sets in ${totalTime}s.\n`);

    // Step 6: Show summary statistics
    console.log('Step 6: Calculating summary statistics...');
    const usersWithRatings = await prisma.user.count({
      where: {
        rating: {
          not: null,
        },
      },
    });

    const avgRating = await prisma.user.aggregate({
      where: {
        rating: {
          not: null,
        },
      },
      _avg: {
        rating: true,
      },
    });

    const minRating = await prisma.user.aggregate({
      where: {
        rating: {
          not: null,
        },
      },
      _min: {
        rating: true,
      },
    });

    const maxRating = await prisma.user.aggregate({
      where: {
        rating: {
          not: null,
        },
      },
      _max: {
        rating: true,
      },
    });

    console.log(`\n📊 Summary Statistics:`);
    console.log(`   Users with ratings: ${usersWithRatings}`);
    console.log(`   Average rating: ${avgRating._avg.rating?.toFixed(2) || 'N/A'}`);
    console.log(`   Minimum rating: ${minRating._min.rating?.toFixed(2) || 'N/A'}`);
    console.log(`   Maximum rating: ${maxRating._max.rating?.toFixed(2) || 'N/A'}`);

    // Show top 10 players by rating
    const topPlayers = await prisma.user.findMany({
      where: {
        rating: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        rating: true,
      },
      orderBy: {
        rating: 'desc',
      },
      take: 10,
    });

    console.log(`\n🏆 Top 10 players by rating:`);
    topPlayers.forEach((player, index) => {
      const rating = Number(player.rating).toFixed(2);
      console.log(`   ${index + 1}. ${player.name}: ${rating}`);
    });

    // Show bottom 5 players (to verify ratings aren't stuck at minimum)
    const bottomPlayers = await prisma.user.findMany({
      where: {
        rating: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        rating: true,
      },
      orderBy: {
        rating: 'asc',
      },
      take: 5,
    });

    console.log(`\n📉 Bottom 5 players by rating:`);
    bottomPlayers.forEach((player, index) => {
      const rating = Number(player.rating).toFixed(2);
      console.log(`   ${index + 1}. ${player.name}: ${rating}`);
    });
  } catch (error) {
    console.error('Error calculating historical ratings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
calculateHistoricalRatings()
  .then(() => {
    console.log('\nHistorical rating calculation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nHistorical rating calculation failed:', error);
    process.exit(1);
  });


