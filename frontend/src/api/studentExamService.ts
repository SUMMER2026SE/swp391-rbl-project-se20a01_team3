import { apiClient, unwrap } from './client';
import type { ApiResponse } from '../types/api';

export type StudentExamQuestionType = 'single' | 'multiple' | 'essay';
export type StudentExamDifficulty = 'easy' | 'medium' | 'hard';

export interface StudentExamQuestion {
  id: string;
  text: string;
  type: StudentExamQuestionType;
  options: string[];
  points: number | null;
  difficulty: StudentExamDifficulty | null;
}

export interface StudentExam {
  id: string;
  courseId: string;
  slotIndex: number;
  scopeStartChapterId: string | null;
  scopeStartChapterTitle: string | null;
  placementChapterId: string | null;
  placementChapterTitle: string | null;
  name: string;
  description: string | null;
  durationMinutes: number;
  passScorePercent: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  questionCount: number;
  totalPoints: number;
  questions: StudentExamQuestion[];
  updatedAt: string;
}

export interface SubmitExamAnswer {
  selectedIndices?: number[];
  textAnswer?: string;
  imageUrls?: string[];
}

export interface StudentExamAnswerImageUpload {
  url: string;
  name: string;
  type: string;
  sizeBytes: number;
}

export interface StudentExamSubmissionResponse {
  attemptId: string;
  examId: string;
  examName: string;
  slotIndex: number;
  attemptNumber: number;
  autoScorePercent: number;
  passed: boolean | null;
  status: 'pending' | 'graded';
  correctObjectiveCount: number;
  totalObjectiveCount: number;
  submittedAt: string;
}

export async function listStudentExams(courseId: string): Promise<StudentExam[]> {
  const res = await apiClient.get<ApiResponse<StudentExam[]>>(
    `/api/student/courses/${encodeURIComponent(courseId)}/exams`,
  );
  return unwrap(res.data);
}

export async function submitStudentExam(
  courseId: string,
  slotIndex: number,
  answers: Record<string, SubmitExamAnswer>,
): Promise<StudentExamSubmissionResponse> {
  const res = await apiClient.post<ApiResponse<StudentExamSubmissionResponse>>(
    `/api/student/courses/${encodeURIComponent(courseId)}/exams/${slotIndex}/submit`,
    { answers },
  );
  return unwrap(res.data);
}

export async function uploadStudentExamAnswerImage(
  _courseId: string,
  file: File,
): Promise<StudentExamAnswerImageUpload> {
  const form = new FormData();
  form.append('file', file);
  const res = await apiClient.post<ApiResponse<{
    publicUrl: string;
    fileType: string;
    fileSizeBytes: number;
  }>>(
    '/api/qa/attachments',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  const uploaded = unwrap(res.data);
  return {
    url: uploaded.publicUrl,
    name: file.name,
    type: uploaded.fileType,
    sizeBytes: uploaded.fileSizeBytes,
  };
}

export async function getStudentExam(
  courseId: string,
  slotIndex: number,
): Promise<StudentExam> {
  const res = await apiClient.get<ApiResponse<StudentExam>>(
    `/api/student/courses/${encodeURIComponent(courseId)}/exams/${slotIndex}`,
  );
  return unwrap(res.data);
}
