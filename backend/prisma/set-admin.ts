import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setAdmin() {
  const adminEmail = 'emiel@emielloonen.nl';
  
  try {
    const user = await prisma.user.update({
      where: { email: adminEmail },
      data: { isAdmin: true },
    });
    
    console.log(`✅ Set ${user.name} (${user.email}) as admin`);
    console.log(`User ID: ${user.id}`);
  } catch (error) {
    console.error('❌ Error setting admin:', error);
    console.error('Make sure the user exists in the database');
  } finally {
    await prisma.$disconnect();
  }
}

setAdmin();

