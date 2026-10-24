export interface BatchFolder {
  id: string;
  courseCode: string;
  courseName: string;
  assignmentTitle: string;
  semester: string;
  totalStudents: number;
  gradedStudents: number;
  lowConfidenceCount: number;
  consistencyScore: number;
  lastUpdated: string;
  status: 'in_progress' | 'ready_to_grade' | 'completed';
  leadTA: string;
  fileCount: number;
  zipFileName: string;
}

export const MOCK_BATCH_FOLDERS: BatchFolder[] = [
  {
    id: 'batch-cs229-hw3',
    courseCode: 'CS 229',
    courseName: 'Machine Learning',
    assignmentTitle: 'Homework 3: Model Evaluation & Churn Prediction',
    semester: 'Fall 2024',
    totalStudents: 500,
    gradedStudents: 370,
    lowConfidenceCount: 12,
    consistencyScore: 92,
    lastUpdated: '10 mins ago',
    status: 'in_progress',
    leadTA: 'Alex Kim',
    fileCount: 500,
    zipFileName: 'cs229_hw3_submissions_batch_v1.zip',
  },
  {
    id: 'batch-cs106a-a4',
    courseCode: 'CS 106A',
    courseName: 'Programming Methodologies',
    assignmentTitle: 'Assignment 4: Breakout & OOP Implementation',
    semester: 'Fall 2024',
    totalStudents: 320,
    gradedStudents: 144,
    lowConfidenceCount: 8,
    consistencyScore: 95,
    lastUpdated: '2 hours ago',
    status: 'in_progress',
    leadTA: 'Sarah Miller',
    fileCount: 320,
    zipFileName: 'cs106a_breakout_batch.zip',
  },
  {
    id: 'batch-ds301-proj2',
    courseCode: 'DS 301',
    courseName: 'Data Mining & Big Data',
    assignmentTitle: 'Project 2: Clustering & High-dimensional Embeddings',
    semester: 'Fall 2024',
    totalStudents: 185,
    gradedStudents: 185,
    lowConfidenceCount: 0,
    consistencyScore: 98,
    lastUpdated: 'Yesterday',
    status: 'completed',
    leadTA: 'Prof. Jane Doe',
    fileCount: 185,
    zipFileName: 'ds301_project2_final.zip',
  },
  {
    id: 'batch-ai502-hw1',
    courseCode: 'AI 502',
    courseName: 'Deep Learning Systems',
    assignmentTitle: 'Homework 1: Custom Autograd Engine & MLP',
    semester: 'Fall 2024',
    totalStudents: 120,
    gradedStudents: 0,
    lowConfidenceCount: 0,
    consistencyScore: 89,
    lastUpdated: '3 days ago',
    status: 'ready_to_grade',
    leadTA: 'David Chen',
    fileCount: 120,
    zipFileName: 'ai502_autograd_batch.zip',
  },
];
