import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateIndianPhone, hashToken, signToken, setSessionCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { phone, otp, autoLogin = true } = await request.json();

    const phoneCheck = validateIndianPhone(phone);
    if (!phoneCheck.isValid) {
      return NextResponse.json(
        { success: false, error: 'Enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    if (!otp || String(otp).trim().length !== 6) {
      return NextResponse.json(
        { success: false, error: 'Please enter the 6-digit OTP code.' },
        { status: 400 }
      );
    }

    const cleanOtp = String(otp).trim();
    const identifier = phoneCheck.normalized;

    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        identifier,
        type: 'PHONE_OTP',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { success: false, error: 'No active OTP found for this number. Please request an OTP first.' },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date() > new Date(tokenRecord.expiresAt)) {
      await prisma.verificationToken.delete({ where: { id: tokenRecord.id } });
      return NextResponse.json(
        { success: false, error: 'OTP expired. Request a new OTP.' },
        { status: 400 }
      );
    }

    // Check attempt limits
    if (tokenRecord.attempts >= 3) {
      await prisma.verificationToken.delete({ where: { id: tokenRecord.id } });
      return NextResponse.json(
        { success: false, error: 'Too many incorrect attempts. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Verify hash
    const expectedHash = hashToken(`${identifier}:${cleanOtp}`);
    if (tokenRecord.tokenHash !== expectedHash) {
      await prisma.verificationToken.update({
        where: { id: tokenRecord.id },
        data: { attempts: tokenRecord.attempts + 1 },
      });
      const remaining = 3 - (tokenRecord.attempts + 1);
      return NextResponse.json(
        {
          success: false,
          error: `Incorrect OTP. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Please request a new OTP.'}`,
        },
        { status: 400 }
      );
    }

    // OTP is valid! Delete the used token
    await prisma.verificationToken.delete({ where: { id: tokenRecord.id } });

    // Find if user already exists with this phone
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: phoneCheck.normalized },
          { phone: phoneCheck.display },
          { phone: phone },
        ],
      },
      include: { student: true },
    });

    if (user) {
      // Mark phone as verified
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          phoneVerified: new Date(),
          lastLogin: new Date(),
        },
        include: { student: true },
      });

      if (!user.isActive) {
        return NextResponse.json(
          { success: false, error: 'This account has been deactivated. Please contact hostel administration.' },
          { status: 403 }
        );
      }

      const userSession = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: (user.role as any) || 'STUDENT',
        phone: user.phone || undefined,
        studentId: user.student?.id || user.studentId || undefined,
        avatar: user.avatar || undefined,
      };

      const token = signToken(userSession, true);
      const redirectTo = user.role === 'ADMIN' ? '/admin' : '/student';

      const response = NextResponse.json({
        success: true,
        verified: true,
        user: userSession,
        redirectTo,
        message: 'Phone verified successfully.',
      });

      setSessionCookie(response.cookies, token, true);
      return response;
    }

    // If user does not exist yet (e.g. during phone verification flow before signup)
    return NextResponse.json({
      success: true,
      verified: true,
      phone: phoneCheck.display,
      normalizedPhone: phoneCheck.normalized,
      message: 'Phone verified successfully. You may proceed with registration.',
    });
  } catch (err: any) {
    console.error('Error verifying OTP:', err);
    return NextResponse.json(
      { success: false, error: 'Could not verify OTP. Please try again.' },
      { status: 500 }
    );
  }
}
