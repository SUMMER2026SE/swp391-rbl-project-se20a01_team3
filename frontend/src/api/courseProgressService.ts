import { apiClient, unwrap } from './client';
import type {
  ApiResponse,
  CompleteCourseProgressItemPayload,
  CourseProgress,
} from '../types/api';

export async function getCourseProgress(courseId: string): Promise<CourseProgress> {
  const res = await apiClient.get<ApiResponse<CourseProgress>>(
    `/api/courses/${encodeURIComponent(courseId)}/progress`,
  );
  return unwrap(res.data);
}

export async function completeCourseProgressItem(
  courseId: string,
  payload: CompleteCourseProgressItemPayload,
): Promise<CourseProgress> {
  const res = await apiClient.post<ApiResponse<CourseProgress>>(
    `/api/courses/${encodeURIComponent(courseId)}/progress/complete`,
    payload,
  );
  return unwrap(res.data);
}
