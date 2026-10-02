import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

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
        documents: true,
      },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student profile not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      student,
      user,
    });
  } catch (error: any) {
    console.error('Error fetching student profile:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch student profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.student.findFirst({
      where: {
        OR: [
          ...(user.studentId ? [{ id: user.studentId }] : []),
          { email: user.email },
          ...(user.phone ? [{ phone: user.phone }] : []),
        ],
      },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student profile not found.' }, { status: 404 });
    }

    const body = await request.json();
    const {
      dob,
      gender,
      branch,
      phone,
      emergencyContact,
      address,
      city,
      district,
      state,
      pincode,
      parentName,
      parentPhone,
      profilePhoto,
    } = body;

    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: {
        dob: dob ? new Date(dob) : student.dob,
        gender: gender || student.gender,
        branch: branch !== undefined ? branch : student.branch,
        phone: phone !== undefined ? phone.trim() : student.phone,
        emergencyContact: emergencyContact !== undefined ? emergencyContact.trim() : student.emergencyContact,
        address: address !== undefined ? address.trim() : student.address,
        city: city !== undefined ? city.trim() : student.city,
        district: district !== undefined ? district.trim() : student.district,
        state: state !== undefined ? state.trim() : student.state,
        pincode: pincode !== undefined ? pincode.trim() : student.pincode,
        parentName: parentName !== undefined ? parentName.trim() : student.parentName,
        parentPhone: parentPhone !== undefined ? parentPhone.trim() : student.parentPhone,
        profilePhoto: profilePhoto !== undefined ? profilePhoto : student.profilePhoto,
      },
      include: {
        room: true,
        bed: true,
      },
    });

    // Also sync User phone & avatar if updated
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          phone: phone ? phone.trim() : user.phone,
          avatar: profilePhoto || user.avatar,
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully.',
      student: updatedStudent,
    });
  } catch (error: any) {
    console.error('Error updating student profile:', error);
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}

