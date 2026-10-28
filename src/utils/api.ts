/**
 * TA+ Backend API Fetcher Client
 * Connects TA_Frontend (Next.js) with TA_Backend (FastAPI)
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface BatchItem {
  id: string;
  course_code: string;
  course_title: string;
  assignment_title: string;
  total_submissions: number;
  graded_submissions: number;
  low_confidence_count: number;
  average_score: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SubmissionFileItem {
  id: string;
  student_id: string;
  student_name: string;
  file_name: string;
  file_size_kb: number;
  file_format: string;
  status: string; // 'Uploaded' | 'Parsing' | 'Parsed' | 'Graded'
  created_at: string;
}

export interface ParsedFileDetail {
  file_id: string;
  batch_id: string;
  student_id: string;
  file_name: string;
  status: string;
  local_parsed_path: string;
  parsed_text: string;
}

export interface PDFPageItem {
  page_number: number;
  text: string;
  char_count: number;
  word_count: number;
}

export interface PDFLightweightResult {
  file_name: string;
  total_pages: number;
  original_size_kb: number;
  cleaned_size_kb: number;
  compression_ratio_percent: number;
  total_characters: number;
  total_words: number;
  cleaned_text: string;
  pages: PDFPageItem[];
}

export interface GenericApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * 1. 백엔드 서버 헬스체크
 */
export async function checkBackendHealth(): Promise<{ status: string; service: string }> {
  const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Backend health check failed (${res.status})`);
  }
  return res.json();
}

/**
 * 2. 등록된 과제 배치 목록 조회
 */
export async function fetchBatches(): Promise<BatchItem[]> {
  const res = await fetch(`${API_BASE_URL}/batches`, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Failed to fetch batches (${res.status})`);
  }
  const data = await res.json();
  return data.items || [];
}

/**
 * 3. LMS ZIP 파일 업로드 및 자동 PDF 경량화 파싱 요청
 * 백엔드에서 ZIP 압축 해제 후 PDF 파일들을 경량화 파싱하여 storage/parsed에 저장합니다.
 */
export async function uploadLmsZip(
  batchId: string,
  zipFile: File
): Promise<GenericApiResponse<SubmissionFileItem[]>> {
  const formData = new FormData();
  formData.append('batch_id', batchId);
  formData.append('file', zipFile);

  const res = await fetch(`${API_BASE_URL}/uploads/zip`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Upload failed (${res.status}): ${errorText}`);
  }

  return res.json();
}

/**
 * 4. 특정 배치의 학생 제출물 및 파싱 상태 목록 조회
 */
export async function fetchBatchFiles(batchId: string): Promise<SubmissionFileItem[]> {
  const res = await fetch(`${API_BASE_URL}/uploads/batch/${batchId}/files`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch batch files (${res.status})`);
  }

  return res.json();
}

/**
 * 5. 특정 파일의 경량화 파싱된 텍스트 및 로컬 저장 정보 조회
 */
export async function fetchParsedText(fileId: string): Promise<ParsedFileDetail> {
  const res = await fetch(`${API_BASE_URL}/uploads/files/${fileId}/parsed`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch parsed text (${res.status})`);
  }

  return res.json();
}

/**
 * 6. 단일 PDF 실시간 경량화 파서 테스트
 */
export async function parseSinglePdf(pdfFile: File): Promise<PDFLightweightResult> {
  const formData = new FormData();
  formData.append('file', pdfFile);

  const res = await fetch(`${API_BASE_URL}/uploads/pdf/lightweight`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`PDF parsing failed (${res.status}): ${errorText}`);
  }

  return res.json();
}

/**
 * 7. 신규 과제 배치 생성
 */
export async function createBatch(payload: {
  course_code: string;
  course_title: string;
  assignment_title: string;
}): Promise<BatchItem> {
  const res = await fetch(`${API_BASE_URL}/batches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Batch creation failed (${res.status}): ${errorText}`);
  }

  return res.json();
}

/**
 * 8. 특정 과제 배치 상세 조회
 */
export async function fetchBatchById(batchId: string): Promise<BatchItem> {
  const res = await fetch(`${API_BASE_URL}/batches/${batchId}`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch batch (${res.status})`);
  }

  return res.json();
}

/**
 * 9. 과제 배치 삭제
 */
export async function deleteBatch(batchId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/batches/${batchId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error(`Failed to delete batch (${res.status})`);
  }
}

export interface RubricCriterionItem {
  id?: string;
  criterion_number: number;
  title: string;
  description: string;
  category: string;
  max_score: number;
  scoring_guideline?: string;
  consistency_rate?: number;
  verdict_stability?: string;
  ambiguity_reason?: string;
  clarified_rule_suggestion?: string;
  is_clarified?: boolean;
}

export interface RubricDetailResponse {
  id: string;
  batch_id: string;
  assignment_title?: string;
  raw_text: string;
  is_validated: boolean;
  determinism_rate: number;
  total_points: number;
  criteria: RubricCriterionItem[];
  created_at: string;
}

/**
 * 10. Claude API를 통해 자유 서식 루브릭을 1~10점 척도 체크리스트로 구조화
 */
export async function parseRubricWithClaude(payload: {
  batch_id?: string;
  assignment_title?: string;
  course_code?: string;
  raw_rubric_text: string;
}): Promise<RubricDetailResponse> {
  const res = await fetch(`${API_BASE_URL}/rubrics/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Rubric parsing failed (${res.status}): ${errorText}`);
  }

  return res.json();
}

/**
 * 11. 특정 배치의 루브릭 체크리스트 조회
 */
