import { PrismaClient } from '@prisma/client';
import { recalculateRatingsForSet } from '../src/services/ratingService';

const prisma = new PrismaClient();

/**
 * Calculate ratings for all historical sets chronologically
 * This processes sets in order of creation to simulate how ratings would have evolved
 */
async function calculateHistoricalRatings() {
  console.log('Starting historical rating calculation...');

  try {
    // Get all sets ordered by creation date (oldest first)
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

    console.log(`Found ${sets.length} sets to process`);

    // Process each set chronologically
    let processed = 0;
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
          await recalculateRatingsForSet(set.id);
          processed++;

          if (processed % 10 === 0) {
            console.log(`Processed ${processed}/${sets.length} sets...`);
          }
        }
      } catch (error) {
        console.error(`Error processing set ${set.id}:`, error);
        // Continue with next set
      }
    }

    console.log(`\nCompleted! Processed ${processed} sets.`);

    // Show summary statistics
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

    console.log(`\nSummary:`);
    console.log(`- Users with ratings: ${usersWithRatings}`);
    console.log(`- Average rating: ${avgRating._avg.rating?.toFixed(2) || 'N/A'}`);

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

    console.log(`\nTop 10 players by rating:`);
    topPlayers.forEach((player, index) => {
      console.log(
        `${index + 1}. ${player.name}: ${Number(player.rating).toFixed(2)}`
      );
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

