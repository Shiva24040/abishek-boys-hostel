import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword, validateIndianPhone } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all users (ADMIN only)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        authProvider: true,
        lastLogin: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            studentId: true,
            room: { select: { roomNumber: true } },
            bed: { select: { bedNumber: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, users });
  } catch (err: any) {
    console.error('Error fetching users:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST create authorized Admin/Staff account (ADMIN only)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const { name, email, phone, password, role = 'ADMIN' } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const phoneCheck = phone ? validateIndianPhone(phone) : null;

    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A user account with this email already exists.' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        username: cleanEmail.split('@')[0],
        phone: phoneCheck?.isValid ? phoneCheck.display : phone?.trim(),
        passwordHash,
        role: role === 'ADMIN' ? 'ADMIN' : 'STUDENT',
        emailVerified: new Date(), // Created directly by Admin
        phoneVerified: new Date(),
        authProvider: 'credentials',
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User ${newUser.name} created successfully with role ${newUser.role}.`,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err: any) {
    console.error('Error creating user:', err);
    return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
  }
}

// PATCH toggle account status (activate/deactivate) or reset password (ADMIN only)
export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const { userId, action, newPassword } = await request.json();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required.' }, { status: 400 });
    }

    // Prevent Admin from deactivating own account
    if (userId === currentUser.id && action === 'deactivate') {
      return NextResponse.json(
        { success: false, error: 'You cannot deactivate your own administrative account.' },
        { status: 400 }
      );
    }

    if (action === 'toggle_status') {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { isActive: !user.isActive },
      });

      return NextResponse.json({
        success: true,
        message: `Account has been ${updated.isActive ? 'activated' : 'deactivated'}.`,
        isActive: updated.isActive,
      });
    }

    if (action === 'reset_password') {
      if (!newPassword || newPassword.length < 8) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 8 characters long.' },
          { status: 400 }
        );
      }

      const passwordHash = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });

      return NextResponse.json({
        success: true,
        message: 'Password has been updated successfully for this user.',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error updating user:', err);
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
  }
}
