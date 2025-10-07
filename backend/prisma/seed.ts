import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Only seed test users in development environment
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    console.log('⚠️  Production environment detected - skipping test user creation');
    console.log('✨ Seeding skipped for production!');
    return;
  }

  console.log('🔧 Development environment - creating test users...');

  // Create 8 test users (your padel group)
  const users = [
    { email: 'john@test.com', name: 'John Doe', phone: '+31612345678' },
    { email: 'sarah@test.com', name: 'Sarah Smith', phone: '+31612345679' },
    { email: 'mike@test.com', name: 'Mike Johnson', phone: '+31612345680' },
    { email: 'emma@test.com', name: 'Emma Davis', phone: '+31612345681' },
    { email: 'alex@test.com', name: 'Alex Brown', phone: '+31612345682' },
    { email: 'lisa@test.com', name: 'Lisa Wilson', phone: '+31612345683' },
    { email: 'tom@test.com', name: 'Tom Anderson', phone: '+31612345684' },
    { email: 'anna@test.com', name: 'Anna Martinez', phone: '+31612345685' },
  ];

  // Password: "password123" for all test users
  const passwordHash = await bcrypt.hash('password123', 10);

  for (const userData of users) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        phone: userData.phone,
        passwordHash, // Also updates password
      },
      create: {
        ...userData,
        passwordHash,
      },
    });
    console.log(`✅ Created/Updated user: ${userData.name} (${userData.email})`);
  }

  console.log('✨ Seeding complete!');
  console.log('📝 Test credentials: Any email above with password "password123"');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

