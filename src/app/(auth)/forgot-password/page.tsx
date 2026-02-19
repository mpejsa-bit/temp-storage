"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--text)] mb-2">Reset Password</h1>
          <p className="text-[var(--text-secondary)]">Recover access to your account</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-8">
          {!submitted ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  placeholder="you@company.com"
                />
              </div>
              <button onClick={() => setSubmitted(true)} disabled={!email}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold rounded-lg transition">
                Continue
              </button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">!</span>
              </div>
              <h3 className="text-lg font-semibold">Local Account Only</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                This app stores accounts locally on this device. There is no email-based password reset.
                If you have forgotten your password, please create a new account.
              </p>
              <Link href="/register" className="inline-block px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium">
                Create New Account
              </Link>
            </div>
          )}
          <p className="text-center text-sm text-[var(--text-muted)] mt-6">
            <Link href="/login" className="text-blue-400 hover:text-blue-300">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
