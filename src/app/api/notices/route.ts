import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get('all') === 'true';
    const user = await getCurrentUser();

    // If admin requested all notices (e.g. for management page)
    if (includeAll && user?.role === 'ADMIN') {
      const notices = await prisma.hostelNotice.findMany({
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      });
      return NextResponse.json({ success: true, notices, isAdmin: true });
    }

    // For students / default feed: return only active & non-expired notices
    const now = new Date();
    const notices = await prisma.hostelNotice.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ success: true, notices, isAdmin: user?.role === 'ADMIN' });
  } catch (error: any) {
    console.error('Error fetching notices:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch notices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, category, priority, publishedAt, expiresAt, attachmentUrl, isActive } = body;

    if (!title || !description) {
      return NextResponse.json({ success: false, error: 'Notice title and description are required.' }, { status: 400 });
    }

    const notice = await prisma.hostelNotice.create({
      data: {
        title: String(title).trim(),
        description: String(description).trim(),
        category: category || 'GENERAL',
        priority: priority || 'NORMAL',
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        attachmentUrl: attachmentUrl || null,
        isActive: typeof isActive === 'boolean' ? isActive : true,
        createdBy: user.name || 'Mahesh (Chief Warden)',
      },
    });

    // Create system notification for all students
    try {
      await prisma.notification.create({
        data: {
          title: `📢 New Notice: ${notice.title}`,
          message: notice.description.slice(0, 120) + (notice.description.length > 120 ? '...' : ''),
          type: 'ANNOUNCEMENT',
          link: '/student?tab=notices',
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Notice successfully published.',
      notice,
    });
  } catch (error: any) {
    console.error('Error creating notice:', error);
    return NextResponse.json({ success: false, error: 'Failed to create notice' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { id, title, description, category, priority, publishedAt, expiresAt, attachmentUrl, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Notice ID is required.' }, { status: 400 });
    }

    const existing = await prisma.hostelNotice.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Notice not found.' }, { status: 404 });
    }

    const updated = await prisma.hostelNotice.update({
      where: { id },
      data: {
        title: title !== undefined ? String(title).trim() : existing.title,
        description: description !== undefined ? String(description).trim() : existing.description,
        category: category || existing.category,
        priority: priority || existing.priority,
        publishedAt: publishedAt ? new Date(publishedAt) : existing.publishedAt,
        expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : existing.expiresAt,
        attachmentUrl: attachmentUrl !== undefined ? attachmentUrl : existing.attachmentUrl,
        isActive: typeof isActive === 'boolean' ? isActive : existing.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Notice successfully updated.',
      notice: updated,
    });
  } catch (error: any) {
    console.error('Error updating notice:', error);
    return NextResponse.json({ success: false, error: 'Failed to update notice' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Notice ID is required.' }, { status: 400 });
    }

    await prisma.hostelNotice.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Notice successfully deleted.',
    });
  } catch (error: any) {
    console.error('Error deleting notice:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete notice' }, { status: 500 });
  }
}

