import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        room: true,
        bed: true,
        payments: {
          orderBy: { dueDate: 'desc' },
          include: { receipt: true },
        },
        receipts: {
          orderBy: { paymentDate: 'desc' },
        },
        complaints: {
          orderBy: { createdAt: 'desc' },
        },
        visitors: {
          orderBy: { visitDate: 'desc' },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, student });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return NextResponse.json({ error: 'Failed to fetch student' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
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
      address,
      emergencyContact,
      status,
      monthlyFee,
      bedId,
    } = body;

    const currentStudent = await prisma.student.findUnique({
      where: { id },
    });

    if (!currentStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Handle bed change if bedId is different
    if (bedId && bedId !== currentStudent.bedId) {
      const newBed = await prisma.bed.findUnique({
        where: { id: bedId },
      });

      if (!newBed) {
        return NextResponse.json({ error: 'New bed not found' }, { status: 404 });
      }

      if (newBed.isOccupied) {
        return NextResponse.json({ error: 'Selected bed is already occupied' }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        // Free old bed
        if (currentStudent.bedId) {
          await tx.bed.update({
            where: { id: currentStudent.bedId },
            data: { isOccupied: false },
          });
        }
        // Occupy new bed
        await tx.bed.update({
          where: { id: bedId },
          data: { isOccupied: true },
        });
        // Update student
        await tx.student.update({
          where: { id },
          data: {
            fullName: fullName?.trim() || undefined,
            phone: phone?.trim() || undefined,
            email: email?.trim() || undefined,
            parentName: parentName?.trim() || undefined,
            parentPhone: parentPhone?.trim() || undefined,
            collegeName: collegeName?.trim() || undefined,
            course: course?.trim() || undefined,
            year: year || undefined,
            address: address?.trim() || undefined,
            emergencyContact: emergencyContact?.trim() || undefined,
            status: status || undefined,
            monthlyFee: monthlyFee ? parseFloat(monthlyFee) : undefined,
            roomId: newBed.roomId,
            bedId: newBed.id,
          },
        });
      });
    } else {
      await prisma.student.update({
        where: { id },
        data: {
          fullName: fullName?.trim() || undefined,
          phone: phone?.trim() || undefined,
          email: email?.trim() || undefined,
          parentName: parentName?.trim() || undefined,
          parentPhone: parentPhone?.trim() || undefined,
          collegeName: collegeName?.trim() || undefined,
          course: course?.trim() || undefined,
          year: year || undefined,
          address: address?.trim() || undefined,
          emergencyContact: emergencyContact?.trim() || undefined,
          status: status || undefined,
          monthlyFee: monthlyFee ? parseFloat(monthlyFee) : undefined,
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Student profile updated successfully' });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json({ error: 'Failed to update student profile' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const student = await prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      if (student.bedId) {
        await tx.bed.update({
          where: { id: student.bedId },
          data: { isOccupied: false },
        });
      }
      await tx.student.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true, message: 'Student removed successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}
