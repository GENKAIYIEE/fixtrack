import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const latestUser = await prisma.user.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (!latestUser) {
    console.log('No users found.');
    return;
  }

  console.log(`Found latest user: ${latestUser.email} (Role: ${latestUser.role})`);

  if (latestUser.role !== 'TECHNICIAN') {
    const updatedUser = await prisma.user.update({
      where: { id: latestUser.id },
      data: { 
        role: 'TECHNICIAN',
        specialization: 'GENERAL' // Default specialization
      },
    });
    console.log(`Successfully upgraded ${updatedUser.email} to TECHNICIAN.`);
  } else {
    console.log('User is already a TECHNICIAN.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
