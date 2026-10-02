import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateIndianPhone, generateOtp, hashToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { phone, purpose = 'LOGIN' } = await request.json();

    const phoneCheck = validateIndianPhone(phone);
    if (!phoneCheck.isValid) {
      return NextResponse.json(
        { success: false, error: 'Enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    const identifier = phoneCheck.normalized;

    // Check rate limit: cooldown 60 seconds since last OTP for this number
    const lastToken = await prisma.verificationToken.findFirst({
      where: {
        identifier,
        type: 'PHONE_OTP',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (lastToken) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(lastToken.createdAt).getTime()) / 1000);
      if (elapsedSeconds < 60) {
        return NextResponse.json(
          {
            success: false,
            error: `Please wait ${60 - elapsedSeconds} seconds before requesting a new OTP.`,
            cooldownSeconds: 60 - elapsedSeconds,
          },
          { status: 429 }
        );
      }
    }

    // Check maximum requests in the last hour (max 5 requests per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourlyCount = await prisma.verificationToken.count({
      where: {
        identifier,
        type: 'PHONE_OTP',
        createdAt: { gte: oneHourAgo },
      },
    });

    if (hourlyCount >= 5) {
      return NextResponse.json(
        { success: false, error: 'Too many OTP requests for this number. Please try again after 1 hour.' },
        { status: 429 }
      );
    }

    // Clean old expired tokens for this identifier
    await prisma.verificationToken.deleteMany({
      where: {
        identifier,
        type: 'PHONE_OTP',
      },
    });

    // Generate cryptographic OTP
    const rawOtp = generateOtp();
    const tokenHash = hashToken(`${identifier}:${rawOtp}`);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    await prisma.verificationToken.create({
      data: {
        identifier,
        tokenHash,
        type: 'PHONE_OTP',
        attempts: 0,
        expiresAt,
      },
    });

    // Check configured SMS providers
    const fast2smsKey = process.env.FAST2SMS_API_KEY;
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;

    let smsSent = false;
    let providerName = '';

    if (fast2smsKey && fast2smsKey.trim() !== '') {
      providerName = 'Fast2SMS';
      try {
        const smsRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            authorization: fast2smsKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            variables_values: rawOtp,
            route: 'otp',
            numbers: phoneCheck.normalized.replace('+91', ''),
          }),
        });
        const smsData = await smsRes.json();
        if (smsData.return) smsSent = true;
      } catch (smsErr) {
        console.error('Fast2SMS delivery error:', smsErr);
      }
    } else if (twilioSid && twilioToken && twilioSid.trim() !== '') {
      providerName = 'Twilio';
      try {
        const fromNumber = process.env.TWILIO_PHONE_NUMBER || '';
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const twilioRes = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: phoneCheck.normalized,
            From: fromNumber,
            Body: `Your Abhishek Boys Hostel verification code is ${rawOtp}. Valid for 10 minutes. Do not share.`,
          }),
        });
        if (twilioRes.ok) smsSent = true;
      } catch (smsErr) {
        console.error('Twilio delivery error:', smsErr);
      }
    }

    if (smsSent) {
      return NextResponse.json({
        success: true,
        configured: true,
        provider: providerName,
        phone: phoneCheck.display,
        cooldownSeconds: 60,
        message: `OTP sent successfully via ${providerName} to ${phoneCheck.display}.`,
      });
    }

    // If no provider is configured, do NOT fake sending. Return clear guidance.
    return NextResponse.json({
      success: false,
      configured: false,
      phone: phoneCheck.display,
      error: 'SMS Gateway is not configured in .env.',
      message: 'To deliver live SMS OTPs to Indian mobile numbers, configure FAST2SMS_API_KEY or TWILIO credentials in your .env file.',
      hint: process.env.NODE_ENV === 'development'
        ? `Development Simulation: For testing, the generated OTP is active. (Enter OTP: ${rawOtp})`
        : undefined,
    });
  } catch (err: any) {
    console.error('Error sending OTP:', err);
    return NextResponse.json(
      { success: false, error: 'Could not send OTP. Please try again later.' },
      { status: 500 }
    );
  }
}
