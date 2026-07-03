package com.beeacademy.backend.service;

import com.beeacademy.backend.dto.request.SaveStudentVideoProgressRequest;
import com.beeacademy.backend.dto.response.StudentVideoProgressResponse;
import com.beeacademy.backend.exception.BusinessException;
import com.beeacademy.backend.exception.ResourceNotFoundException;
import com.beeacademy.backend.model.Lesson;
import com.beeacademy.backend.model.Profile;
import com.beeacademy.backend.model.StudentVideoProgress;
import com.beeacademy.backend.repository.EnrollmentRepository;
import com.beeacademy.backend.repository.LessonRepository;
import com.beeacademy.backend.repository.ProfileRepository;
import com.beeacademy.backend.repository.StudentVideoProgressRepository;
import com.beeacademy.backend.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StudentVideoProgressService {

    private final StudentVideoProgressRepository progressRepository;
    private final LessonRepository lessonRepository;
    private final ProfileRepository profileRepository;
    private final EnrollmentRepository enrollmentRepository;

    @Transactional(readOnly = true)
    public StudentVideoProgressResponse getProgress(UUID courseId, UUID lessonId,
                                                    AuthenticatedUser me) {
        verifyStudentLessonAccess(courseId, lessonId, me);
        return progressRepository.findByStudent_IdAndLesson_Id(me.userId(), lessonId)
                .map(StudentVideoProgressResponse::fromEntity)
                .orElseGet(() -> StudentVideoProgressResponse.empty(lessonId));
    }

    @Transactional
    public StudentVideoProgressResponse saveProgress(UUID courseId, UUID lessonId,
                                                     AuthenticatedUser me,
                                                     SaveStudentVideoProgressRequest request) {
        Lesson lesson = verifyStudentLessonAccess(courseId, lessonId, me);
        StudentVideoProgress progress = progressRepository
                .findByStudent_IdAndLesson_Id(me.userId(), lessonId)
                .orElseGet(() -> {
                    Profile student = profileRepository.findById(me.userId())
                            .orElseThrow(() -> new ResourceNotFoundException("Profile", me.userId()));
                    return StudentVideoProgress.create(
                            student, lesson, request.positionSec(), request.durationSec());
                });
        progress.update(request.positionSec(), request.durationSec());
        return StudentVideoProgressResponse.fromEntity(progressRepository.saveAndFlush(progress));
    }

    private Lesson verifyStudentLessonAccess(UUID courseId, UUID lessonId, AuthenticatedUser me) {
        if (me == null || !"student".equalsIgnoreCase(me.role())) {
            throw new BusinessException(
                    "STUDENT_VIDEO_PROGRESS_ROLE_FORBIDDEN",
                    "Chi hoc sinh moi co the luu tien do xem video.",
                    HttpStatus.FORBIDDEN
            );
        }
        Lesson lesson = lessonRepository.findWithChapterAndCourseById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson", lessonId));
        if (!lesson.getChapter().getCourse().getId().equals(courseId)) {
            throw new BusinessException(
                    "STUDENT_VIDEO_PROGRESS_INVALID_LESSON",
                    "Bai hoc khong thuoc khoa hoc da chon.",
                    HttpStatus.BAD_REQUEST
            );
        }
        if (!enrollmentRepository.existsByStudentIdAndCourseId(me.userId(), courseId)) {
            throw new BusinessException(
                    "STUDENT_VIDEO_PROGRESS_COURSE_FORBIDDEN",
                    "Ban can tham gia khoa hoc de luu tien do xem video.",
                    HttpStatus.FORBIDDEN
            );
        }
        return lesson;
    }
}
