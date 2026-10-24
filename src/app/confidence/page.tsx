'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Send,
  Check,
} from 'lucide-react';
import { TopHeader } from '@/components/TopHeader';
import { StepProgressBar } from '@/components/StepProgressBar';
import { Toast } from '@/components/Toast';
import { MOCK_SUBMISSION_QUEUE, SubmissionQueueItem } from '@/data/mockConfidenceData';

export default function ConfidenceQueuePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'low_confidence' | 'random_audit' | 'confident'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('sub_003');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const selectedItem: SubmissionQueueItem =
    MOCK_SUBMISSION_QUEUE.find((item) => item.id === selectedStudentId) ||
    MOCK_SUBMISSION_QUEUE[2];

  const filteredQueue = MOCK_SUBMISSION_QUEUE.filter((item) => {
    const matchesSearch =
      item.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.fileName.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'low_confidence') {
      return matchesSearch && item.status === 'TA Review Needed';
    }
    if (activeTab === 'random_audit') {
      return matchesSearch && item.status === 'Random Audit';
    }
    if (activeTab === 'confident') {
      return matchesSearch && item.status === 'AI Confident';
    }
    return matchesSearch;
  });

  const lowConfidenceCount = MOCK_SUBMISSION_QUEUE.filter(
    (i) => i.status === 'TA Review Needed'
  ).length;
  const randomAuditCount = MOCK_SUBMISSION_QUEUE.filter(
    (i) => i.status === 'Random Audit'
  ).length;
  const confidentCount = MOCK_SUBMISSION_QUEUE.filter(
    (i) => i.status === 'AI Confident'
  ).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Top Header matching dark navy aesthetics */}
      <TopHeader />

      {/* 4-Step Progress Bar matching mockup screenshot 4 */}
      <StepProgressBar
        currentStep={4}
        progressPercent={100}
        onStepClick={(step) => {
          if (step === 1) router.push('/upload');
          if (step === 2) router.push('/upload?step=2');
          if (step === 3) router.push('/grading');
          if (step === 4) router.push('/confidence');
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
                Review low-confidence cases and a sample of submissions before releasing grades.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => showToast("Exporting official CSV grade sheet...")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => showToast("🎉 250 grades officially published to LMS (Canvas/Gradescope)!")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30"
            >
              <Send className="w-4 h-4" />
              <span>Release Grades to LMS</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Summary Cards matching screenshot 4 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: 250 graded submissions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                250
              </div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">
                graded submissions
              </div>
              <div className="text-[11px] text-slate-700 font-medium">
                Out of 250 total (100%)
              </div>
            </div>
          </div>

          {/* Card 2: 18 low-confidence cases */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                18
              </div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">
                low-confidence cases
              </div>
              <div className="text-[11px] text-rose-700 font-medium">
                Need TA review (7.2%)
              </div>
            </div>
          </div>

          {/* Card 3: 12 randomly audited */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Eye className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                12
              </div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">
                randomly audited
              </div>
              <div className="text-[11px] text-purple-700 font-medium">
                For quality assurance (5%)
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
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      activeTab === 'all'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    All Submissions (250)
                  </button>
                  <button
                    onClick={() => setActiveTab('low_confidence')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === 'low_confidence'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Low Confidence (18)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('random_audit')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === 'random_audit'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-purple-500" />
                    <span>Random Audit (12)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('confident')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === 'confident'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>All Confident (220)</span>
                  </button>
                </div>

                {/* Filter and Search */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by student ID or name..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </div>
                  <button
                    title="Filters"
                    className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-700 uppercase font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-3 w-8">
                      <input type="checkbox" className="rounded text-blue-600" />
                    </th>
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
                    const isSelected = item.id === selectedItem.id;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedStudentId(item.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50/70 border-l-4 border-l-blue-600'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded text-blue-600"
                          />
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                          {item.studentId}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                          {item.fileName}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                          {item.suggestedScore} <span className="text-[11px] text-slate-700 font-medium">/ 100</span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-xs font-bold ${
                                item.confidence < 50
                                  ? 'text-rose-600'
                                  : item.confidence < 80
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                              }`}
                            >
                              {item.confidence}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              item.reviewPriority === 'High'
                                ? 'bg-rose-100 text-rose-700'
                                : item.reviewPriority === 'Medium'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.reviewPriority}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {item.status === 'TA Review Needed' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                              TA Review Needed
                            </span>
                          )}
                          {item.status === 'Random Audit' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Eye className="w-3 h-3 text-purple-600" />
                              Random Audit
                            </span>
                          )}
                          {item.status === 'AI Confident' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              AI Confident
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            title="More actions"
                            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700">
              <span className="font-medium">1-10 of 250 submissions</span>
              <div className="flex items-center gap-1">
                <button className="px-2 py-1 rounded bg-white border border-slate-200 text-slate-500 hover:bg-slate-100">
                  &lt;
                </button>
                <button className="px-2.5 py-1 rounded bg-blue-600 text-white font-bold">1</button>
                <button className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium">2</button>
                <button className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium">3</button>
                <button className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium">4</button>
                <span className="px-1 text-slate-400">&hellip;</span>
                <button className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium">25</button>
                <button className="px-2 py-1 rounded bg-white border border-slate-200 text-slate-500 hover:bg-slate-100">
                  &gt;
                </button>
              </div>
            </div>

          </div>

          {/* ================= RIGHT COLUMN: Selected Submission Card (5 cols) ================= */}
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
                <ChevronLeft className="w-3.5 h-3.5 cursor-pointer hover:text-slate-900" />
                <span>3 of 18</span>
                <ChevronRight className="w-3.5 h-3.5 cursor-pointer hover:text-slate-900" />
              </div>
            </div>

            {/* Student ID & Status Badge */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {selectedItem.studentId}
                </h3>
                <div className="text-xs text-slate-700 font-mono font-medium mt-0.5">
                  {selectedItem.fileName} &middot; {selectedItem.fileSize}
                </div>
              </div>

              <div>
                {selectedItem.status === 'TA Review Needed' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    TA Review Needed
                  </span>
                )}
                {selectedItem.status === 'Random Audit' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    Random Audit
                  </span>
                )}
                {selectedItem.status === 'AI Confident' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    AI Confident
                  </span>
                )}
              </div>
            </div>

            {/* Metrics Row: Suggested Score, AI Confidence, Review Priority */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-700 uppercase font-semibold">Suggested Score</div>
                <div className="text-base font-extrabold text-slate-900 mt-0.5">
                  {selectedItem.suggestedScore} <span className="text-[11px] text-slate-700 font-normal">/ 100</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-700 uppercase font-semibold">AI Confidence</div>
                <div
                  className={`text-base font-extrabold mt-0.5 ${
                    selectedItem.confidence < 50
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
                    selectedItem.reviewPriority === 'High'
                      ? 'text-rose-600'
                      : selectedItem.reviewPriority === 'Medium'
                      ? 'text-amber-600'
                      : 'text-slate-700'
                  }`}
                >
                  {selectedItem.reviewPriority}
                </div>
              </div>
            </div>

            {/* AI Explanation */}
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>AI Explanation</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                {selectedItem.aiExplanation}
              </p>
            </div>

            {/* Cited Evidence from Submission (Code Snippet) */}
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Cited Evidence from Submission</span>
              </div>
              <pre className="font-mono text-[11px] bg-slate-900 text-slate-200 p-3.5 rounded-xl overflow-x-auto leading-relaxed border border-slate-800">
                {selectedItem.citedEvidenceCode}
              </pre>
            </div>

            {/* Reason for Uncertainty (Warning Box) */}
            {selectedItem.reasonsForUncertainty.length > 0 && (
              <div className="p-3.5 rounded-xl border border-rose-200/90 bg-rose-50/50 space-y-2">
                <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Reason for Uncertainty</span>
                </div>
                <ul className="text-xs text-rose-900/90 space-y-1 pl-1 font-medium">
                  {selectedItem.reasonsForUncertainty.map((reason, idx) => (
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
                {selectedItem.suggestedAction}
              </p>
            </div>

            {/* Actions: Open Full Evaluation & Grade */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/grading"
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Open Full Evaluation &amp; Grade</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                type="button"
                onClick={() => showToast(`✓ ${selectedItem.studentId} approved with score ${selectedItem.suggestedScore}/100.`)}
                className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Quick Approve
              </button>
            </div>

          </div>

        </div>

      </main>

      {/* Floating Action / Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
