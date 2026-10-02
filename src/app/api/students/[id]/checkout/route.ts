import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const { checkoutDate, remarks } = body;

    const student = await prisma.student.findUnique({
      where: { id },
      include: { bed: true, room: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (student.status === 'LEFT') {
      return NextResponse.json({ error: 'Student is already checked out.' }, { status: 400 });
    }

    const leavingDate = checkoutDate ? new Date(checkoutDate) : new Date();

    await prisma.$transaction(async (tx) => {
      // Free the bed
      if (student.bedId) {
        await tx.bed.update({
          where: { id: student.bedId },
          data: { isOccupied: false },
        });
      }

      // Update student status to LEFT while preserving room/bed historical info in remarks
      const histRemark = `Checked out on ${leavingDate.toLocaleDateString()}. Previous Room: ${student.room?.roomNumber || 'N/A'}, Bed: ${student.bed?.bedNumber || 'N/A'}. ${remarks || ''}`.trim();

      await tx.student.update({
        where: { id },
        data: {
          status: 'LEFT',
          leavingDate: leavingDate,
          bedId: null,
          roomId: null,
          remarks: student.remarks ? `${student.remarks} | ${histRemark}` : histRemark,
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          title: 'Student Checked Out',
          message: `${student.fullName} has checked out. Bed ${student.bed?.bedNumber} in Room ${student.room?.roomNumber} is now available.`,
          type: 'BED_VACANCY',
          link: '/rooms',
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `${student.fullName} has been successfully checked out. Bed is now available for new admissions.`,
    });
  } catch (error) {
    console.error('Error checking out student:', error);
    return NextResponse.json({ error: 'Failed to process checkout' }, { status: 500 });
  }
}
