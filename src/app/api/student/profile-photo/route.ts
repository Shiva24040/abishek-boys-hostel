import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = (formData.get('photo') || formData.get('file')) as File | null;

    if (!file || typeof file !== 'object' || !('arrayBuffer' in file)) {
      return NextResponse.json({ success: false, error: 'Please choose an image file to upload.' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const fileType = file.type || 'image/jpeg';
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid image format. Only JPG, PNG, and WEBP images are supported.' },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'Image size must be less than 5MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, safeName), buffer);

    const photoUrl = `/uploads/profiles/${safeName}`;

    // Update in Student record if linked
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          ...(user.studentId ? [{ id: user.studentId }] : []),
          { email: user.email },
          ...(user.phone ? [{ phone: user.phone }] : []),
        ],
      },
    });

    if (student) {
      await prisma.student.update({
        where: { id: student.id },
        data: { profilePhoto: photoUrl },
      });
    }

    // Update in User record
    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: photoUrl },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile photo updated successfully.',
      profilePhoto: photoUrl,
    });
  } catch (error: any) {
    console.error('Error uploading profile photo:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload profile photo' }, { status: 500 });
  }
}

