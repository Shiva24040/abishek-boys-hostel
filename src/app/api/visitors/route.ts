import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const visitors = await prisma.visitor.findMany({
      orderBy: { visitDate: 'desc' },
      include: { student: true },
    });

    const formatted = visitors.map((v) => ({
      id: v.id,
      visitorName: v.visitorName,
      phone: v.phone,
      studentId: v.studentId,
      studentName: v.studentName,
      roomNumber: v.roomNumber,
      visitDate: v.visitDate.toISOString(),
      entryTime: v.entryTime,
      exitTime: v.exitTime,
      purpose: v.purpose,
      idProofType: v.idProofType,
    }));

    return NextResponse.json({ success: true, visitors: formatted });
  } catch (error) {
    console.error('Error fetching visitors:', error);
    return NextResponse.json({ error: 'Failed to fetch visitors' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { visitorName, phone, studentId, studentName, roomNumber, entryTime, purpose, idProofType } = body;

    if (!visitorName || !phone || !studentName) {
      return NextResponse.json({ error: 'Visitor name, phone, and resident name are required' }, { status: 400 });
    }

    const now = new Date();
    const currentTimeStr = entryTime || now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const visitor = await prisma.visitor.create({
      data: {
        visitorName: visitorName.trim(),
        phone: phone.trim(),
        studentId: studentId || null,
        studentName: studentName.trim(),
        roomNumber: roomNumber || '—',
        visitDate: now,
        entryTime: currentTimeStr,
        purpose: purpose || 'Personal Visit',
        idProofType: idProofType || 'Aadhaar / ID Card',
      },
    });

    return NextResponse.json({ success: true, visitor });
  } catch (error) {
    console.error('Error logging visitor:', error);
    return NextResponse.json({ error: 'Failed to log visitor' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, exitTime } = body;

    if (!id) {
      return NextResponse.json({ error: 'Visitor ID is required' }, { status: 400 });
    }

    const now = new Date();
    const currentTimeStr = exitTime || now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const updated = await prisma.visitor.update({
      where: { id },
      data: {
        exitTime: currentTimeStr,
      },
    });

    return NextResponse.json({ success: true, visitor: updated });
  } catch (error) {
    console.error('Error logging visitor departure:', error);
    return NextResponse.json({ error: 'Failed to record visitor exit' }, { status: 500 });
  }
}
