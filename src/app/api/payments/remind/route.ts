import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { paymentId, channel } = await request.json(); // channel: 'WHATSAPP' | 'SMS' | 'EMAIL' | 'ALL'

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        student: {
          include: { room: true, bed: true },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const hostel = await prisma.hostelSetting.findFirst();
    const hostelName = hostel?.hostelName || 'Abhishek Boys Hostel';
    const upiId = hostel?.upiId || 'abhishekhostel@upi';
    const dueAmount = payment.amount - payment.amountPaid;

    // Build standard reminder text
    const messageText = `Dear ${payment.student.fullName},\n\nThis is a friendly fee reminder from *${hostelName}*.\n\n` +
      `📋 Room: ${payment.student.room?.roomNumber || '—'} / ${payment.student.bed?.bedNumber || '—'}\n` +
      `🗓️ Month: ${payment.month}\n` +
      `💰 Amount Due: ₹${dueAmount.toLocaleString('en-IN')}\n` +
      `⏰ Due Date: ${new Date(payment.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}\n` +
      `💳 UPI ID: ${upiId}\n\n` +
      `Please clear the dues and upload the payment receipt on the portal.\nThank you!`;

    // Clean phone number for WhatsApp link
    const cleanPhone = payment.student.phone.replace(/[^0-9]/g, '');
    const waPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const whatsappUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(messageText)}`;

    // Create a notification record in system
    await prisma.notification.create({
      data: {
        title: `Fee Reminder Sent: ${payment.student.fullName}`,
        message: `Reminder generated for ${payment.month} (₹${dueAmount.toLocaleString('en-IN')}) via ${channel || 'Portal/WhatsApp'}.`,
        type: 'FEE_DUE',
        link: '/fees',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Fee reminder prepared for ${payment.student.fullName}`,
      reminder: {
        studentName: payment.student.fullName,
        studentPhone: payment.student.phone,
        month: payment.month,
        dueAmount,
        dueDate: payment.dueDate,
        messageText,
        whatsappUrl,
        channel: channel || 'WHATSAPP',
        // Clear message stating that third-party SMS/WhatsApp gateway requires API credentials (Twilio/Gupshup)
        gatewayNotice: process.env.WHATSAPP_API_KEY
          ? 'Live gateway configured'
          : 'Third-party SMS/WhatsApp direct gateway is not configured with an API key. You can use the generated WhatsApp Web link or copy the formatted reminder message.',
      },
    });
  } catch (error) {
    console.error('Error sending fee reminder:', error);
    return NextResponse.json({ error: 'Failed to process fee reminder' }, { status: 500 });
  }
}
