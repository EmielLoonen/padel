/**
 * Diagnose March 24 match submission issues.
 * Run: cd backend && npx ts-node scripts/diagnose-march24.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const from = new Date('2026-03-23T00:00:00.000Z');
  const to   = new Date('2026-03-25T23:59:59.999Z');

  const matches = await prisma.match.findMany({
    where: { startDate: { gte: from, lte: to } },
    include: {
      sets: {
        orderBy: { setNumber: 'asc' },
        include: {
          scores: {
            include: {
              user:  { select: { id: true, name: true } },
              guest: { select: { id: true, name: true } },
            },
          },
        },
      },
      teamStats:   true,
      playerStats: true,
    },
  });

  console.log(`Found ${matches.length} match(es) on March 24:\n`);

  for (const m of matches) {
    console.log(`Match ${m.id}  winner=${m.winner}`);

    console.log('  PlayerStats (MatchPlayerStats):');
    for (const p of m.playerStats) {
      console.log(`    code=${p.code}  name=${p.name}  team=${p.team}  userId=${p.userId ?? 'NULL (guest)'}`);
    }

    console.log('  Sets + SetScores:');
    for (const s of m.sets) {
      console.log(`    Set ${s.setNumber}:`);
      for (const sc of s.scores) {
        if (sc.user) {
          console.log(`      registered user: ${sc.user.name} (${sc.user.id})  gamesWon=${sc.gamesWon}`);
        } else if (sc.guest) {
          console.log(`      guest: ${sc.guest.name} (${sc.guest.id})  gamesWon=${sc.gamesWon}`);
        } else {
          console.log(`      ORPHANED score — no user or guest  gamesWon=${sc.gamesWon}`);
        }
      }
    }
    console.log();
  }

  // Also check for guests created today
  const guests = await prisma.guest.findMany({
    where: { createdAt: { gte: new Date('2026-03-23T00:00:00.000Z'), lte: new Date('2026-03-25T23:59:59.999Z') } },
    select: { id: true, name: true, createdAt: true },
  });
  console.log(`Guests created on March 24 (${guests.length}):`);
  for (const g of guests) {
    console.log(`  ${g.name}  id=${g.id}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
