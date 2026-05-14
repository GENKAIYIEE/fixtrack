import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Starting technician demo seed...')

  // Step 1: Find target technician
  const technician = await prisma.user.findFirst({
    where: { role: 'TECHNICIAN', accountStatus: 'ACTIVE' }
  })
  if (!technician) throw new Error('No active technician found. Run the main seed first.')

  // Step 2: Find admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })
  if (!admin) throw new Error('No admin user found.')

  // Step 3: Find submitter user
  const submitter = await prisma.user.findFirst({
    where: { role: 'USER', accountStatus: 'ACTIVE' }
  })
  if (!submitter) throw new Error('No submitter user found.')

  // Step 4: Check if demo tasks already exist
  const existingTask = await prisma.maintenanceRequest.findUnique({
    where: { requestCode: 'REQ-DEMO-01' }
  })
  if (existingTask) {
    console.log('Technician demo tasks already seeded — skipping')
    return
  }

  const now = new Date()

  // Task 1: REQ-DEMO-01 (URGENT / ONGOING)
  const task1 = await prisma.maintenanceRequest.create({
    data: {
      requestCode: 'REQ-DEMO-01',
      issueType: 'HVAC',
      building: 'IT_BUILDING',
      roomNumber: 'Room 304',
      locationNotes: 'Near the server rack area',
      description: 'AC unit is leaking water heavily near the server rack.\nRoom temperature is rising and equipment is at risk.\nNeeds immediate attention to prevent hardware damage.',
      urgencyLevel: 'URGENT',
      priorityLevel: 'URGENT',
      status: 'ONGOING',
      adminNotes: 'Priority set to Urgent — handle immediately',
      assignedToId: technician.id,
      assignedById: admin.id,
      assignedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      startedAt: new Date(now.getTime() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
      submittedById: submitter.id,
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
      updatedAt: new Date(now.getTime() - 1.5 * 60 * 60 * 1000),
      
      statusHistory: {
        create: [
          {
            changedById: submitter.id,
            newStatus: 'PENDING',
            changedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000)
          },
          {
            changedById: admin.id,
            previousStatus: 'PENDING',
            newStatus: 'ONGOING',
            remarks: 'Approved and assigned.',
            changedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
          }
        ]
      },
      assignments: {
        create: {
          assignedToId: technician.id,
          assignedById: admin.id,
          isActive: true,
          assignedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
        }
      },
      notifications: {
        create: {
          userId: technician.id,
          type: 'TASK_ASSIGNED',
          title: 'New Urgent Task Assigned',
          message: 'REQ-DEMO-01 — HVAC Leak, Room 304 IT Building has been assigned to you.',
          isRead: false,
          createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
        }
      }
    }
  })

  // Task 2: REQ-DEMO-02 (HIGH / PENDING)
  const task2 = await prisma.maintenanceRequest.create({
    data: {
      requestCode: 'REQ-DEMO-02',
      issueType: 'ELECTRICAL',
      building: 'ADMIN_BUILDING',
      roomNumber: 'Conference Room B',
      locationNotes: 'Main power panel near the entrance',
      description: 'Power outlet near the whiteboard is sparking intermittently.\nPossible loose wiring or short circuit. Several staff members\nreported seeing sparks during the morning meeting.',
      urgencyLevel: 'HIGH',
      priorityLevel: 'HIGH',
      status: 'PENDING',
      adminNotes: 'Check for short circuit — bring electrical tester',
      assignedToId: technician.id,
      assignedById: admin.id,
      assignedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 hours ago
      submittedById: submitter.id,
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
      updatedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),

      statusHistory: {
        create: [
          {
            changedById: submitter.id,
            newStatus: 'PENDING',
            changedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000)
          }
        ]
      },
      assignments: {
        create: {
          assignedToId: technician.id,
          assignedById: admin.id,
          isActive: true,
          assignedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000)
        }
      },
      notifications: {
        create: {
          userId: technician.id,
          type: 'TASK_ASSIGNED',
          title: 'New Task Assigned',
          message: 'REQ-DEMO-02 — Electrical issue, Conference Room B has been assigned to you.',
          isRead: true,
          createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000)
        }
      }
    }
  })

  // Task 3: REQ-DEMO-03 (NORMAL / COMPLETED)
  const task3 = await prisma.maintenanceRequest.create({
    data: {
      requestCode: 'REQ-DEMO-03',
      issueType: 'PLUMBING',
      building: 'GYMNASIUM',
      roomNumber: 'Ground Floor Comfort Room',
      locationNotes: 'Third sink from the entrance',
      description: 'Leaking faucet in the ground floor comfort room.\nWater dripping continuously causing water waste and\nwet floor hazard for students.',
      urgencyLevel: 'NORMAL',
      priorityLevel: 'NORMAL',
      status: 'COMPLETED',
      adminNotes: 'Routine fix — complete before end of day',
      assignedToId: technician.id,
      assignedById: admin.id,
      assignedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
      startedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
      completedAt: new Date(now.getTime() - 20 * 60 * 60 * 1000), // 20 hours ago
      submittedById: submitter.id,
      createdAt: new Date(now.getTime() - 25 * 60 * 60 * 1000), // 25 hours ago
      updatedAt: new Date(now.getTime() - 20 * 60 * 60 * 1000),

      statusHistory: {
        create: [
          {
            changedById: submitter.id,
            newStatus: 'PENDING',
            changedAt: new Date(now.getTime() - 25 * 60 * 60 * 1000)
          },
          {
            changedById: admin.id,
            previousStatus: 'PENDING',
            newStatus: 'ONGOING',
            remarks: 'Assigned to technician.',
            changedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000)
          },
          {
            changedById: technician.id,
            previousStatus: 'ONGOING',
            newStatus: 'COMPLETED',
            remarks: 'Task completed.',
            changedAt: new Date(now.getTime() - 20 * 60 * 60 * 1000)
          }
        ]
      },
      assignments: {
        create: {
          assignedToId: technician.id,
          assignedById: admin.id,
          isActive: false,
          assignedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          revokedAt: new Date(now.getTime() - 20 * 60 * 60 * 1000)
        }
      },
      repairNote: {
        create: {
          technicianId: technician.id,
          notes: "Replaced worn rubber washer on the faucet valve. Tightened all pipe connections. Tested for 10 minutes — no leaks detected. Floor cleaned and dried. Faucet functioning normally.",
          partsReplaced: "1x rubber washer, plumber's tape",
          createdAt: new Date(now.getTime() - 20 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 20 * 60 * 60 * 1000)
        }
      },
      notifications: {
        create: {
          userId: technician.id,
          type: 'REMINDER',
          title: 'Task Completed',
          message: 'REQ-DEMO-03 has been marked as completed. Good work!',
          isRead: true,
          createdAt: new Date(now.getTime() - 20 * 60 * 60 * 1000)
        }
      }
    }
  })

  // Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'TASK_ASSIGNED',
        affectedRecordId: task1.id,
        affectedRecordType: 'MaintenanceRequest',
        details: `Assigned REQ-DEMO-01 to technician ${technician.id}`,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      },
      {
        userId: admin.id,
        action: 'TASK_ASSIGNED',
        affectedRecordId: task2.id,
        affectedRecordType: 'MaintenanceRequest',
        details: `Assigned REQ-DEMO-02 to technician ${technician.id}`,
        createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000)
      },
      {
        userId: technician.id,
        action: 'TASK_COMPLETED',
        affectedRecordId: task3.id,
        affectedRecordType: 'MaintenanceRequest',
        details: `Completed REQ-DEMO-03`,
        createdAt: new Date(now.getTime() - 20 * 60 * 60 * 1000)
      }
    ]
  })

  console.log(`\n╔══════════════════════════════════════════════════════════╗`)
  console.log(`║   ✅ TECHNICIAN DEMO TASKS SEEDED SUCCESSFULLY           ║`)
  console.log(`╚══════════════════════════════════════════════════════════╝\n`)
  console.log(`Target Technician: ${technician.firstName} ${technician.lastName}`)
  console.log(`Login Email:       ${technician.email}`)
  console.log(`Password:          tech123`)
  console.log(`Portal URL:        http://localhost:3000/technician/dashboard\n`)
  console.log(`Tasks Created:`)
  console.log(`✅ REQ-DEMO-01 — HVAC Leak, Room 304 IT Building`)
  console.log(`                 Status: ONGOING | Urgency: URGENT`)
  console.log(`                 → Shows active task with urgent priority\n`)
  console.log(`✅ REQ-DEMO-02 — Electrical Issue, Conference Room B`)
  console.log(`                 Status: PENDING | Urgency: HIGH`)
  console.log(`                 → Shows assigned but not yet started task\n`)
  console.log(`✅ REQ-DEMO-03 — Plumbing Leak, Gymnasium CR`)
  console.log(`                 Status: COMPLETED | Urgency: NORMAL`)
  console.log(`                 → Shows completed task with repair notes\n`)
  console.log(`Supporting Records Created:`)
  console.log(`✅ RequestStatusHistory: entries for all 3 requests`)
  console.log(`✅ RequestAssignment:    3 records (1 active, 2 inactive)`)
  console.log(`✅ RepairNote:           1 record (REQ-DEMO-03)`)
  console.log(`✅ Notifications:        3 records (1 unread, 2 read)`)
  console.log(`✅ AuditLog:             3 entries`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
