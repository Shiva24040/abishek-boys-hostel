import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (category && category !== 'ALL') where.category = category;
    if (priority && priority !== 'ALL') where.priority = priority;

    const complaints = await prisma.complaint.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            studentId: true,
          },
        },
      },
    });

    const formatted = complaints.map((c) => ({
      id: c.id,
      studentId: c.studentId,
      studentName: c.studentName,
      roomNumber: c.roomNumber,
      title: c.title,
      description: c.description,
      category: c.category,
      priority: c.priority,
      status: c.status,
      resolutionNotes: c.resolutionNotes,
      createdAt: c.createdAt.toISOString(),
      resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null,
    }));

    return NextResponse.json({ success: true, complaints: formatted });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentName, roomNumber, title, description, category, priority, studentId } = body;

    if (!title || !description || !roomNumber || !studentName) {
      return NextResponse.json({ error: 'Title, description, room number, and student name are required' }, { status: 400 });
    }

    const complaint = await prisma.complaint.create({
      data: {
        studentId: studentId || null,
        studentName: studentName.trim(),
        roomNumber: String(roomNumber).trim(),
        title: title.trim(),
        description: description.trim(),
        category: category || 'OTHER',
        priority: priority || 'MEDIUM',
        status: 'OPEN',
      },
    });

    await prisma.notification.create({
      data: {
        title: 'New Complaint Logged',
        message: `${studentName} (Room ${roomNumber}) logged complaint: "${title}".`,
        type: 'COMPLAINT_CREATED',
        link: '/complaints',
      },
    });

    return NextResponse.json({ success: true, complaint });
  } catch (error) {
    console.error('Error creating complaint:', error);
    return NextResponse.json({ error: 'Failed to lodge complaint' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, resolutionNotes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Complaint ID and status are required' }, { status: 400 });
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status,
        resolutionNotes: resolutionNotes || undefined,
        resolvedAt: status === 'RESOLVED' ? new Date() : null,
      },
    });

    if (status === 'RESOLVED') {
      await prisma.notification.create({
        data: {
          title: 'Complaint Resolved',
          message: `Complaint #${updated.roomNumber} - "${updated.title}" marked as resolved.`,
          type: 'COMPLAINT_RESOLVED',
          link: '/complaints',
        },
      });
    }

    return NextResponse.json({ success: true, complaint: updated });
  } catch (error) {
    console.error('Error updating complaint:', error);
    return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 });
  }
}
