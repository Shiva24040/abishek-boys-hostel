import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from './prisma';
import { UserRole, UserSession } from './types';

const AUTH_SECRET = process.env.AUTH_SECRET || 'abhishek-hostel-secure-jwt-secret-key-2026-production';
const COOKIE_NAME = 'abh_token';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(session: UserSession, rememberMe: boolean = true): string {
  const expiresIn = rememberMe ? '7d' : '24h';
  return jwt.sign(
    {
      id: session.id,
      name: session.name,
      email: session.email,
      role: session.role,
      phone: session.phone,
      studentId: session.studentId,
      avatar: session.avatar,
    },
    AUTH_SECRET,
    { expiresIn }
  );
}

export function verifyToken(token: string): UserSession | null {
  try {
    const decoded = jwt.verify(token, AUTH_SECRET) as any;
    if (!decoded || !decoded.id || !decoded.role) return null;
    return {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role as UserRole,
      phone: decoded.phone,
      studentId: decoded.studentId,
      avatar: decoded.avatar,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    const verified = verifyToken(token);
    if (verified) {
      // Validate with database to ensure user is active and role is fresh
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: verified.id },
          include: { student: true },
        });

        if (dbUser && dbUser.isActive) {
          return {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: (dbUser.role as UserRole) || 'STUDENT',
            phone: dbUser.phone || undefined,
            studentId: dbUser.student?.id || dbUser.studentId || undefined,
            avatar: dbUser.avatar || undefined,
            emailVerified: Boolean(dbUser.emailVerified),
            phoneVerified: Boolean(dbUser.phoneVerified),
            isActive: dbUser.isActive,
          };
        }
      } catch (err) {
        console.error('Error fetching user from database:', err);
      }
    }
  }

  return null;
}

export function setSessionCookie(responseCookies: any, token: string, rememberMe: boolean = true) {
  const maxAge = rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24; // 7 days or 1 day
  responseCookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
}

export function clearSessionCookie(responseCookies: any) {
  responseCookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  responseCookies.set('abh_role', '', {
    path: '/',
    maxAge: 0,
  });
}

/**
 * Validates and normalizes Indian mobile numbers (+91).
 * Accepts: "9876543210", "+919876543210", "+91 98765 43210", "919876543210"
 */
export function validateIndianPhone(input: string): { isValid: boolean; normalized: string; display: string } {
  if (!input) return { isValid: false, normalized: '', display: '' };
  const cleaned = input.replace(/\D/g, ''); // strip all non-digits
  
  let tenDigits = '';
  if (cleaned.length === 10) {
    tenDigits = cleaned;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    tenDigits = cleaned.slice(2);
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    tenDigits = cleaned.slice(1);
  } else {
    return { isValid: false, normalized: '', display: input };
  }

  // Indian numbers must begin with 6, 7, 8, or 9
  const isValid = /^[6-9]\d{9}$/.test(tenDigits);
  const normalized = `+91${tenDigits}`;
  const display = `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}`;

  return {
    isValid,
    normalized,
    display,
  };
}

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 */
export function generateOtp(): string {
  return Math.floor(100000 + crypto.randomInt(900000)).toString();
}

/**
 * Securely hashes an OTP using HMAC-SHA256.
 */
export function hashToken(token: string): string {
  return crypto.createHmac('sha256', AUTH_SECRET).update(token).digest('hex');
}

