import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up test users from production database...');

  // Delete all users with @test.com email addresses
  const result = await prisma.user.deleteMany({
    where: {
      email: {
        endsWith: '@test.com'
      }
    }
  });

  console.log(`✅ Deleted ${result.count} test users`);
  console.log('✨ Cleanup complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error cleaning up database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

