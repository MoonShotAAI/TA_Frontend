'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FolderKanban,
  UploadCloud,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Plus,
  BookOpen,
  ChevronRight,
  TrendingUp,
  FileCheck2,
  Users,
  MoreVertical,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { TopHeader } from '@/components/TopHeader';
import { MOCK_BATCH_FOLDERS, BatchFolder } from '@/data/mockBatches';

export default function BatchesDashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'ready_to_grade' | 'completed'>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  const filteredBatches = MOCK_BATCH_FOLDERS.filter((batch) => {
    const matchesSearch =
      batch.assignmentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.courseName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter;
    const matchesCourse = selectedCourse === 'all' || batch.courseCode === selectedCourse;

    return matchesSearch && matchesStatus && matchesCourse;
  });

  const totalStudents = MOCK_BATCH_FOLDERS.reduce((acc, curr) => acc + curr.totalStudents, 0);
  const totalGraded = MOCK_BATCH_FOLDERS.reduce((acc, curr) => acc + curr.gradedStudents, 0);
  const totalNeedReview = MOCK_BATCH_FOLDERS.reduce((acc, curr) => acc + curr.lowConfidenceCount, 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Top Header matching dark navy aesthetics */}
      <TopHeader activeSection="batches" />

      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Title & Main Action Button */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                Fall Semester 2024
              </span>
              <span className="text-xs text-slate-700 font-medium">· Updated 10 minutes ago</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Assignment Batches &amp; Grading Folders
            </h1>
            <p className="text-sm text-slate-700 mt-1">
              Select an active grading batch to review submissions, or upload a new ZIP from your university LMS.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30 group"
            >
              <UploadCloud className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              <span>Upload New ZIP Batch</span>
            </Link>
          </div>
        </div>

        {/* Quick Analytics Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Active Folders</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{MOCK_BATCH_FOLDERS.length} Batches</div>
              <div className="text-xs text-slate-700 font-medium mt-0.5">Across 4 courses</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Overall Progress</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">
                {Math.round((totalGraded / totalStudents) * 100)}%
              </div>
              <div className="text-xs text-slate-700 font-medium mt-0.5">
                {totalGraded} of {totalStudents} submissions
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">TA Review Needed</div>
              <div className="text-2xl font-bold text-amber-700 mt-0.5">{totalNeedReview} Flagged</div>
              <div className="text-xs text-amber-800 font-medium mt-0.5">Low confidence cases</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Avg Rubric Health</div>
              <div className="text-2xl font-bold text-indigo-900 mt-0.5">93.5%</div>
              <div className="text-xs text-emerald-700 font-semibold mt-0.5">High Stability (&sigma; &le; 0.20)</div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Batches', count: MOCK_BATCH_FOLDERS.length },
              { id: 'in_progress', label: 'In Progress', count: 2 },
              { id: 'ready_to_grade', label: 'Ready to Grade', count: 1 },
              { id: 'completed', label: 'Completed', count: 1 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    statusFilter === tab.id ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Course Dropdown */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search batch or assignment..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
              />
            </div>

            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Courses</option>
              <option value="CS 229">CS 229 (Machine Learning)</option>
              <option value="CS 106A">CS 106A (Programming)</option>
              <option value="DS 301">DS 301 (Data Mining)</option>
              <option value="AI 502">AI 502 (Deep Learning)</option>
            </select>
          </div>
        </div>

        {/* Batches Folder Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
          {filteredBatches.map((batch) => {
            const progressPercent = Math.round((batch.gradedStudents / batch.totalStudents) * 100);

            return (
              <div
                key={batch.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between group hover:border-blue-400/60 relative overflow-hidden"
              >
                {/* Top strip banner */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/80">
                        {batch.courseCode}
                      </span>
                      <span className="text-xs text-slate-700 font-semibold">{batch.courseName}</span>
                      <span className="text-xs text-slate-700">· {batch.semester}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {batch.assignmentTitle}
                    </h3>
                    <div className="text-xs text-slate-700 mt-1 flex items-center gap-1.5 font-mono">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      <span>{batch.zipFileName}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {batch.status === 'in_progress' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                        In Progress
                      </span>
                    )}
                    {batch.status === 'ready_to_grade' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Ready to Grade
                      </span>
                    )}
                    {batch.status === 'completed' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Completed
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Info & Progress Bar */}
                <div className="py-4 border-y border-slate-100 my-2 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-700">Grading Completion</span>
                      <span className="text-slate-900 font-bold">
                        {batch.gradedStudents} / {batch.totalStudents} ({progressPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          batch.status === 'completed'
                            ? 'bg-emerald-500'
                            : progressPercent > 50
                            ? 'bg-blue-600'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Badges / Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-700 font-medium">Students</div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">{batch.totalStudents} enrolled</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-700 font-medium">Rubric Health</div>
                      <div className="text-xs font-bold text-indigo-700 mt-0.5">{batch.consistencyScore}%</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-700 font-medium">Low Confidence</div>
                      <div
                        className={`text-xs font-bold mt-0.5 ${
                          batch.lowConfidenceCount > 0 ? 'text-amber-700 font-extrabold' : 'text-slate-700'
                        }`}
                      >
                        {batch.lowConfidenceCount} cases
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Footer & Action Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-slate-700 font-medium">
                    Lead TA: <strong className="text-slate-800">{batch.leadTA}</strong> · {batch.lastUpdated}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/upload?step=2"
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      Rubric
                    </Link>
                    <Link
                      href="/grading"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all group-hover:shadow-md"
                    >
                      <span>Continue Grading</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state if nothing matched */}
        {filteredBatches.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 my-8">
            <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No matching assignment folders found</h3>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or filter tags.</p>
          </div>
        )}

        {/* Bottom Upload New Banner */}
        <div className="mt-8 bg-gradient-to-r from-blue-900 via-indigo-900 to-[#0e1e36] text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-blue-300 shrink-0">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Have a new assignment batch from Canvas or Gradescope?</h3>
              <p className="text-sm text-blue-100/80 mt-1 max-w-2xl">
                Upload your downloaded ZIP bundle. Our AI parser extracts student code/essays and formats your rubric into a verified checklist in seconds.
              </p>
            </div>
          </div>
          <Link
            href="/upload"
            className="px-6 py-3 rounded-xl bg-white text-blue-900 font-extrabold text-xs shadow-lg hover:bg-blue-50 transition-all shrink-0 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New ZIP Now</span>
          </Link>
        </div>

      </main>
    </div>
  );
}
