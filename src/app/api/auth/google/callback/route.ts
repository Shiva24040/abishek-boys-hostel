import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signToken, setSessionCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  const origin = url.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;

  if (error || !code) {
    return NextResponse.redirect(`${origin}/login?error=google_cancelled`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/login?error=google_not_configured`);
  }

  try {
    // 1. Exchange authorization code for access token with Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errData = await tokenResponse.text();
      console.error('Google token exchange failed:', errData);
      return NextResponse.redirect(`${origin}/login?error=google_token_failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch verified user profile from Google
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileResponse.ok) {
      return NextResponse.redirect(`${origin}/login?error=google_profile_failed`);
    }

    const profile = await profileResponse.json();
    const { id: googleId, email, name, picture } = profile;

    if (!email) {
      return NextResponse.redirect(`${origin}/login?error=google_no_email`);
    }

    const cleanEmail = email.toLowerCase().trim();

    // 3. Locate existing user by googleId or verified email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email: cleanEmail },
        ],
      },
      include: { student: true },
    });

    if (user) {
      // Existing user: Link googleId and avatar if not present
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          avatar: user.avatar || picture || undefined,
          emailVerified: user.emailVerified || new Date(),
          lastLogin: new Date(),
        },
        include: { student: true },
      });
    } else {
      // New user: SECURITY RULE - default role is ALWAYS 'STUDENT'
      const count = await prisma.student.count();
      const studentCode = `ABH-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

      // Create unassigned student record
      const student = await prisma.student.create({
        data: {
          studentId: studentCode,
          fullName: name || cleanEmail.split('@')[0],
          email: cleanEmail,
          phone: '+91 Pending',
          parentName: 'Pending Parent Details',
          parentPhone: '+91 Pending',
          collegeName: 'College / University',
          course: 'Degree Course',
          year: '1st Year',
          address: 'Hostel Resident',
          emergencyContact: '+91 Pending',
          status: 'ACTIVE',
          monthlyFee: 5000,
          securityDeposit: 5000,
          roomId: null,
          bedId: null,
        },
      });

      // Create linked student User
      user = await prisma.user.create({
        data: {
          name: name || cleanEmail.split('@')[0],
          email: cleanEmail,
          username: cleanEmail.split('@')[0],
          role: 'STUDENT', // Strictly STUDENT
          googleId,
          avatar: picture,
          studentId: student.id,
          authProvider: 'google',
          emailVerified: new Date(),
          isActive: true,
          lastLogin: new Date(),
        },
        include: { student: true },
      });
    }

    if (!user.isActive) {
      return NextResponse.redirect(`${origin}/login?error=account_deactivated`);
    }

    // 4. Create session and set cookie
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
    const destination = user.role === 'ADMIN' ? `${origin}/admin` : `${origin}/student`;
    const response = NextResponse.redirect(destination);

    setSessionCookie(response.cookies, token, true);
    return response;
  } catch (err: any) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(`${origin}/login?error=oauth_internal_error`);
  }
}
