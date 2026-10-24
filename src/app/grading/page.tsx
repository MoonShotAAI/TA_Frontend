'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Maximize2,
  Bookmark,
  Share2,
  Sliders,
  RotateCcw,
  Edit3,
} from 'lucide-react';
import { TopHeader } from '@/components/TopHeader';
import { StepProgressBar } from '@/components/StepProgressBar';
import { Toast } from '@/components/Toast';

interface RubricCheckItem {
  id: string;
  number: number;
  title: string;
  description: string;
  assignedScore: number;
  maxScore: number;
  status: 'MET' | 'PARTIALLY_MET' | 'NOT_MET';
  evidenceQuote: string;
  rationale: string;
  isExpanded: boolean;
  taNotes?: string;
  isCustomAdjusted?: boolean;
}

const INITIAL_RUBRIC_CHECKS: RubricCheckItem[] = [
  {
    id: 'crit-1',
    number: 1,
    title: 'Analysis and Interpretation of Results',
    description:
      'Accurately interprets results, explains their significance, and provides reasonable discussion of findings.',
    assignedScore: 25,
    maxScore: 30,
    status: 'PARTIALLY_MET',
    evidenceQuote:
      'This improvement can be attributed to the use of word embeddings, which capture semantic relationships between words and help the model generalize better to unseen data.',
    rationale:
      'The submission correctly interprets the performance improvement and provides a reasonable explanation for why word embeddings help, showing good understanding of the results. Additional discussion of limitations (e.g., error analysis) would strengthen this section.',
    isExpanded: true,
  },
  {
    id: 'crit-2',
    number: 2,
    title: 'Technical Implementation',
    description: 'Correctly implements required methods and follows best practices.',
    assignedScore: 20,
    maxScore: 25,
    status: 'PARTIALLY_MET',
    evidenceQuote:
      'model = Sequential([Embedding(vocab_size, 128), LSTM(64), Dense(1, activation="sigmoid")])',
    rationale:
      'Core neural architecture implemented correctly. However, missing early-stopping callback and dropout regularizer per assignment specification 2.4.',
    isExpanded: false,
  },
  {
    id: 'crit-3',
    number: 3,
    title: 'Use of Visualizations',
    description: 'Includes appropriate visualizations with clear labels and captions.',
    assignedScore: 15,
    maxScore: 20,
    status: 'MET',
    evidenceQuote:
      'Figure 2: Confusion matrix for binary sentiment classification on test partition (N=1,408).',
    rationale:
      'Clean confusion matrix plot with labeled axis ticks and percentage annotations in each quadrant.',
    isExpanded: false,
  },
  {
    id: 'crit-4',
    number: 4,
    title: 'Written Communication',
    description: 'Clear, organized, and professional writing with correct terminology.',
    assignedScore: 25,
    maxScore: 25,
    status: 'MET',
    evidenceQuote:
      'In this work, we developed a neural network model for sentiment analysis that achieves state-of-the-art results on the provided dataset.',
    rationale:
      'Impeccable academic prose, coherent paragraph structure, and appropriate mathematical notation.',
    isExpanded: false,
  },
];

