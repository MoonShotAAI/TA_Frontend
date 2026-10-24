'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  AlertTriangle,
  Sparkles,
  Quote,
  Eye,
  CornerDownRight,
  Maximize2,
  ChevronRight,
  Filter,
  Check,
  RotateCcw,
  Clock,
  Shield,
  Layers,
  ArrowRight,
  Award,
} from 'lucide-react';
import { RubricEvidence, StudentSubmission, GradingStatus } from '@/types/grading';
import { mockEssayParagraphs } from '@/data/mockGradingData';

interface SplitPaneGradingViewProps {
  submission: StudentSubmission;
  rubricItems: RubricEvidence[];
  onUpdateRubricItem: (updated: RubricEvidence) => void;
  onOpenDeductionReport: () => void;
  onApproveSubmission: () => void;
  isApproved: boolean;
}

export const SplitPaneGradingView: React.FC<SplitPaneGradingViewProps> = ({
  submission,
  rubricItems,
  onUpdateRubricItem,
  onOpenDeductionReport,
  onApproveSubmission,
  isApproved,
}) => {
  const [activeHighlightId, setActiveHighlightId] = useState<string>('rubric_2'); // default to the low-confidence one for TA review
  const [filterMode, setFilterMode] = useState<'ALL' | 'NEEDS_REVIEW' | 'DEDUCTIONS'>('ALL');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');

  const essayContainerRef = useRef<HTMLDivElement>(null);
  const rubricContainerRef = useRef<HTMLDivElement>(null);

  // Compute live totals
  const totalScore = rubricItems.reduce((acc, curr) => acc + curr.assignedScore, 0);
  const maxScore = rubricItems.reduce((acc, curr) => acc + curr.maxScore, 0);
  const percentage = Math.round((totalScore / maxScore) * 100);

  // Filter rubric items
  const filteredRubrics = rubricItems.filter((item) => {
    if (filterMode === 'NEEDS_REVIEW') return item.confidence === 'LOW_TA_REVIEW';
    if (filterMode === 'DEDUCTIONS') return item.status !== 'MET';
    return true;
  });

  const scrollToEvidenceInEssay = (rubricId: string) => {
    setActiveHighlightId(rubricId);
    const targetElement = document.getElementById(`essay-highlight-${rubricId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleStatusChange = (item: RubricEvidence, newStatus: GradingStatus) => {
    let newScore = item.assignedScore;
    let newPenalty = item.penaltyPoints;

    if (newStatus === 'MET') {
      newScore = item.maxScore;
      newPenalty = 0;
    } else {
      newScore = 0;
      newPenalty = item.maxScore;
    }

    onUpdateRubricItem({
      ...item,
      status: newStatus,
      assignedScore: newScore,
      penaltyPoints: newPenalty,
      taReviewed: true,
    });
  };

  const handleScoreChange = (item: RubricEvidence, newScore: number) => {
    const clamped = Math.max(0, Math.min(item.maxScore, newScore));
    const derivedStatus: GradingStatus = clamped === item.maxScore ? 'MET' : 'NOT_MET';

    onUpdateRubricItem({
      ...item,
      assignedScore: clamped,
      penaltyPoints: item.maxScore - clamped,
      status: derivedStatus,
      taReviewed: true,
    });
  };

  return (
    <div className="space-y-4">
      
      {/* Informative Sub-header banner emphasizing workload reduction */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-3.5 px-5 rounded-xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Split-Pane Evidence Verification Workspace
            </h2>
            <p className="text-xs text-slate-300 font-normal">
              Direct evidence synchronization: TAs verify AI decisions through highlighted text citations without reading entire submissions.
            </p>
          </div>
        </div>

        {/* Live Score pill and student deduction report button */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="bg-white/10 border border-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-[11px] text-slate-300 font-medium">Current Evaluation:</span>
            <span className="text-sm font-extrabold text-white">
              {totalScore} / {maxScore} pts
            </span>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
              {percentage}%
            </span>
          </div>

          <button
            onClick={onOpenDeductionReport}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Student Report Preview</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ========================================================
            LEFT PANE: STUDENT SUBMISSION (5 cols on lg)
           ======================================================== */}
        <div className="lg:col-span-6 xl:col-span-6 bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col h-[760px] overflow-hidden">
          
          {/* Student Manuscript Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex-shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                    Submission #{submission.studentId}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{submission.studentName}</span>
                  <span className="text-[11px] text-slate-700">({submission.courseCode})</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1 leading-snug">
                  {submission.paperTitle}
                </h3>
              </div>

              {/* Plagiarism & Word stats */}
              <div className="text-right flex-shrink-0">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  {submission.plagiarismIndex}% Plag. Match
                </span>
                <p className="text-[10px] text-slate-700 mt-0.5">{submission.wordCount} words · {submission.submissionDate}</p>
              </div>
            </div>

            {/* Quick Evidence Navigator Controls */}
            <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold text-slate-700">
                Click highlight to jump to corresponding rubric:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => scrollToEvidenceInEssay('rubric_1')}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors"
                >
                  Crit #1 (Model)
                </button>
                <button
                  onClick={() => scrollToEvidenceInEssay('rubric_2')}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-900 border border-blue-300 hover:bg-blue-200 transition-colors flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                  Crit #2 (Split)
                </button>
                <button
                  onClick={() => scrollToEvidenceInEssay('rubric_3')}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200 transition-colors"
                >
                  Crit #3 (Z-Score)
                </button>
              </div>
            </div>
          </div>

          {/* Student Essay Paper Body (Scrollable Academic View) */}
          <div
            ref={essayContainerRef}
            className="flex-1 p-6 overflow-y-auto bg-slate-50/40 text-slate-800 space-y-6 leading-relaxed select-text"
          >
            {/* Paper Title Block */}
            <div className="text-center pb-4 border-b border-slate-200/80">
              <h2 className="text-lg font-serif font-bold text-slate-900 tracking-tight">
                {submission.paperTitle}
              </h2>
              <p className="text-xs font-serif text-slate-700 mt-1">
                {submission.studentName} · Department of Computer Science & Engineering
              </p>
            </div>

            {/* Abstract */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200/70 text-xs italic text-slate-700">
              <strong className="not-italic font-bold text-slate-900 block mb-1">Abstract:</strong>
              {submission.paperAbstract}
            </div>

            {/* Paragraphs with interactive highlight annotations */}
            {mockEssayParagraphs.map((para) => (
              <div key={para.id} className="space-y-1.5 text-xs font-serif">
                <h4 className="font-sans font-bold text-xs text-slate-900 tracking-wide uppercase">
                  {para.sectionNumber}
                </h4>

                {/* Paragraph Content with highlighted matches */}
                <p className="text-justify leading-relaxed text-slate-800">
                  {para.id === 'p2' ? (
                    <>
                      Before executing model training routines, feature scaling was conducted to avoid gradient instability and coefficient bias across high-magnitude columns.{' '}
                      <mark
                        id="essay-highlight-rubric_3"
                        onClick={() => setActiveHighlightId('rubric_3')}
                        className={`cursor-pointer rounded px-1.5 py-0.5 transition-all duration-200 font-sans ${
                          activeHighlightId === 'rubric_3'
                            ? 'bg-emerald-200 ring-2 ring-emerald-500 font-semibold text-emerald-950 shadow-xs'
                            : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                        }`}
                        title="Click to view AI Rubric Evaluation for Preprocessing"
                      >
                        The dataset was normalized using Z-score standardization across all numeric features (monthly charges, total tenure, and roaming minutes) strictly fitted on training splits to prevent data leakage.
                        <span className="ml-1 text-[9px] font-mono px-1 rounded bg-emerald-300 text-emerald-950 align-middle">
                          [Rubric #3: Met]
                        </span>
                      </mark>{' '}
                      Categorical predictors including payment method, streaming services, and contract type were encoded using one-hot indicators with dummy drop to prevent multi-collinearity.
                    </>
                  ) : para.id === 'p3' ? (
                    <>
                      With preprocessed tensors prepared, we initialized our primary estimator.{' '}
                      <mark
                        id="essay-highlight-rubric_1"
                        onClick={() => setActiveHighlightId('rubric_1')}
                        className={`cursor-pointer rounded px-1.5 py-0.5 transition-all duration-200 font-sans ${
                          activeHighlightId === 'rubric_1'
                            ? 'bg-amber-200 ring-2 ring-amber-500 font-semibold text-amber-950 shadow-xs'
                            : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                        }`}
                        title="Click to view AI Rubric Evaluation for Model Selection"
                      >
                        To predict customer churn status, we utilized an ordinary linear regression model with standard ordinary least squares estimator, mapping the continuous output to a binary threshold of 0.5.
                        <span className="ml-1 text-[9px] font-mono px-1 rounded bg-amber-300 text-amber-950 align-middle">
                          [Rubric #1: Not Met · -5 pts]
                        </span>
                      </mark>{' '}
                      Although tree ensembles were considered, the linear formulation was chosen for its interpretable weights across individual feature dimensions.
                    </>
                  ) : para.id === 'p4' ? (
                    <>
                      We configured stratified k-fold splits across the cohort.{' '}
                      <mark
                        id="essay-highlight-rubric_2"
                        onClick={() => setActiveHighlightId('rubric_2')}
                        className={`cursor-pointer rounded px-1.5 py-0.5 transition-all duration-200 font-sans ${
                          activeHighlightId === 'rubric_2'
                            ? 'bg-blue-200 ring-2 ring-blue-600 font-semibold text-blue-950 shadow-xs'
                            : 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                        }`}
                        title="Click to view AI Rubric Evaluation for Validation Reporting"
                      >
                        Model accuracy reached 89.4% on training data, but evaluation on validation set was not reported due to computational constraints during cross-fold iterations.
                        <span className="ml-1 text-[9px] font-mono px-1 rounded bg-blue-300 text-blue-950 align-middle">
                          [Rubric #2: Low Confidence · TA Review]
                        </span>
                      </mark>{' '}
                      Confusion matrices for the training samples indicated low false negatives for short-term month-to-month contracts, though borderline subscribers near the 0.5 probability threshold displayed sensitivity to minor feature shifts.
                    </>
                  ) : para.id === 'p5' ? (
                    <>
                      <mark
                        id="essay-highlight-rubric_4"
                        onClick={() => setActiveHighlightId('rubric_4')}
                        className={`cursor-pointer rounded px-1.5 py-0.5 transition-all duration-200 font-sans ${
                          activeHighlightId === 'rubric_4'
                            ? 'bg-purple-200 ring-2 ring-purple-500 font-semibold text-purple-950 shadow-xs'
                            : 'bg-purple-100 text-purple-900 hover:bg-purple-200'
                        }`}
                        title="Click to view AI Rubric Evaluation for Logical Flow"
                      >
                        Based on the variable importance weights showing fiber-optic contract length and electronic billing as top positive coefficients, we conclude that contract inflexibility constitutes the primary driver of customer drop-off.
                        <span className="ml-1 text-[9px] font-mono px-1 rounded bg-purple-300 text-purple-950 align-middle">
                          [Rubric #4: Met]
                        </span>
                      </mark>{' '}
                      We advise the retention team to introduce flexible bi-annual incentive plans and streamline account cancellation procedures to retain high-risk consumer cohorts.
                    </>
                  ) : (
                    para.text
                  )}
                </p>
              </div>
            ))}
          </div>

          {/* Left Pane Footer status */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Showing 4 AI Evidence Citations synced with Rubric
            </span>
            <span className="font-mono text-slate-700">PDF OCR Verified</span>
          </div>
        </div>

        {/* ========================================================
            RIGHT PANE: AI EVALUATION & CHECKLIST (6 cols on lg)
           ======================================================== */}
        <div className="lg:col-span-6 xl:col-span-6 bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col h-[760px] overflow-hidden">
          
          {/* Right Pane Controls Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-700" />
                  AI Evaluation & Rubric Checklist
                </h3>
                <p className="text-[11px] text-slate-700 mt-0.5">
                  Click any criterion to verify evidence directly in the submission pane.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg text-[11px] font-medium">
                <button
                  onClick={() => setFilterMode('ALL')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    filterMode === 'ALL' ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({rubricItems.length})
                </button>
                <button
                  onClick={() => setFilterMode('NEEDS_REVIEW')}
                  className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
                    filterMode === 'NEEDS_REVIEW' ? 'bg-amber-100 font-bold text-amber-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Needs TA Review (1)
                </button>
                <button
                  onClick={() => setFilterMode('DEDUCTIONS')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    filterMode === 'DEDUCTIONS' ? 'bg-white font-bold text-rose-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Deductions (2)
                </button>
              </div>
            </div>
          </div>

          {/* Rubric Checklist Scrollable List */}
          <div
            ref={rubricContainerRef}
            className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/30"
          >
            {filteredRubrics.map((item, idx) => {
              const isActive = activeHighlightId === item.id;
              const isNeedsReview = item.confidence === 'LOW_TA_REVIEW';

              return (
                <div
                  key={item.id}
                  id={`rubric-card-${item.id}`}
                  onClick={() => scrollToEvidenceInEssay(item.id)}
                  className={`rounded-xl border transition-all duration-200 p-4 bg-white cursor-pointer ${
                    isActive
                      ? 'ring-2 ring-blue-700 border-blue-400 shadow-md'
                      : isNeedsReview
                      ? 'border-amber-300 bg-amber-50/20 hover:border-amber-400'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {/* Item Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] font-bold text-slate-500">
                          #{idx + 1}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                          {item.criterionTitle}
                        </h4>
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.category}
                        </span>
                      </div>

                      {/* Required: Confidence Status Badge */}
                      <div className="flex items-center gap-2 pt-0.5">
                        {isNeedsReview ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Low Confidence - TA Review Needed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            AI Confident ({item.confidencePercent}%)
                          </span>
                        )}

                        {item.taReviewed && (
                          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            TA Verified
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score / Point allocation */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm sm:text-base font-extrabold text-slate-900">
                        {item.assignedScore} <span className="text-xs text-slate-600 font-semibold">/ {item.maxScore} pts</span>
                      </div>
                      {item.penaltyPoints > 0 && (
                        <span className="text-xs font-bold text-rose-600 block">
                          -{item.penaltyPoints} pts
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status toggle pills: [충족 Met], [미충족 Not Met] */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold text-slate-700">Criterion Status:</span>
                    <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(item, 'MET');
                        }}
                        className={`px-3 py-1 rounded-md transition-all font-semibold flex items-center gap-1 ${
                          item.status === 'MET'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        충족 (Met &mdash; {item.maxScore} pts)
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(item, 'NOT_MET');
                        }}
                        className={`px-3 py-1 rounded-md transition-all font-semibold flex items-center gap-1 ${
                          item.status === 'NOT_MET'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        미충족 (Not Met &mdash; 0 pts)
                      </button>
                    </div>
                  </div>

                  {/* Required: EVIDENCE BLOCK matching highlighted text in Left Pane */}
                  <div className="mt-3 bg-slate-50 border border-slate-200/90 rounded-lg p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <Quote className="w-3 h-3 text-blue-700" />
                        Evidence Block (Cites Submission Manuscript)
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          scrollToEvidenceInEssay(item.id);
                        }}
                        className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-0.5"
                      >
                        <span>Focus sentence</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Exact highlighted quotation */}
                    <blockquote className="border-l-2 border-blue-600 pl-2.5 py-0.5 text-slate-800 italic font-serif text-[11.5px] bg-white/80 rounded-r">
                      &ldquo;{item.evidenceQuote}&rdquo;
                    </blockquote>

                    {/* AI Assessment / Explanation under Evidence */}
                    <div className="text-[11px] text-slate-700 leading-relaxed font-sans">
                      <strong className="text-slate-900 font-semibold">{item.evidenceExplanation}</strong>
                    </div>
                  </div>

                  {/* AI Guideline Rationale */}
                  <div className="mt-2 text-[11px] text-slate-700 leading-normal pl-1">
                    <span className="font-semibold text-slate-800">Rubric Rationale: </span>
                    {item.aiRationale}
                  </div>

                  {/* TA Quick Actions & Points Overriding */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-700 font-medium">Score Adjust:</span>
                      <div className="flex items-center border border-slate-200 rounded">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleScoreChange(item, item.assignedScore - 1);
                          }}
                          className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 font-mono font-bold text-slate-900 text-xs">
                          {item.assignedScore}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleScoreChange(item, item.assignedScore + 1);
                          }}
                          className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateRubricItem({ ...item, taReviewed: true });
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                        item.taReviewed
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      {item.taReviewed ? 'Verified' : 'Confirm AI Decision'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Pane Footer - TA Sign-off / Next Student */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex-shrink-0 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-700">
              <span className="font-semibold text-slate-800">Final Grade:</span>{' '}
              <strong className="text-sm font-extrabold text-blue-900">{totalScore} / {maxScore} pts</strong> ({percentage}%)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenDeductionReport}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                View Deductions
              </button>

              <button
                onClick={onApproveSubmission}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs ${
                  isApproved
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-800 hover:bg-blue-700 text-white'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isApproved ? 'Approved' : 'Approve & Next (Space)'}</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
