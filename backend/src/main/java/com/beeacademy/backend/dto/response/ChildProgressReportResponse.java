package com.beeacademy.backend.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ChildProgressReportResponse(
        UUID studentId,
        String studentName,
        String gradeLabel,
        Instant generatedAt,
        boolean detailAccessAllowed,
        boolean sensitiveDataMasked,
        String detailAccessReason,
        WeeklySummary weeklySummary,
        List<CourseProgressItem> courses,
        List<AssessmentRecord> assessments
) {
    public record WeeklySummary(
            String progressTrend,
            Double averageScore,
            Integer completedAssessments,
            Integer incompleteCourses,
            Integer inactiveDays,
            String actionSuggestion
    ) {}

    public record CourseProgressItem(
            UUID courseId,
            UUID courseVersionId,
            String courseTitle,
            String teacherName,
            String status,
            Integer progressPct,
            Instant enrolledAt,
            List<Integer> grades,
            Integer quizCompletedCount,
            Integer quizTotalCount,
            Double averageQuizScore,
            Double latestQuizScore,
            Double latestExamScore,
            Double latestAssignmentScore,
            List<RequiredExamResult> requiredExams
    ) {}

    public record RequiredExamResult(
            Integer slotIndex,
            String label,
            String status,
            UUID examConfigId,
            Double scorePercent,
            Double normalizedScore,
            Boolean passed,
            Instant submittedAt
    ) {}

    public record AssessmentRecord(
            String id,
            UUID courseId,
            String courseTitle,
            String courseStatus,
            String assessmentName,
            String assessmentType,
            String chapterTitle,
            Double rawScore,
            Double maxScore,
            Double normalizedScore,
            String feedback,
            Instant submittedAt
    ) {}
}
