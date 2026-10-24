export interface SubmissionQueueItem {
  id: string;
  studentId: string;
  fileName: string;
  suggestedScore: number;
  maxScore: number;
  confidence: number; // percentage, e.g. 42
  reviewPriority: 'High' | 'Medium' | 'Low';
  status: 'AI Confident' | 'TA Review Needed' | 'Random Audit';
  aiExplanation: string;
  citedEvidenceCode: string;
  reasonsForUncertainty: string[];
  suggestedAction: string;
  submittedAt: string;
  fileSize: string;
}

export const MOCK_SUBMISSION_QUEUE: SubmissionQueueItem[] = [
  {
    id: 'sub_001',
    studentId: 'student_001',
    fileName: 'student_001.ipynb',
    suggestedScore: 92,
    maxScore: 100,
    confidence: 96,
    reviewPriority: 'Low',
    status: 'AI Confident',
    aiExplanation:
      'All rubric criteria are thoroughly satisfied with clear experimental benchmarks, cross-validation, and well-structured discussion of limitations.',
    citedEvidenceCode: `15  # Cross validation setup
16  cv_scores = cross_val_score(model, X_train, y_train, cv=5)
17  print(f"Mean CV Accuracy: {cv_scores.mean():.4f}")`,
    reasonsForUncertainty: [],
    suggestedAction: 'No action required. Meets all rubric benchmarks with high determinism.',
    submittedAt: 'Oct 15, 2024, 2:14 PM',
    fileSize: '245 KB',
  },
  {
    id: 'sub_002',
    studentId: 'student_002',
    fileName: 'student_002.ipynb',
    suggestedScore: 88,
    maxScore: 100,
    confidence: 92,
    reviewPriority: 'Low',
    status: 'AI Confident',
    aiExplanation:
      'Model implementation and evaluation metrics adhere to syllabus guidelines. Minor formatting discrepancy in confusion matrix visual.',
    citedEvidenceCode: `28  sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
29  plt.title("Confusion Matrix on Test Dataset")
30  plt.show()`,
    reasonsForUncertainty: [],
    suggestedAction: 'Ready for bulk grade release.',
    submittedAt: 'Oct 15, 2024, 2:13 PM',
    fileSize: '312 KB',
  },
  {
    id: 'sub_003',
    studentId: 'student_003',
    fileName: 'student_003.ipynb',
    suggestedScore: 67,
    maxScore: 100,
    confidence: 42,
    reviewPriority: 'High',
    status: 'TA Review Needed',
    aiExplanation:
      'The submission implements parts of the required analysis, BUT there are inconsistencies in the results and missing components. The AI model is uncertain about whether the approach fully satisfies the rubric requirements.',
    citedEvidenceCode: `12  # Calculate accuracy
13  accuracy = correct / total
14  print("Accuracy:", accuracy)
15  
16  # TODO: Implement cross-validation`,
    reasonsForUncertainty: [
      'Missing required cross-validation step (rubric item 3)',
      'Unclear if results are computed on test set vs. training set',
      'Output format does not match rubric specification',
    ],
    suggestedAction:
      'Review the implementation and clarify whether the missing components are addressed. Adjust the score if needed.',
    submittedAt: 'Oct 15, 2024, 2:13 PM',
    fileSize: '312 KB',
  },
  {
    id: 'sub_004',
    studentId: 'student_004',
    fileName: 'student_004.ipynb',
    suggestedScore: 85,
    maxScore: 100,
    confidence: 78,
    reviewPriority: 'Medium',
    status: 'TA Review Needed',
    aiExplanation:
      'The student used a custom loss function without providing mathematical justification in the written report.',
    citedEvidenceCode: `45  def custom_loss(y_true, y_pred):
46      return torch.mean(torch.abs(y_true - y_pred) ** 1.5)`,
    reasonsForUncertainty: [
      'Lacks mathematical proof for power 1.5 exponent',
      'Minor divergence in expected convergence behavior',
    ],
    suggestedAction: 'Verify whether the TA accepts non-standard loss without deduction.',
    submittedAt: 'Oct 15, 2024, 2:12 PM',
    fileSize: '356 KB',
  },
  {
    id: 'sub_005',
    studentId: 'student_005',
    fileName: 'student_005.ipynb',
    suggestedScore: 74,
    maxScore: 100,
    confidence: 38,
    reviewPriority: 'High',
    status: 'TA Review Needed',
    aiExplanation:
      'Possible data leakage: student applied StandardScaler before train/test split. High probability of artificial score inflation.',
    citedEvidenceCode: `8   # Data scaling applied to full dataframe
9   scaler = StandardScaler()
10  X_scaled = scaler.fit_transform(df.drop('target', axis=1))
11  X_train, X_test, y_train, y_test = train_test_split(X_scaled, y)`,
    reasonsForUncertainty: [
      'Data leakage detected on line 10',
      'Test accuracy may be artificially elevated by ~4%',
      'Rubric clause 3.2 specifies strict pre-processing isolation',
    ],
    suggestedAction: 'Apply 10-point penalty for preprocessing leakage per rubric clause 3.2.',
    submittedAt: 'Oct 15, 2024, 2:11 PM',
    fileSize: '280 KB',
  },
  {
    id: 'sub_006',
    studentId: 'student_006',
    fileName: 'student_006.ipynb',
    suggestedScore: 90,
    maxScore: 100,
    confidence: 94,
    reviewPriority: 'Low',
    status: 'AI Confident',
    aiExplanation:
      'Clean modular implementation with comprehensive ROC-AUC and F1-score evaluation tables.',
    citedEvidenceCode: `52  print(classification_report(y_test, y_pred, digits=4))`,
    reasonsForUncertainty: [],
    suggestedAction: 'Ready to approve.',
    submittedAt: 'Oct 15, 2024, 2:10 PM',
    fileSize: '310 KB',
  },
  {
    id: 'sub_007',
    studentId: 'student_007',
    fileName: 'student_007.ipynb',
    suggestedScore: 78,
    maxScore: 100,
    confidence: 65,
    reviewPriority: 'Medium',
    status: 'TA Review Needed',
    aiExplanation:
      'Report conclusion is under the 250-word requirement and fails to cite 2 required peer-reviewed references.',
    citedEvidenceCode: `89  # Conclusion
90  In conclusion, the random forest performed best. It worked well.`,
    reasonsForUncertainty: [
      'Word count 42 words vs required 250 words',
      'Missing literature citations in Section 5',
    ],
    suggestedAction: 'Deduct 5 points under Rubric Criterion 5 (Conclusion & Depth).',
    submittedAt: 'Oct 15, 2024, 2:09 PM',
    fileSize: '190 KB',
  },
  {
    id: 'sub_008',
    studentId: 'student_008',
    fileName: 'student_008.ipynb',
    suggestedScore: 83,
    maxScore: 100,
    confidence: 87,
    reviewPriority: 'Low',
    status: 'Random Audit',
    aiExplanation:
      'Selected as part of the 5% random sampling cohort to verify AI scoring consistency across typical mid-range submissions.',
    citedEvidenceCode: `34  model = LogisticRegression(C=0.1, max_iter=1000)
35  model.fit(X_train, y_train)`,
    reasonsForUncertainty: [],
    suggestedAction: 'Quick 30-second audit of hyperparameter choice.',
    submittedAt: 'Oct 15, 2024, 2:08 PM',
    fileSize: '220 KB',
  },
  {
    id: 'sub_009',
    studentId: 'student_009',
    fileName: 'student_009.ipynb',
    suggestedScore: 95,
    maxScore: 100,
    confidence: 94,
    reviewPriority: 'Low',
    status: 'AI Confident',
    aiExplanation:
      'Exemplary submission with thorough hyperparameter search and ablation study diagrams.',
    citedEvidenceCode: `66  grid_search = GridSearchCV(estimator=rf, param_grid=param_grid, cv=5)`,
    reasonsForUncertainty: [],
    suggestedAction: 'Ready to approve.',
    submittedAt: 'Oct 15, 2024, 2:05 PM',
    fileSize: '410 KB',
  },
  {
    id: 'sub_010',
    studentId: 'student_010',
    fileName: 'student_010.ipynb',
    suggestedScore: 68,
    maxScore: 100,
    confidence: 49,
    reviewPriority: 'Medium',
    status: 'TA Review Needed',
    aiExplanation:
      'Training loop failed to converge before max iterations. Unclear if student submitted early checkpoint or unfinished code.',
    citedEvidenceCode: `104 ConvergenceWarning: lbfgs failed to converge (status=1): STOP: TOTAL NO. of ITERATIONS REACHED LIMIT.`,
    reasonsForUncertainty: [
      'Optimization failed to converge',
      'Test accuracy plateaued at 54% (near random chance)',
    ],
    suggestedAction: 'Check if student acknowledged convergence issue in discussion.',
    submittedAt: 'Oct 15, 2024, 2:01 PM',
    fileSize: '275 KB',
  },
];
