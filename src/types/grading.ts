export type GradingStatus = 'MET' | 'NOT_MET';
export type ConfidenceLevel = 'HIGH' | 'LOW_TA_REVIEW' | 'MEDIUM';

export interface RubricEvidence {
  id: string;
  criterionTitle: string;
  category: string;
  maxScore: number;
  assignedScore: number;
  status: GradingStatus;
  confidence: ConfidenceLevel;
  confidencePercent: number;
  evidenceQuote: string;
  evidenceExplanation: string;
  aiRationale: string;
  deductionReason?: string;
  penaltyPoints: number;
  highlightVariant: 'yellow' | 'blue' | 'purple' | 'emerald';
  taReviewed: boolean;
  taFeedbackNotes?: string;
}

export interface StudentEssaySection {
  id: string;
  heading?: string;
  content: string;
}

export interface StudentSubmission {
  id: string;
  studentName: string;
  studentId: string;
  avatarUrl?: string;
  courseCode: string;
  courseTitle: string;
  assignmentTitle: string;
  submissionDate: string;
  turnaroundEstimate: string;
  plagiarismIndex: number; // e.g. 0.4%
  wordCount: number;
  paperTitle: string;
  paperAbstract: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'APPEAL_FLAGGED';
}

export interface ConsistencyHealthMetrics {
  overallScore: number; // e.g. 92%
  benchmarkRating: 'Excellent' | 'Needs Clarification' | 'Critical Variance';
  flaggedCriterion: string;
  sampleRunsTested: number;
  discrepancyCount: number;
  aiDiagnosticMessage: string;
  actionableSuggestion: string;
  varianceStandardDev: number;
}
