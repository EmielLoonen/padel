import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migration script to convert existing sessions to the new court-based model
 * 
 * This script:
 * 1. For each existing session, creates default courts based on RSVP count
 * 2. Assigns existing RSVPs to Court 1 by default
 * 3. Should be run AFTER the Prisma migration completes
 */
async function main() {
  console.log('🔄 Starting data migration for court system...');

  // Get all sessions
  const sessions = await prisma.session.findMany({
    include: {
      rsvps: true,
    },
  });

  console.log(`📊 Found ${sessions.length} sessions to migrate`);

  for (const session of sessions) {
    console.log(`\n🎾 Processing session: ${session.venueName} (${session.date})`);

    // Determine number of courts based on RSVPs
    const yesRSVPs = session.rsvps.filter((r) => r.status === 'yes');
    const numberOfCourts = yesRSVPs.length <= 4 ? 1 : 2;

    console.log(`  - ${yesRSVPs.length} confirmed players → ${numberOfCourts} court(s)`);

    // Update session with numberOfCourts
    await prisma.session.update({
      where: { id: session.id },
      data: { numberOfCourts },
    });

    // Create default courts
    for (let i = 1; i <= numberOfCourts; i++) {
      const court = await prisma.court.create({
        data: {
          sessionId: session.id,
          courtNumber: i,
          startTime: session.time,
          duration: 60,
          maxPlayers: 4,
        },
      });

      console.log(`  ✅ Created Court ${i} (${court.startTime})`);

      // Assign RSVPs to courts (distribute evenly)
      if (i === 1) {
        // Assign first 4 (or fewer) "yes" RSVPs to Court 1
        const court1RSVPs = yesRSVPs.slice(0, 4);
        for (const rsvp of court1RSVPs) {
          await prisma.rSVP.update({
            where: { id: rsvp.id },
            data: { courtId: court.id },
          });
          console.log(`    → Assigned ${rsvp.userId} to Court 1`);
        }
      } else if (i === 2 && yesRSVPs.length > 4) {
        // Assign remaining "yes" RSVPs to Court 2
        const court2RSVPs = yesRSVPs.slice(4);
        for (const rsvp of court2RSVPs) {
          await prisma.rSVP.update({
            where: { id: rsvp.id },
            data: { courtId: court.id },
          });
          console.log(`    → Assigned ${rsvp.userId} to Court 2`);
        }
      }
    }

    // Note: "no" and "maybe" RSVPs keep courtId = null
    const noMaybeRSVPs = session.rsvps.filter((r) => r.status !== 'yes');
    if (noMaybeRSVPs.length > 0) {
      console.log(`  ℹ️  ${noMaybeRSVPs.length} "no/maybe" RSVPs (no court assignment)`);
    }
  }

  console.log('\n✨ Migration complete!');
  console.log('📝 Summary:');
  console.log(`  - Migrated ${sessions.length} sessions`);
  console.log(`  - Created courts with default times`);
  console.log(`  - Assigned "yes" RSVPs to courts`);
}

main()
  .catch((e) => {
    console.error('❌ Migration error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

