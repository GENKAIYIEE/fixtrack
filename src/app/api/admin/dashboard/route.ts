import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalRequestsToday,
      pendingTriage,
      ongoingRepairs,
      completedToday,
      unassignedTasks,
      liveRequests,
      priorityQueue
    ] = await Promise.all([
      prisma.maintenanceRequest.count({
        where: { createdAt: { gte: startOfDay } }
      }),
      prisma.maintenanceRequest.count({
        where: { status: 'PENDING' }
      }),
      prisma.maintenanceRequest.count({
        where: { status: 'ONGOING' }
      }),
      prisma.maintenanceRequest.count({
        where: { status: 'COMPLETED', completedAt: { gte: startOfDay } }
      }),
      prisma.maintenanceRequest.count({
        where: { 
          assignedToId: null,
          status: { notIn: ['COMPLETED', 'REJECTED', 'CANCELLED'] }
        }
      }),
      prisma.maintenanceRequest.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.maintenanceRequest.findMany({
        where: { 
          urgencyLevel: 'URGENT',
          assignedToId: null,
          status: { notIn: ['COMPLETED', 'REJECTED', 'CANCELLED'] }
        },
        take: 3,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Compute chart data for last 7 days
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const nextDay = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      
      const count = await prisma.maintenanceRequest.count({
        where: {
          createdAt: {
            gte: d,
            lt: nextDay
          }
        }
      });
      
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      chartData.push({ day: dayName, count });
    }

    return NextResponse.json({
      kpis: {
        totalRequestsToday,
        pendingTriage,
        ongoingRepairs,
        completedToday,
        unassignedTasks
      },
      liveRequests,
      priorityQueue,
      chartData
    });

  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
