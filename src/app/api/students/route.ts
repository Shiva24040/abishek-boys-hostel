import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const roomId = searchParams.get('roomId');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (roomId && roomId !== 'ALL') {
      where.roomId = roomId;
    }
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { studentId: { contains: search } },
        { phone: { contains: search } },
        { collegeName: { contains: search } },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        room: true,
        bed: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const formatted = students.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      fullName: s.fullName,
      phone: s.phone,
      email: s.email,
      parentName: s.parentName,
      parentPhone: s.parentPhone,
      collegeName: s.collegeName,
      course: s.course,
      year: s.year,
      roomId: s.roomId,
      roomNumber: s.room?.roomNumber || '—',
      bedId: s.bedId,
      bedNumber: s.bed?.bedNumber || '—',
      joiningDate: s.joiningDate.toISOString(),
      leavingDate: s.leavingDate ? s.leavingDate.toISOString() : null,
      address: s.address,
      emergencyContact: s.emergencyContact,
      profilePhoto: s.profilePhoto,
      status: s.status,
      monthlyFee: s.monthlyFee,
      securityDeposit: s.securityDeposit,
      latestPayment: s.payments[0]
        ? {
            month: s.payments[0].month,
            amount: s.payments[0].amount,
            status: s.payments[0].status,
            dueDate: s.payments[0].dueDate.toISOString(),
          }
        : null,
    }));

    return NextResponse.json({ success: true, students: formatted });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fullName,
      phone,
      email,
      parentName,
      parentPhone,
      collegeName,
      course,
      year,
      roomId,
      bedId,
      joiningDate,
      address,
      emergencyContact,
      profilePhoto,
      idProofType,
      monthlyFee,
      securityDeposit,
    } = body;

    if (!fullName || !phone || !parentName || !parentPhone || !collegeName || !course || !bedId) {
      return NextResponse.json(
        { error: 'Please fill all required resident information and select an available bed.' },
        { status: 400 }
      );
    }

    // Verify bed is available
    const bed = await prisma.bed.findUnique({
      where: { id: bedId },
      include: { room: true },
    });

    if (!bed) {
      return NextResponse.json({ error: 'Selected bed does not exist' }, { status: 404 });
    }

    if (bed.isOccupied) {
      return NextResponse.json(
        { error: 'This bed is already occupied. Please select an available bed.' },
        { status: 400 }
      );
    }

    // Generate unique student ID (e.g. ABH-2026-014)
    const count = await prisma.student.count();
    const studentSeq = String(count + 1).padStart(3, '0');
    const studentIdCode = `ABH-2026-${studentSeq}`;

    const parsedMonthlyFee = monthlyFee ? parseFloat(monthlyFee) : 5000;
    const parsedDeposit = securityDeposit ? parseFloat(securityDeposit) : 5000;
    const parsedJoiningDate = joiningDate ? new Date(joiningDate) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      // Create student
      const student = await tx.student.create({
        data: {
          studentId: studentIdCode,
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email ? email.trim() : null,
          parentName: parentName.trim(),
          parentPhone: parentPhone.trim(),
          collegeName: collegeName.trim(),
          course: course.trim(),
          year: year || '1st Year',
          roomId: bed.roomId,
          bedId: bed.id,
          joiningDate: parsedJoiningDate,
          address: address ? address.trim() : 'Hostel Resident',
          emergencyContact: emergencyContact ? emergencyContact.trim() : parentPhone,
          profilePhoto: profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
          idProofType: idProofType || 'Aadhaar Card',
          idProofUrl: '/mock-id-proof.pdf',
          status: 'ACTIVE',
          monthlyFee: parsedMonthlyFee,
          securityDeposit: parsedDeposit,
        },
      });

      // Mark bed as occupied
      await tx.bed.update({
        where: { id: bed.id },
        data: { isOccupied: true },
      });

      // Create initial fee entry for current month (October 2026)
      await tx.payment.create({
        data: {
          studentId: student.id,
          month: 'October 2026',
          monthIndex: 10,
          year: 2026,
          amount: parsedMonthlyFee,
          amountPaid: 0,
          dueDate: new Date('2026-10-05T00:00:00Z'),
          status: 'PENDING',
          remarks: 'Initial monthly hostel fee',
        },
      });

      // Add notification
      await tx.notification.create({
        data: {
          title: 'New Student Registered',
          message: `${student.fullName} (${student.studentId}) registered and assigned to Room ${bed.room.roomNumber} - ${bed.bedNumber}.`,
          type: 'STUDENT_REGISTERED',
          link: `/students/${student.id}`,
        },
      });

      // Automatically link or create User account for login access
      try {
        const existingUser = await tx.user.findFirst({
          where: {
            OR: [
              ...(student.email ? [{ email: student.email }] : []),
              { phone: student.phone },
            ],
          },
        });

        if (existingUser) {
          await tx.user.update({
            where: { id: existingUser.id },
            data: { studentId: student.id },
          });
        } else {
          const defaultPasswordHash = await hashPassword('StudentPassword@2026');
          await tx.user.create({
            data: {
              email: student.email || `${student.studentId.toLowerCase()}@abhishekhostel.com`,
              passwordHash: defaultPasswordHash,
              name: student.fullName,
              role: 'STUDENT',
              phone: student.phone,
              studentId: student.id,
              isActive: true,
              emailVerified: student.email ? new Date() : null,
              phoneVerified: new Date(),
            },
          });
        }
      } catch (userErr) {
        console.warn('Could not auto-create User account for student:', userErr);
      }

      return student;
    });

    return NextResponse.json({ success: true, student: result });
  } catch (error) {
    console.error('Error registering student:', error);
    return NextResponse.json({ error: 'Failed to register student' }, { status: 500 });
  }
}
