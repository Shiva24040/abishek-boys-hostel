import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, authenticated: false, user: null }, { status: 401 });
    }

    let studentProfile = null;
    if (user.role === 'STUDENT') {
      // Find linked student record
      const student = await prisma.student.findFirst({
        where: {
          OR: [
            ...(user.studentId ? [{ id: user.studentId }] : []),
            { email: user.email },
            ...(user.phone ? [{ phone: user.phone }] : []),
          ],
        },
        include: {
          room: true,
          bed: true,
          payments: {
            orderBy: [{ year: 'desc' }, { monthIndex: 'desc' }],
            include: { receipt: true },
          },
          complaints: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      studentProfile = student;
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user,
      studentProfile,
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch user session' }, { status: 500 });
  }
}

