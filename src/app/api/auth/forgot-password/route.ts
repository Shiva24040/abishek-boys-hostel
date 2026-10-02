import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { validateIndianPhone, hashToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { identifier } = await request.json();

    if (!identifier || !String(identifier).trim()) {
      return NextResponse.json(
        { success: false, error: 'Please provide your registered email address or phone number.' },
        { status: 400 }
      );
    }

    const trimmed = String(identifier).trim();
    const isEmail = trimmed.includes('@');
    const phoneCheck = validateIndianPhone(trimmed);

    let user = null;
    let targetIdentifier = '';

    if (isEmail) {
      targetIdentifier = trimmed.toLowerCase();
      user = await prisma.user.findUnique({ where: { email: targetIdentifier } });
    } else if (phoneCheck.isValid) {
      targetIdentifier = phoneCheck.normalized;
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: phoneCheck.normalized },
            { phone: phoneCheck.display },
            { phone: trimmed },
          ],
        },
      });
    }

    // Generic safe response to prevent user enumeration
    const genericResponse = {
      success: true,
      message: 'If an account exists with this detail, password reset instructions have been generated.',
    };

    if (!user) {
      return NextResponse.json(genericResponse);
    }

    // Clean old reset tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: user.email,
        type: 'PASSWORD_RESET',
      },
    });

    // Generate random secure token
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawResetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        tokenHash,
        type: 'PASSWORD_RESET',
        attempts: 0,
        expiresAt,
      },
    });

    const resetLink = `/reset-password?token=${rawResetToken}&email=${encodeURIComponent(user.email)}`;

    return NextResponse.json({
      success: true,
      message: 'Password reset link generated.',
      resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined,
    });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    return NextResponse.json(
      { success: false, error: 'An error occurred while processing your request.' },
      { status: 500 }
    );
  }
}
