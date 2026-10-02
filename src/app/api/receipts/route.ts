import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const studentId = searchParams.get('studentId');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (studentId) {
      where.studentId = studentId;
    }

    const receipts = await prisma.receipt.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          include: { room: true, bed: true },
        },
        payment: true,
      },
    });

    const formatted = receipts.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      studentName: r.student.fullName,
      studentCode: r.student.studentId,
      roomNumber: r.student.room?.roomNumber || '—',
      bedNumber: r.student.bed?.bedNumber || '—',
      month: r.month,
      amount: r.amount,
      paymentDate: r.paymentDate.toISOString(),
      paymentMethod: r.paymentMethod,
      transactionId: r.transactionId,
      fileUrl: r.fileUrl,
      fileName: r.fileName,
      fileSize: r.fileSize,
      fileType: r.fileType,
      status: r.status,
      adminNotes: r.adminNotes,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, receipts: formatted });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let studentId = '';
    let paymentId: string | null = null;
    let month = '';
    let amount = '';
    let paymentDate = '';
    let paymentMethod = 'UPI';
    let transactionId = '';
    let fileUrl = '';
    let fileName = '';
    let fileType = 'image/jpeg';
    let fileSize = 1048576;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      studentId = (formData.get('studentId') as string) || '';
      paymentId = (formData.get('paymentId') as string) || null;
      month = (formData.get('month') as string) || '';
      amount = (formData.get('amount') as string) || '';
      paymentDate = (formData.get('paymentDate') as string) || '';
      paymentMethod = (formData.get('paymentMethod') as string) || 'UPI';
      transactionId = (formData.get('transactionId') as string) || '';

      const uploadedFile = formData.get('file') as File | null;
      if (uploadedFile && typeof uploadedFile === 'object' && 'arrayBuffer' in uploadedFile) {
        fileType = uploadedFile.type || 'image/jpeg';
        fileSize = uploadedFile.size || 1024;
        fileName = `${Date.now()}_${uploadedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        // Validate type & size
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(fileType)) {
          return NextResponse.json(
            { error: 'Invalid file format. Only JPG, PNG, WEBP, and PDF documents are allowed.' },
            { status: 400 }
          );
        }
        if (fileSize > 5 * 1024 * 1024) {
          return NextResponse.json({ error: 'File size exceeds maximum 5MB limit.' }, { status: 400 });
        }

        const bytes = await uploadedFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'receipts');
        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, fileName), buffer);
        fileUrl = `/uploads/receipts/${fileName}`;
      }
    } else {
      const body = await request.json();
      studentId = body.studentId || '';
      paymentId = body.paymentId || null;
      month = body.month || '';
      amount = body.amount !== undefined ? String(body.amount) : '';
      paymentDate = body.paymentDate || '';
      paymentMethod = body.paymentMethod || 'UPI';
      transactionId = body.transactionId || '';
      fileUrl = body.fileUrl || '';
      fileName = body.fileName || '';
      fileType = body.fileType || 'image/jpeg';
      fileSize = body.fileSize || 1048576;
    }

    if (!studentId || !month || !amount || !transactionId) {
      return NextResponse.json(
        { error: 'Student, month, amount, and transaction ID are required.' },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Default receipt preview if no file was uploaded
    if (!fileUrl) {
      fileUrl = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600';
    }
    if (!fileName) {
      fileName = `Receipt_${month.replace(/\s+/g, '_')}_${transactionId.trim()}.pdf`;
    }

    const receipt = await prisma.receipt.create({
      data: {
        studentId,
        paymentId: paymentId || null,
        month,
        amount: parseFloat(amount),
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMethod: paymentMethod || 'UPI',
        transactionId: transactionId.trim(),
        fileUrl,
        fileName,
        fileType,
        fileSize,
        status: 'PENDING',
        adminNotes: 'Uploaded by resident. Awaiting verification.',
      },
    });

    // Notify admin
    await prisma.notification.create({
      data: {
        title: 'New Receipt Uploaded',
        message: `${student.fullName} uploaded a payment receipt of ₹${parseFloat(amount).toLocaleString('en-IN')} for ${month}.`,
        type: 'PAYMENT_RECEIVED',
        link: '/receipts',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Receipt uploaded successfully. Admin will review and verify.',
      receipt,
    });
  } catch (error) {
    console.error('Error creating receipt:', error);
    return NextResponse.json({ error: 'Failed to upload receipt' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { receiptId, action, adminNotes } = await request.json(); // action: 'APPROVE' | 'REJECT'

    if (!receiptId || !action) {
      return NextResponse.json({ error: 'Receipt ID and action (APPROVE or REJECT) are required' }, { status: 400 });
    }

    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: { student: true, payment: true },
    });

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    await prisma.$transaction(async (tx) => {
      // Update receipt
      await tx.receipt.update({
        where: { id: receiptId },
        data: {
          status: newStatus,
          adminNotes: adminNotes || (action === 'APPROVE' ? 'Verified by Admin' : 'Rejected - Details could not be verified'),
        },
      });

      // If approved, update matching payment record
      if (action === 'APPROVE') {
        let targetPaymentId = receipt.paymentId;
        if (!targetPaymentId) {
          const matchPayment = await tx.payment.findFirst({
            where: { studentId: receipt.studentId, month: receipt.month },
          });
          if (matchPayment) {
            targetPaymentId = matchPayment.id;
          }
        }

        if (targetPaymentId) {
          await tx.payment.update({
            where: { id: targetPaymentId },
            data: {
              status: 'PAID',
              amountPaid: receipt.amount,
              paymentDate: receipt.paymentDate,
              paymentMethod: receipt.paymentMethod,
              transactionId: receipt.transactionId,
            },
          });
        }
      }

      // Add notification for the student
      await tx.notification.create({
        data: {
          title: `Receipt ${action === 'APPROVE' ? 'Approved' : 'Rejected'}`,
          message: `Receipt for ${receipt.month} (₹${receipt.amount.toLocaleString('en-IN')}) was ${action === 'APPROVE' ? 'approved' : 'rejected'}.`,
          type: 'PAYMENT_RECEIVED',
          link: '/receipts',
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Receipt has been marked as ${newStatus}.`,
    });
  } catch (error) {
    console.error('Error updating receipt:', error);
    return NextResponse.json({ error: 'Failed to update receipt' }, { status: 500 });
  }
}

