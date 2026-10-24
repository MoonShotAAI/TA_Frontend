'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  UploadCloud,
  FileArchive,
  Search,
  MoreVertical,
  Folder,
  FileCode,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Users,
  BookOpen,
  FileSpreadsheet,
  Check,
  RotateCcw,
  Sliders,
  ExternalLink,
  Info,
  Layers,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { TopHeader } from '@/components/TopHeader';
import { StepProgressBar, GradingStep } from '@/components/StepProgressBar';
import { Toast } from '@/components/Toast';

interface UploadedFileItem {
  id: string;
  name: string;
  type: string;
  size: string;
  dateModified: string;
  isFolder?: boolean;
}

const INITIAL_FILES: UploadedFileItem[] = [
  {
    id: 'f-1',
    name: 'student_submissions',
    type: 'Folder',
    size: '--',
    dateModified: 'Oct 15, 2024 2:14 PM',
    isFolder: true,
  },
  {
    id: 'f-2',
    name: 'student_001.ipynb',
    type: 'Jupyter Notebook',
    size: '245 KB',
    dateModified: 'Oct 15, 2024 2:13 PM',
  },
  {
    id: 'f-3',
    name: 'student_002.ipynb',
    type: 'Jupyter Notebook',
    size: '312 KB',
    dateModified: 'Oct 15, 2024 2:13 PM',
  },
  {
    id: 'f-4',
    name: 'student_003.ipynb',
    type: 'Jupyter Notebook',
    size: '198 KB',
    dateModified: 'Oct 15, 2024 2:13 PM',
  },
  {
    id: 'f-5',
    name: 'student_004.ipynb',
    type: 'Jupyter Notebook',
    size: '356 KB',
    dateModified: 'Oct 15, 2024 2:12 PM',
  },
  {
    id: 'f-6',
    name: 'student_005.ipynb',
    type: 'Jupyter Notebook',
    size: '280 KB',
    dateModified: 'Oct 15, 2024 2:11 PM',
  },
  {
    id: 'f-7',
    name: 'student_006.ipynb',
    type: 'Jupyter Notebook',
    size: '310 KB',
    dateModified: 'Oct 15, 2024 2:10 PM',
  },
];

const DEFAULT_RUBRIC_TEXT = `CS 229 - Machine Learning
Homework 3: Model Evaluation
Total: 100 points

1. Problem Formulation (20 points)
• Clearly defines the learning problem and target variable (10 pts)
• Justifies the choice of evaluation metric(s) (10 pts)

2. Data Analysis (20 points)
• Explores and summarizes key patterns in the data (10 pts)
• Identifies potential data issues (e.g., missing values, imbalance) and discusses their impact (10 pts)

3. Model Implementation (25 points)
• Correctly implements the required model(s) (15 pts)
• Code is clean, modular, and well-documented (10 pts)

4. Results and Evaluation (25 points)
• Reports results with appropriate metrics and visualizations (15 pts)
• Provides a clear and thoughtful discussion of results (10 pts)

5. Conclusion (10 points)
• Summarizes key findings (5 pts)
• Discusses limitations and possible improvements (5 pts)`;

function UploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialStepParam = searchParams.get('step');
  const [currentStep, setCurrentStep] = useState<GradingStep>(
    initialStepParam === '2' ? 2 : 1
  );

  const [files, setFiles] = useState<UploadedFileItem[]>(INITIAL_FILES);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Step 2 state
  const [rubricInputTab, setRubricInputTab] = useState<'paste' | 'upload' | 'pdf'>('paste');
  const [rubricText, setRubricText] = useState(DEFAULT_RUBRIC_TEXT);
  const [isParsingRubric, setIsParsingRubric] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const handleStepClick = (step: GradingStep) => {
    if (step === 3 || step === 4) {
      router.push('/grading');
    } else {
      setCurrentStep(step);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    showToast("✓ ZIP package extracted! 24 submission files detected.");
  };

  const handleChooseZip = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      showToast(`✓ ZIP package "${file.name}" uploaded and unpacked!`);
    }
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleParseRubric = () => {
    setIsParsingRubric(true);
    setTimeout(() => {
      setIsParsingRubric(false);
      showToast("🎉 Rubric parsed into 5 structured criteria (10 sub-criteria). Ready for AI grading!");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Top Header matching dark navy aesthetics */}
      <TopHeader />

      {/* 4-Step Progress Bar matching mockup */}
      <StepProgressBar
        currentStep={currentStep}
        progressPercent={currentStep === 1 ? 0 : 25}
        onStepClick={handleStepClick}
      />

      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ================= STEP 1: UPLOAD LMS ZIP ================= */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Main Column: Step 1 Upload & File Table (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Step Header Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                      Step 1. Upload ZIP from LMS
                    </h1>
                    <p className="text-xs text-slate-700 font-medium mt-0.5">
                      Upload the downloaded assignment batch from your LMS (e.g., Canvas, Gradescope, Blackboard)
                    </p>
                  </div>
                </div>

                {/* Drag and Drop Box */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50/80 ring-4 ring-blue-100'
                      : 'border-blue-200/90 bg-gradient-to-b from-blue-50/40 to-slate-50/30 hover:bg-blue-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />

                  <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 shadow-xs">
                    <FileArchive className="w-8 h-8" />
                  </div>

                  <h3 className="text-sm font-bold text-slate-800">
                    Drag and drop your ZIP file here
                  </h3>
                  <p className="text-xs text-slate-700 font-medium mt-1">or click to browse</p>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleChooseZip}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30"
                    >
                      Choose ZIP File
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-700 mt-4 font-medium">
                    Upload downloaded assignment batch from LMS (Supports .zip files up to 2GB)
                  </p>
                </div>
              </div>

              {/* Uploaded Files Table Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">
                      Uploaded Files
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                      24 items
                    </span>
                  </div>

                  {/* Search Files Input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search files..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-700 uppercase font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-5">Name ↑</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Size</th>
                        <th className="py-3 px-4">Date Modified</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {filteredFiles.map((file) => (
                        <tr key={file.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-5 flex items-center gap-2.5 font-semibold text-slate-900">
                            {file.isFolder ? (
                              <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                            ) : (
                              <FileCode className="w-4 h-4 text-blue-500 shrink-0" />
                            )}
                            <span className="truncate max-w-[240px] sm:max-w-none">{file.name}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium">{file.type}</td>
                          <td className="py-3 px-4 text-slate-700 font-mono text-[11px]">{file.size}</td>
                          <td className="py-3 px-4 text-slate-700">{file.dateModified}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              title="File actions"
                              className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Step Progression Banner */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-700 font-medium">
                    24 student submission records unpacked and indexed.
                  </span>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30 group"
                  >
                    <span>Next: Configure Rubric &amp; Assignment</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

            </div>

            {/* Right Side Column: Batch Information & Tips (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Batch Information Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Batch Information</span>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-900">Weekly Assignment Batch</div>
                  <div className="text-xs text-slate-700 font-medium mt-0.5">
                    CS 229 &mdash; Machine Learning
                  </div>
                  <div className="text-xs text-slate-700">Homework 3: Model Evaluation</div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">500 students</div>
                        <div className="text-[11px] text-slate-700 font-medium">Detected from submission batch</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Ready
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Rubric loaded</div>
                        <div className="text-[11px] text-slate-700 font-medium">HW3 Grading Rubric (v2)</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Ready
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Auto-save active</div>
                        <div className="text-[11px] text-slate-700 font-medium">Progress will be saved automatically</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      On
                    </span>
                  </div>
                </div>
              </div>

              {/* Tips Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-3">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>Tips</span>
                </div>
                <ul className="text-xs text-slate-700 font-medium space-y-2.5 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Download the full assignment batch from your LMS as a ZIP file (with all student submissions).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Ensure the ZIP file contains all student folders/files.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Supported file types: <code>.ipynb</code>, <code>.py</code>, <code>.pdf</code>, <code>.docx</code>, <code>.txt</code>, etc.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>File names should include student identifiers (e.g., student_001, netid, or ID).</span>
                  </li>
                </ul>
              </div>

              {/* Need Help Card */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">Need Help?</div>
                  <div className="text-[11px] text-slate-700 mt-0.5">
                    See our upload guide or contact support if you encounter issues.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => showToast("Opening LMS Upload Help Guide...")}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors shrink-0"
                >
                  View Guide
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ================= STEP 2: RUBRIC TO CHECKLIST ================= */}
        {currentStep === 2 && (
          <div className="space-y-6">
            
            {/* Step 2 Header */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Step 2. Rubric to Checklist
                  </h1>
                  <p className="text-xs text-slate-700 font-medium mt-0.5">
                    Paste or upload your instructor rubric. We&apos;ll parse it into a structured checklist for consistent AI grading.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Step 1</span>
                </button>
                <Link
                  href="/grading"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30 group"
                >
                  <span>Proceed to AI Grading</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Step 2 Grid: Rubric Input (Left 4 cols) + Checklist Preview (Middle 5 cols) + Health & Info (Right 3 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* 1. Instructor Rubric Input (4 cols) */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-slate-900">
                      Instructor Rubric Input
                    </h2>
                  </div>
                  <p className="text-[11px] text-slate-700 font-medium mb-3">
                    Upload a rubric file (PDF, DOC, or TXT) or paste your rubric text below.
                  </p>

                  {/* Input Tab Switcher */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl mb-3 text-xs">
                    <button
                      onClick={() => setRubricInputTab('paste')}
                      className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                        rubricInputTab === 'paste'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Paste Text
                    </button>
                    <button
                      onClick={() => setRubricInputTab('upload')}
                      className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                        rubricInputTab === 'upload'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      onClick={() => setRubricInputTab('pdf')}
                      className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                        rubricInputTab === 'pdf'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      View PDF
                    </button>
                  </div>

                  {/* Textarea */}
                  <textarea
                    rows={16}
                    value={rubricText}
                    onChange={(e) => setRubricText(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
                  <button
                    onClick={() => setRubricText('')}
                    className="text-xs text-slate-400 hover:text-rose-600 font-semibold transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleParseRubric}
                    disabled={isParsingRubric}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-60"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                    <span>{isParsingRubric ? 'Parsing Rubric...' : 'Parse Rubric to Checklist'}</span>
                  </button>
                </div>
              </div>

              {/* 2. AI-Structured Checklist (5 cols) */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      AI-Structured Checklist
                    </h2>
                    <p className="text-[11px] text-slate-700 font-medium">
                      We&apos;ve converted your rubric into clear, gradable checklist criteria.
                    </p>
                  </div>
                  <button
                    onClick={() => showToast("Checklist editor mode enabled.")}
                    className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    Edit Checklist
                  </button>
                </div>

                {/* Criteria items list matching mockup */}
                <div className="space-y-3 mt-4">
                  
                  {/* Item 1 */}
                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                          1
                        </span>
                        <span className="text-xs font-bold text-slate-900">Problem Formulation</span>
                        <span className="text-xs text-slate-700 font-bold">20 points</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                        Concept &amp; Framing
                      </span>
                    </div>
                    <div className="pl-8 space-y-1.5 text-xs text-slate-700 font-medium">
                      <div className="flex items-start gap-2">
                        <input type="checkbox" defaultChecked className="mt-0.5 rounded text-blue-600" />
                        <span>Clearly defines the learning problem and target variable (10 pts)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <input type="checkbox" defaultChecked className="mt-0.5 rounded text-blue-600" />
                        <span>Justifies the choice of evaluation metric(s) (10 pts)</span>
                      </div>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                          2
                        </span>
                        <span className="text-xs font-bold text-slate-900">Data Analysis</span>
                        <span className="text-xs text-slate-700 font-bold">20 points</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                        Data &amp; EDA
                      </span>
                    </div>
                    <div className="pl-8 space-y-1.5 text-xs text-slate-700 font-medium">
                      <div className="flex items-start gap-2">
                        <input type="checkbox" defaultChecked className="mt-0.5 rounded text-blue-600" />
                        <span>Explores and summarizes key patterns in the data (10 pts)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <input type="checkbox" defaultChecked className="mt-0.5 rounded text-blue-600" />
                        <span>Identifies potential data issues (missing values, imbalance) (10 pts)</span>
                      </div>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                          3
                        </span>
                        <span className="text-xs font-bold text-slate-900">Model Implementation</span>
                        <span className="text-xs text-slate-700 font-bold">25 points</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                        Implementation
                      </span>
                    </div>
                    <div className="pl-8 space-y-1.5 text-xs text-slate-700 font-medium">
                      <div className="flex items-start gap-2">
                        <input type="checkbox" defaultChecked className="mt-0.5 rounded text-blue-600" />
                        <span>Correctly implements the required model(s) (15 pts)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <input type="checkbox" defaultChecked className="mt-0.5 rounded text-blue-600" />
                        <span>Code is clean, modular, and well-documented (10 pts)</span>
                      </div>
                    </div>
                  </div>

                  {/* Item 4 */}
                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                          4
                        </span>
                        <span className="text-xs font-bold text-slate-900">Results and Evaluation</span>
                        <span className="text-xs text-slate-700 font-bold">25 points</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                        Analysis &amp; Insight
                      </span>
                    </div>
                    <div className="pl-8 space-y-1.5 text-xs text-slate-700 font-medium">
                      <div className="flex items-start gap-2">
                        <input type="checkbox" defaultChecked className="mt-0.5 rounded text-blue-600" />
                        <span>Reports results with appropriate metrics and visualizations (15 pts)</span>
                      </div>
                    </div>
                  </div>

                  {/* Item 5 */}
                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                          5
                        </span>
                        <span className="text-xs font-bold text-slate-900">Conclusion</span>
                        <span className="text-xs text-slate-700 font-bold">10 points</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200 font-semibold">
                        Communication
                      </span>
                    </div>
                    <div className="pl-8 space-y-1.5 text-xs text-slate-700 font-medium">
                      <div className="flex items-start gap-2">
                        <input type="checkbox" defaultChecked className="mt-0.5 rounded text-blue-600" />
                        <span>Summarizes key findings (5 pts)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <input type="checkbox" defaultChecked className="mt-0.5 rounded text-blue-600" />
                        <span>Discusses limitations and possible improvements (5 pts)</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* 3. Consistency Health & Batch Information (3 cols) */}
              <div className="lg:col-span-3 space-y-5">
                
                {/* Rubric Consistency Health Card */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3.5">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Rubric Consistency Health</span>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="flex items-start gap-2.5 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-900">Pre-Grading Validation Passed</div>
                        <div className="text-[11px] text-slate-700 font-medium mt-0.5">Your rubric is clear and well-structured.</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-900">Rubric structure detected</div>
                        <div className="text-[11px] text-slate-700 font-medium mt-0.5">5 criteria, 10 sub-criteria.</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-900">Point values consistent</div>
                        <div className="text-[11px] text-slate-700 font-medium mt-0.5">Total: 100 points.</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-900">Criteria are specific and measurable</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 text-xs p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-amber-900">1 ambiguous criterion flagged</div>
                        <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                          Consider adding more detail for &ldquo;possible improvements&rdquo; in the Conclusion section.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Batch Information */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>Batch Information</span>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-900">Weekly Assignment Batch</div>
                    <div className="text-xs text-slate-700 font-medium">CS 229 &mdash; Machine Learning</div>
                    <div className="text-xs text-slate-700">Homework 3: Model Evaluation</div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-medium">500 students detected</span>
                      <span className="font-bold text-emerald-800 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100">
                        Ready
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-medium">Parsed into 5 criteria (100 pts)</span>
                      <span className="font-bold text-emerald-800 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100">
                        Ready
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-medium">Auto-save active</span>
                      <span className="font-bold text-emerald-800 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100">
                        On
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Proceed Button */}
                <Link
                  href="/grading"
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Proceed to AI Grading</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* Floating Action / Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]" />}>
      <UploadContent />
    </Suspense>
  );
}

