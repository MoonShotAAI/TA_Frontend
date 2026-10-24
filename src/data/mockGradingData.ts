import { ConsistencyHealthMetrics, RubricEvidence, StudentSubmission } from '@/types/grading';

export const mockConsistencyHealth: ConsistencyHealthMetrics = {
  overallScore: 92,
  benchmarkRating: 'Excellent',
  flaggedCriterion: 'Logical Flow & Scientific Reasoning',
  sampleRunsTested: 10,
  discrepancyCount: 3,
  aiDiagnosticMessage:
    "Checklist criteria are clear. However, the 'Logical Flow' criterion caused low-confidence in 3 sample runs. Consider clarifying the penalty rules.",
  actionableSuggestion:
    "Add explicit thresholds for 'transition statements between exploratory findings and model choices' to reduce ambiguity from ±1.5 pts to <0.2 pts across grading rounds.",
  varianceStandardDev: 0.18,
};

export const mockStudentSubmission: StudentSubmission = {
  id: 'sub_2026_cs402_042',
  studentName: 'Min-jun Kim',
  studentId: '2021312894',
  courseCode: 'CS402',
  courseTitle: 'Data Mining & Machine Learning',
  assignmentTitle: 'Assignment 2: Predictive Modeling for Customer Retention',
  submissionDate: 'Oct 12, 2026 · 23:41 (On-time)',
  turnaroundEstimate: 'AI Evaluated in 1.4s · Ready for TA Sign-off',
  plagiarismIndex: 0.4,
  wordCount: 1420,
  paperTitle: 'Predictive Modeling on Telecommunication Churn: Model Evaluation & Hyperparameter Optimization',
  paperAbstract:
    'In this empirical study, we evaluate customer behavior across 7,043 telecommunication subscriber records. We examine feature normalization strategies, formulate predictive classifiers to isolate churn risk indicators, and review validation loss metrics to justify automated retention campaigns.',
  status: 'PENDING_REVIEW',
};

export const initialRubricItems: RubricEvidence[] = [
  {
    id: 'rubric_1',
    criterionTitle: 'Model Formulation & Algorithmic Selection',
    category: 'Methodology & Modeling',
    maxScore: 10,
    assignedScore: 0,
    status: 'NOT_MET',
    confidence: 'HIGH',
    confidencePercent: 96,
    evidenceQuote:
      'To predict customer churn status, we utilized an ordinary linear regression model with standard ordinary least squares estimator, mapping the continuous output to a binary threshold of 0.5.',
    evidenceExplanation:
      'Evidence: The student used linear regression instead of logistic regression, random forests, or gradient boosted trees for a discrete binary churn classification problem.',
    aiRationale:
      'Violates assignment specification Section 3.1: "Binary target variables (Churn = 0/1) must be modeled using probabilistic classification techniques (e.g., Logistic Regression, SVM, XGBoost) rather than unconstrained continuous estimators like standard OLS linear regression which yields uncalibrated probabilities outside [0, 1]."',
    deductionReason: 'Linear regression applied to discrete binary target without log-odds transformation.',
    penaltyPoints: 10,
    highlightVariant: 'yellow',
    taReviewed: false,
    taFeedbackNotes: '',
  },
  {
    id: 'rubric_2',
    criterionTitle: 'Train / Validation / Test Split Integrity & Reporting',
    category: 'Evaluation Protocol',
    maxScore: 10,
    assignedScore: 0,
    status: 'NOT_MET',
    confidence: 'LOW_TA_REVIEW',
    confidencePercent: 64,
    evidenceQuote:
      'Model accuracy reached 89.4% on training data, but evaluation on validation set was not reported due to computational constraints during cross-fold iterations.',
    evidenceExplanation:
      'Evidence: Training score is documented, but explicit held-out validation metric curves or test set metrics are omitted in Table 2.',
    aiRationale:
      'The rubric requires complete validation metrics. Because held-out reporting was omitted, criterion is marked Not Met (0/10 pts). TA review recommended to verify raw script logs in Appendix.',
    deductionReason: 'Missing formal held-out validation / test set performance metrics table.',
    penaltyPoints: 10,
    highlightVariant: 'blue',
    taReviewed: false,
    taFeedbackNotes: '',
  },
  {
    id: 'rubric_3',
    criterionTitle: 'Feature Preprocessing & Normalization',
    category: 'Data Preparation',
    maxScore: 10,
    assignedScore: 10,
    status: 'MET',
    confidence: 'HIGH',
    confidencePercent: 98,
    evidenceQuote:
      'The dataset was normalized using Z-score standardization across all numeric features (monthly charges, total tenure, and roaming minutes) strictly fitted on training splits to prevent data leakage.',
    evidenceExplanation:
      'Evidence: Clear statement of Z-score standardization strictly fitted on train folds.',
    aiRationale:
      'Full compliance with Section 2.2. Data hygiene correctly prevents training-to-validation data contamination.',
    penaltyPoints: 0,
    highlightVariant: 'emerald',
    taReviewed: true,
    taFeedbackNotes: 'Exemplary explanation of train-leakage mitigation.',
  },
  {
    id: 'rubric_4',
    criterionTitle: 'Logical Flow & Scientific Reasoning',
    category: 'Synthesis & Argumentation',
    maxScore: 10,
    assignedScore: 10,
    status: 'MET',
    confidence: 'HIGH',
    confidencePercent: 91,
    evidenceQuote:
      'Based on the variable importance weights showing fiber-optic contract length and electronic billing as top positive coefficients, we conclude that contract inflexibility constitutes the primary driver of customer drop-off.',
    evidenceExplanation:
      'Evidence: Explanations sequentially link exploratory coefficient findings directly to customer behavioral conclusions.',
    aiRationale:
      'Sound inductive argument structure connecting quantitative coefficients to operational recommendations.',
    penaltyPoints: 0,
    highlightVariant: 'purple',
    taReviewed: false,
    taFeedbackNotes: '',
  },
];

