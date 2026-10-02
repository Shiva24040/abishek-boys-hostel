import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const floor = searchParams.get('floor');
    const search = searchParams.get('search');

    const where: any = {};
    if (floor && floor !== 'ALL') {
      where.floor = parseInt(floor, 10);
    }
    if (search) {
      where.roomNumber = { contains: search };
    }

    const rooms = await prisma.room.findMany({
      where,
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
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

    const formattedRooms = rooms.map((room) => {
      const occupiedCount = room.beds.filter((b) => b.isOccupied).length;
      const availableCount = room.beds.length - occupiedCount;

      const bedsWithDetails = room.beds.map((bed) => ({
        id: bed.id,
        bedNumber: bed.bedNumber,
        roomId: bed.roomId,
        isOccupied: bed.isOccupied,
        student: bed.student
          ? {
              id: bed.student.id,
              studentId: bed.student.studentId,
              fullName: bed.student.fullName,
              phone: bed.student.phone,
              joiningDate: bed.student.joiningDate.toISOString(),
              monthlyFee: bed.student.monthlyFee,
              status: bed.student.status,
              latestPaymentStatus: bed.student.payments[0]?.status || 'PENDING',
            }
          : null,
      }));

      return {
        id: room.id,
        roomNumber: room.roomNumber,
        floor: room.floor,
        totalBeds: room.totalBeds,
        roomType: room.roomType,
        amenities: room.amenities,
        notes: room.notes,
        occupiedCount,
        availableCount,
        beds: bedsWithDetails,
      };
    });

    return NextResponse.json({ success: true, rooms: formattedRooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomNumber, floor, totalBeds, roomType, amenities, notes } = body;

    if (!roomNumber || !totalBeds || totalBeds < 1) {
      return NextResponse.json({ error: 'Room number and total beds (min 1) are required' }, { status: 400 });
    }

    const existing = await prisma.room.findUnique({
      where: { roomNumber: String(roomNumber).trim() },
    });

    if (existing) {
      return NextResponse.json({ error: `Room ${roomNumber} already exists` }, { status: 400 });
    }

    const bedCount = parseInt(totalBeds, 10);
    const parsedFloor = parseInt(floor, 10) || 1;

    // Create room and generate beds in a transaction
    const newRoom = await prisma.$transaction(async (tx) => {
      const room = await tx.room.create({
        data: {
          roomNumber: String(roomNumber).trim(),
          floor: parsedFloor,
          totalBeds: bedCount,
          roomType: roomType || 'Standard Non-AC',
          amenities: amenities || 'Ceiling Fan, Study Table, Wardrobe, Attached Bathroom, High-speed Wi-Fi',
          notes: notes || null,
        },
      });

      const bedPromises = [];
      for (let i = 1; i <= bedCount; i++) {
        bedPromises.push(
          tx.bed.create({
            data: {
              bedNumber: `Bed ${i}`,
              roomId: room.id,
              isOccupied: false,
            },
          })
        );
      }
      await Promise.all(bedPromises);
      return room;
    });

    // Record notification
    await prisma.notification.create({
      data: {
        title: 'New Room Created',
        message: `Room ${newRoom.roomNumber} with ${bedCount} beds added on Floor ${parsedFloor}.`,
        type: 'BED_VACANCY',
        link: '/rooms',
      },
    });

    return NextResponse.json({ success: true, room: newRoom });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
