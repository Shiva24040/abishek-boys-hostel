import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const totalRooms = await prisma.room.count();
    const totalBeds = await prisma.bed.count();
    const occupiedBeds = await prisma.bed.count({ where: { isOccupied: true } });
    const availableBeds = totalBeds - occupiedBeds;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const totalStudents = await prisma.student.count({
      where: { status: { in: ['ACTIVE', 'NOTICE_PERIOD'] } },
    });
    const activeStudents = await prisma.student.count({ where: { status: 'ACTIVE' } });
    const noticeStudents = await prisma.student.count({ where: { status: 'NOTICE_PERIOD' } });
    const leftStudents = await prisma.student.count({ where: { status: 'LEFT' } });

    // Current month fee statistics (October 2026)
    const currentMonth = 'October 2026';
    const monthPayments = await prisma.payment.findMany({
      where: { month: currentMonth },
      include: {
        student: {
          include: { room: true, bed: true },
        },
      },
    });

    let totalExpected = 0;
    let totalCollected = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;
    const pendingStudentsList = [];

    monthPayments.forEach((p) => {
      totalExpected += p.amount;
      totalCollected += p.amountPaid;
      if (p.status === 'PAID') {
        paidCount++;
      } else if (p.status === 'OVERDUE') {
        overdueCount++;
        pendingStudentsList.push({
          id: p.id,
          studentId: p.student.studentId,
          studentName: p.student.fullName,
          roomNumber: p.student.room?.roomNumber || '—',
          bedNumber: p.student.bed?.bedNumber || '—',
          amount: p.amount,
          amountPaid: p.amountPaid,
          balance: p.amount - p.amountPaid,
          status: p.status,
          dueDate: p.dueDate,
          phone: p.student.phone,
        });
      } else {
        pendingCount++;
        pendingStudentsList.push({
          id: p.id,
          studentId: p.student.studentId,
          studentName: p.student.fullName,
          roomNumber: p.student.room?.roomNumber || '—',
          bedNumber: p.student.bed?.bedNumber || '—',
          amount: p.amount,
          amountPaid: p.amountPaid,
          balance: p.amount - p.amountPaid,
          status: p.status,
          dueDate: p.dueDate,
          phone: p.student.phone,
        });
      }
    });

    const totalPending = Math.max(0, totalExpected - totalCollected);

    // Floor-wise breakdown
    const rooms = await prisma.room.findMany({
      include: { beds: true },
    });

    const floorMap: { [key: number]: { floor: number; totalBeds: number; occupiedBeds: number; roomsCount: number } } = {};
    rooms.forEach((r) => {
      if (!floorMap[r.floor]) {
        floorMap[r.floor] = { floor: r.floor, totalBeds: 0, occupiedBeds: 0, roomsCount: 0 };
      }
      floorMap[r.floor].roomsCount += 1;
      floorMap[r.floor].totalBeds += r.beds.length;
      floorMap[r.floor].occupiedBeds += r.beds.filter((b) => b.isOccupied).length;
    });

    const floorBreakdown = Object.values(floorMap).sort((a, b) => a.floor - b.floor);

    // Recent activities
    const recentStudents = await prisma.student.findMany({
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: { room: true, bed: true },
    });

    const recentPayments = await prisma.payment.findMany({
      take: 5,
      where: { status: 'PAID' },
      orderBy: { paymentDate: 'desc' },
      include: {
        student: {
          include: { room: true, bed: true },
        },
      },
    });

    const recentComplaints = await prisma.complaint.findMany({
      take: 4,
      orderBy: { createdAt: 'desc' },
    });

    const recentAnnouncements = await prisma.announcement.findMany({
      take: 3,
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const todayVisitors = await prisma.visitor.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    // Today's meal menu
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];
    const todayMenu = await prisma.mealMenu.findUnique({
      where: { dayOfWeek: currentDay },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalRooms,
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate,
        totalStudents,
        activeStudents,
        noticeStudents,
        leftStudents,
        currentMonth,
        fees: {
          expected: totalExpected,
          collected: totalCollected,
          pending: totalPending,
          paidCount,
          pendingCount,
          overdueCount,
        },
        pendingStudents: pendingStudentsList,
        floorBreakdown,
        recentStudents,
        recentPayments,
        recentComplaints,
        recentAnnouncements,
        todayVisitors,
        todayMenu,
      },
    });
  } catch (error) {
    console.error('Error in dashboard stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to calculate stats' }, { status: 500 });
  }
}
