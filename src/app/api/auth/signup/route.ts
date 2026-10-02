import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, signToken, setSessionCookie, validateIndianPhone } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fullName,
      email,
      phone,
      password,
      confirmPassword,
      collegeName,
      course,
      year,
      studentCode,
    } = body;

    // Validation
    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ success: false, error: 'Full name is required.' }, { status: 400 });
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'A valid email address is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Indian Phone Validation
    const phoneCheck = validateIndianPhone(phone);
    if (!phoneCheck.isValid) {
      return NextResponse.json(
        { success: false, error: 'Enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    // Password strength check
    if (!password || password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Password and Confirm Password do not match.' },
        { status: 400 }
      );
    }

    // Check duplicate email
    const existingEmail = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'An account with this email address already exists. Please log in.' },
        { status: 400 }
      );
    }

    // Check duplicate phone
    const existingPhone = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: phoneCheck.normalized },
          { phone: phoneCheck.display },
          { phone: phone },
        ],
      },
    });
    if (existingPhone) {
      return NextResponse.json(
        { success: false, error: 'An account with this phone number already exists.' },
        { status: 400 }
      );
    }

    // Get default monthly fee setting
    const setting = await prisma.hostelSetting.findFirst();
    const defaultFee = setting?.defaultMonthlyFee || 5000;

    // Generate unique student ID code if not provided
    const count = await prisma.student.count();
    const generatedCode = studentCode?.trim() || `ABH-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    // 1. Create Student profile WITHOUT room/bed assignment (admin assigns room later)
    const student = await prisma.student.create({
      data: {
        studentId: generatedCode,
        fullName: fullName.trim(),
        email: cleanEmail,
        phone: phoneCheck.display,
        parentName: 'Pending Parent Details',
        parentPhone: phoneCheck.display,
        collegeName: collegeName?.trim() || 'College / University',
        course: course?.trim() || 'Degree Course',
        year: year?.trim() || '1st Year',
        address: 'Hostel Resident',
        emergencyContact: phoneCheck.display,
        status: 'ACTIVE',
        monthlyFee: defaultFee,
        securityDeposit: defaultFee,
        roomId: null, // Explicitly unassigned
        bedId: null,  // Explicitly unassigned
      },
    });

    // 2. Create User account (STRICTLY ROLE: 'STUDENT')
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name: fullName.trim(),
        email: cleanEmail,
        username: cleanEmail.split('@')[0],
        phone: phoneCheck.display,
        passwordHash,
        role: 'STUDENT', // Never allow public signup to create ADMIN
        studentId: student.id,
        emailVerified: null,
        phoneVerified: null,
        authProvider: 'credentials',
        isActive: true,
        lastLogin: new Date(),
      },
    });

    // Create a notification for Admin about new registration
    await prisma.notification.create({
      data: {
        title: 'New Student Registered',
        message: `${fullName.trim()} registered online (${cleanEmail}). Pending room & bed allocation.`,
        type: 'REGISTRATION',
      },
    });

    const userSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'STUDENT' as const,
      phone: user.phone || undefined,
      studentId: student.id,
    };

    const token = signToken(userSession, true);
    const response = NextResponse.json({
      success: true,
      user: userSession,
      redirectTo: '/student',
      message: 'Student account created successfully. Welcome to Abhishek Boys Hostel!',
    });

    setSessionCookie(response.cookies, token, true);
    return response;
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed due to a server error. Please try again.' },
      { status: 500 }
    );
  }
}
