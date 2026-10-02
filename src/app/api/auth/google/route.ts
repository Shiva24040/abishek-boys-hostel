import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const url = new URL(request.url);
  const origin = url.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;

  // If Google credentials are not configured, return clear guidance
  if (!clientId || !clientSecret || clientId.trim() === '' || clientSecret.trim() === '') {
    return NextResponse.json(
      {
        success: false,
        configured: false,
        error: 'Google OAuth credentials are not configured.',
        message: 'To enable Google Sign-In, please add your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the .env file. Obtain these credentials from the Google Cloud Console (APIs & Services > Credentials > OAuth 2.0 Client IDs).',
        redirectUri,
      },
      { status: 503 }
    );
  }

  // Construct real Google OAuth 2.0 authorization URL
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'select_account');

  return NextResponse.redirect(googleAuthUrl.toString());
}
