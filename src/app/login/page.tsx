'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Sparkles,
  Lock,
  Mail,
  Building,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('jane.doe@university.edu');
  const [password, setPassword] = useState('••••••••••••');
  const [institution, setInstitution] = useState('Sungkyunkwan University (SKKU)');
  const [fullName, setFullName] = useState('Prof. Jane Doe');
  const [role, setRole] = useState<'instructor' | 'head_ta' | 'grader'>('instructor');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/');
    }, 600);
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#081220] via-[#0d1c33] to-[#152a4a] text-slate-100 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      {/* Top Simple Brand Bar */}
      <header className="px-6 py-5 max-w-7xl mx-auto w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:bg-blue-500 transition-colors">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-2xl tracking-tight text-white">
                TA<span className="text-blue-400">+</span>
              </span>
              <span className="text-xs uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                AI Grader
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              Intelligent Grading for University Courses
            </p>
          </div>
        </Link>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>FERPA & University LMS Compliant</span>
        </div>
      </header>

      {/* Main Content Card Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80">
          
          {/* Left Hero / Brand Promotion Panel */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#0f1f38] to-[#0a1526] p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Background glowing ambient circles */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-6">
                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                <span>Next-Gen Grading Automation</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
                Cut grading hours by 80% without sacrificing fairness.
              </h2>
              <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                Parse instructor rubrics into verifiable checklists, pinpoint citation evidence in code & essays, and eliminate student grade dispute emails.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="relative z-10 mt-8 space-y-3.5 pt-6 border-t border-white/10">
              <div className="flex items-start gap-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Direct ZIP batch upload from Canvas, Gradescope, Blackboard</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>AI-powered Rubric Consistency Testing (&sigma; variance indicator)</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Instant student deduction reports with verbatim citations</span>
              </div>
            </div>

            {/* Testimonial / stat */}
            <div className="relative z-10 mt-8 p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-xs italic text-slate-300">
                &ldquo;TA+ turned our 60-hour midterm grading nightmare into a breezy 8-hour collaborative session.&rdquo;
              </div>
              <div className="mt-2 text-[11px] font-semibold text-blue-300">
                Prof. Jane Doe &mdash; Stanford CS Dept.
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-7 p-8 sm:p-12 text-slate-800 bg-white flex flex-col justify-center">
            
            {/* Mode Switch Tabs */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {mode === 'login' ? 'Welcome Back' : 'Create Grader Account'}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  {mode === 'login'
                    ? 'Log in to continue evaluating assignments'
                    : 'Get started with automated rubric grading'}
                </p>
              </div>

              {/* Tab pills */}
              <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    mode === 'login'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    mode === 'signup'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Quick Demo One-Click Access Button */}
            <div className="mb-6">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200/80 text-blue-900 transition-all text-xs group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    JD
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Instant Demo Access</div>
                    <div className="text-blue-700 text-[11px]">Sign in as Prof. Jane Doe (CS 229)</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 font-semibold text-blue-700 group-hover:translate-x-1 transition-transform">
                  <span>Enter</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <span className="relative px-3 bg-white text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  or university credentials
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name & Title
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g., Prof. Jane Doe or Alex Kim (TA)"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Grading Role
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'instructor', label: 'Professor / Instructor' },
                        { id: 'head_ta', label: 'Head TA' },
                        { id: 'grader', label: 'Grading Assistant' },
                      ].map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRole(r.id as any)}
                          className={`p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                            role === r.id
                              ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold ring-1 ring-blue-500'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  University / Academic Institution
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Sungkyunkwan University (SKKU)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@university.edu"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Password</label>
                  {mode === 'login' && (
                    <a href="#" className="text-[11px] text-blue-600 hover:underline font-medium">
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group disabled:opacity-60"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{mode === 'login' ? 'Sign In to TA+' : 'Complete Registration'}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400">
              By proceeding, you agree to the University LMS Data Privacy and Student Honor Code terms.
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500">
        &copy; 2025 TA+ AI Grader &middot; Academic Integrity &amp; Consistent Evaluation System
      </footer>
    </div>
  );
}
