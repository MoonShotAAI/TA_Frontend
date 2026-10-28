'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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

type BatchLifecycleKey = 'all' | 'pending_rubric' | 'ai_grading' | 'pending_review' | 'completed';

function getBatchLifecycle(status: string) {
  const s = (status || '').toLowerCase().trim();
  // 1. zip 파일만 올리고 채점 기준도 확정 안한 경우
  if (s.includes('rubric') || s.includes('upload') || s === 'uploaded') {
    return {
      key: 'pending_rubric' as const,
      label: '1. 루브릭 미설정',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      description: '채점 기준 설정 대기',
    };
  }
  // 2. 채점 기준은 확정했지만 AI가 채점 중인 경우
  if (s.includes('progress') || s === 'grading') {
    return {
      key: 'ai_grading' as const,
      label: '2. AI 채점 중',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'AI 채점 진행 중',
    };
  }
  // 4. 해당 과제 전체에 대해 사람이 채점을 확정 지은 경우
  if (s.includes('complete') || s.includes('finalized')) {
    return {
      key: 'completed' as const,
      label: '4. 채점 확정',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      description: '사람 검토 및 채점 확정 완료',
    };
  }
  // 3. AI 채점이 완료되었으며, 사람의 검토를 기다리고 있는 경우 (설령 AI의 confidence가 모두 좋더라도 검토필요). (채점중)
  return {
    key: 'pending_review' as const,
    label: '3. 검토 대기 (채점 중)',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'AI 채점 완료 • 사람 검토 대기',
  };
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    batches,
    stats,
    isLoading,
    refreshBatches,
    removeBatch,
    selectBatch,
  } = useBatchStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BatchLifecycleKey>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (searchParams.get('toast') === 'grading_started') {
      setToastMessage('AI 채점 요청이 전송되었습니다');
      refreshBatches();
      router.replace('/');
    } else if (searchParams.get('toast') === 'finalized') {
      setToastMessage('✓ 해당 과제 전체에 대해 사람이 채점을 최종 확정했습니다 (상태 4 완료)');
      refreshBatches();
      router.replace('/');
    }
  }, [searchParams, refreshBatches, router]);

  // 4개 라이프사이클 상태별 카운트 계산
  const pendingRubricCount = batches.filter((b) => getBatchLifecycle(b.status).key === 'pending_rubric').length;
  const aiGradingCount = batches.filter((b) => getBatchLifecycle(b.status).key === 'ai_grading').length;
  const pendingReviewCount = batches.filter((b) => getBatchLifecycle(b.status).key === 'pending_review').length;
  const completedCount = batches.filter((b) => getBatchLifecycle(b.status).key === 'completed').length;

  // Filter Logic
  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      batch.assignment_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.id.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (statusFilter !== 'all') {
      matchesStatus = getBatchLifecycle(batch.status).key === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

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
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">3. 검토 대기 (채점 중)</div>
              <div className="text-2xl font-bold text-indigo-700 mt-0.5">
                {pendingReviewCount} Batches
              </div>
              <div className="text-xs text-indigo-800 font-medium mt-0.5">
                {pendingReviewCount > 0 ? 'AI 채점 완료 • 사람 검토 대기' : '대기 과제 없음'}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">4. 채점 확정 (완료)</div>
              <div className="text-2xl font-bold text-emerald-900 mt-0.5">
                {completedCount} Batches
              </div>
              <div className="text-xs text-slate-600 font-medium mt-0.5">
                {completedCount > 0 ? '최종 채점 완료' : '확정 과제 없음'}
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar with 4 Specific Lifecycle Status Tabs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Status Tabs with Dynamic Real Counts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: '전체 (All)', count: batches.length },
              { id: 'pending_rubric', label: '1. 루브릭 미설정', count: pendingRubricCount },
              { id: 'ai_grading', label: '2. AI 채점 중', count: aiGradingCount },
              { id: 'pending_review', label: '3. 검토 대기 (채점 중)', count: pendingReviewCount },
              { id: 'completed', label: '4. 채점 확정', count: completedCount },
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

          {/* Search Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="과제명 또는 Batch ID 검색..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
              />
            </div>
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
              const lifecycle = getBatchLifecycle(batch.status);

              return (
                <div
                  key={batch.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between group hover:border-blue-400/60 relative overflow-hidden"
                >
                  {/* Top strip banner */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {batch.assignment_title}
                      </h3>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-mono">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span>Batch ID: {batch.id}</span>
                      </div>
                    </div>

                    {/* Status Badge (4 Specific States) & Delete Action */}
                    <div className="flex items-center gap-2">
                      {lifecycle.key === 'pending_rubric' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>1. 루브릭 미설정</span>
                        </span>
                      )}
                      {lifecycle.key === 'ai_grading' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                          <span>2. AI 채점 진행 중</span>
                        </span>
                      )}
                      {lifecycle.key === 'pending_review' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          <span>3. 검토 대기 (채점 중)</span>
                        </span>
                      )}
                      {lifecycle.key === 'completed' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>4. 채점 확정 (완료)</span>
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
                        <span className="text-slate-700">채점 진행 현황</span>
                        <span className="text-slate-900 font-bold">
                          {gradedSub} / {batch.total_submissions} ({progressPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            lifecycle.key === 'completed'
                              ? 'bg-emerald-500'
                              : lifecycle.key === 'pending_review'
                              ? 'bg-indigo-600'
                              : lifecycle.key === 'ai_grading'
                              ? 'bg-blue-600'
                              : 'bg-amber-400'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Badges / Metrics Row */}
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <div className="text-[10px] text-slate-700 font-medium">제출 학생 수</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">
                          {batch.total_submissions}명 제출
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <div className="text-[10px] text-slate-700 font-medium">평균 점수</div>
                        <div className="text-xs font-bold text-indigo-700 mt-0.5">
                          {batch.average_score > 0 ? `${batch.average_score}점` : '--'}
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <div className="text-[10px] text-slate-700 font-medium">검토 상태</div>
                        <div
                          className={`text-xs font-bold mt-0.5 ${
                            lifecycle.key === 'completed'
                              ? 'text-emerald-700 font-extrabold'
                              : lifecycle.key === 'pending_review'
                              ? 'text-indigo-700 font-extrabold'
                              : lifecycle.key === 'ai_grading'
                              ? 'text-blue-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {lifecycle.key === 'completed'
                            ? '최종 확정 완료'
                            : lifecycle.key === 'pending_review'
                            ? '사람 검토 대기'
                            : lifecycle.key === 'ai_grading'
                            ? 'AI 채점 중'
                            : '루브릭 미설정'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Footer & Action Buttons tailored to each state */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-slate-600 font-medium">
                      최근 수정: {new Date(batch.updated_at || batch.created_at).toLocaleDateString()}
                    </div>

                    <div className="flex items-center gap-2">
                      {lifecycle.key === 'pending_rubric' && (
                        <Link
                          href={`/upload?step=2&batchId=${batch.id}`}
                          onClick={() => selectBatch(batch.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-[1.02]"
                        >
                          <span>루브릭 설정하기</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                      {lifecycle.key === 'ai_grading' && (
                        <button
                          type="button"
                          onClick={handleManualRefresh}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                          <span>AI 채점 중 (새로고침)</span>
                        </button>
                      )}
                      {lifecycle.key === 'pending_review' && (
                        <>
                          <Link
                            href={`/upload?step=2&batchId=${batch.id}`}
                            onClick={() => selectBatch(batch.id)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                          >
                            루브릭
                          </Link>
                          <Link
                            href={`/grading?batchId=${batch.id}`}
                            onClick={() => selectBatch(batch.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-[1.02]"
                          >
                            <span>채점 검토하기</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </>
                      )}
                      {lifecycle.key === 'completed' && (
                        <>
                          <Link
                            href={`/upload?step=2&batchId=${batch.id}`}
                            onClick={() => selectBatch(batch.id)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                          >
                            루브릭
                          </Link>
                          <Link
                            href={`/grading?batchId=${batch.id}`}
                            onClick={() => selectBatch(batch.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-[1.02]"
                          >
                            <span>채점 결과 조회</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </>
                      )}
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

export default function BatchesDashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}

