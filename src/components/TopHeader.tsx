'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GraduationCap,
  HelpCircle,
  FileCheck2,
  ListTree,
  BarChart3,
  Settings,
  FolderKanban,
  LogOut,
  UploadCloud,
  ChevronDown,
} from 'lucide-react';

interface TopHeaderProps {
  currentCourse?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentCourse = 'CS 229 - Machine Learning',
}) => {
  const pathname = usePathname();

  const navLinks = [
    { label: 'Batches', href: '/', icon: FolderKanban },
    { label: 'Upload ZIP', href: '/upload', icon: UploadCloud },
    { label: 'Grade', href: '/grading', icon: FileCheck2 },
    { label: 'Rubrics', href: '/upload?step=2', icon: ListTree },
    { label: 'Analytics', href: '#', icon: BarChart3 },
    { label: 'Settings', href: '#', icon: Settings },
  ];

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

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href.split('?')[0]);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                    isActive
                      ? 'bg-blue-600/30 text-white font-semibold border border-blue-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Help & Profile */}
        <div className="flex items-center gap-4">
          <button
            title="Help & Documentation"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-slate-700/80 hidden sm:block" />

          {/* User Profile Info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-blue-400/30">
              JD
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-xs font-semibold text-white">Prof. Jane Doe</div>
              <div className="text-[11px] text-slate-400 font-medium">Computer Science</div>
            </div>
            <Link
              href="/login"
              title="Sign Out / Switch Account"
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-md hover:bg-white/5 transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
