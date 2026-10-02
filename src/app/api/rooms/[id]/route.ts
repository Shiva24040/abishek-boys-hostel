import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        beds: {
          orderBy: { bedNumber: 'asc' },
          include: {
            student: {
              include: {
                payments: {
                  where: { month: 'October 2026' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const occupiedCount = room.beds.filter((b) => b.isOccupied).length;
    const availableCount = room.beds.length - occupiedCount;

    return NextResponse.json({
      success: true,
      room: {
        ...room,
        occupiedCount,
        availableCount,
      },
    });
  } catch (error) {
    console.error('Error fetching room details:', error);
    return NextResponse.json({ error: 'Failed to fetch room' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { floor, roomType, amenities, notes } = body;

    const updated = await prisma.room.update({
      where: { id },
      data: {
        floor: floor !== undefined ? parseInt(floor, 10) : undefined,
        roomType: roomType || undefined,
        amenities: amenities || undefined,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    return NextResponse.json({ success: true, room: updated });
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Check if any bed in this room is occupied
    const occupiedBeds = await prisma.bed.findFirst({
      where: {
        roomId: id,
        isOccupied: true,
      },
    });

    if (occupiedBeds) {
      return NextResponse.json(
        { error: 'Cannot delete room because it currently has active residents. Please reassign or check out the students first.' },
        { status: 400 }
      );
    }

    await prisma.room.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
  }
}
