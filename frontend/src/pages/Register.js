import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const Register = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [verificationEmail, setVerificationEmail] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState('');
    const [verifySuccess, setVerifySuccess] = useState('');
    const [resending, setResending] = useState(false);
    const [resendError, setResendError] = useState('');
    const [resendSuccess, setResendSuccess] = useState('');

    const submit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess(null);
        setVerifyError('');
        setVerifySuccess('');
        setResendError('');
        setResendSuccess('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        try {
            setSubmitting(true);
            const { data } = await axios.post(`${API_BASE}/auth/register`, {
                name,
                email,
                password
            });
            setSuccess(data);
            setVerificationEmail(data?.user?.email || email);
            setVerificationCode(data?.devVerificationCode || '');
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err?.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const submitVerification = async () => {
        setVerifyError('');
        setVerifySuccess('');

        const code = String(verificationCode || '').trim();
        const targetEmail = String(verificationEmail || email || '').trim().toLowerCase();

        if (!targetEmail) {
            setVerifyError('Registered email is required for verification.');
            return;
        }

        if (!code) {
            setVerifyError('Enter the verification code from your email.');
            return;
        }

        try {
            setVerifying(true);
            const { data } = await axios.post(`${API_BASE}/auth/verify-email`, {
                email: targetEmail,
                code
            });

            setVerifySuccess(data?.message || 'Email verified successfully.');
            setSuccess((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    user: {
                        ...(prev.user || {}),
                        isEmailVerified: true
                    }
                };
            });

            setTimeout(() => {
                navigate('/login');
            }, 900);
        } catch (err) {
            setVerifyError(err?.response?.data?.message || 'Could not verify email.');
        } finally {
            setVerifying(false);
        }
    };

    const resendVerification = async () => {
        setResendError('');
        setResendSuccess('');

        const targetEmail = String(verificationEmail || email || '').trim();
        if (!targetEmail) {
            setResendError('Email is missing for resend.');
            return;
        }

        try {
            setResending(true);
            const { data } = await axios.post(`${API_BASE}/auth/resend-verification`, {
                email: targetEmail
            });

            setResendSuccess(data?.message || 'Verification code sent.');
            if (data?.devVerificationCode) {
                setVerificationCode(data.devVerificationCode);
            }
        } catch (err) {
            setResendError(err?.response?.data?.message || 'Could not resend verification email.');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-200">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-20 left-8 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"></div>
                <div className="absolute top-20 right-0 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl"></div>
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10 sm:px-6 lg:px-8">
                <div className="surface-glass w-full rounded-3xl p-6 sm:p-8">
                    <div className="mb-6 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Account Setup</p>
                            <h1 className="mt-2 text-3xl font-extrabold text-white">Create Your CrickJudge Account</h1>
                            <p className="mt-2 text-sm text-slate-400">Registration milestone 1. Email verification and login flow will be wired next.</p>
                        </div>
                        <Link
                            to="/"
                            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                        >
                            Back
                        </Link>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">Full Name</label>
                            <input
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                required
                                minLength={2}
                                placeholder="Enter your full name"
                                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                required
                                placeholder="you@example.com"
                                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    required
                                    minLength={8}
                                    placeholder="At least 8 characters"
                                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                    required
                                    minLength={8}
                                    placeholder="Re-enter password"
                                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                        </div>

                        <p className="text-xs text-slate-500">Password must include uppercase, lowercase, and a number.</p>

                        {error && (
                            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-bold text-white transition hover:from-blue-500 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    {success && (
                        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                            <p>{success.message}</p>
                            <p className="mt-1 text-xs text-emerald-300">Account created for {success?.user?.email}</p>
                            {success?.verification?.required && (
                                <p className="mt-1 text-xs text-emerald-300">Verification required. Expiry: {new Date(success.verification.expiresAt).toLocaleString()}</p>
                            )}
                            {success?.notice && (
                                <p className="mt-2 text-xs text-amber-300">{success.notice}</p>
                            )}
                        </div>
                    )}

                    {success?.verification?.required && !success?.user?.isEmailVerified && (
                        <div className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-3 text-sm text-cyan-100">
                            <p className="font-semibold">Verification code required</p>
                            <p className="mt-1 text-xs text-cyan-200/80">We sent a code to your email. Paste the code below to continue.</p>

                            <div className="mt-3 space-y-3">
                                <div>
                                    <label className="mb-1 block text-[11px] uppercase tracking-wider text-cyan-200/70">Email</label>
                                    <input
                                        value={verificationEmail}
                                        onChange={(event) => setVerificationEmail(event.target.value)}
                                        className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-[11px] uppercase tracking-wider text-cyan-200/70">6-digit code</label>
                                    <input
                                        maxLength={6}
                                        value={verificationCode}
                                        onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="Enter code"
                                        className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm font-bold tracking-[0.2em] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                    />
                                </div>

                                {verifyError && (
                                    <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-200">{verifyError}</p>
                                )}
                                {verifySuccess && (
                                    <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-200">{verifySuccess} Redirecting to login...</p>
                                )}

                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={submitVerification}
                                        disabled={verifying}
                                        className="rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                                    >
                                        {verifying ? 'Checking code...' : 'Verify Code'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resendVerification}
                                        disabled={resending}
                                        className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-100 disabled:opacity-60"
                                    >
                                        {resending ? 'Resending...' : 'Resend Code'}
                                    </button>
                                </div>

                                {resendError && (
                                    <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-200">{resendError}</p>
                                )}
                                {resendSuccess && (
                                    <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-200">{resendSuccess}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {success?.user?.isEmailVerified && (
                        <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                            Email verified. Redirecting to login page...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Register;
