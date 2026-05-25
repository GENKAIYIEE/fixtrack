import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Prisma v7 with pg driver adapter — matches the runtime setup
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding FixTrack database...')

  // ── Step 0: Seed System Settings ──
  console.log('🌱 Seeding System Settings...')
  const defaultSettings = [
    { key: 'platform_name', value: 'FixTrack — Polytechnic College of La Union', description: 'Platform display name' },
    { key: 'institution_name', value: 'Polytechnic College of La Union', description: 'Institution official name' },
    { key: 'logo_url', value: '', description: 'Organization logo URL' },
    { key: 'support_email', value: 'support@pclu.edu.ph', description: 'Support reply-to email' },
    { key: 'notif_global_email', value: 'true', description: 'Global email alerts toggle' },
    { key: 'notif_push', value: 'false', description: 'Push notifications toggle' },
    { key: 'notif_request_submitted', value: 'true', description: 'Notify on request submitted' },
    { key: 'notif_task_assigned', value: 'true', description: 'Notify on task assigned' },
    { key: 'notif_request_completed', value: 'true', description: 'Notify on request completed' },
    { key: 'notif_request_rejected', value: 'true', description: 'Notify on rejection/cancellation' },
    { key: 'request_max_photo_mb', value: '5', description: 'Max photo upload size in MB' },
    { key: 'request_auto_assign', value: 'false', description: 'Auto-assign requests toggle' },
    { key: 'request_allow_user_cancel', value: 'true', description: 'Allow user cancellation' },
    { key: 'request_expiry_days', value: '30', description: 'Request expiry in days' },
    { key: 'request_require_photo', value: 'false', description: 'Require photo on submission' },
    { key: 'security_session_timeout_mins', value: '60', description: 'Session timeout in minutes' },
    { key: 'security_min_password_length', value: '8', description: 'Minimum password length' },
    { key: 'security_require_strong_password', value: 'true', description: 'Require strong password' },
    { key: 'security_max_login_attempts', value: '5', description: 'Max login attempts' },
    { key: 'security_audit_logging', value: 'true', description: 'Enable audit logging' },
  ]

  for (const setting of defaultSettings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting
    })
  }
  console.log('✅ System settings seeded successfully.')


  // ── Step 1: Check if Admin already exists ──
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@gmail.com' }
  })

  if (existingAdmin) {
    console.log('✅ Admin account already exists — skipping seed.')
    return
  }

  // ── Step 2: Hash the Admin password ──
  const hashedPassword = await bcrypt.hash('password123', 12)

  // ── Step 3: Create Supabase Auth user for Admin ──
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: supabaseUser, error } = await supabase.auth.admin.createUser({
    email: 'admin@gmail.com',
    password: 'password123',
    email_confirm: true
  })

  if (error) {
    console.error('❌ Failed to create Supabase Auth user for Admin:', error.message)
    throw error
  }

  // ── Step 4: Create Admin user in Prisma ──
  const admin = await prisma.user.create({
    data: {
      id: supabaseUser.user.id,
      email: 'admin@gmail.com',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'FixTrack',
      idNumber: 'ADMIN-001',
      department: 'Administration',
      role: 'ADMIN',
      accountStatus: 'ACTIVE'
    }
  })

  console.log('✅ Admin account created successfully:', admin.email)
  console.log('📧 Email:    admin@gmail.com')
  console.log('🔑 Password: password123')
  console.log('🛡️  Role:     ADMIN')
  // ── DEMO DATA SEEDING ──

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   ✅ FIXTRACK — BASE SEED COMPLETE                       ║');
  console.log('║   System is now populated with Settings & Admin only     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
