'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Building2,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  BedDouble,
  GraduationCap,
  Shield,
  HelpCircle,
  FileCheck2,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Portal selection: 'student' or 'admin'
  const initialPortal = searchParams.get('portal') === 'admin' ? 'admin' : 'student';
  const [selectedPortal, setSelectedPortal] = useState<'student' | 'admin'>(initialPortal);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleConfigNotice, setGoogleConfigNotice] = useState(false);

  useEffect(() => {
    const p = searchParams.get('portal');
    if (p === 'admin' || p === 'student') {
      setSelectedPortal(p);
    }

    const errorParam = searchParams.get('error');
    if (errorParam === 'google_not_configured') {
      setError('Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.');
    } else if (errorParam === 'account_deactivated') {
      setError('This account has been deactivated. Please contact hostel administration.');
    } else if (errorParam === 'google_cancelled') {
      setError('Google Sign-In was cancelled or failed.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          rememberMe,
          portal: selectedPortal,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const redirectParam = searchParams.get('redirect');
        if (redirectParam && !redirectParam.startsWith('/login') && !redirectParam.startsWith('/signup')) {
          router.push(redirectParam);
        } else {
          router.push(data.redirectTo || (selectedPortal === 'admin' ? '/admin' : '/student'));
        }
      } else {
        setError(data.error || 'Invalid credentials. Please verify your email/phone and password.');
      }
    } catch (err: any) {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      const res = await fetch('/api/auth/google');
      if (res.status === 503) {
        const data = await res.json();
        setGoogleConfigNotice(true);
        setError(data.message || 'Google OAuth is not configured in .env yet.');
        return;
      }
      window.location.href = '/api/auth/google';
    } catch {
      window.location.href = '/api/auth/google';
    }
  };

  return (
    <div className="min-h-screen bg-[#070D18] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Hostel Architectural Atmosphere Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#6366f1 1px, #070D18 1px)`,
          backgroundSize: '36px 36px',
          backgroundPosition: '0 0, 18px 18px',
        }}
      />

      {/* Ambient Lighting Gradients */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-blue-600/20 via-indigo-600/10 to-transparent blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-32 right-10 w-[450px] h-[350px] bg-amber-500/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Hostel Branding Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-amber-500 p-0.5 shadow-2xl shadow-blue-500/20 mb-3.5 group transform hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-[#0A1224] rounded-[14px] flex items-center justify-center">
              <Building2 className="w-8 h-8 text-blue-400 group-hover:text-amber-400 transition-colors" />
            </div>
          </div>

          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] font-bold uppercase tracking-widest mb-1.5 backdrop-blur-sm">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Private Boys Hostel Management System</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Abhishek Boys Hostel
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Authorized portal for hostel residents, room allocations, fee payments, and administration.
          </p>
        </div>

        {/* Portal Switcher Tabs (Admin Portal vs Student Portal) */}
        <div className="bg-[#0B1528] p-1.5 rounded-2xl border border-slate-800/80 mb-5 shadow-inner flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSelectedPortal('student');
              setError('');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              selectedPortal === 'student'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student Portal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedPortal('admin');
              setError('');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              selectedPortal === 'admin'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Admin Portal</span>
          </button>
        </div>

        {/* Hostel Feature Badges */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-[10px] text-slate-400 font-medium text-center">
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl py-1.5 px-2 flex items-center justify-center space-x-1">
            <BedDouble className="w-3 h-3 text-blue-400" />
            <span className="truncate">Rooms & Beds</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl py-1.5 px-2 flex items-center justify-center space-x-1">
            <FileCheck2 className="w-3 h-3 text-emerald-400" />
            <span className="truncate">UPI Fee Pay</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl py-1.5 px-2 flex items-center justify-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            <span className="truncate">24/7 Security</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-[#0D182E]/90 backdrop-blur-xl py-7 px-6 sm:px-8 shadow-2xl rounded-3xl border border-slate-800/90 relative">
          {/* Active Portal Header Sub-Banner */}
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800/80">
            <div>
              <span className="text-xs font-bold text-white block">
                {selectedPortal === 'admin' ? 'Hostel Administration Login' : 'Resident Student Sign-In'}
              </span>
              <span className="text-[11px] text-slate-400 block">
                {selectedPortal === 'admin'
                  ? 'Authorized Wardens & Management Staff only'
                  : 'Access room details, monthly fee dues & hostel notices'}
              </span>
            </div>
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                selectedPortal === 'admin'
                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                  : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
              }`}
            >
              {selectedPortal === 'admin' ? 'Admin Portal' : 'Student Portal'}
            </span>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          {/* Google Configuration Guidance */}
          {googleConfigNotice && (
            <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start space-x-2">
              <HelpCircle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
              <div className="leading-relaxed">
                Add <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-200">GOOGLE_CLIENT_ID</code> and{' '}
                <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-200">GOOGLE_CLIENT_SECRET</code> to your{' '}
                <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-200">.env</code> file to enable Google OAuth.
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email or Phone Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Email Address or Indian Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder={selectedPortal === 'admin' ? 'admin@abhishekhostel.com or 9059860870' : 'ravi.kumar@gmail.com or 9811234567'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 bg-[#070D18]/90 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-[#070D18]/90 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#070D18] border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                />
                <span className="text-xs text-slate-400">Remember this device</span>
              </label>

              <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>SSL Secured</span>
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 text-white text-xs font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 ${
                selectedPortal === 'admin'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/30'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/30'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Log In to {selectedPortal === 'admin' ? 'Admin Portal' : 'Student Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Alternative Auth Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[#0D182E] text-slate-500 font-medium">Or continue with</span>
            </div>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 bg-[#070D18]/90 hover:bg-slate-800/80 border border-slate-700/80 rounded-2xl text-xs font-semibold text-slate-200 transition-all flex items-center justify-center space-x-2.5 shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Quick sign-in with Phone OTP option */}
          <div className="mt-3 text-center">
            <Link
              href="/verify-phone"
              className="text-xs font-semibold text-slate-400 hover:text-blue-400 inline-flex items-center space-x-1.5 transition-colors py-1"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Login with Mobile Number & OTP</span>
            </Link>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-5 text-center">
          <p className="text-xs text-slate-400">
            New resident student?{' '}
            <Link
              href="/signup"
              className="font-bold text-blue-400 hover:text-blue-300 underline decoration-blue-500/40 transition-colors"
            >
              Register for Hostel Admission
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#070D18] flex items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}

