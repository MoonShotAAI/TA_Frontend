'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FolderKanban,
  UploadCloud,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Plus,
  FileCheck2,
  RefreshCw,
  Trash2,
  X,
  Loader2,
  FileArchive,
  Check,
} from 'lucide-react';
import { TopHeader } from '@/components/TopHeader';
import { useBatchStore } from '@/context/BatchContext';
import { Toast } from '@/components/Toast';
export default function BatchesDashboardPage() {
  const router = useRouter();

  const {
    batches,
    stats,
    isLoading,
    refreshBatches,
    removeBatch,
    selectBatch,
  } = useBatchStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'ready_to_grade' | 'completed'>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);



  // Status Counts
  const inProgressCount = batches.filter((b) => b.status.toLowerCase().includes('progress')).length;
  const readyCount = batches.filter(
    (b) =>
      b.status.toLowerCase().includes('ready') ||
      b.status.toLowerCase().includes('review') ||
      b.status.toLowerCase().includes('upload')
  ).length;
  const completedCount = batches.filter(
    (b) => b.status.toLowerCase().includes('complete') || b.status.toLowerCase().includes('graded')
  ).length;

  // Filter Logic
  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      batch.assignment_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.course_title.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    const st = batch.status.toLowerCase();
    if (statusFilter === 'in_progress') {
      matchesStatus = st.includes('progress');
    } else if (statusFilter === 'ready_to_grade') {
      matchesStatus = st.includes('ready') || st.includes('review') || st.includes('upload');
    } else if (statusFilter === 'completed') {
      matchesStatus = st.includes('complete') || st.includes('graded');
    }

    const matchesCourse = selectedCourse === 'all' || batch.course_code === selectedCourse;

    return matchesSearch && matchesStatus && matchesCourse;
  });

  const availableCourses = Array.from(new Set(batches.map((b) => b.course_code)));

  const handleManualRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshBatches();
      setToastMessage('✓ Refreshed batches and statistics from SQLite DB.');
    } catch {
      setToastMessage('⚠️ Could not refresh from backend.');
    } finally {
      setIsRefreshing(false);
    }
  };



  const handleDeleteBatch = async (batchId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete batch "${title}" from the database?`)) {
      try {
        await removeBatch(batchId);
        setToastMessage(`🗑️ Batch "${title}" deleted.`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setToastMessage(`❌ Delete failed: ${msg}`);
      }
    }
  };

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
                Fall Semester 2026
              </span>
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="text-xs text-slate-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
                title="Refresh data from DB"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                <span>Sync with SQLite DB</span>
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Assignment Batches &amp; Grading Folders
            </h1>
            <p className="text-sm text-slate-700 mt-1">
              Select an active grading batch to review submissions, or upload a new ZIP from your university LMS.
            </p>
          </div>

          <div></div>
        </div>

        {/* Quick Analytics Summary Bar (Live DB numbers - 0 if empty) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Active Folders</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{stats.totalBatches} Batches</div>
              <div className="text-xs text-slate-700 font-medium mt-0.5">Across {stats.totalCourses} courses</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Overall Progress</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">
                {stats.totalSubmissions > 0 ? `${stats.overallProgressPercent}%` : '0%'}
              </div>
              <div className="text-xs text-slate-700 font-medium mt-0.5">
                {stats.totalGraded.toLocaleString()} of {stats.totalSubmissions.toLocaleString()} submissions
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">TA Review Needed</div>
              <div className="text-2xl font-bold text-amber-700 mt-0.5">
                {stats.totalLowConfidence > 0 ? `${stats.totalLowConfidence} Flagged` : '0 Flagged'}
              </div>
              <div className="text-xs text-amber-800 font-medium mt-0.5">
                {stats.totalLowConfidence > 0 ? 'Low confidence cases' : 'No pending reviews'}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Avg Rubric Health</div>
              <div className="text-2xl font-bold text-indigo-900 mt-0.5">
                {stats.avgRubricHealth ? `${stats.avgRubricHealth}%` : '--'}
              </div>
              <div className="text-xs text-slate-600 font-medium mt-0.5">
                {stats.avgRubricHealth ? 'High Stability (σ ≤ 0.20)' : 'No active rubrics'}
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Status Tabs with Dynamic Real Counts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Batches', count: batches.length },
              { id: 'in_progress', label: 'In Progress', count: inProgressCount },
              { id: 'ready_to_grade', label: 'Ready to Grade', count: readyCount },
              { id: 'completed', label: 'Completed', count: completedCount },
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
              {availableCourses.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Batches Folder Grid OR Empty State */}
        {isLoading ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-2xs my-6 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">Loading batches from database...</p>
          </div>
        ) : batches.length === 0 ? (
          /* TRULY EMPTY STATE: When NO data exists in DB, show clean minimal empty state */
          <div className="py-24 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FolderKanban className="w-6 h-6" />
            </div>
            <h2 className="text-sm font-bold text-slate-700">
              등록된 과제 배치가 없습니다
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              상단의 Submissions 메뉴에서 업로드 및 파싱된 과제 파일들을 관리할 수 있습니다.
            </p>
          </div>
        ) : filteredBatches.length === 0 ? (
          /* Filtered search empty state */
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 my-8">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">검색 조건과 일치하는 과제가 없습니다</h3>
            <p className="text-xs text-slate-400 mt-1">검색어나 필터 조건을 변경해 보세요.</p>
          </div>
        ) : (
          /* Real Batches from Database */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
            {filteredBatches.map((batch) => {
              const totalSub = batch.total_submissions || 1;
              const gradedSub = batch.graded_submissions || 0;
              const progressPercent = Math.min(100, Math.round((gradedSub / totalSub) * 100));
              const isCompleted =
                batch.status.toLowerCase().includes('completed') ||
                batch.status.toLowerCase().includes('graded');
              const isReady =
                batch.status.toLowerCase().includes('ready') ||
                batch.status.toLowerCase().includes('review');

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
                          {batch.course_code}
                        </span>
                        <span className="text-xs text-slate-700 font-semibold">{batch.course_title}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {batch.assignment_title}
                      </h3>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-mono">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span>Batch ID: {batch.id}</span>
                      </div>
                    </div>

                    {/* Status Badge & Delete Action */}
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Completed
                        </span>
                      ) : isReady ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Ready to Grade
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                          In Progress
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteBatch(batch.id, batch.assignment_title)}
                        className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete batch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Middle Info & Progress Bar */}
                  <div className="py-4 border-y border-slate-100 my-2 space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                        <span className="text-slate-700">Grading Completion</span>
                        <span className="text-slate-900 font-bold">
                          {gradedSub} / {batch.total_submissions} ({progressPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted
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
                        <div className="text-xs font-bold text-slate-800 mt-0.5">
                          {batch.total_submissions} enrolled
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <div className="text-[10px] text-slate-700 font-medium">Avg Score</div>
                        <div className="text-xs font-bold text-indigo-700 mt-0.5">
                          {batch.average_score > 0 ? `${batch.average_score} pts` : '--'}
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <div className="text-[10px] text-slate-700 font-medium">Low Confidence</div>
                        <div
                          className={`text-xs font-bold mt-0.5 ${
                            batch.low_confidence_count > 0
                              ? 'text-amber-700 font-extrabold'
                              : 'text-slate-700'
                          }`}
                        >
                          {batch.low_confidence_count} cases
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Footer & Action Buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-slate-600 font-medium">
                      Updated: {new Date(batch.updated_at || batch.created_at).toLocaleDateString()}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/upload?step=2&batchId=${batch.id}`}
                        onClick={() => selectBatch(batch.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                      >
                        Rubric
                      </Link>
                      <Link
                        href={`/grading?batchId=${batch.id}`}
                        onClick={() => selectBatch(batch.id)}
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
        )}
      </main>



      {/* Floating Action / Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
