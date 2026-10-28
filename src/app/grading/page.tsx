'use client';

import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Code2,
  FileCode,
  Eye,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Sliders,
  RotateCcw,
  Edit3,
  Bookmark,
  FolderOpen,
  Loader2,
  AlertCircle,
  Save,
  UserCheck,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { TopHeader } from '@/components/TopHeader';
import { StepProgressBar } from '@/components/StepProgressBar';
import { Toast } from '@/components/Toast';
import { useBatchStore } from '@/context/BatchContext';
import {
  fetchBatches,
  fetchBatchFiles,
  fetchStudentGrading,
  fetchParsedText,
  updateCriterionScore,
  finalizeBatchGrading,
  approveStudentGrading,
  autoApproveHighConfidence,
  SubmissionFileItem,
  StudentGradingDetail,
  CriterionGradeItem,
} from '@/utils/api';

interface UIExpandedCriterion extends CriterionGradeItem {
  isExpanded: boolean;
}

function GradingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlBatchId = searchParams.get('batchId');

  const { selectedBatchId, selectBatch } = useBatchStore();
  const [effectiveBatchId, setEffectiveBatchId] = useState<string | null>(urlBatchId || selectedBatchId || null);

  // Batch & file navigation state
  const [files, setFiles] = useState<SubmissionFileItem[]>([]);
  const [currentStudentIdx, setCurrentStudentIdx] = useState(0);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [filesError, setFilesError] = useState<string | null>(null);

  // Student grading & parsed text state
  const [gradingDetail, setGradingDetail] = useState<StudentGradingDetail | null>(null);
  const [criteria, setCriteria] = useState<UIExpandedCriterion[]>([]);
  const [parsedText, setParsedText] = useState<string>('');
  const [isLoadingStudent, setIsLoadingStudent] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);

  // Action states
  const [isSaving, setIsSaving] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isAutoApproving, setIsAutoApproving] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'raw'>('preview');
  const [highlightActive, setHighlightActive] = useState(true);
  const [activeQuote, setActiveQuote] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const evidenceRef = useRef<HTMLSpanElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // 1. Resolve batch ID on mount
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
          setIsLoadingFiles(false);
        }
      } catch (err: unknown) {
        console.error('Failed to resolve batches:', err);
        setIsLoadingFiles(false);
        setFilesError('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      }
    }
    resolveBatch();
  }, [urlBatchId, selectedBatchId, selectBatch]);

  // 2. Fetch submission files for the active batch
  const loadBatchFiles = useCallback(async (batchId: string) => {
    setIsLoadingFiles(true);
    setFilesError(null);
    try {
      const fileList = await fetchBatchFiles(batchId);
      setFiles(fileList);
      if (fileList.length > 0) {
        setCurrentStudentIdx(0);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFilesError(`과제 제출 파일 목록을 불러오지 못했습니다: ${msg}`);
      setFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    if (effectiveBatchId) {
      loadBatchFiles(effectiveBatchId);
    }
  }, [effectiveBatchId, loadBatchFiles]);

  // 3. Fetch grading details & parsed text for the currently selected student
  const currentFile: SubmissionFileItem | undefined = files[currentStudentIdx];

  const loadStudentData = useCallback(async (file: SubmissionFileItem) => {
    setIsLoadingStudent(true);
    setStudentError(null);
    setGradingDetail(null);
    setCriteria([]);
    setParsedText('');
    setActiveQuote(null);

    try {
      // Parallel fetch: Grading result + Parsed text
      const [gradingResult, parsedResult] = await Promise.allSettled([
        fetchStudentGrading(file.id),
        fetchParsedText(file.id),
      ]);

      if (parsedResult.status === 'fulfilled') {
        setParsedText(parsedResult.value.parsed_text || '');
      } else {
        setParsedText('원문 텍스트를 불러오지 못했습니다.');
      }

      if (gradingResult.status === 'fulfilled') {
        const gd = gradingResult.value;
        setGradingDetail(gd);
        const uic: UIExpandedCriterion[] = (gd.criteria_grades || []).map((cg, idx) => ({
          ...cg,
          isExpanded: idx === 0, // expand first criterion by default
        }));
        setCriteria(uic);
        if (uic.length > 0 && uic[0].evidence_quote) {
          setActiveQuote(uic[0].evidence_quote);
        }
      } else {
        setStudentError('이 학생의 AI 채점 결과가 아직 없거나 불러오지 못했습니다.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStudentError(`학생 데이터 로드 실패: ${msg}`);
    } finally {
      setIsLoadingStudent(false);
    }
  }, []);

  useEffect(() => {
    if (currentFile) {
      loadStudentData(currentFile);
    }
  }, [currentFile, loadStudentData]);

  // Calculations
  const currentTotalScore = criteria.reduce((sum, c) => sum + (c.assigned_score || 0), 0);
  const maxPossibleScore = criteria.reduce((sum, c) => sum + (c.max_score || 0), 0) || 100;
  const scorePercent = maxPossibleScore > 0 ? (currentTotalScore / maxPossibleScore) * 100 : 0;

  // Confetti celebration trigger
  const triggerConfetti = async () => {
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#10b981', '#3b82f6', '#6366f1', '#f59e0b'],
      });
    } catch {
      // ignore if canvas-confetti fails
    }
  };

  // Toggle criterion accordion expansion
  const toggleExpand = (criterionId: string) => {
    setCriteria((prev) =>
      prev.map((item) => {
        if (item.criterion_id === criterionId) {
          const nextExpanded = !item.isExpanded;
          if (nextExpanded && item.evidence_quote) {
            setActiveQuote(item.evidence_quote);
          }
          return { ...item, isExpanded: nextExpanded };
        }
        return item;
      })
    );
  };

  // Change score for a criterion
  const handleScoreChange = (criterionId: string, rawScore: number) => {
    setCriteria((prev) =>
      prev.map((item) => {
        if (item.criterion_id === criterionId) {
          const clamped = Math.max(0, Math.min(item.max_score, isNaN(rawScore) ? 0 : rawScore));
          let status: 'MET' | 'PARTIALLY_MET' | 'NOT_MET' = 'MET';
          if (clamped === 0) status = 'NOT_MET';
          else if (clamped < item.max_score) status = 'PARTIALLY_MET';
          else status = 'MET';

          return {
            ...item,
            assigned_score: clamped,
            status,
            is_custom_adjusted: true,
          };
        }
        return item;
      })
    );
  };

  // Set preset status (MET / NOT_MET)
  const setStatus = (criterionId: string, status: 'MET' | 'NOT_MET') => {
    setCriteria((prev) =>
      prev.map((item) => {
        if (item.criterion_id === criterionId) {
          const newScore = status === 'MET' ? item.max_score : 0;
          return {
            ...item,
            status,
            assigned_score: newScore,
            is_custom_adjusted: true,
          };
        }
        return item;
      })
    );
  };

  // Change TA notes
  const handleNotesChange = (criterionId: string, notes: string) => {
    setCriteria((prev) =>
      prev.map((item) =>
        item.criterion_id === criterionId ? { ...item, ta_notes: notes, is_custom_adjusted: true } : item
      )
    );
  };

  // Jump to quote in text pane
  const handleJumpToText = (quote: string) => {
    setActiveTab('preview');
    setActiveQuote(quote);
    setHighlightActive(true);
    setTimeout(() => {
      evidenceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
    showToast('제출물 본문 인용구 위치로 스크롤했습니다.');
  };

  // Reset scores to AI original
  const handleResetScores = () => {
    if (!currentFile) return;
    loadStudentData(currentFile);
    showToast('AI 채점 점수로 초기화했습니다.');
  };

  // Save changes and confirm TA review (확인완료) for current student to backend
  const handleSaveCurrentStudent = async () => {
    if (!gradingDetail || !gradingDetail.id) {
      showToast('⚠️ 채점 ID가 존재하지 않아 저장할 수 없습니다.');
      return;
    }

    try {
      setIsSaving(true);
      // 1. Update criterion scores & TA notes
      const updatePromises = criteria.map((crit) =>
        updateCriterionScore(gradingDetail.id, crit.criterion_id, {
          status: crit.status,
          assigned_score: Math.round(crit.assigned_score),
          ta_notes: crit.ta_notes || '',
        })
      );
      await Promise.all(updatePromises);

      // 2. Mark grading as approved by human TA
      try {
        await approveStudentGrading(gradingDetail.id);
      } catch (approveErr) {
        console.warn('approveStudentGrading endpoint warning:', approveErr);
      }

      // 3. Update local state
      setGradingDetail((prev) => (prev ? { ...prev, is_ta_reviewed: true } : null));

      // 4. Trigger celebration animation & feedback
      triggerConfetti();
      showToast(`✓ [확인완료] ${currentFile?.student_name || currentFile?.file_name || '학생'}의 조교 채점 검토가 승인 완료되었습니다.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`❌ 채점 저장 실패: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Finalize batch grading (State 4)
  const handleFinalizeAll = async () => {
    if (!effectiveBatchId) {
      showToast('선택된 배치가 없습니다.');
      return;
    }

    try {
      setIsFinalizing(true);
      await finalizeBatchGrading(effectiveBatchId);
      router.push(effectiveBatchId ? `/confidence?batchId=${effectiveBatchId}` : '/confidence');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`❌ 채점 확정 실패: ${msg}`);
      setIsFinalizing(false);
    }
  };

  // Auto-approve all high-confidence submissions in the batch
  const handleAutoApproveHighConfidence = async () => {
    if (!effectiveBatchId) {
      showToast('선택된 배치가 없습니다.');
      return;
    }

    try {
      setIsAutoApproving(true);
      const res = await autoApproveHighConfidence(effectiveBatchId);
      const count = res.data?.approved_count ?? 0;

      // 만약 현재 학생이 High Confidence라면 화면 상태도 바로 승인 완료로 갱신
      if (gradingDetail) {
        const isHigh =
          gradingDetail.confidence_level === 'HIGH' ||
          (gradingDetail.confidence_percent && gradingDetail.confidence_percent >= 80);
        if (isHigh) {
          setGradingDetail((prev) => (prev ? { ...prev, is_ta_reviewed: true } : null));
        }
      }

      triggerConfetti();
      showToast(
        count > 0
          ? `⚡ 총 ${count}건의 High-Confidence 과제가 일괄 자동 채점 확정되었습니다!`
          : '✓ 이미 모든 High-Confidence 과제가 확정되었거나 대상이 없습니다.'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`❌ 자동 확정 실패: ${msg}`);
    } finally {
      setIsAutoApproving(false);
    }
  };

  // Navigation chevrons
  const handlePrevStudent = () => {
    if (currentStudentIdx > 0) {
      setCurrentStudentIdx((prev) => prev - 1);
    }
  };

  const handleNextStudent = () => {
    if (currentStudentIdx < files.length - 1) {
      setCurrentStudentIdx((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Top Header matching dark navy aesthetics */}
      <TopHeader activeSection="grade" />

      {/* 4-Step Progress Bar matching mockup */}
      <StepProgressBar
        currentStep={3}
        progressPercent={75}
        onStepClick={(step) => {
          if (step === 1) router.push('/upload');
          if (step === 2) router.push('/upload?step=2');
          if (step === 3) router.push('/grading');
          if (step === 4) router.push('/confidence');
        }}
      />

      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Step Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Left Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-xs">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Step 3. Evaluate &amp; Cite Evidence
              </h1>
              <p className="text-xs text-slate-700 font-medium mt-0.5">
                실제 제출물을 검토하고 AI 채점 결과 및 근거 인용구를 검증합니다.
              </p>
            </div>
          </div>

          {/* Right Controls: Top Action Buttons, Student Stepper & Current Total Score */}
          {!isLoadingFiles && files.length > 0 && currentFile && (
            <div className="flex flex-wrap items-center gap-3">
              {/* Top Quick Actions (상단으로 올린 전체 확정 및 자동 확정 버튼) */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. High-Confidence 자동 채점 확정 버튼 */}
                <button
                  type="button"
                  onClick={handleAutoApproveHighConfidence}
                  disabled={isAutoApproving}
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-xs disabled:opacity-50"
                  title="AI 신뢰도가 높은(HIGH 또는 80% 이상) 모든 과제를 일괄 조교 채점 확정합니다"
                >
                  {isAutoApproving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                  )}
                  <span>{isAutoApproving ? '일괄 확정 중...' : 'High-Confidence 자동 채점 확정'}</span>
                </button>

                {/* 2. 과제 전체 채점 최종 확정 (맨 위로 이동) */}
                <button
                  type="button"
                  onClick={handleFinalizeAll}
                  disabled={isFinalizing}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] flex items-center gap-1.5 disabled:opacity-60"
                  title="과제 배치의 채점을 최종 확정하고 검토 큐로 이동합니다"
                >
                  {isFinalizing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                  )}
                  <span>{isFinalizing ? '확정 처리 중...' : '과제 전체 채점 최종 확정'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-100" />
                </button>
              </div>

              {/* Student Stepper */}
              <div className="flex items-center bg-slate-50 border border-slate-200/90 rounded-xl px-2 py-1.5 shadow-2xs">
                <button
                  type="button"
                  onClick={handlePrevStudent}
                  disabled={currentStudentIdx <= 0}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                  title="이전 학생"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-3 text-center min-w-[140px]">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5">
                    <span>{currentStudentIdx + 1} of {files.length}</span>
                    {gradingDetail?.is_ta_reviewed && (
                      <span className="inline-flex items-center text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200" title="조교 확인완료">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 mr-0.5" />
                        확인됨
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-700 font-mono font-medium truncate max-w-[180px]" title={currentFile.file_name}>
                    {currentFile.file_name}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleNextStudent}
                  disabled={currentStudentIdx >= files.length - 1}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                  title="다음 학생"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Current Total Score & TA Review Status Badge */}
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2 shadow-2xs">
                <div className="text-left">
                  <div className="text-[10px] text-slate-700 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                    <span>Current Total Score</span>
                    <span className="text-blue-600 font-bold">(TA Editable)</span>
                  </div>
                  <div className="text-base font-extrabold text-slate-900 leading-none mt-0.5 font-mono">
                    {currentTotalScore}{' '}
                    <span className="text-xs text-slate-700 font-bold">/ {maxPossibleScore}</span>
                  </div>
                </div>

                {/* Score Tier Badge (calculated by percentage) */}
                <div>
                  {scorePercent >= 90 && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/70">
                      Excellent
                    </span>
                  )}
                  {scorePercent >= 80 && scorePercent < 90 && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200/70">
                      Good
                    </span>
                  )}
                  {scorePercent >= 70 && scorePercent < 80 && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200/70">
                      Average
                    </span>
                  )}
                  {scorePercent < 70 && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200/70">
                      Needs Review
                    </span>
                  )}
                </div>

                {/* Prominent Human TA Review Status Badge */}
                <div className="border-l border-slate-200 pl-3">
                  {gradingDetail?.is_ta_reviewed ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-600 text-white shadow-xs animate-fadeIn">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>조교 확인완료</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200/90 text-slate-700 border border-slate-300">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>조교 미검토</span>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleResetScores}
                  title="AI 원래 제안 점수로 초기화"
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* LOADING STATE */}
        {isLoadingFiles && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-16 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <div>
              <h3 className="text-base font-bold text-slate-900">제출물 및 채점 데이터를 불러오는 중입니다...</h3>
              <p className="text-xs text-slate-500 mt-1">백엔드 API 서버에서 학생 제출 파일과 루브릭 채점 결과를 동기화하고 있습니다.</p>
            </div>
          </div>
        )}

        {/* EMPTY STATE: NO BATCH OR NO FILES */}
        {!isLoadingFiles && (files.length === 0 || filesError) && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-12 sm:p-16 flex flex-col items-center justify-center text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-500 flex items-center justify-center shadow-inner">
              <FolderOpen className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="text-lg font-bold text-slate-900">
                {filesError ? '제출물 목록을 불러올 수 없습니다' : '채점할 제출물이 없습니다'}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {filesError ||
                  '선택된 과제 배치에 업로드된 학생 제출물이 없습니다. 과제 관리 대시보드에서 배치를 선택하거나 새로운 LMS 과제 ZIP 파일을 업로드해주세요.'}
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
                href="/upload"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-colors"
              >
                과제 파일 업로드하기
              </Link>
            </div>
          </div>
        )}

        {/* MAIN 2-PANE GRADING WORKSPACE */}
        {!isLoadingFiles && files.length > 0 && currentFile && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ================= LEFT PANE: Student Submission Viewer (6 cols) ================= */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
              {/* Header row */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900 truncate max-w-[320px]">
                      {currentFile.file_name}
                    </h2>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 uppercase font-mono">
                      {currentFile.file_format || 'DOCX'}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {currentFile.status}
                    </span>
                    {gradingDetail?.is_ta_reviewed ? (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>조교 검토완료</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <span>검토 대기</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-700 font-medium mt-0.5">
                    {currentFile.file_size_kb ? `${currentFile.file_size_kb.toFixed(1)} KB` : 'Local File'} &middot;{' '}
                    {currentFile.student_name ? `제출자: ${currentFile.student_name}` : `학생 ID: ${currentFile.student_id || 'N/A'}`}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Open raw parsed text in new window
                      const blob = new Blob([parsedText], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      window.open(url, '_blank');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <span>새 창에서 원문 보기</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tab Navigation: Preview / Code / Raw File */}
              <div className="bg-slate-50/80 px-4 pt-2 border-b border-slate-200/80 flex items-center gap-1">
                {[
                  { id: 'preview', label: '문서 미리보기 (Preview)', icon: Eye },
                  { id: 'code', label: '코드 블록 (Code)', icon: Code2 },
                  { id: 'raw', label: '파싱 텍스트 (Raw)', icon: FileCode },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as 'preview' | 'code' | 'raw')}
                      className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
                        isActive
                          ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Content Body */}
              <div className="p-6 sm:p-8 space-y-4 max-h-[680px] min-h-[460px] overflow-y-auto font-sans leading-relaxed text-slate-700 text-xs sm:text-[13px]">
                {isLoadingStudent && (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-xs">학생 제출물 파싱 본문을 불러오는 중...</span>
                  </div>
                )}

                {!isLoadingStudent && activeTab === 'preview' && (
                  <div className="space-y-4">
                    {parsedText ? (
                      parsedText.split('\n\n').map((paragraph, pIdx) => {
                        const trimmedPara = paragraph.trim();
                        if (!trimmedPara) return null;

                        // Check if paragraph contains activeQuote
                        const hasActiveQuote =
                          activeQuote &&
                          highlightActive &&
                          trimmedPara.includes(activeQuote.trim());

                        if (hasActiveQuote && activeQuote) {
                          const quotePart = activeQuote.trim();
                          const parts = trimmedPara.split(quotePart);

                          return (
                            <p key={pIdx} className="text-justify leading-relaxed whitespace-pre-wrap">
                              {parts[0]}
                              <span
                                ref={evidenceRef}
                                className="transition-all duration-300 rounded px-1.5 py-0.5 border font-semibold bg-blue-100/90 text-blue-900 border-blue-400 shadow-2xs"
                              >
                                {quotePart}
                              </span>
                              {parts[1]}
                            </p>
                          );
                        }

                        // Check if it looks like a section header (e.g. 1. 2. 3. or # or 제목)
                        const isHeading =
                          trimmedPara.startsWith('#') ||
                          /^[0-9]+[\.\)]\s/.test(trimmedPara) ||
                          (trimmedPara.length < 50 && trimmedPara.endsWith(':'));

                        return (
                          <div key={pIdx}>
                            {isHeading ? (
                              <h3 className="text-sm sm:text-base font-bold text-slate-900 pt-2 pb-1 border-b border-slate-100">
                                {trimmedPara.replace(/^#+\s*/, '')}
                              </h3>
                            ) : (
                              <p className="text-justify leading-relaxed whitespace-pre-wrap">
                                {trimmedPara}
                              </p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 text-slate-500 text-xs">
                        추출된 텍스트 내용이 비어있습니다.
                      </div>
                    )}
                  </div>
                )}

                {!isLoadingStudent && activeTab === 'code' && (
                  <div className="font-mono text-xs bg-slate-900 text-slate-200 p-5 rounded-xl space-y-2 overflow-x-auto whitespace-pre-wrap">
                    {parsedText.includes('```') ? (
                      parsedText
                        .split('```')
                        .filter((_, i) => i % 2 === 1)
                        .join('\n\n--- Code Block ---\n\n')
                    ) : (
                      <div className="text-slate-400">
                        {`// 본문 내 명시적 코드 블록(Markdown)이 감지되지 않았습니다.\n// 전체 텍스트:\n\n${parsedText.slice(0, 1000)}`}
                      </div>
                    )}
                  </div>
                )}

                {!isLoadingStudent && activeTab === 'raw' && (
                  <div className="p-4 rounded-xl bg-slate-50 font-mono text-xs text-slate-700 whitespace-pre-wrap overflow-x-auto">
                    {parsedText || '파싱된 텍스트가 없습니다.'}
                  </div>
                )}
              </div>

              {/* Bottom Citation Notice */}
              <div className="p-3 bg-blue-50/70 border-t border-blue-100/80 px-6 flex items-center justify-between text-xs text-blue-900">
                <span className="font-semibold truncate max-w-[420px]">
                  &bull; {activeQuote ? `인용구 하이라이트: "${activeQuote.slice(0, 45)}..."` : '선택된 루브릭 인용구가 없습니다'}
                </span>
                <button
                  type="button"
                  onClick={() => setHighlightActive(!highlightActive)}
                  className="text-[11px] underline font-bold hover:text-blue-700 shrink-0 ml-2"
                >
                  {highlightActive ? '하이라이트 끄기' : '하이라이트 켜기'}
                </button>
              </div>
            </div>

            {/* ================= RIGHT PANE: AI Evaluation & Rubric Checklist (6 cols) ================= */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
              {/* Header row */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    AI Evaluation &amp; Rubric Checklist
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {gradingDetail && (
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        gradingDetail.confidence_level === 'HIGH'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      AI Confidence: {gradingDetail.confidence_percent || 0}% ({gradingDetail.confidence_level})
                    </span>
                  )}
                  <Link
                    href={`/upload?step=2${effectiveBatchId ? `&batchId=${effectiveBatchId}` : ''}`}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    루브릭 보기
                  </Link>
                </div>
              </div>

              {/* Human TA Review Status Banner */}
              {!isLoadingStudent && !studentError && gradingDetail && (
                gradingDetail.is_ta_reviewed ? (
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/90 text-emerald-900 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <span>사람 조교(TA) 채점 및 검증 완료</span>
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <div className="text-[11px] text-emerald-700 mt-0.5">
                          AI 자동 채점 결과와 원문 인용구를 조교가 직접 검토하고 최종 승인한 과제입니다.
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                      검토 승인됨
                    </span>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>현재 <strong>AI 초안 채점 상태</strong>입니다. 내용 검토 후 아래 <strong>[확인완료]</strong> 버튼을 눌러 승인하세요.</span>
                    </div>
                  </div>
                )
              )}

              {/* Student loading state */}
              {isLoadingStudent && (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-xs text-slate-600">AI 평가 결과 및 루브릭 채점 기준을 로드 중입니다...</p>
                </div>
              )}

              {/* Student error state */}
              {!isLoadingStudent && studentError && (
                <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                  <div className="text-sm font-bold text-amber-900">{studentError}</div>
                  <p className="text-xs text-amber-700">
                    아직 이 학생에 대한 AI 채점이 수행되지 않았거나 대기 중입니다.
                  </p>
                  <Link
                    href={`/upload?step=2${effectiveBatchId ? `&batchId=${effectiveBatchId}` : ''}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 shadow-xs"
                  >
                    <span>루브릭 확정 및 AI 채점 실행</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* Rubric Accordion Cards List */}
              {!isLoadingStudent && !studentError && criteria.length > 0 && (
                <div className="space-y-4">
                  {criteria.map((item) => (
                    <div
                      key={item.criterion_id}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        item.isExpanded
                          ? 'border-blue-300 bg-white shadow-xs ring-1 ring-blue-100'
                          : 'border-slate-200/80 bg-slate-50/60 hover:bg-slate-50'
                      }`}
                    >
                      {/* Card Header row */}
                      <div
                        onClick={() => toggleExpand(item.criterion_id)}
                        className="p-4 sm:p-4.5 cursor-pointer flex items-start justify-between gap-3 select-none"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {item.criterion_number}
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-slate-700 font-medium mt-0.5 leading-relaxed">
                              {item.description}
                            </div>
                          </div>
                        </div>

                        {/* Right side: Score Stepper & Editor */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 shrink-0 select-text"
                        >
                          {item.is_custom_adjusted && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                              TA
                            </span>
                          )}

                          <div className="flex items-center bg-slate-100 hover:bg-white border border-slate-200/90 rounded-xl p-1 shadow-2xs transition-colors">
                            <button
                              type="button"
                              onClick={() => handleScoreChange(item.criterion_id, item.assigned_score - 1)}
                              disabled={item.assigned_score <= 0}
                              className="w-5 h-5 rounded-md bg-white hover:bg-slate-200 text-slate-700 font-extrabold flex items-center justify-center text-xs border border-slate-200 disabled:opacity-30 shadow-2xs"
                              title="1점 감점"
                            >
                              -
                            </button>

                            <div className="flex items-center px-1">
                              <input
                                type="number"
                                min={0}
                                max={item.max_score}
                                value={item.assigned_score}
                                onChange={(e) =>
                                  handleScoreChange(item.criterion_id, Number(e.target.value))
                                }
                                className="w-11 text-center font-extrabold text-xs text-blue-700 bg-white border border-slate-300 rounded-md py-0.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                                title="점수 직접 입력"
                              />
                              <span className="text-[11px] text-slate-700 font-bold pl-1 font-mono">
                                / {item.max_score}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleScoreChange(item.criterion_id, item.assigned_score + 1)}
                              disabled={item.assigned_score >= item.max_score}
                              className="w-5 h-5 rounded-md bg-white hover:bg-slate-200 text-slate-700 font-extrabold flex items-center justify-center text-xs border border-slate-200 disabled:opacity-30 shadow-2xs"
                              title="1점 증점"
                            >
                              +
                            </button>
                          </div>

                          <div className="pl-1 border-l border-slate-200">
                            {item.isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Body: Met/Not Met + Direct Slider + Cited Evidence + Rationale + TA Notes */}
                      {item.isExpanded && (
                        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-slate-100">
                          {/* 충족 (Met) / 미충족 (Not Met) Toggle Buttons */}
                          <div className="grid grid-cols-2 gap-2.5 pt-2">
                            <button
                              type="button"
                              onClick={() => setStatus(item.criterion_id, 'MET')}
                              className={`py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                                item.status === 'MET'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>충족 (Met &mdash; {item.max_score} pts)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setStatus(item.criterion_id, 'NOT_MET')}
                              className={`py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                                item.status === 'NOT_MET'
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <AlertTriangle className="w-4 h-4" />
                              <span>미충족 (Not Met &mdash; 0 pts)</span>
                            </button>
                          </div>

                          {/* TA Score Slider & Quick Presets */}
                          <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/90 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                                <span>Fine-Tune Score:</span>
                                <span className="text-blue-700 font-extrabold text-sm font-mono ml-1">
                                  {item.assigned_score}
                                </span>
                                <span className="text-slate-700 font-bold">/ {item.max_score} pts</span>
                              </span>

                              <div className="flex items-center gap-1 text-[10px]">
                                <span className="text-slate-700 font-medium mr-1">Presets:</span>
                                <button
                                  type="button"
                                  onClick={() => handleScoreChange(item.criterion_id, item.max_score)}
                                  className="px-2.5 py-0.5 font-bold rounded bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                                >
                                  충족 ({item.max_score} pts)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleScoreChange(item.criterion_id, 0)}
                                  className="px-2.5 py-0.5 font-bold rounded bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors"
                                >
                                  미충족 (0 pts)
                                </button>
                              </div>
                            </div>

                            <input
                              type="range"
                              min={0}
                              max={item.max_score}
                              value={item.assigned_score}
                              onChange={(e) =>
                                handleScoreChange(item.criterion_id, Number(e.target.value))
                              }
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>

                          {/* TA Override Notes */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Edit3 className="w-3 h-3 text-slate-500" />
                                TA Adjustment Note / Deduction Reason:
                              </span>
                              <span className="text-[10px] text-slate-700 font-normal">
                                (조교 메모 &middot; 학생에게 공유 가능)
                              </span>
                            </label>
                            <textarea
                              rows={2}
                              value={item.ta_notes || ''}
                              onChange={(e) => handleNotesChange(item.criterion_id, e.target.value)}
                              placeholder="감점 사유 또는 피드백 코멘트를 입력하세요 (예: 2번 문항 오류 분석 누락으로 2점 감점)..."
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none font-medium"
                            />
                          </div>

                          {/* Cited Evidence from Submission */}
                          {item.evidence_quote ? (
                            <div className="rounded-xl border border-blue-200/90 bg-blue-50/50 p-3.5 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                                  <Bookmark className="w-3.5 h-3.5 text-blue-600" />
                                  Cited Evidence from Submission
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleJumpToText(item.evidence_quote)}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline"
                                >
                                  <span>jump to text</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-xs text-slate-700 italic border-l-2 border-blue-500 pl-3 py-0.5 leading-relaxed bg-white/60 rounded-r-lg">
                                &ldquo;{item.evidence_quote}&rdquo;
                              </p>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 italic">
                              인용된 근거 문장이 없습니다.
                            </div>
                          )}

                          {/* Rubric Rationale */}
                          {item.rationale && (
                            <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-3.5 space-y-1">
                              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                <span>Rubric Rationale</span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                {item.rationale}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Actions: Save Current Student & Next */}
              {!isLoadingStudent && !studentError && criteria.length > 0 && (
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleSaveCurrentStudent}
                    disabled={isSaving}
                    className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 ${
                      gradingDetail?.is_ta_reviewed
                        ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20 hover:scale-[1.01]'
                    }`}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin text-current" />
                    ) : gradingDetail?.is_ta_reviewed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <UserCheck className="w-4 h-4 text-white" />
                    )}
                    <span>
                      {isSaving
                        ? '승인 처리 중...'
                        : gradingDetail?.is_ta_reviewed
                        ? '✓ 조교 확인완료됨 (수정 후 재저장 가능)'
                        : '조교 채점 확인완료 (검토 승인)'}
                    </span>
                  </button>

                  {/* 다음 학생으로 이동 버튼 */}
                  {currentStudentIdx < files.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleNextStudent}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all shadow-2xs hover:shadow-xs"
                    >
                      <span>다음 학생 검토 ({currentStudentIdx + 2} / {files.length})</span>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFinalizeAll}
                      disabled={isFinalizing}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] disabled:opacity-60"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>{isFinalizing ? '확정 처리 중...' : '과제 전체 채점 최종 확정'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Action / Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}

export default function EvaluateAndCitePage() {
  return (
    <Suspense fallback={null}>
      <GradingContent />
    </Suspense>
  );
}
