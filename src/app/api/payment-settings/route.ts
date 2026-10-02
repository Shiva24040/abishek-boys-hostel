import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let setting = await prisma.paymentSetting.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!setting) {
      setting = await prisma.paymentSetting.create({
        data: {
          upiId: 'abhishekhostel@upi',
          phoneNumber: '9059860870',
          paymentName: 'Abhishek Boys Hostel',
          qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=abhishekhostel@upi&pn=Abhishek%20Boys%20Hostel&cu=INR',
          instructions: 'Pay the monthly hostel fee using the above UPI ID or Phone number. Upload your transaction screenshot or receipt for instant verification.',
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      paymentSetting: setting,
    });
  } catch (error: any) {
    console.error('Error fetching payment settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch payment settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { upiId, phoneNumber, paymentName, qrCodeUrl, instructions, isActive } = body;

    if (!upiId || !phoneNumber || !paymentName) {
      return NextResponse.json({ success: false, error: 'UPI ID, Phone Number, and Payment Name are required.' }, { status: 400 });
    }

    let setting = await prisma.paymentSetting.findFirst();

    if (setting) {
      setting = await prisma.paymentSetting.update({
        where: { id: setting.id },
        data: {
          upiId: String(upiId).trim(),
          phoneNumber: String(phoneNumber).trim(),
          paymentName: String(paymentName).trim(),
          qrCodeUrl: qrCodeUrl !== undefined ? qrCodeUrl : setting.qrCodeUrl,
          instructions: instructions !== undefined ? String(instructions).trim() : setting.instructions,
          isActive: typeof isActive === 'boolean' ? isActive : true,
        },
      });
    } else {
      setting = await prisma.paymentSetting.create({
        data: {
          upiId: String(upiId).trim(),
          phoneNumber: String(phoneNumber).trim(),
          paymentName: String(paymentName).trim(),
          qrCodeUrl: qrCodeUrl || null,
          instructions: instructions ? String(instructions).trim() : null,
          isActive: typeof isActive === 'boolean' ? isActive : true,
        },
      });
    }

    // Keep HostelSetting in sync as well
    try {
      await prisma.hostelSetting.updateMany({
        data: {
          upiId: setting.upiId,
          phone: setting.phoneNumber,
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Payment settings successfully updated.',
      paymentSetting: setting,
    });
  } catch (error: any) {
    console.error('Error updating payment settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update payment settings' }, { status: 500 });
  }
}

