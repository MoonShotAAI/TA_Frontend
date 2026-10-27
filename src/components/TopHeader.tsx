'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GraduationCap,
  HelpCircle,
  FileCheck2,
  ListTree,
  FolderKanban,
  UploadCloud,
} from 'lucide-react';

interface TopHeaderProps {
  currentCourse?: string;
  activeSection?: 'batches' | 'upload' | 'rubrics' | 'grade';
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentCourse = 'CS 229 - Machine Learning',
  activeSection: propActiveSection,
}) => {
  const pathname = usePathname();

  // Determine active section fallback from pathname if not explicitly passed
  let activeSection = propActiveSection;
  if (!activeSection) {
    if (pathname === '/') {
      activeSection = 'batches';
    } else if (pathname.startsWith('/upload')) {
      activeSection = 'upload';
    } else if (pathname.startsWith('/grading') || pathname.startsWith('/confidence')) {
      activeSection = 'grade';
    }
  }

  return (
    <header className="bg-[#0b1727] text-white border-b border-[#1b2b44] sticky top-0 z-50 shadow-md">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        {/* Left: Brand Logo & Navigation Links */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-500 transition-colors">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-white">
                TA<span className="text-blue-400">+</span>
              </span>
              <span className="text-slate-300 font-medium text-sm">AI Grader</span>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1.5">
            {/* 1. Batches (Enabled Link) */}
            <Link
              href="/"
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeSection === 'batches'
                  ? 'bg-blue-600/30 text-white font-semibold border border-blue-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <FolderKanban className={`w-3.5 h-3.5 ${activeSection === 'batches' ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>Batches</span>
            </Link>

            {/* 2. Submissions / Upload */}
            <Link
              href="/upload"
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeSection === 'upload'
                  ? 'bg-blue-600/30 text-white font-semibold border border-blue-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <UploadCloud className={`w-3.5 h-3.5 ${activeSection === 'upload' ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>Submissions</span>
            </Link>

            {/* 3. Rubrics (Status Indicator - Non-clickable) */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs rounded-md cursor-default select-none transition-all ${
                activeSection === 'rubrics'
                  ? 'bg-blue-600/30 text-white font-semibold border border-blue-500/40'
                  : 'text-slate-400/70 hover:text-slate-400/70'
              }`}
              title="Rubrics Stage (Status Indicator)"
            >
              <ListTree className={`w-3.5 h-3.5 ${activeSection === 'rubrics' ? 'text-blue-400' : 'text-slate-500'}`} />
              <span>Rubrics</span>
            </div>

            {/* 4. Grade (Status Indicator - Non-clickable) */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs rounded-md cursor-default select-none transition-all ${
                activeSection === 'grade'
                  ? 'bg-blue-600/30 text-white font-semibold border border-blue-500/40'
                  : 'text-slate-400/70 hover:text-slate-400/70'
              }`}
              title="Grade Stage (Status Indicator)"
            >
              <FileCheck2 className={`w-3.5 h-3.5 ${activeSection === 'grade' ? 'text-blue-400' : 'text-slate-500'}`} />
              <span>Grade</span>
            </div>
          </nav>
        </div>

        {/* Right: Help */}
        <div className="flex items-center gap-4">
          <button
            title="Help & Documentation"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
