import 'dotenv/config';
import prisma from './src/lib/prisma';

async function main() {
  console.log('Testing request creation...');
  
  const user = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  if (!user) throw new Error('No student found');

  const count = await prisma.maintenanceRequest.count();
  const requestCode = `REQ-${String(count + 1).padStart(4, '0')}`;

  console.log('Creating request...');
  const newRequest = await prisma.maintenanceRequest.create({
    data: {
      requestCode,
      submittedById: user.id,
      issueType: 'OTHERS',
      urgencyLevel: 'URGENT',
      building: 'COLLEGE_BUILDING',
      roomNumber: 'Computer Laboratory',
      locationNotes: null,
      description: `Test Title\n\nTest Description that is quite long enough`,
      status: 'PENDING',
      priorityLevel: 'HIGH',
      photoUrl: null
    }
  });
  console.log('Request created:', newRequest.id);

  console.log('Creating history...');
  await prisma.requestStatusHistory.create({
    data: {
      requestId: newRequest.id,
      changedById: user.id,
      previousStatus: null,
      newStatus: 'PENDING',
      remarks: 'Request submitted by student'
    }
  });

  console.log('Creating notifications...');
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', accountStatus: 'ACTIVE' },
    select: { id: true }
  });
  
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map(admin => ({
        userId: admin.id,
        type: 'REQUEST_SUBMITTED',
        title: 'New Maintenance Request',
        message: `Test Student submitted: "Test Title" at COLLEGE BUILDING, Computer Laboratory (${requestCode})`,
        requestId: newRequest.id
      }))
    });
  }

  console.log('Creating audit log...');
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'REQUEST_SUBMITTED',
      affectedRecordId: newRequest.id,
      affectedRecordType: 'MaintenanceRequest',
      details: `Student submitted ${requestCode}: OTHERS issue at COLLEGE_BUILDING, Computer Laboratory`
    }
  });

  console.log('All done successfully!');
}

main().catch(console.error);
