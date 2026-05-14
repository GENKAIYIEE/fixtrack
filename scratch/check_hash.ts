import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { email: true, passwordHash: true }
  });

  if (user) {
    console.log('Email:', user.email);
    console.log('Hash starts with $2:', user.passwordHash.startsWith('$2'));
    console.log('Hash length:', user.passwordHash.length);
  } else {
    console.log('No users found.');
  }
}

main().finally(() => prisma.$disconnect());
