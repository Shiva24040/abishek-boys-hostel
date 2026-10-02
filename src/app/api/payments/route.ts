import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const status = searchParams.get('status');
    const studentId = searchParams.get('studentId');
    const search = searchParams.get('search');

    const where: any = {};
    if (month && month !== 'ALL') {
      where.month = month;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (studentId) {
      where.studentId = studentId;
    }
    if (search) {
      where.student = {
        OR: [
          { fullName: { contains: search } },
          { studentId: { contains: search } },
          { phone: { contains: search } },
        ],
      };
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
      include: {
        student: {
          include: {
            room: true,
            bed: true,
          },
        },
        receipt: true,
      },
    });

    const formatted = payments.map((p) => ({
      id: p.id,
      studentId: p.studentId,
      studentName: p.student.fullName,
      studentCode: p.student.studentId,
      roomNumber: p.student.room?.roomNumber || '—',
      bedNumber: p.student.bed?.bedNumber || '—',
      month: p.month,
      monthIndex: p.monthIndex,
      year: p.year,
      amount: p.amount,
      amountPaid: p.amountPaid,
      dueDate: p.dueDate.toISOString(),
      paymentDate: p.paymentDate ? p.paymentDate.toISOString() : null,
      status: p.status,
      paymentMethod: p.paymentMethod,
      transactionId: p.transactionId,
      remarks: p.remarks,
      receipt: p.receipt
        ? {
            id: p.receipt.id,
            fileUrl: p.receipt.fileUrl,
            fileName: p.receipt.fileName,
            status: p.receipt.status,
            paymentDate: p.receipt.paymentDate.toISOString(),
          }
        : null,
    }));

    return NextResponse.json({ success: true, payments: formatted });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      paymentId,
      studentId,
      month,
      amountPaid,
      paymentMethod,
      transactionId,
      paymentDate,
      remarks,
      receiptUrl,
    } = body;

    const parsedAmount = parseFloat(amountPaid);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required' }, { status: 400 });
    }

    let targetPayment;

    if (paymentId) {
      targetPayment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { student: { include: { room: true } } },
      });
    } else if (studentId && month) {
      targetPayment = await prisma.payment.findFirst({
        where: { studentId, month },
        include: { student: { include: { room: true } } },
      });
    }

    if (!targetPayment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    const newAmountPaid = (targetPayment.amountPaid || 0) + parsedAmount;
    let newStatus = 'PAID';
    if (newAmountPaid < targetPayment.amount) {
      newStatus = 'PARTIALLY_PAID';
    }

    const payDate = paymentDate ? new Date(paymentDate) : new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: targetPayment.id },
        data: {
          amountPaid: newAmountPaid,
          paymentDate: payDate,
          paymentMethod: paymentMethod || 'UPI',
          transactionId: transactionId || `TXN${Date.now().toString().slice(-8)}`,
          status: newStatus,
          remarks: remarks || `Payment received on ${payDate.toLocaleDateString()}`,
        },
        include: { student: true },
      });

      // If receipt is provided, link it
      if (receiptUrl) {
        await tx.receipt.create({
          data: {
            paymentId: p.id,
            studentId: p.studentId,
            month: p.month,
            amount: parsedAmount,
            paymentDate: payDate,
            paymentMethod: paymentMethod || 'UPI',
            transactionId: transactionId || `TXN${Date.now().toString().slice(-8)}`,
            fileUrl: receiptUrl,
            fileName: `Receipt_${p.month.replace(' ', '_')}_${p.student.studentId}.pdf`,
            fileSize: 104857,
            status: 'APPROVED',
            adminNotes: 'Auto-verified with recorded payment',
          },
        });
      }

      // Create notification
      await tx.notification.create({
        data: {
          title: 'Payment Received',
          message: `₹${parsedAmount.toLocaleString('en-IN')} received from ${p.student.fullName} for ${p.month}.`,
          type: 'PAYMENT_RECEIVED',
          link: `/payments`,
        },
      });

      return p;
    });

    return NextResponse.json({
      success: true,
      message: `Payment of ₹${parsedAmount.toLocaleString('en-IN')} successfully recorded.`,
      payment: updated,
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
