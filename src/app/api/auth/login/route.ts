import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword, signToken, setSessionCookie, validateIndianPhone } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password, rememberMe = true, portal } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Please provide email or phone number and password.' },
        { status: 400 }
      );
    }

    const trimmed = String(identifier).trim();
    const isEmail = trimmed.includes('@');
    const phoneCheck = validateIndianPhone(trimmed);

    let user = null;

    if (isEmail) {
      user = await prisma.user.findUnique({
        where: { email: trimmed.toLowerCase() },
        include: { student: true },
      });
    } else if (phoneCheck.isValid) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: phoneCheck.normalized },
            { phone: phoneCheck.display },
            { phone: trimmed },
          ],
        },
        include: { student: true },
      });
    } else {
      // Try searching both
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: trimmed.toLowerCase() },
            { phone: trimmed },
            { username: trimmed.toLowerCase() },
          ],
        },
        include: { student: true },
      });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email/phone or password.' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Your account has been deactivated. Please contact hostel administration.' },
        { status: 403 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          error: user.authProvider === 'google'
            ? 'This account is linked with Google Sign-In. Please click "Continue with Google".'
            : 'No password set for this account. Please reset your password.',
        },
        { status: 400 }
      );
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email/phone or password.' },
        { status: 401 }
      );
    }

    // Strict server-side portal role authorization
    if (portal === 'admin' && user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied. This account does not have Administrator privileges. Please switch to the Student Portal.',
        },
        { status: 403 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const userSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: (user.role as any) || 'STUDENT',
      phone: user.phone || undefined,
      studentId: user.student?.id || user.studentId || undefined,
      avatar: user.avatar || undefined,
    };

    const token = signToken(userSession, rememberMe);
    const redirectTo = user.role === 'ADMIN' ? '/admin' : '/student';

    const response = NextResponse.json({
      success: true,
      user: userSession,
      redirectTo,
      message: 'Login successful',
    });

    setSessionCookie(response.cookies, token, rememberMe);
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected authentication error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
