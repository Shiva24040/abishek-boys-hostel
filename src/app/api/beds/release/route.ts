import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { bedId } = await request.json();

    if (!bedId) {
      return NextResponse.json({ error: 'Bed ID is required' }, { status: 400 });
    }

    const bed = await prisma.bed.findUnique({
      where: { id: bedId },
      include: { student: true, room: true },
    });

    if (!bed) {
      return NextResponse.json({ error: 'Bed not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Mark bed available
      await tx.bed.update({
        where: { id: bedId },
        data: { isOccupied: false },
      });

      // If student was on this bed, detach and mark as LEFT or unassigned
      if (bed.student) {
        await tx.student.update({
          where: { id: bed.student.id },
          data: {
            bedId: null,
            roomId: null,
            status: 'LEFT',
            leavingDate: new Date(),
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `Bed ${bed.bedNumber} in Room ${bed.room.roomNumber} has been vacated and is now available.`,
    });
  } catch (error) {
    console.error('Error releasing bed:', error);
    return NextResponse.json({ error: 'Failed to release bed' }, { status: 500 });
  }
}
