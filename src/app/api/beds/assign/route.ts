import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { studentId, bedId } = await request.json();

    if (!studentId || !bedId) {
      return NextResponse.json({ error: 'Student ID and Bed ID are required' }, { status: 400 });
    }

    const bed = await prisma.bed.findUnique({
      where: { id: bedId },
      include: { room: true },
    });

    if (!bed) {
      return NextResponse.json({ error: 'Bed not found' }, { status: 404 });
    }

    if (bed.isOccupied) {
      return NextResponse.json({ error: 'This bed is already occupied by another student.' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // If student was already assigned to another bed, free the old bed
    await prisma.$transaction(async (tx) => {
      if (student.bedId && student.bedId !== bedId) {
        await tx.bed.update({
          where: { id: student.bedId },
          data: { isOccupied: false },
        });
      }

      // Mark new bed as occupied
      await tx.bed.update({
        where: { id: bedId },
        data: { isOccupied: true },
      });

      // Update student
      await tx.student.update({
        where: { id: studentId },
        data: {
          bedId: bedId,
          roomId: bed.roomId,
          status: 'ACTIVE',
        },
      });

      // Ensure active fee record exists for current month
      const existingPayment = await tx.payment.findFirst({
        where: { studentId, month: 'October 2026' },
      });
      if (!existingPayment) {
        await tx.payment.create({
          data: {
            studentId,
            month: 'October 2026',
            monthIndex: 10,
            year: 2026,
            amount: student.monthlyFee || 5000,
            amountPaid: 0,
            dueDate: new Date('2026-10-05T00:00:00Z'),
            status: 'PENDING',
            remarks: 'Hostel fee generated upon bed allocation',
          },
        });
      }

      // Notification
      await tx.notification.create({
        data: {
          title: 'Bed Assigned',
          message: `${student.fullName} was allocated Bed ${bed.bedNumber} in Room ${bed.room.roomNumber}.`,
          type: 'BED_VACANCY',
          link: '/rooms',
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Bed ${bed.bedNumber} in Room ${bed.room.roomNumber} successfully assigned to ${student.fullName}.`,
    });
  } catch (error) {
    console.error('Error assigning bed:', error);
    return NextResponse.json({ error: 'Failed to assign bed' }, { status: 500 });
  }
}
