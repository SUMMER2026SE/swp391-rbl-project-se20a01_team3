package com.beeacademy.backend.service;

import com.beeacademy.backend.dto.request.CompleteCourseProgressItemRequest;
import com.beeacademy.backend.dto.response.CourseProgressResponse;
import com.beeacademy.backend.exception.BusinessException;
import com.beeacademy.backend.exception.ResourceNotFoundException;
import com.beeacademy.backend.model.CourseProgressItem;
import com.beeacademy.backend.model.Enrollment;
import com.beeacademy.backend.repository.CourseProgressItemRepository;
import com.beeacademy.backend.repository.CourseRepository;
import com.beeacademy.backend.repository.EnrollmentRepository;
import com.beeacademy.backend.repository.LessonRepository;
import com.beeacademy.backend.repository.QuizConfigRepository;
import com.beeacademy.backend.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseProgressService {

    private static final String ITEM_LESSON = "lesson";
    private static final String ITEM_QUIZ = "quiz";

    private final CourseProgressItemRepository progressRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final QuizConfigRepository quizConfigRepository;

    @Transactional(readOnly = true)
    public CourseProgressResponse getProgress(UUID courseId, AuthenticatedUser me) {
        requireEnrolled(me.userId(), courseId);
        return buildResponse(me.userId(), courseId);
    }

    @Transactional
    public CourseProgressResponse completeItem(
            UUID courseId,
            AuthenticatedUser me,
            CompleteCourseProgressItemRequest request
    ) {
        requireEnrolled(me.userId(), courseId);
        validateItemBelongsToCourse(courseId, request.itemId(), request.itemType());

        boolean exists = progressRepository.existsByStudentIdAndCourseIdAndItemIdAndItemType(
                me.userId(), courseId, request.itemId(), request.itemType()
        );
        if (!exists) {
            progressRepository.save(CourseProgressItem.create(
                    me.userId(), courseId, request.itemId(), request.itemType()
            ));
        }

        int progressPct = calculateProgressPct(me.userId(), courseId);
        enrollmentRepository.findByStudentIdAndCourseId(me.userId(), courseId)
                .ifPresent(enrollment -> enrollment.updateProgress(progressPct));

        return buildResponse(me.userId(), courseId);
    }

    public Map<UUID, Integer> calculateProgressForCourses(UUID studentId, List<UUID> courseIds) {
        if (courseIds == null || courseIds.isEmpty()) return Map.of();

        Map<UUID, Long> completedByCourse = progressRepository
                .countCompletedByStudentAndCourseIds(studentId, courseIds)
                .stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> (Long) row[1]
                ));

        Map<UUID, Long> totalByCourse = courseRepository.countProgressItemsByCourseIds(courseIds)
                .stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> (Long) row[1]
                ));

        return courseIds.stream().collect(Collectors.toMap(
                courseId -> courseId,
                courseId -> {
                    long total = Math.max(totalByCourse.getOrDefault(courseId, 0L), 0L);
                    if (total == 0) return 0;
                    long completed = Math.min(completedByCourse.getOrDefault(courseId, 0L), total);
                    return (int) Math.round((completed * 100.0) / total);
                }
        ));
    }

    private CourseProgressResponse buildResponse(UUID studentId, UUID courseId) {
        List<CourseProgressItem> items = progressRepository.findByStudentIdAndCourseId(studentId, courseId);
        List<UUID> lessonIds = items.stream()
                .filter(item -> ITEM_LESSON.equals(item.getItemType()))
                .map(CourseProgressItem::getItemId)
                .toList();
        List<UUID> quizIds = items.stream()
                .filter(item -> ITEM_QUIZ.equals(item.getItemType()))
                .map(CourseProgressItem::getItemId)
                .toList();
        return new CourseProgressResponse(courseId, calculateProgressPct(studentId, courseId), lessonIds, quizIds);
    }

    private void requireEnrolled(UUID studentId, UUID courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course", courseId);
        }
        if (!enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId)) {
            throw new BusinessException(
                    "COURSE_NOT_ENROLLED",
                    "Bạn cần ghi danh khóa học trước khi lưu tiến độ.",
                    HttpStatus.FORBIDDEN
            );
        }
    }

    private void validateItemBelongsToCourse(UUID courseId, UUID itemId, String itemType) {
        boolean valid = switch (itemType) {
            case ITEM_LESSON -> lessonRepository.existsByIdAndCourseId(itemId, courseId);
            case ITEM_QUIZ -> quizConfigRepository.existsByChapterIdAndCourseId(itemId, courseId);
            default -> false;
        };
        if (!valid) {
            throw new BusinessException(
                    "INVALID_PROGRESS_ITEM",
                    "Nội dung học không thuộc khóa học này.",
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    private int calculateProgressPct(UUID studentId, UUID courseId) {
        long total = courseRepository.countProgressItemsByCourseId(courseId);
        if (total <= 0) return 0;
        long completed = Math.min(progressRepository.countByStudentIdAndCourseId(studentId, courseId), total);
        return (int) Math.round((completed * 100.0) / total);
    }
}