export const mockEssayParagraphs = [
  {
    id: 'p1',
    sectionNumber: '1. Introduction & Problem Scope',
    text: `Customer churn represents one of the most critical operational risks for modern telecommunication operators, directly impacting annual recurrent revenue and customer lifetime value (CLV). In this assignment, our primary objective is to formulate an automated predictive pipeline on the telco churn dataset to detect early indicators of customer attrition before contract termination occurs. We begin by cleaning the raw records, filtering null values in senior citizen indicators, and inspecting feature variance.`,
    highlights: [],
  },
  {
    id: 'p2',
    sectionNumber: '2. Data Preprocessing & Leakage Control',
    text: `Before executing model training routines, feature scaling was conducted to avoid gradient instability and coefficient bias across high-magnitude columns. The dataset was normalized using Z-score standardization across all numeric features (monthly charges, total tenure, and roaming minutes) strictly fitted on training splits to prevent data leakage. Categorical predictors including payment method, streaming services, and contract type were encoded using one-hot indicators with dummy drop to prevent multi-collinearity.`,
    highlights: [
      {
        rubricId: 'rubric_3',
        quote:
          'The dataset was normalized using Z-score standardization across all numeric features (monthly charges, total tenure, and roaming minutes) strictly fitted on training splits to prevent data leakage.',
        variant: 'emerald',
      },
    ],
  },
  {
    id: 'p3',
    sectionNumber: '3. Predictive Modeling Architecture',
    text: `With preprocessed tensors prepared, we initialized our primary estimator. To predict customer churn status, we utilized an ordinary linear regression model with standard ordinary least squares estimator, mapping the continuous output to a binary threshold of 0.5. Although tree ensembles were considered, the linear formulation was chosen for its interpretable weights across individual feature dimensions.`,
    highlights: [
      {
        rubricId: 'rubric_1',
        quote:
          'To predict customer churn status, we utilized an ordinary linear regression model with standard ordinary least squares estimator, mapping the continuous output to a binary threshold of 0.5.',
        variant: 'yellow',
      },
    ],
  },
  {
    id: 'p4',
    sectionNumber: '4. Empirical Validation & Results',
    text: `We configured stratified k-fold splits across the cohort. Model accuracy reached 89.4% on training data, but evaluation on validation set was not reported due to computational constraints during cross-fold iterations. Confusion matrices for the training samples indicated low false negatives for short-term month-to-month contracts, though borderline subscribers near the 0.5 probability threshold displayed sensitivity to minor feature shifts.`,
    highlights: [
      {
        rubricId: 'rubric_2',
        quote:
          'Model accuracy reached 89.4% on training data, but evaluation on validation set was not reported due to computational constraints during cross-fold iterations.',
        variant: 'blue',
      },
    ],
  },
  {
    id: 'p5',
    sectionNumber: '5. Business Implications & Discussion',
    text: `Based on the variable importance weights showing fiber-optic contract length and electronic billing as top positive coefficients, we conclude that contract inflexibility constitutes the primary driver of customer drop-off. We advise the retention team to introduce flexible bi-annual incentive plans and streamline account cancellation procedures to retain high-risk consumer cohorts.`,
    highlights: [
      {
        rubricId: 'rubric_4',
        quote:
          'Based on the variable importance weights showing fiber-optic contract length and electronic billing as top positive coefficients, we conclude that contract inflexibility constitutes the primary driver of customer drop-off.',
        variant: 'purple',
      },
    ],
  },
];
