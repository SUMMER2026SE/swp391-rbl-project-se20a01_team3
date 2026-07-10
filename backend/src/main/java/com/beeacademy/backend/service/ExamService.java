package com.beeacademy.backend.service;

import com.beeacademy.backend.dto.request.ExamConfigRequest;
import com.beeacademy.backend.dto.request.ExamQuestionRandomRequest;
import com.beeacademy.backend.dto.request.GradeExamAttemptRequest;
import com.beeacademy.backend.dto.request.SubmitExamRequest;
import com.beeacademy.backend.dto.response.ExamConfigResponse;
import com.beeacademy.backend.dto.response.QuestionStatsResponse;
import com.beeacademy.backend.dto.response.StudentExamResponse;
import com.beeacademy.backend.dto.response.StudentExamSubmissionResponse;
import com.beeacademy.backend.dto.response.TeacherExamAttemptResponse;
import com.beeacademy.backend.dto.response.UploadResponse;
import com.beeacademy.backend.exception.BusinessException;
import com.beeacademy.backend.exception.ResourceNotFoundException;
import com.beeacademy.backend.model.Chapter;
import com.beeacademy.backend.model.Course;
import com.beeacademy.backend.model.ExamAttempt;
import com.beeacademy.backend.model.ExamConfig;
import com.beeacademy.backend.model.Profile;
import com.beeacademy.backend.model.Question;
import com.beeacademy.backend.model.QuestionChoice;
import com.beeacademy.backend.model.RewardAssessmentType;
import com.beeacademy.backend.repository.ChapterRepository;
import com.beeacademy.backend.repository.CourseRepository;
import com.beeacademy.backend.repository.EnrollmentRepository;
import com.beeacademy.backend.repository.ExamAttemptRepository;
import com.beeacademy.backend.repository.ExamConfigRepository;
import com.beeacademy.backend.repository.ProfileRepository;
import com.beeacademy.backend.repository.QuestionRepository;
import com.beeacademy.backend.security.AuthenticatedUser;
import com.beeacademy.backend.client.SupabaseStorageClient;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.IntStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExamService {

    private static final int FIXED_EXAM_SLOT_COUNT = 4;
    private static final double EXAM_TOTAL_POINTS = 10.0;
    private static final String EXAM_ANSWER_IMAGE_BUCKET = "course-docs";
    private static final long MAX_EXAM_ANSWER_IMAGE_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_EXAM_ANSWER_IMAGE_MIME = Set.of(
            "image/png", "image/jpeg", "image/webp");
    private final ExamConfigRepository examRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ChapterRepository chapterRepository;
    private final ProfileRepository profileRepository;
    private final QuestionRepository questionRepository;
    private final ObjectMapper objectMapper;
    private final SupabaseStorageClient storageClient;
    private final UserNotificationService userNotificationService;
    private final RewardService rewardService;

    @Transactional(readOnly = true)
    public List<ExamConfigResponse> listExams(UUID courseId, AuthenticatedUser me) {
        loadOwnedCourse(courseId, me.userId());
        return examRepository.findByCourseIdOrderBySlotIndexAsc(courseId).stream()
                .map(config -> ExamConfigResponse.fromEntity(config, objectMapper))
                .toList();
    }

    @Transactional(readOnly = true)
    public ExamConfigResponse getExam(UUID courseId, Integer slotIndex, AuthenticatedUser me) {
        loadOwnedCourse(courseId, me.userId());
        return examRepository.findByCourseIdAndSlotIndex(courseId, slotIndex)
                .map(config -> ExamConfigResponse.fromEntity(config, objectMapper))
                .orElseThrow(() -> new BusinessException("EXAM_NOT_FOUND",
                        "Chưa có bài kiểm tra cho vị trí này.", HttpStatus.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public List<StudentExamResponse> listStudentExams(UUID courseId, AuthenticatedUser me) {
        requireStudentEnrollment(courseId, me.userId());
        return examRepository.findStudentVisibleByCourseId(courseId).stream()
                .filter(config -> isFixedExamSlot(config.getSlotIndex()))
                .map(config -> StudentExamResponse.fromEntity(config, objectMapper))
                .toList();
    }

    @Transactional(readOnly = true)
    public StudentExamResponse getStudentExam(UUID courseId, Integer slotIndex, AuthenticatedUser me) {
        validateSlot(slotIndex);
        requireStudentEnrollment(courseId, me.userId());
        return examRepository.findStudentVisibleByCourseIdAndSlotIndex(courseId, slotIndex)
                .map(config -> StudentExamResponse.fromEntity(config, objectMapper))
                .orElseThrow(() -> new BusinessException("EXAM_NOT_FOUND",
                        "Chua co bai kiem tra cho vi tri nay.", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public StudentExamSubmissionResponse submitStudentExam(
            UUID courseId,
            Integer slotIndex,
            AuthenticatedUser me,
            SubmitExamRequest request) {
        validateSlot(slotIndex);
        requireStudentEnrollment(courseId, me.userId());
        if (request == null || request.answers() == null) {
            throw new BusinessException("INVALID_SUBMISSION",
                    "Thieu danh sach cau tra loi.");
        }
        validateAnswerImages(me.userId(), request.answers());

        ExamConfig config = examRepository.findStudentVisibleByCourseIdAndSlotIndex(courseId, slotIndex)
                .orElseThrow(() -> new BusinessException("EXAM_NOT_FOUND",
                        "Chua co bai kiem tra cho vi tri nay.", HttpStatus.NOT_FOUND));

        int submittedCount = examAttemptRepository.countByStudentIdAndExamConfigIdAndSubmittedAtIsNotNull(
                me.userId(), config.getId());
        if (submittedCount >= config.getMaxAttempts()) {
            throw new BusinessException("MAX_ATTEMPTS_REACHED",
                    "Ban da het luot lam bai kiem tra (" + config.getMaxAttempts() + " lan).");
        }

        List<SnapshotExamQuestion> questions = readSnapshotQuestions(config.getQuestionsJson());
        ExamScoringSummary scoringSummary = scoreObjectiveQuestions(questions, request.answers());
        Boolean passed = scoringSummary.hasEssay()
                ? null
                : scoringSummary.autoScorePercent() >= effectivePassScorePercent(config);

        Profile student = loadProfile(me.userId());
        ExamAttempt attempt = ExamAttempt.start(
                student,
                config,
                config.getQuestionsJson(),
                submittedCount + 1);
        attempt.submit(toJson(request.answers()), scoringSummary.autoScorePercent(), passed);
        ExamAttempt saved = examAttemptRepository.save(attempt);

        if (scoringSummary.hasEssay()) {
            try {
                notifyTeacherAboutEssaySubmission(config, student, saved);
            } catch (Exception ex) {
                log.warn("Could not notify teacher about essay exam attempt {}", saved.getId(), ex);
            }
        } else {
            rewardService.recordAssessmentScore(
                    me.userId(),
                    RewardAssessmentType.EXAM,
                    config.getId(),
                    scoringSummary.autoScorePercent());
        }

        log.info("Student {} submitted exam course={} slot={} attempt={} autoScore={}",
                me.userId(), courseId, slotIndex, saved.getId(), scoringSummary.autoScorePercent());

        return new StudentExamSubmissionResponse(
                saved.getId(),
                config.getId(),
                config.getName(),
                config.getSlotIndex(),
                saved.getAttemptNumber(),
                scoringSummary.autoScorePercent(),
                saved.getPassed(),
                scoringSummary.hasEssay() ? "pending" : "graded",
                scoringSummary.correctObjectiveCount(),
                scoringSummary.totalObjectiveCount(),
                saved.getSubmittedAt());
    }

    private void notifyTeacherAboutEssaySubmission(
            ExamConfig config,
            Profile student,
            ExamAttempt attempt) {
        if (config.getCourse() == null || config.getCourse().getTeacher() == null) {
            return;
        }
        String studentName = student.getFullName() == null || student.getFullName().isBlank()
                ? "Hoc sinh"
                : student.getFullName().trim();
        userNotificationService.notify(
                config.getCourse().getTeacher().getId(),
                "exam_essay_submission",
                "Co bai tu luan moi can cham",
                "%s vua nop bai kiem tra \"%s\" va co phan tu luan can giao vien cham."
                        .formatted(studentName, config.getName()),
                "/teacher/grades"
        );
        log.info("Notified teacher {} about essay exam attempt {}",
                config.getCourse().getTeacher().getId(), attempt.getId());
    }

    public UploadResponse uploadStudentExamAnswerImage(
            UUID courseId,
            AuthenticatedUser me,
            MultipartFile file) {
        requireStudentEnrollment(courseId, me.userId());
        if (file == null || file.isEmpty()) {
            throw new BusinessException("FILE_REQUIRED", "Vui long chon anh.");
        }
        if (file.getSize() > MAX_EXAM_ANSWER_IMAGE_BYTES) {
            throw new BusinessException("FILE_TOO_LARGE", "Anh dap an toi da 5 MB.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_EXAM_ANSWER_IMAGE_MIME.contains(contentType)) {
            throw new BusinessException("UNSUPPORTED_FILE_TYPE",
                    "Chi ho tro anh PNG, JPG hoac WEBP.", HttpStatus.BAD_REQUEST);
        }

        String extension = switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
        String path = "exam-answer-images/" + me.userId() + "/" + UUID.randomUUID() + extension;
        String publicUrl = storageClient.upload(EXAM_ANSWER_IMAGE_BUCKET, path, contentType,
                file.getResource(), file.getSize());
        return new UploadResponse(path, publicUrl, contentType, file.getSize());
    }

    @Transactional(readOnly = true)
    public QuestionStatsResponse getQuestionBankStats(UUID courseId, AuthenticatedUser me) {
        Course course = loadOwnedCourse(courseId, me.userId());
        List<Object[]> rows = questionRepository.countActiveByDifficultyForTeacherCategoryAndGrades(
                me.userId(), courseCategoryId(course), courseGrades(course));

        int easy = 0, medium = 0, hard = 0;
        for (Object[] row : rows) {
            String diff = (String) row[0];
            long count = (Long) row[1];
            switch (diff) {
                case "easy" -> easy = (int) count;
                case "medium" -> medium = (int) count;
                case "hard" -> hard = (int) count;
                default -> {
                }
            }
        }
        return new QuestionStatsResponse(easy, medium, hard, easy + medium + hard);
    }

    @Transactional(readOnly = true)
    public List<ExamConfigResponse.ExamQuestionResponse> randomQuestions(
            UUID courseId, AuthenticatedUser me, ExamQuestionRandomRequest req) {
        Course course = loadOwnedCourse(courseId, me.userId());
        validateRandomRequest(req);

        if (hasChapterConfigs(req)) {
            List<ExamConfigResponse.ExamQuestionResponse> result = new ArrayList<>();
            List<Question> selectedQuestions = new ArrayList<>();
            for (ExamQuestionRandomRequest.ChapterQuestionRandomRequest chapterReq
                    : req.chapterConfigs()) {
                Chapter chapter = loadCourseChapter(courseId, chapterReq.chapterId());
                List<Question> selected = pickRandomQuestionsByChapter(
                        me.userId(), chapter.getId(), chapterReq);
                selectedQuestions.addAll(selected);
            }
            Collections.shuffle(selectedQuestions);
            int objectiveTotal = (int) selectedQuestions.stream()
                    .filter(question -> !"essay".equals(question.getType()))
                    .count();
            int essayTotal = (int) selectedQuestions.stream()
                    .filter(question -> "essay".equals(question.getType()))
                    .count();
            double objectivePoint = objectiveTotal > 0
                    ? req.objectivePoints() / objectiveTotal
                    : 0.0;
            double essayPoint = essayTotal > 0
                    ? req.essayPoints() / essayTotal
                    : 0.0;
            result.addAll(selectedQuestions.stream()
                    .map(question -> toExamQuestion(question,
                            "essay".equals(question.getType()) ? essayPoint : objectivePoint))
                    .toList());
            return result;
        }

        UUID categoryId = courseCategoryId(course);
        List<Integer> grades = courseGrades(course);
        List<Question> selected = new ArrayList<>();
        selected.addAll(pickRandomQuestions(me.userId(), categoryId, grades,
                "easy", req.easyCount()));
        selected.addAll(pickRandomQuestions(me.userId(), categoryId, grades,
                "medium", req.mediumCount()));
        selected.addAll(pickRandomQuestions(me.userId(), categoryId, grades,
                "hard", req.hardCount()));
        Collections.shuffle(selected);

        return selected.stream()
                .map(question -> toExamQuestion(question, req.pointsPerQuestion()))
                .toList();
    }

    @Transactional
    public ExamConfigResponse saveExam(UUID courseId, Integer slotIndex,
                                       AuthenticatedUser me, ExamConfigRequest req) {
        Course course = loadOwnedCourse(courseId, me.userId());
        Profile teacher = loadProfile(me.userId());
        validateSlot(slotIndex);
        validateRequest(req, me.userId());
        Chapter scopeStartChapter = loadCourseChapter(courseId, req.scopeStartChapterId());
        Chapter placementChapter = loadCourseChapter(courseId, req.placementChapterId());
        validateExamChapterRange(courseId, scopeStartChapter, placementChapter);

        String questionsJson = toJson(req.questions());
        ExamConfig config = examRepository.findByCourseIdAndSlotIndex(courseId, slotIndex)
                .orElse(null);

        if (config == null) {
            config = ExamConfig.create(course, teacher, slotIndex, scopeStartChapter, placementChapter,
                    req.name().trim(), trimToNull(req.description()),
                    req.durationMinutes(), req.passScorePercent(), req.maxAttempts(),
                    req.shuffleQuestions(), req.shuffleOptions(), req.showAnswerAfterSubmit(),
                    questionsJson);
        } else {
            config.update(scopeStartChapter, placementChapter, req.name().trim(), trimToNull(req.description()),
                    req.durationMinutes(), req.passScorePercent(), req.maxAttempts(),
                    req.shuffleQuestions(), req.shuffleOptions(), req.showAnswerAfterSubmit(),
                    questionsJson);
        }

        ExamConfig saved = examRepository.save(config);
        log.info("Teacher {} saved exam course={} slot={}", me.userId(), courseId, slotIndex);
        return ExamConfigResponse.fromEntity(saved, objectMapper);
    }

    @Transactional
    public void deleteExam(UUID courseId, Integer slotIndex, AuthenticatedUser me) {
        loadOwnedCourse(courseId, me.userId());
        ExamConfig config = examRepository.findByCourseIdAndSlotIndex(courseId, slotIndex)
                .orElseThrow(() -> new BusinessException("EXAM_NOT_FOUND",
                        "Chưa có bài kiểm tra cho vị trí này.", HttpStatus.NOT_FOUND));
        examRepository.delete(config);
    }

    @Transactional(readOnly = true)
    public List<TeacherExamAttemptResponse> listTeacherExamAttempts(AuthenticatedUser me) {
        return examAttemptRepository.findSubmittedAttemptsForTeacher(me.userId()).stream()
                .map(this::toTeacherExamAttemptResponse)
                .toList();
    }

    @Transactional
    public TeacherExamAttemptResponse gradeExamAttempt(
            UUID attemptId,
            AuthenticatedUser me,
            GradeExamAttemptRequest request) {
        ExamAttempt attempt = examAttemptRepository
                .findSubmittedAttemptForTeacher(attemptId, me.userId())
                .orElseThrow(() -> new ResourceNotFoundException("ExamAttempt", attemptId));

        attempt.grade(request.scorePercent(), request.feedback());
        ExamAttempt saved = examAttemptRepository.save(attempt);
        rewardService.recordAssessmentScore(
                saved.getStudent().getId(),
                RewardAssessmentType.EXAM,
                saved.getExamConfig().getId(),
                request.scorePercent());
        log.info("Teacher {} graded exam attempt {} with score={}",
                me.userId(), attemptId, request.scorePercent());
        return toTeacherExamAttemptResponse(saved);
    }

    private TeacherExamAttemptResponse toTeacherExamAttemptResponse(ExamAttempt attempt) {
        List<SnapshotExamQuestion> questions = readSnapshotQuestions(attempt.getQuestionsSnapshot());
        Map<String, SubmitExamRequest.ExamAnswerRequest> answers = readAnswers(attempt.getAnswers());
        List<TeacherExamAttemptResponse.QuestionReview> reviews = questions.stream()
                .map(question -> {
                    SubmitExamRequest.ExamAnswerRequest answer = answers.get(question.id());
                    List<Integer> studentAnswers = normalizeAnswer(
                            answer != null ? answer.selectedIndices() : null);
                    String textAnswer = answer != null ? trimToNull(answer.textAnswer()) : null;
                    List<String> imageUrls = normalizeImageUrls(answer != null ? answer.imageUrls() : null);
                    List<Integer> correctAnswers = normalizeAnswer(question.correctIndices());
                    Boolean correct = isEssayQuestion(question) ? null : studentAnswers.equals(correctAnswers);
                    double points = question.points() != null ? question.points() : 0.0;
                    return new TeacherExamAttemptResponse.QuestionReview(
                            question.id(),
                            question.text(),
                            question.type(),
                            question.options(),
                            studentAnswers,
                            textAnswer,
                            imageUrls,
                            correctAnswers,
                            correct,
                            points,
                            Boolean.TRUE.equals(correct) ? points : 0.0,
                            question.explanation());
                })
                .toList();

        Double autoScore = attempt.getScorePercent() != null
                ? attempt.getScorePercent().doubleValue()
                : null;
        Double manualScore = attempt.getManualScorePercent() != null
                ? attempt.getManualScorePercent().doubleValue()
                : null;
        Double effectiveScore = attempt.getEffectiveScorePercent() != null
                ? attempt.getEffectiveScorePercent().doubleValue()
                : null;

        return new TeacherExamAttemptResponse(
                attempt.getId(),
                attempt.getStudent().getId(),
                attempt.getStudent().getFullName(),
                attempt.getExamConfig().getCourse().getId(),
                attempt.getExamConfig().getCourse().getTitle(),
                attempt.getExamConfig().getId(),
                attempt.getExamConfig().getName(),
                attempt.getExamConfig().getSlotIndex(),
                attempt.getAttemptNumber(),
                attempt.getStartedAt(),
                attempt.getSubmittedAt(),
                autoScore,
                manualScore,
                effectiveScore,
                effectivePassScorePercent(attempt.getExamConfig()),
                attempt.getPassed(),
                attempt.getTeacherFeedback(),
                attempt.getGradedAt(),
                attempt.getGradedAt() == null ? "pending" : "graded",
                reviews);
    }

    private Map<String, SubmitExamRequest.ExamAnswerRequest> readAnswers(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            return readJsonValue(
                    json,
                    new TypeReference<Map<String, SubmitExamRequest.ExamAnswerRequest>>() {});
        } catch (Exception e) {
            throw new BusinessException("INTERNAL_ERROR",
                    "Không thể đọc đáp án bài kiểm tra.");
        }
    }

    private List<SnapshotExamQuestion> readSnapshotQuestions(String json) {
        try {
            return readJsonValue(
                    json,
                    new TypeReference<List<SnapshotExamQuestion>>() {});
        } catch (Exception e) {
            throw new BusinessException("INTERNAL_ERROR",
                    "Không thể đọc bài kiểm tra.");
        }
    }

    private <T> T readJsonValue(String json, TypeReference<T> type) throws JsonProcessingException {
        try {
            return objectMapper.readValue(json, type);
        } catch (JsonProcessingException first) {
            String unwrapped = objectMapper.readValue(json, String.class);
            return objectMapper.readValue(unwrapped, type);
        }
    }
    private List<Integer> normalizeAnswer(List<Integer> values) {
        if (values == null) return List.of();
        return values.stream()
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .toList();
    }

    private List<String> normalizeImageUrls(List<String> values) {
        if (values == null) return List.of();
        return values.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .limit(10)
                .toList();
    }

    private boolean isEssayQuestion(SnapshotExamQuestion question) {
        return "essay".equals(question.type());
    }

    private void validateAnswerImages(
            UUID studentId,
            Map<String, SubmitExamRequest.ExamAnswerRequest> answers) {
        answers.values().stream()
                .filter(Objects::nonNull)
                .map(SubmitExamRequest.ExamAnswerRequest::imageUrls)
                .filter(Objects::nonNull)
                .flatMap(List::stream)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(url -> !url.isBlank())
                .forEach(url -> validateAnswerImageUrl(studentId, url));
    }

    private void validateAnswerImageUrl(UUID studentId, String url) {
        String examImagePath = "/storage/v1/object/public/" + EXAM_ANSWER_IMAGE_BUCKET
                + "/exam-answer-images/" + studentId + "/";
        String qaImagePath = "/storage/v1/object/public/" + EXAM_ANSWER_IMAGE_BUCKET
                + "/qa-images/" + studentId + "/";
        if (!url.contains(examImagePath) && !url.contains(qaImagePath)) {
            throw new BusinessException("INVALID_ATTACHMENT",
                    "Anh dap an khong hop le.", HttpStatus.BAD_REQUEST);
        }
    }

    private ExamScoringSummary scoreObjectiveQuestions(
            List<SnapshotExamQuestion> questions,
            Map<String, SubmitExamRequest.ExamAnswerRequest> answers) {
        double totalPoints = questions.stream()
                .map(SnapshotExamQuestion::points)
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .sum();
        if (totalPoints <= 0.0) {
            totalPoints = EXAM_TOTAL_POINTS;
        }

        double earnedObjectivePoints = 0.0;
        int correctObjectiveCount = 0;
        int totalObjectiveCount = 0;
        boolean hasEssay = false;

        for (SnapshotExamQuestion question : questions) {
            if (isEssayQuestion(question)) {
                hasEssay = true;
                continue;
            }
            totalObjectiveCount++;
            SubmitExamRequest.ExamAnswerRequest answer = answers.get(question.id());
            List<Integer> studentAnswers = normalizeAnswer(
                    answer != null ? answer.selectedIndices() : null);
            List<Integer> correctAnswers = normalizeAnswer(question.correctIndices());
            if (studentAnswers.equals(correctAnswers)) {
                correctObjectiveCount++;
                earnedObjectivePoints += question.points() != null ? question.points() : 0.0;
            }
        }

        double autoScorePercent = Math.round((earnedObjectivePoints / totalPoints) * 1000.0) / 10.0;
        return new ExamScoringSummary(
                autoScorePercent,
                correctObjectiveCount,
                totalObjectiveCount,
                hasEssay);
    }

    private int nullToZero(Integer value) {
        return value != null ? value : 0;
    }

    private int effectivePassScorePercent(ExamConfig config) {
        Integer value = config != null ? config.getPassScorePercent() : null;
        return value != null && value >= 0 ? value : 60;
    }

    private boolean isFixedExamSlot(Integer slotIndex) {
        return slotIndex != null && slotIndex >= 0 && slotIndex < FIXED_EXAM_SLOT_COUNT;
    }

    private record SnapshotExamQuestion(
            String id,
            String text,
            String type,
            List<String> options,
            List<Integer> correctIndices,
            String explanation,
            Double points,
            String difficulty
    ) {}

    private record ExamScoringSummary(
            double autoScorePercent,
            int correctObjectiveCount,
            int totalObjectiveCount,
            boolean hasEssay
    ) {}

    private Course loadOwnedCourse(UUID courseId, UUID teacherId) {
        Course course = courseRepository.findWithCategoryAndTeacherById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));
        if (course.getTeacher() == null || !course.getTeacher().getId().equals(teacherId)) {
            throw new BusinessException("FORBIDDEN",
                    "Bạn không có quyền quản lý bài kiểm tra của khóa học này.",
                    HttpStatus.FORBIDDEN);
        }
        return course;
    }

    private void requireStudentEnrollment(UUID courseId, UUID studentId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course", courseId);
        }
        if (!enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId)) {
            throw new BusinessException(
                    "COURSE_NOT_ENROLLED",
                    "Ban can ghi danh khoa hoc truoc khi lam bai kiem tra.",
                    HttpStatus.FORBIDDEN
            );
        }
    }

    private Profile loadProfile(UUID profileId) {
        return profileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile", profileId));
    }

    private void validateSlot(Integer slotIndex) {
        if (!isFixedExamSlot(slotIndex)) {
            throw new BusinessException("INVALID_SLOT", "Vị trí bài kiểm tra không hợp lệ.");
        }
    }

    private void validateQuestionComesFromBank(ExamConfigRequest.ExamQuestionRequest q, UUID teacherId) {
        try {
            UUID questionId = UUID.fromString(q.id());
            Question question = questionRepository.findById(questionId)
                    .orElseThrow(() -> new BusinessException("QUESTION_NOT_FROM_BANK",
                            "Tat ca cau hoi bai kiem tra phai lay tu ngan hang cau hoi."));
            if (!"active".equals(question.getStatus())) {
                throw new BusinessException("QUESTION_INACTIVE",
                        "Cau hoi da bi an khong the dua vao bai kiem tra.");
            }
            if (question.getTeacher() == null || !teacherId.equals(question.getTeacher().getId())) {
                throw new BusinessException("QUESTION_NOT_FROM_BANK",
                        "Tat ca cau hoi bai kiem tra phai lay tu ngan hang cau hoi cua giao vien.");
            }
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("QUESTION_NOT_FROM_BANK",
                    "Tat ca cau hoi bai kiem tra phai lay tu ngan hang cau hoi.");
        }
    }
    private void validateRequest(ExamConfigRequest req, UUID teacherId) {
        if (req == null) {
            throw new BusinessException("INVALID_REQUEST", "Dữ liệu bài kiểm tra không hợp lệ.");
        }
        if (req.questions() == null || req.questions().isEmpty()) {
            throw new BusinessException("INVALID_QUESTIONS",
                    "Bài kiểm tra phải có ít nhất 1 câu hỏi.");
        }
        for (int i = 0; i < req.questions().size(); i++) {
            ExamConfigRequest.ExamQuestionRequest q = req.questions().get(i);
            if (q == null || q.type() == null || q.points() == null) {
                throw new BusinessException("INVALID_QUESTIONS",
                        "Câu " + (i + 1) + " không hợp lệ.");
            }
            validateQuestionComesFromBank(q, teacherId);
            if ("essay".equals(q.type())) {
                continue;
            }
            if (q.options() == null || q.options().size() < 2
                    || q.correctIndices() == null || q.correctIndices().isEmpty()) {
                throw new BusinessException("INVALID_QUESTIONS",
                        "Cau " + (i + 1) + " trac nghiem phai co lua chon va dap an dung.");
            }
            if ("single".equals(q.type()) && q.correctIndices().size() != 1) {
                throw new BusinessException("INVALID_QUESTIONS",
                        "Câu " + (i + 1) + " dạng một đáp án phải có đúng 1 đáp án đúng.");
            }
            int optionCount = q.options().size();
            for (Integer correctIndex : q.correctIndices()) {
                if (correctIndex == null || correctIndex < 0 || correctIndex >= optionCount) {
                    throw new BusinessException("INVALID_QUESTIONS",
                            "Câu " + (i + 1) + " có đáp án đúng không hợp lệ.");
                }
            }
        }
        validateExamPointsAndSections(req);
    }

    private void validateExamPointsAndSections(ExamConfigRequest req) {
        long objectiveCount = req.questions().stream()
                .filter(q -> !"essay".equals(q.type()))
                .count();
        long essayCount = req.questions().stream()
                .filter(q -> "essay".equals(q.type()))
                .count();
        if (objectiveCount == 0 || essayCount == 0) {
            throw new BusinessException("INVALID_QUESTIONS",
                    "Bai kiem tra phai co ca phan trac nghiem va phan tu luan.");
        }
        double totalPoints = req.questions().stream()
                .map(ExamConfigRequest.ExamQuestionRequest::points)
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .sum();
        if (Math.abs(totalPoints - EXAM_TOTAL_POINTS) > 0.001) {
            throw new BusinessException("INVALID_POINTS",
                    "Tong diem phan trac nghiem va tu luan phai bang 10 diem.");
        }
    }

    private void validateExamChapterRange(UUID courseId, Chapter scopeStartChapter, Chapter placementChapter) {
        List<Chapter> chapters = chapterRepository.findByCourseIdOrderByPositionAsc(courseId);
        int startIndex = indexOfChapter(chapters, scopeStartChapter.getId());
        int endIndex = indexOfChapter(chapters, placementChapter.getId());
        if (startIndex < 0 || endIndex < 0 || startIndex > endIndex) {
            throw new BusinessException("INVALID_EXAM_SCOPE",
                    "Chuong bat dau phai dung truoc hoac bang chuong ket thuc.");
        }
    }

    private int indexOfChapter(List<Chapter> chapters, UUID chapterId) {
        for (int i = 0; i < chapters.size(); i++) {
            if (chapters.get(i).getId().equals(chapterId)) {
                return i;
            }
        }
        return -1;
    }

    private void validateRandomRequest(ExamQuestionRandomRequest req) {
        if (req != null && hasChapterConfigs(req)) {
            validateChapterRandomRequest(req);
            return;
        }
        if (req == null) {
            throw new BusinessException("INVALID_REQUEST", "Dữ liệu random câu hỏi không hợp lệ.");
        }
        if (req.easyCount() == null || req.mediumCount() == null
                || req.hardCount() == null || req.pointsPerQuestion() == null) {
            throw new BusinessException("INVALID_RANDOM_CONFIG",
                    "Phân bổ câu hỏi random không hợp lệ.");
        }
        int total = req.easyCount() + req.mediumCount() + req.hardCount();
        if (total <= 0) {
            throw new BusinessException("INVALID_RANDOM_CONFIG",
                    "Cần chọn ít nhất 1 câu hỏi để random.");
        }
        if (total > 200) {
            throw new BusinessException("INVALID_RANDOM_CONFIG",
                    "Mỗi lần random tối đa 200 câu hỏi.");
        }
    }

    private void validateChapterRandomRequest(ExamQuestionRandomRequest req) {
        if (req.objectivePoints() == null || req.essayPoints() == null) {
            throw new BusinessException("INVALID_RANDOM_CONFIG",
                    "Phân bổ câu hỏi random không hợp lệ.");
        }
        int total = 0;
        int objectiveTotal = 0;
        int essayTotal = 0;
        for (ExamQuestionRandomRequest.ChapterQuestionRandomRequest chapterReq
                : req.chapterConfigs()) {
            if (chapterReq.chapterId() == null
                    || chapterReq.totalCount() == null) {
                throw new BusinessException("INVALID_RANDOM_CONFIG",
                        "Phân bổ câu hỏi theo chương không hợp lệ.");
            }
            total += chapterReq.totalCount();
            int typedTotal = nullToZero(chapterReq.objectiveCount()) + nullToZero(chapterReq.essayCount());
            if (typedTotal > 0 && typedTotal != chapterReq.totalCount()) {
                throw new BusinessException("INVALID_RANDOM_CONFIG",
                        "Tong so cau trac nghiem va tu luan phai bang so cau cua chuong.");
            }
            objectiveTotal += nullToZero(chapterReq.objectiveCount());
            essayTotal += nullToZero(chapterReq.essayCount());
        }
        if (objectiveTotal <= 0 || essayTotal <= 0) {
            throw new BusinessException("INVALID_RANDOM_CONFIG",
                    "Bai kiem tra phai co ca phan trac nghiem va phan tu luan.");
        }
        if (Math.abs(req.objectivePoints() + req.essayPoints() - EXAM_TOTAL_POINTS) > 0.001) {
            throw new BusinessException("INVALID_POINTS",
                    "Tong diem phan trac nghiem va tu luan phai bang 10 diem.");
        }
        if (total <= 0) {
            throw new BusinessException("INVALID_RANDOM_CONFIG",
                    "Cần chọn ít nhất 1 câu hỏi để random.");
        }
        if (total > 200) {
            throw new BusinessException("INVALID_RANDOM_CONFIG",
                    "Mỗi lần random tối đa 200 câu hỏi.");
        }
    }

    private boolean hasChapterConfigs(ExamQuestionRandomRequest req) {
        return req.chapterConfigs() != null && !req.chapterConfigs().isEmpty();
    }

    private List<Question> pickRandomQuestions(UUID teacherId, UUID categoryId, List<Integer> grades,
                                               String difficulty, int count) {
        if (count <= 0) {
            return List.of();
        }
        List<Question> pool = new ArrayList<>(
                questionRepository.findActiveByTeacherAndCategoryAndGradesAndDifficulty(
                        teacherId, categoryId, grades, difficulty));
        if (pool.size() < count) {
            throw new BusinessException("QUESTION_BANK_NOT_ENOUGH",
                    "Ngân hàng câu hỏi chưa đủ câu " + difficulty
                            + ": cần " + count + ", hiện có " + pool.size() + ".");
        }
        Collections.shuffle(pool);
        return pool.subList(0, count);
    }

    private List<Question> pickRandomQuestionsByChapter(
            UUID teacherId,
            UUID chapterId,
            ExamQuestionRandomRequest.ChapterQuestionRandomRequest chapterReq) {
        int count = chapterReq.totalCount();
        if (count <= 0) {
            return List.of();
        }
        int objectiveCount = nullToZero(chapterReq.objectiveCount());
        int essayCount = nullToZero(chapterReq.essayCount());
        if (objectiveCount + essayCount > 0) {
            List<Question> selected = new ArrayList<>();
            selected.addAll(pickRandomQuestionsByChapterAndTypes(
                    teacherId, chapterId, List.of("multiple_choice", "true_false"),
                    objectiveCount, "trac nghiem"));
            selected.addAll(pickRandomQuestionsByChapterAndTypes(
                    teacherId, chapterId, List.of("essay"),
                    essayCount, "tu luan"));
            Collections.shuffle(selected);
            return selected;
        }
        List<Question> pool = new ArrayList<>(
                questionRepository.findActiveByTeacherAndChapter(teacherId, chapterId));
        if (pool.size() < count) {
            throw new BusinessException("QUESTION_BANK_NOT_ENOUGH",
                    "Ngân hàng câu hỏi chưa đủ cho chương này: cần " + count
                            + ", hiện có " + pool.size() + ".");
        }
        Collections.shuffle(pool);
        return pool.subList(0, count);
    }

    private List<Question> pickRandomQuestionsByChapterAndTypes(
            UUID teacherId, UUID chapterId, List<String> types, int count, String label) {
        if (count <= 0) return List.of();
        List<Question> pool = new ArrayList<>(
                questionRepository.findActiveByTeacherAndChapterAndTypes(teacherId, chapterId, types));
        if (pool.size() < count) {
            throw new BusinessException("QUESTION_BANK_NOT_ENOUGH",
                    "Ngan hang cau hoi chua du cau " + label + ": can " + count
                            + ", hien co " + pool.size() + ".");
        }
        Collections.shuffle(pool);
        return pool.subList(0, count);
    }

    private Chapter loadCourseChapter(UUID courseId, UUID chapterId) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResourceNotFoundException("Chapter", chapterId));
        if (chapter.getCourse() == null || !chapter.getCourse().getId().equals(courseId)) {
            throw new BusinessException("INVALID_CHAPTER",
                    "Chương không thuộc khóa học đang chọn.");
        }
        return chapter;
    }

    private ExamConfigResponse.ExamQuestionResponse toExamQuestion(Question question,
                                                                   Double pointsPerQuestion) {
        List<QuestionChoice> choices = new ArrayList<>(question.getChoices());
        choices.sort(Comparator.comparing(QuestionChoice::getPosition));
        List<String> options = choices.stream()
                .map(QuestionChoice::getContent)
                .toList();
        List<Integer> correctIndices = IntStream.range(0, choices.size())
                .filter(i -> Boolean.TRUE.equals(choices.get(i).getIsCorrect()))
                .boxed()
                .toList();
        String examQuestionType = "essay".equals(question.getType())
                ? "essay"
                : correctIndices.size() > 1 ? "multiple" : "single";
        return new ExamConfigResponse.ExamQuestionResponse(
                question.getId().toString(),
                question.getContent(),
                examQuestionType,
                options,
                correctIndices,
                question.getExplanation(),
                pointsPerQuestion,
                question.getDifficulty()
        );
    }

    private UUID courseCategoryId(Course course) {
        if (course.getCategory() == null) {
            throw new BusinessException("COURSE_CATEGORY_MISSING",
                    "Khóa học chưa có thông tin môn học.");
        }
        return course.getCategory().getId();
    }

    private List<Integer> courseGrades(Course course) {
        int[] grades = course.getGrades();
        if (grades == null || grades.length == 0) {
            throw new BusinessException("COURSE_GRADE_MISSING",
                    "Khóa học chưa có thông tin lớp.");
        }
        return Arrays.stream(grades).boxed().toList();
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new BusinessException("INVALID_QUESTIONS",
                    "Không thể lưu danh sách câu hỏi.");
        }
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }
}
