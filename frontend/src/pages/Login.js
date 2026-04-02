import React from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
    return (
        <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-200">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-20 left-8 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"></div>
                <div className="absolute top-20 right-0 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl"></div>
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10 sm:px-6 lg:px-8">
                <div className="surface-glass w-full rounded-3xl p-6 sm:p-8">
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Authentication</p>
                    <h1 className="mt-2 text-3xl font-extrabold text-white">Login Page</h1>
                    <p className="mt-3 text-sm text-slate-300">
                        Email verification is complete. Login API and session handling will be built in the next milestone.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            to="/register"
                            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
                        >
                            Back to Register
                        </Link>
                        <Link
                            to="/"
                            className="rounded-xl border border-cyan-300/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
