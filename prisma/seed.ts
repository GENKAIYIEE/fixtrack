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
  console.log('🌱 Seeding Demo Data...')

  // Step 1: Check if demo data already exists
  const existingDemo = await prisma.maintenanceRequest.findUnique({
    where: { requestCode: 'REQ-0042' }
  })

  if (existingDemo) {
    console.log('✅ Demo data already seeded — skipping.')
    console.log('🌱 Seeding complete.')
    return
  }

  // Define relative times
  const now = Date.now()
  const hours = (h: number) => h * 60 * 60 * 1000
  const days = (d: number) => d * 24 * 60 * 60 * 1000

  // Step 2: Create 3 Technician Accounts
  const techPassword = await bcrypt.hash('tech123', 12)
  const userPassword = await bcrypt.hash('user123', 12)

  const techniciansData = [
    { firstName: 'Ben', lastName: 'Santos', email: 'ben@fixtrack.edu', idNumber: 'TECH-001', department: 'Maintenance Department', role: 'TECHNICIAN' as const, specialization: 'HVAC' as const, accountStatus: 'ACTIVE' as const },
    { firstName: 'Maria', lastName: 'Cruz', email: 'maria@fixtrack.edu', idNumber: 'TECH-002', department: 'Maintenance Department', role: 'TECHNICIAN' as const, specialization: 'ELECTRICAL' as const, accountStatus: 'ACTIVE' as const },
    { firstName: 'Carlos', lastName: 'Reyes', email: 'carlos@fixtrack.edu', idNumber: 'TECH-003', department: 'Maintenance Department', role: 'TECHNICIAN' as const, specialization: 'PLUMBING' as const, accountStatus: 'ACTIVE' as const },
  ]

  const usersData = [
    { firstName: 'Juan', lastName: 'Santos', email: 'juan.santos@fixtrack.edu', idNumber: 'FAC-001', department: 'College of Information Technology', role: 'USER' as const, accountStatus: 'ACTIVE' as const },
    { firstName: 'Ana', lastName: 'Reyes', email: 'ana.reyes@fixtrack.edu', idNumber: 'FAC-002', department: 'College of Engineering', role: 'USER' as const, accountStatus: 'ACTIVE' as const },
    { firstName: 'Marco', lastName: 'Dela Cruz', email: 'marco.delacruz@fixtrack.edu', idNumber: 'STF-001', department: 'Administration', role: 'USER' as const, accountStatus: 'ACTIVE' as const },
    { firstName: 'Lisa', lastName: 'Aquino', email: 'lisa.aquino@fixtrack.edu', idNumber: 'STU-001', department: 'College of Information Technology', role: 'USER' as const, accountStatus: 'ACTIVE' as const },
    { firstName: 'Roberto', lastName: 'Bautista', email: 'roberto.bautista@fixtrack.edu', idNumber: 'FAC-003', department: 'College of Sciences', role: 'USER' as const, accountStatus: 'ACTIVE' as const },
  ]

  const createdTechnicians = []
  const createdUsers = []

  for (const tech of techniciansData) {
    const { data: supaUser, error } = await supabase.auth.admin.createUser({
      email: tech.email,
      password: 'tech123',
      email_confirm: true
    })
    if (error) throw error
    const dbUser = await prisma.user.create({
      data: { ...tech, id: supaUser.user.id, passwordHash: techPassword }
    })
    createdTechnicians.push(dbUser)
  }

  // Step 3: Create 5 User Accounts
  for (const user of usersData) {
    const { data: supaUser, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: 'user123',
      email_confirm: true
    })
    if (error) throw error
    const dbUser = await prisma.user.create({
      data: { ...user, id: supaUser.user.id, passwordHash: userPassword }
    })
    createdUsers.push(dbUser)
  }

  // Helper variables mapping
  const adminUser = admin
  const techBen = createdTechnicians.find(t => t.email === 'ben@fixtrack.edu')!
  const techMaria = createdTechnicians.find(t => t.email === 'maria@fixtrack.edu')!
  const techCarlos = createdTechnicians.find(t => t.email === 'carlos@fixtrack.edu')!

  const uJuan = createdUsers.find(u => u.email === 'juan.santos@fixtrack.edu')!
  const uAna = createdUsers.find(u => u.email === 'ana.reyes@fixtrack.edu')!
  const uMarco = createdUsers.find(u => u.email === 'marco.delacruz@fixtrack.edu')!
  const uLisa = createdUsers.find(u => u.email === 'lisa.aquino@fixtrack.edu')!
  const uRoberto = createdUsers.find(u => u.email === 'roberto.bautista@fixtrack.edu')!

  // Step 4: Create 10 MaintenanceRequest records
  const requests = [
    {
      requestCode: 'REQ-0042', submittedById: uJuan.id, issueType: 'HVAC' as const, building: 'IT_BUILDING' as const, roomNumber: 'Room 304',
      description: 'AC unit is leaking water heavily near the server rack. Room is very hot and equipment is at risk.',
      urgencyLevel: 'URGENT' as const, priorityLevel: 'URGENT' as const, status: 'ONGOING' as const, adminNotes: 'Priority set to Urgent — handle immediately',
      assignedToId: techBen.id, assignedById: adminUser.id, assignedAt: new Date(now - hours(3)), startedAt: new Date(now - hours(2)), createdAt: new Date(now - hours(4)), updatedAt: new Date(now - hours(2)), reviewedById: adminUser.id, reviewedAt: new Date(now - hours(3.5))
    },
    {
      requestCode: 'REQ-0043', submittedById: uAna.id, issueType: 'PLUMBING' as const, building: 'ADMIN_BUILDING' as const, roomNumber: 'Restroom 2F',
      description: "Leaking pipe under the sink in the 2nd floor women's restroom. Water pooling on floor.",
      urgencyLevel: 'HIGH' as const, priorityLevel: 'HIGH' as const, status: 'PENDING' as const,
      createdAt: new Date(now - hours(1)), updatedAt: new Date(now - hours(1))
    },
    {
      requestCode: 'REQ-0044', submittedById: uMarco.id, issueType: 'ELECTRICAL' as const, building: 'LIBRARY' as const, roomNumber: 'Study Hall A',
      description: 'Several fluorescent lights are flickering in Study Hall A. Causing eye strain for students.',
      urgencyLevel: 'NORMAL' as const, priorityLevel: 'NORMAL' as const, status: 'PENDING' as const,
      createdAt: new Date(now - hours(0.5)), updatedAt: new Date(now - hours(0.5))
    },
    {
      requestCode: 'REQ-0040', submittedById: uLisa.id, issueType: 'ELECTRICAL' as const, building: 'IT_BUILDING' as const, roomNumber: 'Room 210',
      description: 'Power outlet near the whiteboard is sparking. Possible short circuit risk.',
      urgencyLevel: 'HIGH' as const, priorityLevel: 'HIGH' as const, status: 'ONGOING' as const, adminNotes: 'Assigned to Maria — check for short circuit',
      assignedToId: techMaria.id, assignedById: adminUser.id, assignedAt: new Date(now - hours(5)), startedAt: new Date(now - hours(4)), createdAt: new Date(now - hours(6)), updatedAt: new Date(now - hours(4)), reviewedById: adminUser.id, reviewedAt: new Date(now - hours(5.5))
    },
    {
      requestCode: 'REQ-0038', submittedById: uRoberto.id, issueType: 'PLUMBING' as const, building: 'GYMNASIUM' as const, roomNumber: 'Ground Floor CR',
      description: 'Main water line in the gymnasium comfort room burst. Flooding the hallway.',
      urgencyLevel: 'URGENT' as const, priorityLevel: 'URGENT' as const, status: 'COMPLETED' as const,
      assignedToId: techCarlos.id, assignedById: adminUser.id, assignedAt: new Date(now - days(1) - hours(2)), startedAt: new Date(now - days(1) - hours(1)), completedAt: new Date(now - days(1)), createdAt: new Date(now - days(1) - hours(3)), updatedAt: new Date(now - days(1)), reviewedById: adminUser.id, reviewedAt: new Date(now - days(1) - hours(2.5))
    },
    {
      requestCode: 'REQ-0037', submittedById: uJuan.id, issueType: 'CARPENTRY' as const, building: 'ADMIN_BUILDING' as const, roomNumber: 'Faculty Room 1',
      description: 'Wooden door hinge broken. Door will not close properly.',
      urgencyLevel: 'NORMAL' as const, priorityLevel: 'NORMAL' as const, status: 'COMPLETED' as const,
      assignedToId: techCarlos.id, assignedById: adminUser.id, assignedAt: new Date(now - days(2) - hours(4)), startedAt: new Date(now - days(2) - hours(2)), completedAt: new Date(now - days(2)), createdAt: new Date(now - days(2) - hours(5)), updatedAt: new Date(now - days(2)), reviewedById: adminUser.id, reviewedAt: new Date(now - days(2) - hours(4.5))
    },
    {
      requestCode: 'REQ-0035', submittedById: uLisa.id, issueType: 'OTHERS' as const, building: 'LIBRARY' as const, roomNumber: 'Room 102',
      description: 'Request to repaint the entire library interior walls.',
      urgencyLevel: 'LOW' as const, priorityLevel: 'LOW' as const, status: 'REJECTED' as const, rejectionReason: 'This request is out of scope for the maintenance team. Repainting requires a separate budget approval and contractor procurement process.',
      createdAt: new Date(now - days(3)), updatedAt: new Date(now - days(2) - hours(12)), reviewedById: adminUser.id, reviewedAt: new Date(now - days(2) - hours(12))
    },
    {
      requestCode: 'REQ-0033', submittedById: uMarco.id, issueType: 'ELECTRICAL' as const, building: 'CANTEEN' as const, roomNumber: 'Main Area',
      description: 'Air conditioning unit not cooling properly in the canteen area.',
      urgencyLevel: 'NORMAL' as const, priorityLevel: 'NORMAL' as const, status: 'CANCELLED' as const, cancellationReason: 'Duplicate report — already being handled under REQ-0042. Cancelling to avoid duplicate work orders.',
      createdAt: new Date(now - days(4)), updatedAt: new Date(now - days(3) - hours(12)), reviewedById: adminUser.id, reviewedAt: new Date(now - days(3) - hours(12))
    },
    {
      requestCode: 'REQ-0031', submittedById: uAna.id, issueType: 'STRUCTURAL' as const, building: 'IT_BUILDING' as const, roomNumber: 'Stairwell B',
      description: 'Ceiling tiles in Stairwell B are cracking and one has partially fallen. Safety hazard for students.',
      urgencyLevel: 'URGENT' as const, priorityLevel: 'URGENT' as const, status: 'PENDING' as const,
      createdAt: new Date(now - hours(12)), updatedAt: new Date(now - hours(12))
    },
    {
      requestCode: 'REQ-0030', submittedById: uRoberto.id, issueType: 'HVAC' as const, building: 'ADMIN_BUILDING' as const, roomNumber: 'Conference Room',
      description: 'Conference room AC is making loud grinding noise and blowing warm air during board meetings.',
      urgencyLevel: 'HIGH' as const, priorityLevel: 'HIGH' as const, status: 'ONGOING' as const,
      assignedToId: techBen.id, assignedById: adminUser.id, assignedAt: new Date(now - hours(6)), startedAt: new Date(now - hours(5)), createdAt: new Date(now - hours(8)), updatedAt: new Date(now - hours(5)), reviewedById: adminUser.id, reviewedAt: new Date(now - hours(7))
    }
  ]

  const createdRequests = []
  for (const req of requests) {
    createdRequests.push(await prisma.maintenanceRequest.create({ data: req }))
  }

  const reqMap = Object.fromEntries(createdRequests.map(r => [r.requestCode, r]))

  // Step 5: Create RequestStatusHistory records
  const historiesToCreate = []
  
  for (const r of requests) {
    historiesToCreate.push({
      requestId: reqMap[r.requestCode].id,
      newStatus: 'PENDING' as const,
      changedById: r.submittedById,
      remarks: 'Request submitted',
      changedAt: r.createdAt
    })
  }

  const ongoingAndCompleted = ['REQ-0042', 'REQ-0040', 'REQ-0030', 'REQ-0038', 'REQ-0037']
  for (const rc of ongoingAndCompleted) {
    historiesToCreate.push({
      requestId: reqMap[rc].id,
      previousStatus: 'PENDING' as const,
      newStatus: 'ONGOING' as const,
      changedById: adminUser.id,
      remarks: 'Approved and assigned',
      changedAt: reqMap[rc].assignedAt || new Date()
    })
  }

  historiesToCreate.push({
    requestId: reqMap['REQ-0038'].id,
    previousStatus: 'ONGOING' as const,
    newStatus: 'COMPLETED' as const,
    changedById: reqMap['REQ-0038'].assignedToId!,
    remarks: 'Replaced burst section of 2-inch PVC pipe. Cleaned and dried flooded area. Water pressure tested and normal.',
    changedAt: reqMap['REQ-0038'].completedAt || new Date()
  })
  
  historiesToCreate.push({
    requestId: reqMap['REQ-0037'].id,
    previousStatus: 'ONGOING' as const,
    newStatus: 'COMPLETED' as const,
    changedById: reqMap['REQ-0037'].assignedToId!,
    remarks: 'Replaced both door hinges with new heavy-duty steel hinges. Door tested and closes properly.',
    changedAt: reqMap['REQ-0037'].completedAt || new Date()
  })

  historiesToCreate.push({
    requestId: reqMap['REQ-0035'].id,
    previousStatus: 'PENDING' as const,
    newStatus: 'REJECTED' as const,
    changedById: adminUser.id,
    remarks: reqMap['REQ-0035'].rejectionReason,
    changedAt: reqMap['REQ-0035'].updatedAt
  })

  historiesToCreate.push({
    requestId: reqMap['REQ-0033'].id,
    previousStatus: 'PENDING' as const,
    newStatus: 'CANCELLED' as const,
    changedById: adminUser.id,
    remarks: reqMap['REQ-0033'].cancellationReason,
    changedAt: reqMap['REQ-0033'].updatedAt
  })

  await prisma.requestStatusHistory.createMany({ data: historiesToCreate })

  // Step 6: Create RequestAssignment records
  const assignmentsToCreate = []
  for (const code of ['REQ-0042', 'REQ-0040', 'REQ-0038', 'REQ-0037', 'REQ-0030']) {
    const r = reqMap[code]
    assignmentsToCreate.push({
      requestId: r.id,
      assignedToId: r.assignedToId!,
      assignedById: adminUser.id,
      isActive: r.status !== 'COMPLETED',
      assignedAt: r.assignedAt || new Date(),
      revokedAt: r.status === 'COMPLETED' ? r.completedAt : null
    })
  }
  await prisma.requestAssignment.createMany({ data: assignmentsToCreate })

  // Step 7: Create RepairNote records
  const repairNotesToCreate = [
    {
      requestId: reqMap['REQ-0038'].id,
      technicianId: techCarlos.id,
      notes: 'Replaced burst section of 2-inch PVC pipe. Cleaned and dried flooded area. Water pressure tested and normal.',
      createdAt: reqMap['REQ-0038'].completedAt || new Date()
    },
    {
      requestId: reqMap['REQ-0037'].id,
      technicianId: techCarlos.id,
      notes: 'Replaced both door hinges with new heavy-duty steel hinges. Door tested and closes properly.',
      createdAt: reqMap['REQ-0037'].completedAt || new Date()
    }
  ]
  await prisma.repairNote.createMany({ data: repairNotesToCreate })

  // Step 8: Create AuditLog records
  const auditLogsToCreate = [
    { action: 'REQUEST_APPROVED' as const, affectedRecordId: reqMap['REQ-0042'].id, affectedRecordType: 'MaintenanceRequest', userId: adminUser.id },
    { action: 'TASK_ASSIGNED' as const, affectedRecordId: reqMap['REQ-0042'].id, affectedRecordType: 'MaintenanceRequest', userId: adminUser.id, details: 'Assigned to ' + techBen.firstName },
    { action: 'REQUEST_APPROVED' as const, affectedRecordId: reqMap['REQ-0040'].id, affectedRecordType: 'MaintenanceRequest', userId: adminUser.id },
    { action: 'TASK_ASSIGNED' as const, affectedRecordId: reqMap['REQ-0040'].id, affectedRecordType: 'MaintenanceRequest', userId: adminUser.id, details: 'Assigned to ' + techMaria.firstName },
    { action: 'REQUEST_APPROVED' as const, affectedRecordId: reqMap['REQ-0038'].id, affectedRecordType: 'MaintenanceRequest', userId: adminUser.id },
    { action: 'TASK_ASSIGNED' as const, affectedRecordId: reqMap['REQ-0038'].id, affectedRecordType: 'MaintenanceRequest', userId: adminUser.id, details: 'Assigned to ' + techCarlos.firstName },
    { action: 'REQUEST_REJECTED' as const, affectedRecordId: reqMap['REQ-0035'].id, affectedRecordType: 'MaintenanceRequest', userId: adminUser.id },
    { action: 'REQUEST_CANCELLED' as const, affectedRecordId: reqMap['REQ-0033'].id, affectedRecordType: 'MaintenanceRequest', userId: adminUser.id },
    { action: 'STATUS_UPDATED' as const, affectedRecordId: reqMap['REQ-0042'].id, affectedRecordType: 'MaintenanceRequest', userId: techBen.id, details: 'ONGOING' },
    { action: 'STATUS_UPDATED' as const, affectedRecordId: reqMap['REQ-0040'].id, affectedRecordType: 'MaintenanceRequest', userId: techMaria.id, details: 'ONGOING' },
    { action: 'TASK_COMPLETED' as const, affectedRecordId: reqMap['REQ-0038'].id, affectedRecordType: 'MaintenanceRequest', userId: techCarlos.id },
    { action: 'TASK_COMPLETED' as const, affectedRecordId: reqMap['REQ-0037'].id, affectedRecordType: 'MaintenanceRequest', userId: techCarlos.id }
  ]
  await prisma.auditLog.createMany({ data: auditLogsToCreate })

  // Step 9: Create Notification records
  const notificationsToCreate = [
    { userId: uJuan.id, type: 'STATUS_UPDATED' as const, title: 'Request Updated', message: 'Your request REQ-0042 has been approved and set to Urgent.', isRead: false, requestId: reqMap['REQ-0042'].id },
    { userId: uJuan.id, type: 'STATUS_UPDATED' as const, title: 'Task Started', message: 'Ben (HVAC) has started working on your request REQ-0042.', isRead: false, requestId: reqMap['REQ-0042'].id },
    { userId: uJuan.id, type: 'TASK_COMPLETED' as const, title: 'Request Completed', message: 'Your request REQ-0037 has been completed.', isRead: true, requestId: reqMap['REQ-0037'].id },
    { userId: uAna.id, type: 'STATUS_UPDATED' as const, title: 'Request Pending', message: 'Your request REQ-0043 is pending assignment.', isRead: false, requestId: reqMap['REQ-0043'].id },
    { userId: uAna.id, type: 'REQUEST_REJECTED' as const, title: 'Request Rejected', message: 'Your request REQ-0035 has been rejected.', isRead: true, requestId: reqMap['REQ-0035'].id },
    { userId: uLisa.id, type: 'TASK_ASSIGNED' as const, title: 'Request Assigned', message: 'Your request REQ-0040 has been assigned to Maria (Electrical).', isRead: false, requestId: reqMap['REQ-0040'].id },
    { userId: techBen.id, type: 'TASK_ASSIGNED' as const, title: 'New Urgent Task', message: 'New Urgent task assigned: AC Leak — Room 304, IT Building.', isRead: false, requestId: reqMap['REQ-0042'].id },
    { userId: techBen.id, type: 'TASK_ASSIGNED' as const, title: 'New Task', message: 'New task assigned: Conference Room AC — Admin Building.', isRead: true, requestId: reqMap['REQ-0030'].id },
    { userId: techMaria.id, type: 'TASK_ASSIGNED' as const, title: 'New High Task', message: 'New High priority task assigned: Electrical — Room 210.', isRead: false, requestId: reqMap['REQ-0040'].id }
  ]

  await prisma.notification.createMany({ data: notificationsToCreate })

  // Step 10: Log a final summary table
  console.log(`
╔══════════════════════════════════════════════════════════╗
║   ✅ FIXTRACK — DEMO DATA SEED COMPLETE                  ║
║   System is now populated with realistic demo data       ║
╚══════════════════════════════════════════════════════════╝

Records created:

✅ Users:               9 total
   → 1 Admin
   → 3 Technicians (Ben, Maria, Carlos)
   → 5 Users (Juan, Ana, Marco, Lisa, Roberto)

✅ MaintenanceRequests: 10 total
   → 3 PENDING   (REQ-0043, REQ-0044, REQ-0031)
   → 3 ONGOING   (REQ-0042, REQ-0040, REQ-0030)
   → 2 COMPLETED (REQ-0038, REQ-0037)
   → 1 REJECTED  (REQ-0035)
   → 1 CANCELLED (REQ-0033)

✅ RequestStatusHistory: ${historiesToCreate.length} entries
✅ RequestAssignment:    ${assignmentsToCreate.length} assignment records
✅ RepairNotes:          ${repairNotesToCreate.length} records (completed requests)
✅ AuditLog:             ${auditLogsToCreate.length} entries
✅ Notifications:        ${notificationsToCreate.length} records across all users
`)


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
