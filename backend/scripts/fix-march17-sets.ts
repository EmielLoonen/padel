/**
 * One-off script: link March 17 Set records to their Match record.
 *
 * Run with:
 *   cd backend && npx ts-node scripts/fix-march17-sets.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Find all Match records around March 17 2026
  const from = new Date('2026-03-17T00:00:00.000Z');
  const to   = new Date('2026-03-17T23:59:59.999Z');

  const matches = await prisma.match.findMany({
    where: { startDate: { gte: from, lte: to } },
    include: {
      sets: true,
      teamStats: true,
      playerStats: { select: { name: true, team: true } },
    },
  });

  console.log(`Found ${matches.length} Match record(s) on March 17:`);
  for (const m of matches) {
    console.log(`  Match id=${m.id}  courtId=${m.courtId}  winner=${m.winner}  sets already linked: ${m.sets.length}`);
  }

  if (matches.length === 0) {
    console.log('\nNo Match records found for March 17. Check the date or timezone.');
    return;
  }

  // 2. Check MatchPlayerStats and MatchTeamStats for each match
  for (const m of matches) {
    const playerStats = await prisma.matchPlayerStats.findMany({ where: { matchId: m.id } });
    const teamStats   = await prisma.matchTeamStats.findMany({ where: { matchId: m.id } });
    console.log(`  Match ${m.id}: playerStats=${playerStats.length}, teamStats=${teamStats.length}`);
    if (playerStats.length > 0) {
      console.log('    Players:', playerStats.map((p) => `${p.name} (team ${p.team}, userId=${p.userId})`).join(', '));
    }
  }

  // 3. Find Set records on March 17 with no matchId (the unlinked ones)
  const unlinkedSets = await prisma.set.findMany({
    where: {
      matchId: null,
      createdAt: { gte: from, lte: to },
    },
    include: { scores: { select: { userId: true, gamesWon: true } } },
    orderBy: { setNumber: 'asc' },
  });

  console.log(`\nFound ${unlinkedSets.length} Set record(s) on March 17 with no matchId:`);
  for (const s of unlinkedSets) {
    console.log(`  Set id=${s.id}  setNumber=${s.setNumber}  courtId=${s.courtId}  scores=${JSON.stringify(s.scores)}`);
  }

  if (unlinkedSets.length === 0) {
    console.log('\nNo unlinked sets found — the matchId may already be set or the sets are on a different date.');
    return;
  }

  // 4. If there is exactly one Match, link all unlinked sets to it
  if (matches.length === 1) {
    const match = matches[0];
    console.log(`\nLinking ${unlinkedSets.length} set(s) to match ${match.id} ...`);
    const result = await prisma.set.updateMany({
      where: { id: { in: unlinkedSets.map((s) => s.id) } },
      data: { matchId: match.id },
    });
    console.log(`Done — updated ${result.count} set(s).`);
  } else {
    // Multiple matches: print IDs so you can decide manually
    console.log('\nMultiple matches found — check which sets belong to which match and update manually.');
    console.log('Match IDs:', matches.map((m) => m.id));
    console.log('Set IDs:',   unlinkedSets.map((s) => s.id));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
