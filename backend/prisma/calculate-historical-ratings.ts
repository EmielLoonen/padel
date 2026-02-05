import { PrismaClient } from '@prisma/client';
import { recalculateRatingsForSet } from '../src/services/ratingService';

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

    // Step 5: Process each set chronologically
    console.log('Step 5: Processing sets chronologically...');
    let processed = 0;
    const startTime = Date.now();

    for (const set of sets) {
      try {
        // Get unique user IDs from this set
        const userIds = Array.from(
          new Set(
            set.scores
              .map((s) => s.userId)
              .filter((id): id is string => id !== null)
          )
        );

        if (userIds.length > 0) {
          // Recalculate ratings for all players in this set
          // This uses the fixed calculatePlayerRating which processes matches chronologically
          await recalculateRatingsForSet(set.id);
          processed++;

          if (processed % 10 === 0) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`  Processed ${processed}/${sets.length} sets (${elapsed}s)...`);
          }
        }
      } catch (error) {
        console.error(`  ✗ Error processing set ${set.id}:`, error);
        // Continue with next set
      }
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


