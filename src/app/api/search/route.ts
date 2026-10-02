import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ success: true, results: { students: [], rooms: [] } });
    }

    // Search students
    const students = await prisma.student.findMany({
      where: {
        OR: [
          { fullName: { contains: q } },
          { studentId: { contains: q } },
          { phone: { contains: q } },
          { collegeName: { contains: q } },
        ],
      },
      take: 6,
      include: {
        room: true,
        bed: true,
      },
    });

    // Search rooms
    const rooms = await prisma.room.findMany({
      where: {
        OR: [
          { roomNumber: { contains: q } },
          { roomType: { contains: q } },
        ],
      },
      take: 4,
      include: {
        beds: true,
      },
    });

    const formattedStudents = students.map((s) => ({
      id: s.id,
      title: s.fullName,
      subtitle: `${s.studentId} • Room ${s.room?.roomNumber || '—'} (${s.bed?.bedNumber || '—'})`,
      badge: s.status,
      type: 'STUDENT',
      link: `/students/${s.id}`,
    }));

    const formattedRooms = rooms.map((r) => ({
      id: r.id,
      title: `Room ${r.roomNumber}`,
      subtitle: `Floor ${r.floor} • ${r.roomType} (${r.beds.filter((b) => b.isOccupied).length}/${r.totalBeds} Occupied)`,
      badge: `${r.totalBeds - r.beds.filter((b) => b.isOccupied).length} Available`,
      type: 'ROOM',
      link: `/rooms`,
    }));

    return NextResponse.json({
      success: true,
      results: {
        students: formattedStudents,
        rooms: formattedRooms,
      },
    });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
}
