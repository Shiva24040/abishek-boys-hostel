import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || 'October 2026';

    // 1. Occupancy Data
    const rooms = await prisma.room.findMany({
      include: {
        beds: {
          include: { student: true },
        },
      },
    });

    const totalRooms = rooms.length;
    let totalBeds = 0;
    let occupiedBeds = 0;

    const roomDetails = rooms.map((r) => {
      const occ = r.beds.filter((b) => b.isOccupied).length;
      totalBeds += r.beds.length;
      occupiedBeds += occ;
      return {
        roomNumber: r.roomNumber,
        floor: r.floor,
        totalBeds: r.beds.length,
        occupiedBeds: occ,
        availableBeds: r.beds.length - occ,
        occupants: r.beds.filter((b) => b.isOccupied && b.student).map((b) => b.student?.fullName).join(', '),
      };
    });

    // 2. Fee Data for selected month
    const payments = await prisma.payment.findMany({
      where: { month },
      include: {
        student: {
          include: { room: true, bed: true },
        },
      },
    });

    let totalExpected = 0;
    let totalCollected = 0;
    let overdueAmount = 0;

    payments.forEach((p) => {
      totalExpected += p.amount;
      totalCollected += p.amountPaid;
      if (p.status === 'OVERDUE') {
        overdueAmount += (p.amount - p.amountPaid);
      }
    });

    const totalPending = Math.max(0, totalExpected - totalCollected);

    // 3. Student Statistics
    const activeStudents = await prisma.student.count({ where: { status: 'ACTIVE' } });
    const noticeStudents = await prisma.student.count({ where: { status: 'NOTICE_PERIOD' } });
    const leftStudents = await prisma.student.count({ where: { status: 'LEFT' } });

    // College distribution
    const allStudents = await prisma.student.findMany({
      select: { collegeName: true, status: true },
    });

    const collegeDist: { [key: string]: number } = {};
    allStudents.forEach((s) => {
      if (s.status !== 'LEFT') {
        collegeDist[s.collegeName] = (collegeDist[s.collegeName] || 0) + 1;
      }
    });

    return NextResponse.json({
      success: true,
      reportMonth: month,
      occupancy: {
        totalRooms,
        totalBeds,
        occupiedBeds,
        availableBeds: totalBeds - occupiedBeds,
        rate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
        roomDetails,
      },
      fees: {
        totalExpected,
        totalCollected,
        totalPending,
        overdueAmount,
        collectionRate: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0,
        paymentRecords: payments.map((p) => ({
          studentName: p.student.fullName,
          studentId: p.student.studentId,
          room: p.student.room?.roomNumber || '—',
          bed: p.student.bed?.bedNumber || '—',
          amount: p.amount,
          amountPaid: p.amountPaid,
          status: p.status,
          paymentDate: p.paymentDate ? p.paymentDate.toISOString() : null,
          method: p.paymentMethod || '—',
        })),
      },
      students: {
        total: activeStudents + noticeStudents,
        active: activeStudents,
        notice: noticeStudents,
        left: leftStudents,
        collegeBreakdown: Object.entries(collegeDist).map(([name, count]) => ({ name, count })),
      },
    });
  } catch (error) {
    console.error('Error generating reports:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
