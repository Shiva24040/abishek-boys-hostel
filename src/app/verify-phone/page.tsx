'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Phone,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export default function VerifyPhonePage() {
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [configNotice, setConfigNotice] = useState<{ isUnconfigured: boolean; message?: string; hint?: string }>({
    isUnconfigured: false,
  });

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setInfoMessage('');
    setConfigNotice({ isUnconfigured: false });

    const rawDigits = phone.replace(/\D/g, '');
    if (rawDigits.length < 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (data.success) {
        setOtpSent(true);
        setCooldown(data.cooldownSeconds || 60);
        setInfoMessage(data.message || `OTP dispatched to +91 ${rawDigits.slice(-10)}`);
      } else {
        if (data.configured === false) {
          setOtpSent(true);
          setConfigNotice({
            isUnconfigured: true,
            message: data.message,
            hint: data.hint,
          });
        } else {
          setError(data.error || 'Failed to send OTP.');
        }
      }
    } catch {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.trim().length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otp.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.user) {
          // Logged in user
          router.push(data.redirectTo || '/student');
        } else {
          // Phone verified for registration
          setInfoMessage('Phone verified successfully! Redirecting to complete registration...');
          setTimeout(() => {
            router.push(`/signup?phone=${encodeURIComponent(data.phone || phone)}`);
          }, 1500);
        }
      } else {
        setError(data.error || 'Verification failed. Please check the code.');
      }
    } catch {
      setError('Network error during verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-blue-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 shadow-xl shadow-blue-900/40 border border-blue-400/20 text-white mb-2">
            <Phone className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">
            ABHISHEK BOYS HOSTEL
          </h1>
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest">
            Mobile OTP Authentication
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/40">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">
              {otpSent ? 'Enter Verification Code' : 'Verify Mobile Number'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {otpSent
                ? `Enter the 6-digit OTP sent to +91 ${phone.replace(/\D/g, '').slice(-10)}`
                : 'Enter your Indian mobile number to sign in or verify your account.'}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-2xl flex items-start space-x-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {infoMessage && (
            <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-2xl flex items-start space-x-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
              <div className="leading-relaxed">{infoMessage}</div>
            </div>
          )}

          {configNotice.isUnconfigured && (
            <div className="mb-5 p-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs rounded-2xl space-y-2 animate-in fade-in">
              <div className="font-bold flex items-center space-x-1.5 text-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>SMS Gateway Configuration</span>
              </div>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                {configNotice.message}
              </p>
              {configNotice.hint && (
                <div className="p-2 bg-amber-950/60 rounded-xl font-mono text-[11px] text-amber-300 font-bold border border-amber-500/20">
                  {configNotice.hint}
                </div>
              )}
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Indian Mobile Number (+91)
                </label>
                <div className="relative flex rounded-2xl border border-slate-700 bg-slate-900/60 overflow-hidden focus-within:border-blue-500">
                  <span className="inline-flex items-center px-3.5 text-xs font-bold text-slate-400 bg-slate-800 border-r border-slate-700 select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="98765 43210"
                    className="w-full px-4 py-3 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Enter 10-digit number without country code.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{loading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-2xl text-center text-lg tracking-[0.3em] font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{loading ? 'Verifying...' : 'Verify & Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  Change Number
                </button>

                <button
                  type="button"
                  disabled={cooldown > 0 || loading}
                  onClick={() => handleSendOtp()}
                  className="text-blue-400 hover:text-blue-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}</span>
                </button>
              </div>
            </form>
          )}

          <div className="pt-4 border-t border-slate-700/60 mt-6 text-center">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-400 hover:text-slate-200 inline-flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
