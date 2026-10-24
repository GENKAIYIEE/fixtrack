import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const restorePassword = process.env.LEGACY_RESTORE_PASSWORD;
  if (!restorePassword) throw new Error('LEGACY_RESTORE_PASSWORD must be supplied explicitly. Do not run this recovery helper during an upgrade.');
  console.log('🌱 Restoring credentials...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const hashedPassword = await bcrypt.hash(restorePassword, 12);

  const usersToSeed = [
    {
      email: 'admin@gmail.com',
      firstName: 'Admin',
      lastName: 'FixTrack',
      idNumber: 'ADMIN-001',
      department: 'Administration',
      role: 'ADMIN',
      accountStatus: 'ACTIVE'
    },
    {
      email: 'tech@gmail.com',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      idNumber: 'TECH-001',
      department: 'Maintenance',
      role: 'TECHNICIAN',
      specialization: 'GENERAL',
      accountStatus: 'ACTIVE'
    },
    {
      email: 'student@gmail.com',
      firstName: 'Juan',
      lastName: 'Tamad',
      idNumber: 'STUD-001',
      department: 'College of Engineering',
      role: 'STUDENT',
      accountStatus: 'ACTIVE'
    }
  ];

  const { data: { users: authUsers }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('❌ Failed to fetch Supabase users:', error.message);
  }

  for (const u of usersToSeed) {
    let sbUserId = null;
    
    // Check if user exists in Supabase Auth
    const existingSbUser = authUsers?.find((authU) => authU.email === u.email);
    
    if (existingSbUser) {
      sbUserId = existingSbUser.id;
    } else {
      // Create if missing
      const { data: newSbUser, error: createErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: restorePassword,
        email_confirm: true
      });
      if (createErr) {
        console.error(`❌ Failed to create Supabase Auth for ${u.email}:`, createErr.message);
        continue;
      }
      sbUserId = newSbUser.user.id;
    }

    // Upsert in Prisma
    const dbUser = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        passwordHash: hashedPassword,
        role: u.role as any,
        accountStatus: 'ACTIVE',
        specialization: (u.specialization as any) || null
      },
      create: {
        id: sbUserId,
        email: u.email,
        passwordHash: hashedPassword,
        firstName: u.firstName,
        lastName: u.lastName,
        idNumber: u.idNumber,
        department: u.department,
        role: u.role as any,
        accountStatus: 'ACTIVE',
        specialization: (u.specialization as any) || null
      }
    });

    console.log(`Restored ${u.role}: ${dbUser.email}`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
