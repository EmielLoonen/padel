/**
 * Recalculate all ratings for a group using the corrected group-wide algorithm.
 * Run: cd backend && npx ts-node scripts/recalculate-all-ratings.ts
 *
 * This fixes ratings that were computed with the broken per-player algorithm
 * (which assigned all opponents the same rating as the player being calculated).
 */
import { PrismaClient } from '@prisma/client';
import { recalculateAllRatings } from '../src/services/ratingService';

const prisma = new PrismaClient();

async function main() {
  // Get the group — change this if you need a different group
  const group = await prisma.group.findFirst({
    select: { id: true, name: true },
  });

  if (!group) {
    console.error('No group found');
    process.exit(1);
  }

  console.log(`Recalculating ratings for group: ${group.name} (${group.id})`);

  // Print before snapshot
  const before = await prisma.userGroup.findMany({
    where: { groupId: group.id },
    include: { user: { select: { name: true } } },
    orderBy: { rating: 'desc' },
  });

  console.log('\nRatings BEFORE:');
  for (const ug of before) {
    console.log(`  ${ug.user.name.padEnd(25)} ${ug.rating ?? 'null'}`);
  }

  // Run the corrected recalculation
  const newRatings = await recalculateAllRatings(group.id);

  // Print after snapshot
  const after = await prisma.userGroup.findMany({
    where: { groupId: group.id },
    include: { user: { select: { name: true } } },
    orderBy: { rating: 'desc' },
  });

  console.log('\nRatings AFTER:');
  for (const ug of after) {
    const prev = before.find((b) => b.userId === ug.userId);
    const diff = ug.rating && prev?.rating
      ? (Number(ug.rating) - Number(prev.rating)).toFixed(3)
      : 'n/a';
    const sign = Number(diff) >= 0 ? '+' : '';
    console.log(`  ${ug.user.name.padEnd(25)} ${String(ug.rating).padEnd(8)} (${sign}${diff})`);
  }

  console.log('\nDone.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