export async function fetchRubricByBatch(batchId: string): Promise<RubricDetailResponse> {
  const res = await fetch(`${API_BASE_URL}/rubrics/batch/${batchId}`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch rubric (${res.status})`);
  }

  return res.json();
}

/**
 * 12. 배치의 모든 학생 과제에 대해 비동기 AI 채점 요청
 */
export async function startBatchGrading(payload: {
  batch_id: string;
  assignment_title?: string;
  criteria?: RubricCriterionItem[];
  concurrency?: number;
}): Promise<GenericApiResponse<{ batch_id: string; status: string }>> {
  const res = await fetch(`${API_BASE_URL}/gradings/batch/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Grading request failed (${res.status}): ${errorText}`);
  }

  return res.json();
}

/**
 * 13. 해당 과제 전체에 대해 사람이 채점 최종 확정 (상태 4: Completed)
 */
export async function finalizeBatchGrading(
  batchId: string
): Promise<GenericApiResponse<{ batch_id: string; status: string }>> {
  const res = await fetch(`${API_BASE_URL}/gradings/batch/${batchId}/finalize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Finalizing batch failed (${res.status}): ${errorText}`);
  }

  return res.json();
}

export interface CriterionGradeItem {
  id?: string;
  criterion_id: string;
  criterion_number: number;
  title: string;
  description: string;
  status: 'MET' | 'PARTIALLY_MET' | 'NOT_MET';
  assigned_score: number;
  max_score: number;
  evidence_quote: string;
  rationale: string;
  ta_notes?: string;
  is_custom_adjusted?: boolean;
}

export interface StudentGradingDetail {
  id: string;
  submission_id: string;
  student_name: string;
  student_id: string;
  file_name: string;
  total_score: number;
  max_possible_score: number;
  confidence_level: 'HIGH' | 'LOW_TA_REVIEW' | string;
  confidence_percent: number;
  is_ta_reviewed: boolean;
  overall_feedback?: string;
  ta_override_notes?: string;
  criteria_grades: CriterionGradeItem[];
  evaluated_at: string;
}

/**
 * 14. 특정 학생 과제의 채점 결과, 루브릭 기준별 점수 및 원문 인용문 조회
 */
export async function fetchStudentGrading(submissionId: string): Promise<StudentGradingDetail> {
  const res = await fetch(`${API_BASE_URL}/gradings/student/${submissionId}`, {
    method: 'GET',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch student grading (${res.status}): ${errorText}`);
  }

  return res.json();
}

/**
 * 15. 조교(TA)의 특정 기준 점수 및 메모 수동 수정 (DB 동기화)
 */
export async function updateCriterionScore(
  gradingId: string,
  criterionId: string,
  payload: {
    status: 'MET' | 'PARTIALLY_MET' | 'NOT_MET';
    assigned_score: number;
    ta_notes?: string;
  }
): Promise<GenericApiResponse<CriterionGradeItem>> {
  const res = await fetch(`${API_BASE_URL}/gradings/${gradingId}/criteria/${criterionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update score (${res.status}): ${errorText}`);
  }

  return res.json();
}

export interface ConfidenceQueueItem {
  id: string;
  grading_id?: string | null;
  submission_id: string;
  student_id: string;
  student_name: string;
  file_name: string;
  file_size: string;
  suggested_score: number;
  max_score: number;
  confidence: number;
  review_priority: 'High' | 'Medium' | 'Low';
  status: 'AI Confident' | 'TA Review Needed' | 'Approved' | 'Pending Grading';
  ai_explanation: string;
  cited_evidence_code: string;
  reasons_for_uncertainty: string[];
  suggested_action: string;
  submitted_at: string;
  is_ta_reviewed: boolean;
}

export interface ConfidenceQueueResponse {
  batch_id: string;
  course_code: string;
  assignment_title: string;
  total_submissions: number;
  graded_submissions: number;
  low_confidence_count: number;
  confident_count: number;
  approved_count: number;
  average_score: number;
  status: string;
  items: ConfidenceQueueItem[];
}

/**
 * 16. Step 4: 특정 배치의 AI 신뢰도 점수 및 검토 큐 목록 조회
 */
export async function fetchBatchConfidenceQueue(batchId: string): Promise<ConfidenceQueueResponse> {
  const res = await fetch(`${API_BASE_URL}/gradings/batch/${batchId}/queue`, {
    method: 'GET',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch confidence queue (${res.status}): ${errorText}`);
  }

  return res.json();
}

/**
 * 17. 특정 학생 채점 결과 즉시 승인(Quick Approve)
 */
export async function approveStudentGrading(
  gradingId: string
): Promise<GenericApiResponse<{ grading_id: string; is_ta_reviewed: boolean }>> {
  const res = await fetch(`${API_BASE_URL}/gradings/${gradingId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to approve grading (${res.status}): ${errorText}`);
  }

  return res.json();
}

/**
 * 18. 성적표 CSV 다운로드 URL 생성
 */
export function getBatchCsvExportUrl(batchId: string): string {
  return `${API_BASE_URL}/gradings/batch/${batchId}/export/csv`;
}



/**
 * 19. 배치 내 High-Confidence 항목 일괄 자동 채점 확정
 */
export async function autoApproveHighConfidence(
  batchId: string
): Promise<GenericApiResponse<{ batch_id: string; approved_count: number }>> {
  const res = await fetch(`${API_BASE_URL}/gradings/batch/${batchId}/auto-approve-high-confidence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Auto-approving high confidence failed (${res.status}): ${errorText}`);
  }

  return res.json();
}
