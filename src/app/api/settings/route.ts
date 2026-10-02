import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    let settings = await prisma.hostelSetting.findFirst();
    if (!settings) {
      settings = await prisma.hostelSetting.create({
        data: {
          id: 'default',
          hostelName: 'Abhishek Boys Hostel',
          tagline: 'Smart Hostel Management System',
        },
      });
    }
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      hostelName,
      tagline,
      address,
      phone,
      email,
      defaultMonthlyFee,
      feeDueDay,
      currency,
      upiId,
      bankAccount,
      rulesText,
    } = body;

    const existing = await prisma.hostelSetting.findFirst();
    const id = existing ? existing.id : 'default';

    const updated = await prisma.hostelSetting.upsert({
      where: { id },
      update: {
        hostelName: hostelName || undefined,
        tagline: tagline || undefined,
        address: address || undefined,
        phone: phone || undefined,
        email: email || undefined,
        defaultMonthlyFee: defaultMonthlyFee !== undefined ? parseFloat(defaultMonthlyFee) : undefined,
        feeDueDay: feeDueDay !== undefined ? parseInt(feeDueDay, 10) : undefined,
        currency: currency || undefined,
        upiId: upiId || undefined,
        bankAccount: bankAccount || undefined,
        rulesText: rulesText || undefined,
      },
      create: {
        id: 'default',
        hostelName: hostelName || 'Abhishek Boys Hostel',
        tagline: tagline || 'Smart Hostel Management System',
        address: address || '',
        phone: phone || '',
        email: email || '',
        defaultMonthlyFee: defaultMonthlyFee ? parseFloat(defaultMonthlyFee) : 5000,
        feeDueDay: feeDueDay ? parseInt(feeDueDay, 10) : 5,
        currency: currency || '₹',
        upiId: upiId || 'abhishekhostel@upi',
        bankAccount: bankAccount || '',
        rulesText: rulesText || '',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Hostel settings updated successfully.',
      settings: updated,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
