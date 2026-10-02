import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashToken, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { token, email, newPassword, confirmPassword } = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing password reset token.' },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Password and Confirm Password do not match.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        identifier: cleanEmail,
        type: 'PASSWORD_RESET',
      },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired password reset request. Please request a new one.' },
        { status: 400 }
      );
    }

    if (new Date() > new Date(tokenRecord.expiresAt)) {
      await prisma.verificationToken.delete({ where: { id: tokenRecord.id } });
      return NextResponse.json(
        { success: false, error: 'Password reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    const expectedHash = hashToken(token);
    if (tokenRecord.tokenHash !== expectedHash) {
      return NextResponse.json(
        { success: false, error: 'Invalid reset token signature.' },
        { status: 400 }
      );
    }

    // Hash new password and update user
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { email: cleanEmail },
      data: {
        passwordHash,
        updatedAt: new Date(),
      },
    });

    // Delete used token
    await prisma.verificationToken.delete({ where: { id: tokenRecord.id } });

    return NextResponse.json({
      success: true,
      message: 'Your password has been successfully reset. You may now log in with your new password.',
    });
  } catch (err: any) {
    console.error('Password reset error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to reset password. Please try again.' },
      { status: 500 }
    );
  }
}
