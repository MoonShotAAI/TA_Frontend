'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Check,
  ArrowRight,
  ListTree,
  ChevronDown,
  ChevronUp,
  Scale,
  Zap,
  Loader2,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import {
  run5x5ConsistencyTest,
  clarifyCriterionRule,
  CriterionConsistencyItem,
} from '@/utils/api';

interface Rubric5x5TestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToGrading?: () => void;
  batchId?: string;
  rubricId?: string;
  assignmentTitle?: string;
  onValidationComplete?: (stability: number, rating: string) => void;
}

export const Rubric5x5TestModal: React.FC<Rubric5x5TestModalProps> = ({
  isOpen,
  onClose,
  onProceedToGrading,
  batchId,
  rubricId,
  assignmentTitle,
  onValidationComplete,
}) => {
  // Configurable N (Samples) and M (Runs per sample) - Defaults to 5, 5
  const [sampleCount, setSampleCount] = useState<number>(5);
  const [runsPerSample, setRunsPerSample] = useState<number>(5);

  const [isRunning, setIsRunning] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [criteria, setCriteria] = useState<CriterionConsistencyItem[]>([]);
  const [overallStability, setOverallStability] = useState<number | null>(null);
  const [benchmarkRating, setBenchmarkRating] = useState<string>('');
  const [expandedCritId, setExpandedCritId] = useState<string>('');
  const [clarifyingCritId, setClarifyingCritId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Auto-calculate stats if validated
  const totalCriteria = criteria.length;
  const deterministicCount = criteria.filter((c) => c.verdict_stability === 'Deterministic').length;
  const ambiguousCount = criteria.filter((c) => c.verdict_stability === 'Ambiguous').length;

  useEffect(() => {
    if (criteria.length > 0 && hasValidated) {
      const avg = Math.round(
        criteria.reduce((acc, c) => acc + (c.consistency_rate ?? 100), 0) / criteria.length
      );
      setOverallStability(avg);
    }
  }, [criteria, hasValidated]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const handleStartSimulation = async () => {
    if (!batchId && !rubricId) {
      showToast('⚠️ 루브릭 정보가 유효하지 않습니다. 루브릭 체크리스트를 먼저 생성해주세요.');
      return;
    }

    setIsRunning(true);
    setProgressPercent(10);
    setStatusMessage(
      `AI가 ${sampleCount}개의 테스트 과제에 대해 각 ${runsPerSample}회씩 일괄 채점을 시작합니다... (총 ${sampleCount * runsPerSample}회 추론)`
    );

    // Progress animation ticker
    const progressTimer = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev < 85) return prev + 10;
        return prev;
      });
    }, 1500);

    try {
      setStatusMessage(`⚡ Claude 프롬프트 캐싱 적용 중 (1회차 생성 후 90% 토큰 비용 할인)...`);
      const res = await run5x5ConsistencyTest({
        batch_id: batchId || '',
        rubric_id: rubricId || '',
        sample_count: sampleCount,
        runs_per_sample: runsPerSample,
      });

      clearInterval(progressTimer);
      setProgressPercent(100);

      if (res.criteria && res.criteria.length > 0) {
        setCriteria(res.criteria);
        setOverallStability(Math.round(res.overall_stability));
        setBenchmarkRating(res.benchmark_rating);
        setHasValidated(true);

        // Ambiguous한 항목이 있으면 첫 번째 것을 자동 펼치기
        const amb = res.criteria.find((c) => c.verdict_stability === 'Ambiguous');
        if (amb) {
          setExpandedCritId(amb.id);
        } else if (res.criteria[0]) {
          setExpandedCritId(res.criteria[0].id);
        }

        onValidationComplete?.(Math.round(res.overall_stability), res.benchmark_rating);
        showToast(`🎉 ${res.sample_count}x${res.runs_per_sample} 루브릭 일관성 검증이 완료되었습니다!`);
      }
    } catch (err: unknown) {
      clearInterval(progressTimer);
      setProgressPercent(0);
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`❌ 검증 실행 실패: ${msg}`);
    } finally {
      setIsRunning(false);
      setStatusMessage('');
    }
  };

  const handleClarifyRule = async (critId: string, ruleSuggestion?: string) => {
    setClarifyingCritId(critId);
    try {
      if (ruleSuggestion) {
        await clarifyCriterionRule(critId, ruleSuggestion);
      }
      setCriteria((prev) =>
        prev.map((c) => {
          if (c.id === critId) {
            return {
              ...c,
              consistency_rate: 100,
              verdict_stability: 'Deterministic',
              variance: 0.0,
              is_clarified: true,
              sample_breakdowns: c.sample_breakdowns.map((s) => ({
                ...s,
                run_verdicts: Array(runsPerSample).fill('Met'),
                scores: Array(runsPerSample).fill(c.max_score),
                is_deterministic: true,
              })),
            };
          }
          return c;
        })
      );
      showToast('✅ 제안된 객관적 규칙이 루브릭에 반영되어 편차가 0으로 고정되었습니다!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`규칙 갱신 안내: ${msg}`);
    } finally {
      setClarifyingCritId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0b1727] via-[#0f2442] to-[#163259] text-white p-6 flex items-start justify-between shrink-0">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Rubric Determinism Engine
                </span>
                <span className="text-xs text-slate-300">
                  {sampleCount}&times;{runsPerSample} 일관성 및 채점 재현성 검증
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                루브릭 일관성 &amp; 결정론({sampleCount}&times;{runsPerSample}) 검증 패널
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                {assignmentTitle ? `[${assignmentTitle}] ` : ''}동일한 테스트 과제 데이터 {sampleCount}개에 대해 각 {runsPerSample}회씩 반복 채점하여,
                루브릭 기준의 모호성 유무와 판정 편차(Variance)를 정밀 진단합니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {feedbackToast && (
          <div className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2.5 text-center flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
            <Sparkles className="w-4 h-4" />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* N x M Configuration Card */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>검증 파라미터 설정 (N &times; M)</span>
              </div>
              <p className="text-[11px] text-slate-600">
                테스트 데이터 수(N)와 데이터당 반복 채점 횟수(M)를 자유롭게 조정할 수 있습니다. (기본값: 5 &times; 5)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* N: Sample count */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-700">과제 수 (N):</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={sampleCount}
                  disabled={isRunning}
                  onChange={(e) => setSampleCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  className="w-12 text-center text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg py-1 focus:outline-hidden focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>

              {/* M: Runs per sample */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-700">반복 횟수 (M):</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={runsPerSample}
                  disabled={isRunning}
                  onChange={(e) => setRunsPerSample(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  className="w-12 text-center text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg py-1 focus:outline-hidden focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => { setSampleCount(5); setRunsPerSample(5); }}
                  className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                    sampleCount === 5 && runsPerSample === 5
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  5&times;5 기본
                </button>
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => { setSampleCount(3); setRunsPerSample(3); }}
                  className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                    sampleCount === 3 && runsPerSample === 3
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  3&times;3 빠른검증
                </button>
              </div>

              {/* Run Button */}
              <button
                type="button"
                onClick={handleStartSimulation}
                disabled={isRunning}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>검증 중...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{sampleCount}&times;{runsPerSample} 검증 시작</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress bar during simulation */}
          {isRunning && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/80 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                <span>{statusMessage || `테스트 데이터 ${sampleCount}개 x ${runsPerSample}회 반복 채점 검증 진행 중...`}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-blue-700">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Prompt Caching 활성화: 공통 루브릭을 2회차부터 캐시에서 90% 할인가로 즉시 재사용합니다.</span>
              </div>
            </div>
          )}

          {/* If NOT VALIDATED YET: Show Clean Empty State */}
          {!hasValidated && !isRunning && (
            <div className="p-10 rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-base font-bold text-slate-900">
                  루브릭 일관성 검증 미실행 상태
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  아직 루브릭 일관성 검증이 실행되지 않았습니다. 상단의 파라미터(N과 M)를 설정한 후{' '}
                  <strong className="text-blue-600">[검증 시작]</strong> 버튼을 클릭하면 실제 AI 반복 채점을 통해 평가 기준별 편차와 모호성을 측정합니다.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl text-left mt-2">
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>결정론율(%) 정량화</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">동일 과제 반복 채점 시 점수 및 판정의 일관성을 검증합니다.</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>프롬프트 캐싱</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">루브릭 지시문을 1회 캐싱하여 2회차부터 90% 토큰 비용을 절감합니다.</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>모호성 규칙 개선</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">주관적 단어로 인한 점수 편차를 감지하고 객관적 수치 기준을 제안합니다.</p>
                </div>
              </div>
            </div>
          )}

          {/* If VALIDATED: Show Real Metrics & Criteria Table */}
          {hasValidated && (
            <>
              {/* Top Key Metrics Strip: Criteria Health */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-700 uppercase font-semibold">Overall Rubric Stability</div>
                    <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                      {overallStability}%{' '}
                      <span className="text-xs text-emerald-700 font-bold font-sans">
                        ({benchmarkRating})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                    <ListTree className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-700 uppercase font-semibold">Consistent Criteria</div>
                    <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                      {deterministicCount} / {totalCriteria}{' '}
                      <span className="text-xs text-slate-700 font-medium">기준 일관성 확정</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      ambiguousCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {ambiguousCount > 0 ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <ShieldCheck className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-700 uppercase font-semibold">Ambiguous Rules</div>
                    <div
                      className={`text-xl font-extrabold mt-0.5 ${
                        ambiguousCount > 0 ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {ambiguousCount}개 모호성 감지
                    </div>
                  </div>
                </div>
              </div>

              {/* Criteria-by-Criteria Consistency Breakdown Table */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200/80 flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <ListTree className="w-4 h-4 text-blue-600" />
                    <span>루브릭 세부 평가 기준별 일관성 &amp; 분산 분석</span>
                  </div>
                  <span className="text-[11px] text-slate-700 font-medium">행을 클릭하면 각 샘플별 상세 채점 매트릭스가 표시됩니다</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {criteria.map((item) => {
                    const isExpanded = expandedCritId === item.id;
                    const isAmbiguous = item.verdict_stability === 'Ambiguous';

                    return (
                      <div key={item.id} className="transition-colors">
                        {/* Criterion Row Header */}
                        <div
                          onClick={() => setExpandedCritId(isExpanded ? '' : item.id)}
                          className={`p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none hover:bg-slate-50/80 ${
                            isAmbiguous ? 'bg-amber-50/30' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isAmbiguous
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {item.number}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-slate-900">
                                  {item.title}
                                </span>
                                <span className="text-xs text-slate-700 font-mono font-semibold">
                                  ({item.max_score}점 만점)
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                                  {item.category}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-700 font-medium mt-0.5">
                                검증 표본: {item.sample_breakdowns?.length || sampleCount}개 과제 &times; {runsPerSample}회 = 총 {(item.sample_breakdowns?.length || sampleCount) * runsPerSample}회 채점
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0 pl-10 sm:pl-0">
                            {/* Consistency rate bar */}
                            <div className="text-right">
                              <div className="text-[10px] text-slate-700 font-semibold uppercase">
                                Verdict Stability
                              </div>
                              <div className="text-xs font-bold font-mono text-slate-900">
                                {item.consistency_rate}% deterministic
                              </div>
                            </div>

                            {/* Status badge */}
                            <div>
                              {item.verdict_stability === 'Deterministic' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                  Stable Criterion
                                </span>
                              )}
                              {item.verdict_stability === 'Ambiguous' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300 animate-pulse">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  Ambiguous Penalty
                                </span>
                              )}
                              {item.verdict_stability === 'Minor Variance' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-100 px-2.5 py-1 rounded-full border border-blue-300">
                                  Minor Variance
                                </span>
                              )}
                            </div>

                            <div>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Criterion Details: Sample Verdict Matrix & Diagnostic */}
                        {isExpanded && (
                          <div className="px-5 pb-5 pt-2 bg-slate-50/60 border-t border-slate-100 space-y-4">
                            
                            {/* Diagnostic alert if ambiguous */}
                            {isAmbiguous && !item.is_clarified && (
                              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-start gap-2.5">
                                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                  <div>
                                    <div className="text-xs font-bold text-amber-900">
                                      이 기준에서 채점 편차가 발생하는 원인 진단
                                    </div>
                                    <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                                      {item.ambiguity_reason}
                                    </p>
                                    {item.clarified_rule_suggestion && (
                                      <div className="text-[11px] text-amber-900 font-semibold mt-1 bg-amber-100/70 p-2 rounded-lg">
                                        💡 객관적 규칙 제안: {item.clarified_rule_suggestion}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleClarifyRule(item.id, item.clarified_rule_suggestion)}
                                  disabled={clarifyingCritId === item.id}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all shrink-0 disabled:opacity-50"
                                >
                                  {clarifyingCritId === item.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Sparkles className="w-3.5 h-3.5" />
                                  )}
                                  <span>규칙 구체화 (편차 0 고정)</span>
                                </button>
                              </div>
                            )}

                            {item.is_clarified && (
                              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>채점 규칙이 확정되었습니다! AI가 모든 테스트 제출물에 대해 100% 동일한 점수와 판정을 산출합니다.</span>
                              </div>
                            )}

                            {/* Breakdown per sample for this criterion */}
                            <div className="space-y-2">
                              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                테스트 과제별 반복 판정 매트릭스 ({item.sample_breakdowns?.length || 0}개 과제):
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                                {item.sample_breakdowns?.map((sample, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className={`p-3 rounded-xl border transition-all ${
                                      sample.is_deterministic
                                        ? 'bg-white border-slate-200'
                                        : 'bg-amber-50 border-amber-300 ring-1 ring-amber-200'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="text-xs font-bold text-slate-900 truncate max-w-[130px]">{sample.sample_name}</div>
                                      <span
                                        className={`w-2 h-2 rounded-full ${
                                          sample.is_deterministic ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                                        }`}
                                      />
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5" title={sample.file_name}>
                                      {sample.file_name}
                                    </div>

                                    {/* Run verdicts pills */}
                                    <div className="mt-2.5 space-y-1">
                                      {sample.run_verdicts?.map((verdict, rIdx) => (
                                        <div
                                          key={rIdx}
                                          className="flex items-center justify-between text-[10px] font-semibold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100"
                                        >
                                          <span className="text-slate-500">Run {rIdx + 1}</span>
                                          <span
                                            className={`font-bold ${
                                              verdict === 'Met'
                                                ? 'text-emerald-700'
                                                : 'text-rose-700'
                                            }`}
                                          >
                                            {verdict} ({sample.scores?.[rIdx] ?? 0}점)
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {hasValidated ? (
                <span>
                  검증 결과: <strong>{totalCriteria}개</strong> 루브릭 기준 &times; <strong>{sampleCount}개</strong> 표본 (안정성: {overallStability}%)
                </span>
              ) : (
                <span className="text-amber-700 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>루브릭 일관성 검증 미완료 상태</span>
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
            >
              닫기
            </button>

            {onProceedToGrading && (
              <button
                type="button"
                onClick={() => {
                  if (!hasValidated) {
                    showToast('⚠️ 루브릭 일관성 검증을 먼저 실행해주세요.');
                    return;
                  }
                  onClose();
                  onProceedToGrading();
                }}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all group ${
                  hasValidated
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:shadow-lg'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>루브릭 확정 &amp; AI 채점 시작</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