export default function EvaluateAndCitePage() {
  const router = useRouter();
  const [currentStudentIdx, setCurrentStudentIdx] = useState(3);
  const totalStudents = 24;
  const studentFileName = 'student_003.ipynb';

  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'raw'>('preview');
  const [rubricItems, setRubricItems] = useState<RubricCheckItem[]>(INITIAL_RUBRIC_CHECKS);
  const [highlightActive, setHighlightActive] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const evidenceRef = useRef<HTMLSpanElement>(null);

  const totalScore = rubricItems.reduce((acc, curr) => acc + curr.assignedScore, 0);
  const maxPossibleScore = rubricItems.reduce((acc, curr) => acc + curr.maxScore, 0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const toggleExpand = (id: string) => {
    setRubricItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
      )
    );
  };

  const handleScoreChange = (id: string, rawScore: number) => {
    setRubricItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const clamped = Math.max(0, Math.min(item.maxScore, isNaN(rawScore) ? 0 : rawScore));
          let status: 'MET' | 'PARTIALLY_MET' | 'NOT_MET' = item.status;
          if (clamped === item.maxScore) {
            status = 'MET';
          } else if (clamped <= Math.round(item.maxScore * 0.5)) {
            status = 'NOT_MET';
          } else {
            status = 'PARTIALLY_MET';
          }
          return {
            ...item,
            assignedScore: clamped,
            status,
            isCustomAdjusted: true,
          };
        }
        return item;
      })
    );
  };

  const handleNotesChange = (id: string, notes: string) => {
    setRubricItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, taNotes: notes } : item))
    );
  };

  const handleResetScores = () => {
    setRubricItems(INITIAL_RUBRIC_CHECKS);
    showToast("Reset all criteria back to AI-suggested scores.");
  };

  const setStatus = (id: string, status: 'MET' | 'PARTIALLY_MET' | 'NOT_MET') => {
    setRubricItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          let newScore = item.maxScore;
          if (status === 'PARTIALLY_MET') newScore = Math.round(item.maxScore * 0.8);
          if (status === 'NOT_MET') newScore = Math.round(item.maxScore * 0.5);
          return { ...item, status, assignedScore: newScore, isCustomAdjusted: true };
        }
        return item;
      })
    );
  };

  const handleJumpToText = () => {
    setActiveTab('preview');
    setHighlightActive(true);
    evidenceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast("Scrolled to cited evidence in student manuscript.");
  };

  const handleNextStudent = () => {
    if (currentStudentIdx < totalStudents) {
      setCurrentStudentIdx((prev) => prev + 1);
      showToast(`Navigated to student_00${currentStudentIdx + 1}.ipynb`);
    }
  };

  const handlePrevStudent = () => {
    if (currentStudentIdx > 1) {
      setCurrentStudentIdx((prev) => prev - 1);
      showToast(`Navigated to student_00${currentStudentIdx - 1}.ipynb`);
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
        
        {/* Step Header Card matching mockup screenshot 3 */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left Title with badge */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-xs">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Step 3. Evaluate &amp; Cite Evidence
              </h1>
              <p className="text-xs text-slate-700 font-medium mt-0.5">
                Review each submission, verify AI evaluations, and ensure evidence supports the rubric scores.
              </p>
            </div>
          </div>

          {/* Right Controls: Student Nav & Current Total Score */}
          <div className="flex flex-wrap items-center gap-4">
            
            {/* Student Stepper */}
            <div className="flex items-center bg-slate-50 border border-slate-200/90 rounded-xl px-2 py-1.5 shadow-2xs">
              <button
                onClick={handlePrevStudent}
                disabled={currentStudentIdx <= 1}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                title="Previous Student"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 text-center">
                <div className="text-xs font-bold text-slate-800">
                  {currentStudentIdx} of {totalStudents}
                </div>
                <div className="text-[10px] text-slate-700 font-mono font-medium">
                  {studentFileName}
                </div>
              </div>
              <button
                onClick={handleNextStudent}
                disabled={currentStudentIdx >= totalStudents}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                title="Next Student"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Current Total Score Badge */}
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2 shadow-2xs">
              <div className="text-left">
                <div className="text-[10px] text-slate-700 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                  <span>Current Total Score</span>
                  <span className="text-blue-600 font-bold">(TA Editable)</span>
                </div>
                <div className="text-base font-extrabold text-slate-900 leading-none mt-0.5 font-mono">
                  {totalScore} <span className="text-xs text-slate-700 font-bold">/ {maxPossibleScore}</span>
                </div>
              </div>

              <div>
                {totalScore >= 90 && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/70">
                    Excellent
                  </span>
                )}
                {totalScore >= 80 && totalScore < 90 && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200/70">
                    Good
                  </span>
                )}
                {totalScore >= 70 && totalScore < 80 && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200/70">
                    Average
                  </span>
                )}
                {totalScore < 70 && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200/70">
                    Needs Review
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleResetScores}
                title="Reset all scores back to AI suggestions"
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

        {/* 2-Pane Split Layout matching screenshot 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= LEFT PANE: Student Submission Viewer (6 cols) ================= */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
            
            {/* Header row */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">{studentFileName}</h2>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 font-mono">
                    Jupyter Notebook
                  </span>
                </div>
                <div className="text-[11px] text-slate-700 font-medium mt-0.5">
                  312 KB &middot; Submitted Oct 15, 2024, 2:13 PM
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => showToast("Opening notebook in standalone viewer...")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <span>Open in New Tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tab Navigation: Preview / Code / Raw File */}
            <div className="bg-slate-50/80 px-4 pt-2 border-b border-slate-200/80 flex items-center gap-1">
              {[
                { id: 'preview', label: 'Preview', icon: Eye },
                { id: 'code', label: 'Code', icon: Code2 },
                { id: 'raw', label: 'Raw File', icon: FileCode },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
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

            {/* Content Body: Academic text with highlighted quote */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[680px] overflow-y-auto font-sans leading-relaxed text-slate-700 text-xs sm:text-[13px]">
              {activeTab === 'preview' && (
                <>
                  {/* Section 3 */}
                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      3. Results and Discussion
                    </h3>
                    <p className="text-justify leading-relaxed">
                      Our model achieves 92% accuracy on the test set, outperforming the baseline logistic regression model by 14 percentage points.{' '}
                      <span
                        ref={evidenceRef}
                        className={`transition-all duration-300 rounded px-1.5 py-0.5 border font-medium ${
                          highlightActive
                            ? 'bg-blue-100/90 text-blue-900 border-blue-400 shadow-2xs'
                            : 'bg-transparent text-slate-700 border-transparent'
                        }`}
                      >
                        This improvement can be attributed to the use of word embeddings, which capture semantic relationships between words and help the model generalize better to unseen data.
                      </span>
                    </p>
                    <p className="text-justify leading-relaxed text-slate-600">
                      The confusion matrix in Figure 2 shows that the model performs particularly well on positive sentiment examples, though it still struggles with sarcasm. These results suggest that incorporating additional contextual features, such as user metadata, could further improve performance.
                    </p>
                  </div>

                  {/* Confusion Matrix figure mockup */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center my-4">
                    <div className="text-[11px] font-mono text-slate-500 mb-2">
                      [Confusion Matrix Visualization: True Positives 684, False Positives 58, True Negatives 612, False Negatives 54]
                    </div>
                    <div className="text-[11px] font-semibold text-slate-700">
                      Figure 2: Normalized Confusion Matrix on Test Partition
                    </div>
                  </div>

                  {/* Section 4 */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      4. Conclusion
                    </h3>
                    <p className="text-justify leading-relaxed text-slate-600">
                      In this work, we developed a neural network model for sentiment analysis that achieves state-of-the-art results on the provided dataset. Future work could explore larger pre-trained language models such as BERT to further improve accuracy, especially on more challenging examples like sarcasm and irony.
                    </p>
                  </div>
                </>
              )}

              {activeTab === 'code' && (
                <div className="font-mono text-xs bg-slate-900 text-slate-200 p-5 rounded-xl space-y-2 overflow-x-auto">
                  <div className="text-slate-500"># Model Architecture Definition</div>
                  <div className="text-blue-300">from tensorflow.keras import layers, models</div>
                  <div>
                    model = models.Sequential([
                    <br />
                    &nbsp;&nbsp;layers.Embedding(input_dim=10000, output_dim=128),
                    <br />
                    &nbsp;&nbsp;layers.Bidirectional(layers.LSTM(64)),
                    <br />
                    &nbsp;&nbsp;layers.Dense(64, activation=&apos;relu&apos;),
                    <br />
                    &nbsp;&nbsp;layers.Dense(1, activation=&apos;sigmoid&apos;)
                    <br />
                    ])
                  </div>
                  <div className="text-slate-500 pt-2"># Compile &amp; Evaluate</div>
                  <div>model.compile(optimizer=&apos;adam&apos;, loss=&apos;binary_crossentropy&apos;, metrics=[&apos;accuracy&apos;])</div>
                  <div className="text-emerald-400"># Test Accuracy: 0.9214 &mdash; Baseline: 0.7810 (+14.04%)</div>
                </div>
              )}

              {activeTab === 'raw' && (
                <div className="p-4 rounded-xl bg-slate-50 font-mono text-xs text-slate-600 overflow-x-auto">
                  <div>&#123;&quot;cells&quot;: [&#123;&quot;cell_type&quot;: &quot;markdown&quot;, &quot;source&quot;: [&quot;# HW3: Sentiment Classification\n&quot;]&#125;]&#125;</div>
                </div>
              )}
            </div>

            {/* Bottom Citation Notice */}
            <div className="p-3 bg-blue-50/70 border-t border-blue-100/80 px-6 flex items-center justify-between text-xs text-blue-900">
              <span className="font-semibold">
                &bull; Highlighted quote linked to Rubric Criterion 1 (Analysis of Results)
              </span>
              <button
                onClick={() => setHighlightActive(!highlightActive)}
                className="text-[11px] underline font-bold hover:text-blue-700"
              >
                {highlightActive ? 'Dim highlight' : 'Highlight evidence'}
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
              <button
                type="button"
                onClick={() => router.push('/upload?step=2')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
              >
                View Full Rubric
              </button>
            </div>

            {/* Rubric Accordion Cards List */}
            <div className="space-y-4">
              {rubricItems.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    item.isExpanded
                      ? 'border-blue-300 bg-white shadow-xs ring-1 ring-blue-100'
                      : 'border-slate-200/80 bg-slate-50/60 hover:bg-slate-50'
                  }`}
                >
                  {/* Card Header row */}
                  <div
                    onClick={() => toggleExpand(item.id)}
                    className="p-4 sm:p-4.5 cursor-pointer flex items-start justify-between gap-3 select-none"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {item.number}
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
                      {item.isCustomAdjusted && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          TA
                        </span>
                      )}

                      <div className="flex items-center bg-slate-100 hover:bg-white border border-slate-200/90 rounded-xl p-1 shadow-2xs transition-colors">
                        <button
                          type="button"
                          onClick={() => handleScoreChange(item.id, item.assignedScore - 1)}
                          disabled={item.assignedScore <= 0}
                          className="w-5 h-5 rounded-md bg-white hover:bg-slate-200 text-slate-700 font-extrabold flex items-center justify-center text-xs border border-slate-200 disabled:opacity-30 shadow-2xs"
                          title="Decrease 1 point"
                        >
                          -
                        </button>

                        <div className="flex items-center px-1">
                          <input
                            type="number"
                            min={0}
                            max={item.maxScore}
                            value={item.assignedScore}
                            onChange={(e) => handleScoreChange(item.id, Number(e.target.value))}
                            className="w-11 text-center font-extrabold text-xs text-blue-700 bg-white border border-slate-300 rounded-md py-0.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                            title="Directly type to edit score"
                          />
                          <span className="text-[11px] text-slate-700 font-bold pl-1 font-mono">
                            / {item.maxScore}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleScoreChange(item.id, item.assignedScore + 1)}
                          disabled={item.assignedScore >= item.maxScore}
                          className="w-5 h-5 rounded-md bg-white hover:bg-slate-200 text-slate-700 font-extrabold flex items-center justify-center text-xs border border-slate-200 disabled:opacity-30 shadow-2xs"
                          title="Increase 1 point"
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

                  {/* Expanded Body: Met/Partially/Not Met + Direct Slider + Cited Evidence + Rationale + TA Notes */}
                  {item.isExpanded && (
                    <div className="px-5 pb-5 pt-1 space-y-4 border-t border-slate-100">
                      
                      {/* Met / Partially Met / Not Met Toggle Buttons */}
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setStatus(item.id, 'MET')}
                          className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                            item.status === 'MET'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Met ({item.maxScore} pts)
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatus(item.id, 'PARTIALLY_MET')}
                          className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                            item.status === 'PARTIALLY_MET'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Partially Met ({Math.round(item.maxScore * 0.8)} pts)
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatus(item.id, 'NOT_MET')}
                          className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                            item.status === 'NOT_MET'
                              ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Not Met ({Math.round(item.maxScore * 0.5)} pts)
                        </button>
                      </div>

                      {/* TA Score Slider & Quick Presets */}
                      <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/90 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-blue-600" />
                            <span>Fine-Tune Score:</span>
                            <span className="text-blue-700 font-extrabold text-sm font-mono ml-1">
                              {item.assignedScore}
                            </span>
                            <span className="text-slate-700 font-bold">/ {item.maxScore} pts</span>
                          </span>

                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="text-slate-700 font-medium mr-1">Presets:</span>
                            <button
                              type="button"
                              onClick={() => handleScoreChange(item.id, item.maxScore)}
                              className="px-2 py-0.5 font-bold rounded bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                            >
                              100%
                            </button>
                            <button
                              type="button"
                              onClick={() => handleScoreChange(item.id, Math.round(item.maxScore * 0.8))}
                              className="px-2 py-0.5 font-bold rounded bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                            >
                              80%
                            </button>
                            <button
                              type="button"
                              onClick={() => handleScoreChange(item.id, Math.round(item.maxScore * 0.5))}
                              className="px-2 py-0.5 font-bold rounded bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                            >
                              50%
                            </button>
                            <button
                              type="button"
                              onClick={() => handleScoreChange(item.id, 0)}
                              className="px-2 py-0.5 font-bold rounded bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors"
                            >
                              0 pts
                            </button>
                          </div>
                        </div>

                        <input
                          type="range"
                          min={0}
                          max={item.maxScore}
                          value={item.assignedScore}
                          onChange={(e) => handleScoreChange(item.id, Number(e.target.value))}
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
                            (Optional &middot; shared with student)
                          </span>
                        </label>
                        <textarea
                          rows={2}
                          value={item.taNotes || ''}
                          onChange={(e) => handleNotesChange(item.id, e.target.value)}
                          placeholder="e.g., Deducted 2 points due to missing error analysis table..."
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none font-medium"
                        />
                      </div>

                      {/* Cited Evidence from Submission */}
                      <div className="rounded-xl border border-blue-200/90 bg-blue-50/50 p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-blue-900 flex items-center gap-1.5">
                            <Bookmark className="w-3.5 h-3.5 text-blue-600" />
                            Cited Evidence from Submission
                          </span>
                          <button
                            type="button"
                            onClick={handleJumpToText}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline"
                          >
                            <span>jump to text</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-700 italic border-l-2 border-blue-500 pl-3 py-0.5 leading-relaxed bg-white/60 rounded-r-lg">
                          &ldquo;{item.evidenceQuote}&rdquo;
                        </p>
                      </div>

                      {/* Rubric Rationale */}
                      <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-3.5 space-y-1">
                        <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Rubric Rationale</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {item.rationale}
                        </p>
                      </div>

                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom Actions: Save & Navigate to Step 4 */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => showToast(`✓ Evaluation confirmed for ${studentFileName} (${totalScore}/100)`)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Save Current Student</span>
              </button>

              <Link
                href="/confidence"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30 group"
              >
                <span>Next: Step 4. Confidence Scoring &amp; Review Queue</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

          </div>

        </div>

      </main>

      {/* Floating Action / Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
