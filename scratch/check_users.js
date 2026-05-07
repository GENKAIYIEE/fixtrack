const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true }
  });
  console.log(JSON.stringify(users, null, 2));
}

main().finally(() => {
    prisma.$disconnect();
    pool.end();
});
