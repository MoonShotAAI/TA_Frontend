'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Search,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Code2,
  FileCode,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Download,
  Check,
  Loader2,
  FolderOpen,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { TopHeader } from '@/components/TopHeader';
import { StepProgressBar } from '@/components/StepProgressBar';
import { Toast } from '@/components/Toast';
import { useBatchStore } from '@/context/BatchContext';
import {
  fetchBatches,
  fetchBatchConfidenceQueue,
  approveStudentGrading,
  getBatchCsvExportUrl,
  ConfidenceQueueItem,
  ConfidenceQueueResponse,
} from '@/utils/api';

function ConfidenceQueueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlBatchId = searchParams.get('batchId');

  const { selectedBatchId, selectBatch } = useBatchStore();
  const [effectiveBatchId, setEffectiveBatchId] = useState<string | null>(urlBatchId || selectedBatchId || null);

  const [queueData, setQueueData] = useState<ConfidenceQueueResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'all' | 'low_confidence' | 'confident' | 'approved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const [isApproving, setIsApproving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // 1. Resolve active batch ID
  useEffect(() => {
    async function resolveBatch() {
      if (urlBatchId) {
        setEffectiveBatchId(urlBatchId);
        selectBatch(urlBatchId);
        return;
      }
      if (selectedBatchId) {
        setEffectiveBatchId(selectedBatchId);
        return;
      }

      try {
        const batchList = await fetchBatches();
        if (batchList && batchList.length > 0) {
          const firstId = batchList[0].id;
          setEffectiveBatchId(firstId);
          selectBatch(firstId);
        } else {
          setIsLoading(false);
        }
      } catch (err: unknown) {
        console.error('Failed to resolve batches:', err);
        setIsLoading(false);
        setError('백엔드 서버에 연결할 수 없습니다.');
      }
    }
    resolveBatch();
  }, [urlBatchId, selectedBatchId, selectBatch]);

  // 2. Fetch confidence queue data
  const loadQueueData = async (batchId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchBatchConfidenceQueue(batchId);
      setQueueData(res);
      if (res.items && res.items.length > 0) {
        setSelectedItemId((prev) => (prev && res.items.some((i) => i.id === prev) ? prev : res.items[0].id));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`신뢰도 채점 데이터를 불러오지 못했습니다: ${msg}`);
      setQueueData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveBatchId) {
      loadQueueData(effectiveBatchId);
    }
  }, [effectiveBatchId]);

  // Derived collections
  const allItems = queueData?.items || [];

  const filteredQueue = useMemo(() => {
    return allItems.filter((item) => {
      const matchesSearch =
        item.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.file_name.toLowerCase().includes(searchQuery.toLowerCase());

      if (activeTab === 'low_confidence') {
        return matchesSearch && item.status === 'TA Review Needed';
      }
      if (activeTab === 'confident') {
        return matchesSearch && item.status === 'AI Confident';
      }
      if (activeTab === 'approved') {
        return matchesSearch && (item.status === 'Approved' || item.is_ta_reviewed);
      }
      return matchesSearch;
    });
  }, [allItems, searchQuery, activeTab]);

  const selectedItem: ConfidenceQueueItem | undefined =
    allItems.find((i) => i.id === selectedItemId) || allItems[0];

  const lowConfidenceCount = allItems.filter((i) => i.status === 'TA Review Needed').length;
  const confidentCount = allItems.filter((i) => i.status === 'AI Confident').length;
  const approvedCount = allItems.filter((i) => i.status === 'Approved' || i.is_ta_reviewed).length;

  // Selected index for chevron stepper
  const selectedIdx = allItems.findIndex((i) => i.id === selectedItem?.id);

  const handlePrevItem = () => {
    if (selectedIdx > 0) {
      setSelectedItemId(allItems[selectedIdx - 1].id);
    }
  };

  const handleNextItem = () => {
    if (selectedIdx < allItems.length - 1) {
      setSelectedItemId(allItems[selectedIdx + 1].id);
    }
  };

  // Quick Approve action
  const handleQuickApprove = async () => {
    if (!selectedItem || !selectedItem.grading_id) {
      showToast('⚠️ 채점 ID가 존재하지 않아 승인할 수 없습니다.');
      return;
    }

    try {
      setIsApproving(true);
      await approveStudentGrading(selectedItem.grading_id);
      
      // Update local state immediately
      setQueueData((prev) => {
        if (!prev) return prev;
        const updated = prev.items.map((it) =>
          it.id === selectedItem.id
            ? { ...it, status: 'Approved' as const, is_ta_reviewed: true, review_priority: 'Low' as const }
            : it
        );
        return {
          ...prev,
          approved_count: prev.approved_count + 1,
          low_confidence_count: Math.max(0, prev.low_confidence_count - (selectedItem.status === 'TA Review Needed' ? 1 : 0)),
          items: updated,
        };
      });

      showToast(`✓ ${selectedItem.student_name} (${selectedItem.file_name}) 채점이 승인(Approved)되었습니다.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`❌ 승인 실패: ${msg}`);
    } finally {
      setIsApproving(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!effectiveBatchId) {
      showToast('선택된 배치가 없습니다.');
      return;
    }
    const downloadUrl = getBatchCsvExportUrl(effectiveBatchId);
    window.open(downloadUrl, '_blank');
    showToast('공식 성적표 CSV 다운로드를 시작했습니다.');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Top Header matching dark navy aesthetics */}
      <TopHeader activeSection="grade" />

      {/* 4-Step Progress Bar matching mockup screenshot 4 */}
      <StepProgressBar
        currentStep={4}
        progressPercent={100}
        onStepClick={(step) => {
          if (step === 1) router.push('/upload');
          if (step === 2) router.push('/upload?step=2');
          if (step === 3) router.push(effectiveBatchId ? `/grading?batchId=${effectiveBatchId}` : '/grading');
          if (step === 4) router.push(effectiveBatchId ? `/confidence?batchId=${effectiveBatchId}` : '/confidence');
        }}
      />

      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Step Header Card matching mockup screenshot 4 */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Step 4. Confidence Scoring &amp; TA Review Queue
              </h1>
              <p className="text-xs text-slate-700 font-medium mt-0.5">
                AI 신뢰도가 낮거나 이상 징후가 감지된 제출물을 우선 검토하고 성적을 최종 확정합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={!queueData || allItems.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all hover:shadow-lg disabled:opacity-40"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Export CSV (성적표 다운로드)</span>
            </button>
          </div>
        </div>

        {/* LOADING STATE */}
        {isLoading && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-16 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <div>
              <h3 className="text-base font-bold text-slate-900">AI 신뢰도 분석 및 검토 큐를 불러오는 중입니다...</h3>
              <p className="text-xs text-slate-500 mt-1">학생별 채점 점수, 인용 근거, 우선순위 데이터를 동기화하고 있습니다.</p>
            </div>
          </div>
        )}

        {/* EMPTY STATE: NO BATCH OR NO SUBMISSIONS */}
        {!isLoading && (allItems.length === 0 || error) && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-12 sm:p-16 flex flex-col items-center justify-center text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-500 flex items-center justify-center shadow-inner">
              <FolderOpen className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="text-lg font-bold text-slate-900">
                {error ? '데이터를 불러올 수 없습니다' : '검토할 채점 데이터가 없습니다'}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {error ||
                  '선택된 과제 배치의 AI 채점이 아직 완료되지 않았거나 제출물이 없습니다. 과제 관리 대시보드에서 배치를 선택하거나 Step 2에서 AI 채점을 먼저 실행해주세요.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/"
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
              >
                과제 대시보드로 이동
              </Link>
              <Link
                href={`/upload?step=2${effectiveBatchId ? `&batchId=${effectiveBatchId}` : ''}`}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-colors"
              >
                AI 채점 실행하기
              </Link>
            </div>
          </div>
        )}

        {/* MAIN WORKSPACE */}
        {!isLoading && allItems.length > 0 && queueData && (
          <>
            {/* 3 Metric Summary Cards matching screenshot 4 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Graded Submissions */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {queueData.graded_submissions}
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    graded submissions
                  </div>
                  <div className="text-[11px] text-slate-700 font-medium">
                    Out of {queueData.total_submissions} total ({queueData.total_submissions > 0 ? Math.round((queueData.graded_submissions / queueData.total_submissions) * 100) : 0}%)
                  </div>
                </div>
              </div>

              {/* Card 2: Low-confidence cases */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {lowConfidenceCount}
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    low-confidence cases
                  </div>
                  <div className="text-[11px] text-rose-700 font-medium">
                    Need TA review ({allItems.length > 0 ? Math.round((lowConfidenceCount / allItems.length) * 100) : 0}%)
                  </div>
                </div>
              </div>

              {/* Card 3: Confident or Approved cases */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {confidentCount + approvedCount}
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    confident &amp; approved
                  </div>
                  <div className="text-[11px] text-blue-700 font-medium">
                    Ready for grade release ({approvedCount} approved)
                  </div>
                </div>
              </div>
            </div>

            {/* 2-Column Split Layout matching screenshot 4 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* ================= LEFT COLUMN: Submission Queue Table (7 cols) ================= */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
                {/* Filter Tabs & Search Bar */}
                <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      <button
                        type="button"
                        onClick={() => setActiveTab('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                          activeTab === 'all'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                        }`}
                      >
                        All Submissions ({allItems.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('low_confidence')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                          activeTab === 'low_confidence'
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        <span>Low Confidence ({lowConfidenceCount})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('confident')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                          activeTab === 'confident'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>AI Confident ({confidentCount})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('approved')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                          activeTab === 'approved'
                            ? 'bg-purple-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 text-purple-500" />
                        <span>Approved ({approvedCount})</span>
                      </button>
                    </div>

                    {/* Search */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-56">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="학생 이름 또는 파일명 검색..."
                          className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto max-h-[640px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-700 uppercase font-semibold border-b border-slate-100 sticky top-0 z-10 backdrop-blur-xs">
                      <tr>
                        <th className="py-3 px-3">Student ID</th>
                        <th className="py-3 px-3">File Name</th>
                        <th className="py-3 px-3">Suggested Score</th>
                        <th className="py-3 px-3">Confidence</th>
                        <th className="py-3 px-3">Review Priority</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredQueue.map((item) => {
                        const isSelected = item.id === selectedItem?.id;

                        return (
                          <tr
                            key={item.id}
                            onClick={() => setSelectedItemId(item.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-50/80 border-l-4 border-l-blue-600'
                                : 'hover:bg-slate-50/70'
                            }`}
                          >
                            <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                              {item.student_name}
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap max-w-[160px] truncate" title={item.file_name}>
                              {item.file_name}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                              {item.suggested_score}{' '}
                              <span className="text-[11px] text-slate-700 font-medium">/ {item.max_score}</span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={`text-xs font-bold ${
                                  item.confidence < 60
                                    ? 'text-rose-600'
                                    : item.confidence < 80
                                    ? 'text-amber-600'
                                    : 'text-emerald-600'
                                }`}
                              >
                                {item.confidence}%
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                  item.review_priority === 'High'
                                    ? 'bg-rose-100 text-rose-700'
                                    : item.review_priority === 'Medium'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {item.review_priority}
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              {item.status === 'Approved' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                  <Check className="w-3 h-3 text-purple-600" />
                                  Approved
                                </span>
                              )}
                              {item.status === 'TA Review Needed' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                  TA Review Needed
                                </span>
                              )}
                              {item.status === 'AI Confident' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  AI Confident
                                </span>
                              )}
                              {item.status === 'Pending Grading' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <Link
                                href={`/grading?batchId=${effectiveBatchId}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-600 hover:text-blue-800 text-[11px] font-bold p-1 rounded hover:bg-blue-50 inline-flex items-center gap-1"
                              >
                                <span>검토</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700">
                  <span className="font-medium">
                    총 {filteredQueue.length}건의 학생 제출물 표시 중
                  </span>
                </div>
              </div>

              {/* ================= RIGHT COLUMN: Selected Submission Card (5 cols) ================= */}
              {selectedItem && (
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
                  {/* Header: Selected Submission & Stepper */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-blue-600" />
                      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Selected Submission
                      </h2>
                    </div>
                    <div className="text-xs font-semibold text-slate-700 flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                      <button
                        type="button"
                        onClick={handlePrevItem}
                        disabled={selectedIdx <= 0}
                        className="disabled:opacity-30 hover:text-slate-900"
                        title="이전 학생"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span>
                        {selectedIdx + 1} of {allItems.length}
                      </span>
                      <button
                        type="button"
                        onClick={handleNextItem}
                        disabled={selectedIdx >= allItems.length - 1}
                        className="disabled:opacity-30 hover:text-slate-900"
                        title="다음 학생"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Student ID & Status Badge */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {selectedItem.student_name}
                      </h3>
                      <div className="text-xs text-slate-700 font-mono font-medium mt-0.5">
                        {selectedItem.file_name} &middot; {selectedItem.file_size}
                      </div>
                    </div>

                    <div>
                      {selectedItem.status === 'Approved' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          Approved
                        </span>
                      )}
                      {selectedItem.status === 'TA Review Needed' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          TA Review Needed
                        </span>
                      )}
                      {selectedItem.status === 'AI Confident' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          AI Confident
                        </span>
                      )}
                      {selectedItem.status === 'Pending Grading' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metrics Row: Suggested Score, AI Confidence, Review Priority */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-700 uppercase font-semibold">Suggested Score</div>
                      <div className="text-base font-extrabold text-slate-900 mt-0.5">
                        {selectedItem.suggested_score}{' '}
                        <span className="text-[11px] text-slate-700 font-normal">/ {selectedItem.max_score}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-700 uppercase font-semibold">AI Confidence</div>
                      <div
                        className={`text-base font-extrabold mt-0.5 ${
                          selectedItem.confidence < 60
                            ? 'text-rose-600'
                            : selectedItem.confidence < 80
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {selectedItem.confidence}%
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-700 uppercase font-semibold">Review Priority</div>
                      <div
                        className={`text-sm font-extrabold mt-1 ${
                          selectedItem.review_priority === 'High'
                            ? 'text-rose-600'
                            : selectedItem.review_priority === 'Medium'
                            ? 'text-amber-600'
                            : 'text-slate-700'
                        }`}
                      >
                        {selectedItem.review_priority}
                      </div>
                    </div>
                  </div>

                  {/* AI Explanation */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>AI Explanation &amp; 종합 피드백</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      {selectedItem.ai_explanation}
                    </p>
                  </div>

                  {/* Cited Evidence from Submission */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Cited Evidence from Submission</span>
                    </div>
                    <pre className="font-sans text-xs bg-slate-900 text-slate-200 p-3.5 rounded-xl overflow-x-auto leading-relaxed border border-slate-800 whitespace-pre-wrap">
                      {selectedItem.cited_evidence_code}
                    </pre>
                  </div>

                  {/* Reason for Uncertainty */}
                  {selectedItem.reasons_for_uncertainty && selectedItem.reasons_for_uncertainty.length > 0 && (
                    <div className="p-3.5 rounded-xl border border-rose-200/90 bg-rose-50/50 space-y-2">
                      <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Reason for Uncertainty / 주의 사항</span>
                      </div>
                      <ul className="text-xs text-rose-900/90 space-y-1 pl-1 font-medium">
                        {selectedItem.reasons_for_uncertainty.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-rose-500 font-bold">&bull;</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggested TA Action */}
                  <div className="p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/40 space-y-1">
                    <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Suggested TA Action</span>
                    </div>
                    <p className="text-xs text-blue-900/90 leading-relaxed font-medium">
                      {selectedItem.suggested_action}
                    </p>
                  </div>

                  {/* Actions: Open Full Evaluation & Grade */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <Link
                      href={`/grading?batchId=${effectiveBatchId}`}
                      className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group"
                    >
                      <span>Open Full Evaluation &amp; Grade</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <button
                      type="button"
                      onClick={handleQuickApprove}
                      disabled={isApproving || selectedItem.status === 'Approved' || !selectedItem.grading_id}
                      className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                    >
                      {isApproving ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> : <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      <span>{selectedItem.status === 'Approved' ? '승인 완료됨' : 'Quick Approve'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Floating Action / Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}

export default function ConfidenceQueuePage() {
  return (
    <Suspense fallback={null}>
      <ConfidenceQueueContent />
    </Suspense>
  );
}
