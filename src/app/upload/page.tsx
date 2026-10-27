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
  Scale,
  Eye,
  Loader2,
  X,
  Copy,
  Plus,
} from 'lucide-react';
import { TopHeader } from '@/components/TopHeader';
import { StepProgressBar, GradingStep } from '@/components/StepProgressBar';
import { Toast } from '@/components/Toast';
import { Rubric5x5TestModal } from '@/components/Rubric5x5TestModal';
import {
  uploadLmsZip,
  fetchBatchFiles,
  fetchParsedText,
  parseSinglePdf,
  fetchBatches,
  parseRubricWithClaude,
  fetchRubricByBatch,
  BatchItem,
  SubmissionFileItem,
  ParsedFileDetail,
  PDFLightweightResult,
  RubricCriterionItem,
} from '@/utils/api';

interface UploadedFileDisplay {
  id: string;
  name: string;
  studentId?: string;
  type: string;
  size: string;
  dateModified: string;
  status: string; // 'Uploaded' | 'Parsing' | 'Parsed' | 'Graded'
  isFolder?: boolean;
}

const DEFAULT_RUBRIC_TEXT = '';

function UploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const singlePdfInputRef = useRef<HTMLInputElement>(null);

  const initialStepParam = searchParams.get('step');
  const [currentStep, setCurrentStep] = useState<GradingStep>(
    initialStepParam === '2' ? 2 : 1
  );

  // Batches & Backend State
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [files, setFiles] = useState<UploadedFileDisplay[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Loading & Upload Progress States
  const [isUploadingZip, setIsUploadingZip] = useState(false);
  const [uploadStatusMessage, setUploadStatusMessage] = useState('');
  const [isTestingPdf, setIsTestingPdf] = useState(false);

  // Modals for Parsed Inspection
  const [parsedModalDetail, setParsedModalDetail] = useState<ParsedFileDetail | null>(null);
  const [isLoadingParsedDetail, setIsLoadingParsedDetail] = useState(false);
  const [singlePdfResult, setSinglePdfResult] = useState<PDFLightweightResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Step 2 state
  const [rubricInputTab, setRubricInputTab] = useState<'paste' | 'upload' | 'pdf'>('paste');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [rubricText, setRubricText] = useState('');
  const [parsedCriteria, setParsedCriteria] = useState<RubricCriterionItem[]>([]);
  const [totalRubricPoints, setTotalRubricPoints] = useState<number>(0);
  const [isParsingRubric, setIsParsingRubric] = useState(false);
  const [is5x5ModalOpen, setIs5x5ModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Human editing handlers for AI-structured checklist
  const handleUpdateCriterion = (
    index: number,
    field: keyof RubricCriterionItem,
    value: string | number
  ) => {
    setParsedCriteria((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'max_score') {
        const newTotal = updated.reduce(
          (sum, item) => sum + (Number(item.max_score) || 0),
          0
        );
        setTotalRubricPoints(newTotal);
      }
      return updated;
    });
  };

  const handleRemoveCriterion = (index: number) => {
    setParsedCriteria((prev) => {
      const filtered = prev
        .filter((_, i) => i !== index)
        .map((item, idx) => ({
          ...item,
          criterion_number: idx + 1,
        }));
      const newTotal = filtered.reduce(
        (sum, item) => sum + (Number(item.max_score) || 0),
        0
      );
      setTotalRubricPoints(newTotal);
      return filtered;
    });
  };

  const handleAddCriterion = () => {
    setParsedCriteria((prev) => {
      const newNum = prev.length + 1;
      const newItem: RubricCriterionItem = {
        criterion_number: newNum,
        title: `평가 기준 ${newNum}`,
        description: '',
        category: '일반',
        max_score: 5,
        scoring_guideline: '5점(우수): 완벽 구현 | 3~4점(보통): 부분 구현 | 1~2점(미흡): 미완성/오류 | 0점: 미수행',
      };
      const updated = [...prev, newItem];
      const newTotal = updated.reduce(
        (sum, item) => sum + (Number(item.max_score) || 0),
        0
      );
      setTotalRubricPoints(newTotal);
      return updated;
    });
  };

  const handleClearCriteria = () => {
    setParsedCriteria([]);
    setTotalRubricPoints(0);
  };

  // Load batches and current batch files from Backend on mount
  useEffect(() => {
    async function initData() {
      try {
        const batchParam = searchParams.get('batchId');
        const batchList = await fetchBatches();
        if (batchList && batchList.length > 0) {
          setBatches(batchList);
          // Only auto-load batch data and rubric if batchParam is explicitly passed in URL
          if (batchParam && batchList.some((b) => b.id === batchParam)) {
            setSelectedBatchId(batchParam);

            const curBatch = batchList.find((b) => b.id === batchParam);
            if (curBatch?.assignment_title) {
              setAssignmentTitle(curBatch.assignment_title);
            }

            const backendFiles = await fetchBatchFiles(batchParam);
            if (backendFiles && backendFiles.length > 0) {
              mapAndSetFiles(backendFiles);
            } else {
              setFiles([]);
            }

            // Fetch existing rubric criteria if already created for this specific batch
            try {
              const rub = await fetchRubricByBatch(batchParam);
              if (rub && rub.criteria && rub.criteria.length > 0) {
                setParsedCriteria(rub.criteria);
                setTotalRubricPoints(rub.total_points || 0);
                if (rub.raw_text) setRubricText(rub.raw_text);
                if (rub.assignment_title) setAssignmentTitle(rub.assignment_title);
              }
            } catch {
              // No saved rubric for this batch yet
            }
          } else {
            // No explicit batchParam: keep fields clean and empty!
            setSelectedBatchId(batchList[0]?.id || '');
            setFiles([]);
          }
        } else {
          setBatches([]);
          setSelectedBatchId('');
          setFiles([]);
        }
      } catch (err) {
        console.warn('Backend not reachable or running demo mockups:', err);
      }
    }
    initData();
  }, [searchParams]);

  const mapAndSetFiles = (backendFiles: SubmissionFileItem[]) => {
    const mapped: UploadedFileDisplay[] = backendFiles.map((bf) => ({
      id: bf.id,
      name: bf.file_name,
      studentId: bf.student_id,
      type: bf.file_format.toUpperCase() + ' Document',
      size: `${bf.file_size_kb.toLocaleString()} KB`,
      dateModified: new Date(bf.created_at).toLocaleDateString(),
      status: bf.status,
    }));
    setFiles(mapped);
  };

  const handleStepClick = (step: GradingStep) => {
    if (step === 3 || step === 4) {
      router.push(selectedBatchId ? `/grading?batchId=${selectedBatchId}` : '/grading');
    } else {
      setCurrentStep(step);
    }
  };

  // Real Upload Handler for ZIP
  const handleProcessZipFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      showToast('⚠️ Please upload a valid .zip file archive.');
      return;
    }

    try {
      setIsUploadingZip(true);
      setUploadStatusMessage(`Uploading "${file.name}" & extracting documents to storage/parsed...`);

      const res = await uploadLmsZip(selectedBatchId || (undefined as any), file);
      showToast(`🎉 ${res.message}`);

      // Refresh batches from backend to get newly created or updated batch
      const updatedBatches = await fetchBatches();
      if (updatedBatches && updatedBatches.length > 0) {
        setBatches(updatedBatches);
        const activeId = selectedBatchId || updatedBatches[0].id;
        setSelectedBatchId(activeId);
        const updatedFiles = await fetchBatchFiles(activeId);
        mapAndSetFiles(updatedFiles);
        const cur = updatedBatches.find((b) => b.id === activeId);
        if (cur?.assignment_title) setAssignmentTitle(cur.assignment_title);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`❌ Upload failed: ${msg}`);
    } finally {
      setIsUploadingZip(false);
      setUploadStatusMessage('');
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessZipFile(e.dataTransfer.files[0]);
    }
  };

  const handleChooseZip = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessZipFile(e.target.files[0]);
    }
  };

  // Test Single PDF Real-time Lightweighting
  const handleProcessSinglePdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        showToast('⚠️ Please select a .pdf file.');
        return;
      }
      try {
        setIsTestingPdf(true);
        showToast(`⚡ Parsing PDF "${file.name}" with PDFLightweightParser...`);
        const result = await parseSinglePdf(file);
        setSinglePdfResult(result);
        showToast(`✓ PDF 경량화 완료! 압축률: ${result.compression_ratio_percent}%`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        showToast(`❌ PDF Parsing failed: ${msg}`);
      } finally {
        setIsTestingPdf(false);
      }
    }
  };

  // View Parsed Text Modal Handler
  const handleViewParsedText = async (fileId: string) => {
    try {
      setIsLoadingParsedDetail(true);
      const detail = await fetchParsedText(fileId);
      setParsedModalDetail(detail);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`❌ Could not fetch parsed text: ${msg}`);
    } finally {
      setIsLoadingParsedDetail(false);
    }
  };

  const copyParsedToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleParseRubric = async () => {
    if (!rubricText.trim()) {
      showToast('⚠️ Please enter or paste rubric text.');
      return;
    }

    try {
      setIsParsingRubric(true);
      showToast('🤖 Claude AI가 루브릭을 분석하여 점수 척도 기반 체크리스트를 생성하는 중입니다...');
      const res = await parseRubricWithClaude({
        batch_id: selectedBatchId || undefined,
        assignment_title: assignmentTitle.trim() || undefined,
        raw_rubric_text: rubricText,
      });

      setParsedCriteria(res.criteria);
      setTotalRubricPoints(res.total_points || 100);
      if (res.assignment_title) {
        setAssignmentTitle(res.assignment_title);
      }
      if (res.batch_id && res.batch_id !== selectedBatchId) {
        setSelectedBatchId(res.batch_id);
      }

      // Also refresh batches so the target batch list stays current
      const updatedBatches = await fetchBatches();
      if (updatedBatches && updatedBatches.length > 0) {
        setBatches(updatedBatches);
      }

      showToast(`🎉 Claude AI가 ${res.criteria.length}개의 세부 평가 체크리스트(1~10점 척도)를 생성했습니다!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`❌ 루브릭 파싱 실패: ${msg}`);
    } finally {
      setIsParsingRubric(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Top Header matching dark navy aesthetics */}
      <TopHeader activeSection={currentStep === 2 ? 'rubrics' : 'upload'} />

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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                        Step 1. Upload ZIP from LMS
                      </h1>
                      <p className="text-xs text-slate-700 font-medium mt-0.5">
                        Upload LMS assignment ZIP &mdash; backend will asynchronously extract and parse PDFs to local disk
                      </p>
                    </div>
                  </div>

                  {/* Batch Selector if multiple batches exist */}
                  {batches.length > 0 && (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                      <span className="font-semibold text-slate-600">Target Batch:</span>
                      <select
                        value={selectedBatchId}
                        onChange={async (e) => {
                          const newBId = e.target.value;
                          setSelectedBatchId(newBId);
                          try {
                            const bFiles = await fetchBatchFiles(newBId);
                            mapAndSetFiles(bFiles);
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="bg-transparent font-bold text-blue-700 focus:outline-hidden"
                      >
                        {batches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.course_code} - {b.assignment_title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Drag and Drop Box */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all ${
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
                  <input
                    ref={singlePdfInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleProcessSinglePdf}
                  />

                  <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 shadow-xs">
                    {isUploadingZip ? (
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    ) : (
                      <FileArchive className="w-8 h-8" />
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-800">
                    {isUploadingZip ? 'Uploading & Parsing PDFs in Background...' : 'Drag and drop your ZIP file here'}
                  </h3>
                  <p className="text-xs text-slate-700 font-medium mt-1">
                    {uploadStatusMessage || 'or choose an archive from your local disk'}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={isUploadingZip}
                      onClick={handleChooseZip}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-60 flex items-center gap-2"
                    >
                      {isUploadingZip && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Choose ZIP Archive</span>
                    </button>

                    <button
                      type="button"
                      disabled={isTestingPdf}
                      onClick={() => singlePdfInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Test Single PDF Parser</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-600 mt-4 font-medium">
                    ⚡ PDF files will automatically have headers/footers removed and saved to <code>storage/parsed/</code>
                  </p>
                </div>
              </div>

              {/* Uploaded Files Table Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">
                      Uploaded Submissions &amp; Parsed Status
                    </h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                      {files.length} items
                    </span>
                  </div>

                  {/* Search Files Input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search submissions..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-700 uppercase font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-5">Submission File</th>
                        <th className="py-3 px-4">Student ID</th>
                        <th className="py-3 px-4">Size</th>
                        <th className="py-3 px-4">Parser Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {filteredFiles.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">
                            <FileArchive className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                            <div className="font-semibold text-slate-600">등록된 과제 파일이 없습니다</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              상단 드롭존에 LMS ZIP 파일을 드래그 앤 드롭하여 업로드하세요.
                            </div>
                          </td>
                        </tr>
                      )}
                      {filteredFiles.map((file) => (
                        <tr key={file.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-5 flex items-center gap-2.5 font-semibold text-slate-900">
                            {file.isFolder ? (
                              <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                            ) : file.name.endsWith('.pdf') ? (
                              <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                            ) : (
                              <FileCode className="w-4 h-4 text-blue-500 shrink-0" />
                            )}
                            <span className="truncate max-w-[240px] sm:max-w-none">{file.name}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-mono text-[11px]">
                            {file.studentId || '--'}
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-mono text-[11px]">{file.size}</td>
                          <td className="py-3 px-4">
                            {file.status === 'Parsed' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Parsed &amp; Saved</span>
                              </span>
                            ) : file.status === 'Parsing' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                                <span>Parsing...</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                                {file.status}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleViewParsedText(file.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 font-semibold text-[11px] transition-colors"
                              title="View parsed text"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Text</span>
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
                    {files.length} student submission records unpacked and indexed.
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
                  <span>Active Batch Information</span>
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
                        <div className="text-xs font-bold text-slate-900">{files.length} Submissions</div>
                        <div className="text-[11px] text-slate-700 font-medium">Ready for AI Grading</div>
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
                        <div className="text-xs font-bold text-slate-900">PDF Lightweighting</div>
                        <div className="text-[11px] text-slate-700 font-medium">Saved to storage/parsed/</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Tips Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-3">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>PDF Parsing Guide</span>
                </div>
                <ul className="text-xs text-slate-700 font-medium space-y-2.5 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>ZIP contains student PDF submissions downloaded from Canvas/Gradescope.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Backend lightweight parser extracts pure text while stripping headers and page numbers.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Cleaned texts are saved directly to <code>storage/parsed/</code> for prompt injection isolated grading.</span>
                  </li>
                </ul>
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

                  {/* Assignment Title Input */}
                  <div className="mb-3">
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      과제 제목 (Assignment Title) *
                    </label>
                    <input
                      type="text"
                      value={assignmentTitle}
                      onChange={(e) => setAssignmentTitle(e.target.value)}
                      placeholder="과제 제목을 입력하세요 (예: 데이터 분석 및 머신러닝 과제 1)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <p className="text-[11px] text-slate-700 font-medium mb-2">
                    루브릭 텍스트를 입력하거나 수정하세요. Claude AI가 1~10점 척도 체크리스트로 구조화합니다.
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
                    rows={14}
                    value={rubricText}
                    onChange={(e) => setRubricText(e.target.value)}
                    placeholder={`루브릭 채점 기준을 입력하거나 붙여넣으세요.\n\n예시:\n1. 데이터 전처리 및 탐색적 분석 (10점)\n- 결측치와 이상치를 적절히 처리하고 정규화 적용 (5점)\n- 특성 공학 및 상관관계 시각화 (5점)\n\n2. 머신러닝 모델 구현 (10점)\n- 문제에 적합한 2개 이상의 모델 비교 구현 (6점)\n- 교차 검증 및 하이퍼파라미터 튜닝 (4점)`}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setRubricText('');
                      setAssignmentTitle('');
                    }}
                    className="text-xs text-slate-400 hover:text-rose-600 font-semibold transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleParseRubric}
                    disabled={isParsingRubric}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-60"
                  >
                    {isParsingRubric ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                    )}
                    <span>{isParsingRubric ? 'Claude AI 파싱 중...' : 'Claude로 체크리스트 생성'}</span>
                  </button>
                </div>
              </div>

              {/* 2. AI-Structured Checklist (5 cols) - Fully editable by humans */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>AI-Structured Checklist</span>
                        {parsedCriteria.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                            {parsedCriteria.length}개 항목 &bull; 총 {totalRubricPoints}점
                          </span>
                        )}
                      </h2>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        루브릭이 1~10점 척도 체크리스트로 구조화되며, 직접 수정하거나 기준을 추가할 수 있습니다.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {parsedCriteria.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearCriteria}
                          className="px-2 py-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
                        >
                          전체 초기화
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleAddCriterion}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>기준 추가</span>
                      </button>
                    </div>
                  </div>

                  {parsedCriteria.length === 0 ? (
                    <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 my-3 space-y-3">
                      <Sparkles className="w-8 h-8 text-blue-500 mx-auto" />
                      <h3 className="text-xs font-bold text-slate-800">생성된 체크리스트가 없습니다</h3>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                        좌측에서 과제 제목과 루브릭 텍스트를 입력하고 <strong>[Claude로 체크리스트 생성]</strong>을 클릭하거나, <strong>[기준 추가]</strong>를 눌러 직접 작성할 수 있습니다.
                      </p>
                      <button
                        type="button"
                        onClick={handleAddCriterion}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-blue-500 text-slate-700 hover:text-blue-600 font-bold text-xs shadow-2xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-blue-600" />
                        <span>새 평가 기준 직접 작성하기</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3.5 mt-3 max-h-[580px] overflow-y-auto pr-1">
                      {parsedCriteria.map((item, index) => (
                        <div
                          key={item.criterion_number || index}
                          className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 shadow-2xs transition-all space-y-2.5"
                        >
                          {/* Top: Index, Title (editable), Category (editable), Max Score (editable), Delete */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                {item.criterion_number}
                              </span>
                              <div className="flex-1 min-w-0 space-y-1">
                                <input
                                  type="text"
                                  value={item.title}
                                  onChange={(e) => handleUpdateCriterion(index, 'title', e.target.value)}
                                  placeholder="평가 기준 제목"
                                  className="w-full text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-2.5 py-1 focus:outline-hidden"
                                />
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-semibold text-slate-400">분류:</span>
                                  <input
                                    type="text"
                                    value={item.category}
                                    onChange={(e) => handleUpdateCriterion(index, 'category', e.target.value)}
                                    placeholder="카테고리"
                                    className="text-[10px] text-slate-600 bg-slate-50 focus:bg-white border border-slate-200 rounded px-1.5 py-0.5 w-36 focus:outline-hidden"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Max score input and Delete button */}
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1">
                                <span className="text-[10px] font-bold text-blue-700">배점</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={100}
                                  value={item.max_score}
                                  onChange={(e) =>
                                    handleUpdateCriterion(
                                      index,
                                      'max_score',
                                      Math.max(1, parseInt(e.target.value) || 1)
                                    )
                                  }
                                  className="w-10 text-center font-mono font-extrabold text-xs text-blue-900 bg-white border border-blue-300 rounded px-1 py-0.5 focus:outline-hidden"
                                />
                                <span className="text-[10px] font-bold text-blue-700">점</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveCriterion(index)}
                                title="이 기준 삭제"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Description textarea */}
                          <div>
                            <textarea
                              rows={2}
                              value={item.description}
                              onChange={(e) => handleUpdateCriterion(index, 'description', e.target.value)}
                              placeholder="세부 평가 항목 및 기준 설명을 입력하세요..."
                              className="w-full p-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg text-xs font-medium text-slate-800 leading-relaxed resize-y focus:outline-hidden"
                            />
                          </div>

                          {/* Scoring Guideline textarea */}
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] space-y-1">
                            <div className="font-bold text-slate-700 flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Sliders className="w-3 h-3 text-blue-600" />
                                <span>점수 산정 기준 (0 ~ {item.max_score}점 포맷)</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal">직접 편집 가능</span>
                            </div>
                            <textarea
                              rows={2}
                              value={item.scoring_guideline || ''}
                              onChange={(e) => handleUpdateCriterion(index, 'scoring_guideline', e.target.value)}
                              placeholder={`점수 산정 가이드라인 (예: ${item.max_score}점: 우수, ${Math.floor(item.max_score / 2)}점: 보통, 0점: 미수행)`}
                              className="w-full p-2 bg-white border border-slate-200 focus:border-blue-500 rounded-lg text-[11px] text-slate-700 leading-relaxed resize-y focus:outline-hidden"
                            />
                          </div>

                          {/* Score Scale Chips */}
                          <div className="pt-0.5 flex items-center gap-1 flex-wrap">
                            <span className="text-[10px] font-bold text-slate-400 mr-1">점수 구간:</span>
                            {Array.from({ length: Math.min(item.max_score + 1, 11) }, (_, i) => i).map((score) => (
                              <span
                                key={score}
                                className={`px-1.5 py-0.2 rounded text-[10px] font-bold font-mono ${
                                  score === item.max_score
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : score === 0
                                    ? 'bg-slate-200 text-slate-600'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}
                              >
                                {score}점
                              </span>
                            ))}
                            {item.max_score > 10 && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ... +{item.max_score - 10}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {parsedCriteria.length > 0 && (
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">
                      총 {parsedCriteria.length}개 세부 평가 기준 준비 완료 (편집 내용 반영됨)
                    </span>
                    <button
                      type="button"
                      onClick={() => router.push(selectedBatchId ? `/grading?batchId=${selectedBatchId}` : '/grading')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      <span>채점 화면으로 이동</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* 3. Consistency Health (3 cols) */}
              <div className="lg:col-span-3 space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Rubric Consistency Health</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      96.2% Determinism
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setIs5x5ModalOpen(true)}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors active:scale-[0.99] group"
                    >
                      <Scale className="w-4 h-4 text-slate-300 group-hover:scale-105 transition-transform" />
                      <span>Validate Rubric Criteria (5&times;5 Test)</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* 5x5 Rubric Determinism Test Modal */}
      <Rubric5x5TestModal
        isOpen={is5x5ModalOpen}
        onClose={() => setIs5x5ModalOpen(false)}
        onProceedToGrading={() => router.push('/grading')}
      />

      {/* Modal: View Extracted/Parsed Text from Local Storage */}
      {parsedModalDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {parsedModalDetail.file_name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Student ID: {parsedModalDetail.student_id} &bull; Status: {parsedModalDetail.status}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setParsedModalDetail(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Local Storage Path & Cleaned Text */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Saved to Local Storage on Backend</span>
                  </div>
                  <p className="font-mono text-[11px] text-emerald-800 break-all">
                    {parsedModalDetail.local_parsed_path}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyParsedToClipboard(parsedModalDetail.parsed_text)}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold text-[11px] shrink-0 flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isCopied ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Cleaned Lightweight Text (Pure AI Evaluation Payload):
                </label>
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs leading-relaxed max-h-[45vh] overflow-y-auto whitespace-pre-wrap select-text">
                  {parsedModalDetail.parsed_text || '(Empty text extracted)'}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setParsedModalDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Single PDF Lightweight Test Result */}
      {singlePdfResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Real-time PDF Lightweighting Test Result
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSinglePdfResult(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="text-[10px] text-blue-600 uppercase font-bold">Total Pages</div>
                  <div className="text-lg font-black text-blue-900">{singlePdfResult.total_pages}</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="text-[10px] text-emerald-600 uppercase font-bold">Size Reduction</div>
                  <div className="text-lg font-black text-emerald-900">{singlePdfResult.compression_ratio_percent}%</div>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                  <div className="text-[10px] text-purple-600 uppercase font-bold">Word Count</div>
                  <div className="text-lg font-black text-purple-900">{singlePdfResult.total_words.toLocaleString()}</div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Extracted Clean Text:</label>
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs leading-relaxed max-h-[35vh] overflow-y-auto whitespace-pre-wrap select-text">
                  {singlePdfResult.cleaned_text}
                </pre>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSinglePdfResult(null)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

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
