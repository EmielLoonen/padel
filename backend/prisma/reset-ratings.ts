import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_RATING = 5.0;

/**
 * Reset all player ratings to 5.0 without clearing historical data
 * Historical rating data is preserved for reference
 */
async function resetRatings() {
  console.log('Resetting all ratings to 5.0...');
  console.log('ℹ️  Historical rating data will be preserved.\n');

  try {
    // Reset all player ratings to DEFAULT_RATING
    console.log('Resetting all player ratings to 5.0...');
    const resetResult = await prisma.user.updateMany({
      data: {
        rating: DEFAULT_RATING,
        ratingUpdatedAt: new Date(),
      },
    });
    console.log(`✓ Reset ${resetResult.count} player ratings to ${DEFAULT_RATING}\n`);

    // Show summary
    const usersWithRatings = await prisma.user.count({
      where: {
        rating: {
          not: null,
        },
      },
    });

    const historyCount = await prisma.ratingHistory.count({});
    const matchRatingsCount = await prisma.matchRating.count({});

    console.log(`\n✅ Reset complete!`);
    console.log(`   ${usersWithRatings} players now have a rating of 5.0`);
    console.log(`   Historical data preserved:`);
    console.log(`   - ${historyCount} rating history entries`);
    console.log(`   - ${matchRatingsCount} match rating entries`);
    console.log(`\n📝 Next steps:`);
    console.log(`   - Ratings will be calculated from new matches going forward`);
    console.log(`   - Each match will update player ratings based on performance`);
    console.log(`   - Ratings will converge to reflect actual skill levels over time`);
    console.log(`   - Historical data remains available for reference`);
  } catch (error) {
    console.error('Error resetting ratings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
resetRatings()
  .then(() => {
    console.log('\nRating reset completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nRating reset failed:', error);
    process.exit(1);
  });
