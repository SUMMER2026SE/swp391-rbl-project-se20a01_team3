package com.beeacademy.backend.service;

import com.beeacademy.backend.client.SupabaseStorageClient;
import com.beeacademy.backend.dto.request.ExamConfigRequest;
import com.beeacademy.backend.dto.request.ExamQuestionRandomRequest;
import com.beeacademy.backend.dto.request.GradeExamAttemptRequest;
import com.beeacademy.backend.dto.request.SubmitExamRequest;
import com.beeacademy.backend.dto.response.ExamConfigResponse;
import com.beeacademy.backend.dto.response.QuestionStatsResponse;
import com.beeacademy.backend.dto.response.StudentExamResultResponse;
import com.beeacademy.backend.dto.response.StudentExamStartResponse;
import com.beeacademy.backend.dto.response.StudentExamSummaryResponse;
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
import com.beeacademy.backend.model.QuizConfig;
import com.beeacademy.backend.repository.ChapterRepository;
import com.beeacademy.backend.repository.CourseRepository;
import com.beeacademy.backend.repository.EnrollmentRepository;
import com.beeacademy.backend.repository.ExamAttemptRepository;
import com.beeacademy.backend.repository.ExamConfigRepository;
import com.beeacademy.backend.repository.ProfileRepository;
import com.beeacademy.backend.repository.QuestionRepository;
import com.beeacademy.backend.repository.QuizAttemptRepository;
import com.beeacademy.backend.repository.QuizConfigRepository;
import com.beeacademy.backend.security.AuthenticatedUser;
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
import java.util.HashMap;
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
    private static final List<String> FIXED_EXAM_NAMES = List.of(
            "Bài kiểm tra giữa kỳ 1",
            "Bài kiểm tra cuối kỳ 1",
            "Bài kiểm tra giữa kỳ 2",
            "Bài kiểm tra cuối kỳ 2"
    );
    private static final double EXAM_TOTAL_POINTS = 10.0;
    private static final Set<String> ALLOWED_IMAGE_MIME = Set.of(
            "image/jpeg", "image/png", "image/webp");
    private static final long MAX_EXAM_IMAGE_BYTES = 10L * 1024 * 1024;

    private final ExamConfigRepository examRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final CourseRepository courseRepository;
    private final ChapterRepository chapterRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ProfileRepository profileRepository;
    private final QuestionRepository questionRepository;
    private final QuizConfigRepository quizConfigRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final SupabaseStorageClient storageClient;
    private final ObjectMapper objectMapper;

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
    public List<StudentExamSummaryResponse> listStudentExams(UUID courseId, AuthenticatedUser me) {
        verifyEnrollment(courseId, me.userId());
        List<Chapter> chapters = chapterRepository.findByCourseIdOrderByPositionAsc(courseId);
        List<ExamConfig> exams = examRepository.findByCourseIdOrderBySlotIndexAsc(courseId)
                .stream()
                .filter(exam -> isFixedExamSlot(exam.getSlotIndex()))
                .toList();

        return exams.stream()
                .map(exam -> buildStudentExamSummary(
                        exam,
                        exam.getSlotIndex(),
                        requiredChaptersForExam(exam, chapters, exams),
                        me.userId()))
                .toList();
    }

    @Transactional
    public StudentExamStartResponse startStudentExam(UUID courseId, Integer slotIndex,
                                                     AuthenticatedUser me) {
        verifyEnrollment(courseId, me.userId());
        ExamConfig config = examRepository.findByCourseIdAndSlotIndex(courseId, slotIndex)
                .orElseThrow(() -> new BusinessException("EXAM_NOT_FOUND",
                        "Giáo viên chưa cấu hình bài kiểm tra này.", HttpStatus.NOT_FOUND));
        assertStudentExamUnlocked(courseId, slotIndex, me.userId());

        int attemptCount = examAttemptRepository.countByStudentIdAndExamConfigId(
                me.userId(), config.getId());
        if (attemptCount >= config.getMaxAttempts()) {
            throw new BusinessException("MAX_ATTEMPTS_REACHED",
                    "Bạn đã hết lượt làm bài kiểm tra này.");
        }

        List<ExamConfigResponse.ExamQuestionResponse> questions = parseExamQuestions(config);
        if (Boolean.TRUE.equals(config.getShuffleQuestions())) {
            Collections.shuffle(questions);
        }
        List<SnapshotExamQuestion> snapshot = questions.stream()
                .map(q -> toSnapshotQuestion(q, Boolean.TRUE.equals(config.getShuffleOptions())))
                .toList();

        Profile student = loadProfile(me.userId());
        ExamAttempt attempt = ExamAttempt.start(student, config, toJson(snapshot), attemptCount + 1);
        ExamAttempt saved = examAttemptRepository.save(attempt);

        return new StudentExamStartResponse(
                saved.getId(),
                config.getId(),
                config.getSlotIndex(),
                config.getName(),
                config.getDescription(),
                config.getDurationMinutes(),
                snapshot.size(),
                saved.getAttemptNumber(),
                snapshot.stream()
                        .map(q -> new StudentExamStartResponse.QuestionForStudent(
                                q.id(), q.text(), q.type(), q.options(), q.points()))
                        .toList()
        );
    }

    @Transactional
    public StudentExamResultResponse submitStudentExam(UUID attemptId, AuthenticatedUser me,
                                                       SubmitExamRequest req) {
        ExamAttempt attempt = examAttemptRepository.findByIdAndStudentId(attemptId, me.userId())
                .orElseThrow(() -> new ResourceNotFoundException("ExamAttempt", attemptId));
        if (attempt.getSubmittedAt() != null) {
            throw new BusinessException("ALREADY_SUBMITTED",
                    "Bài kiểm tra này đã được nộp rồi.");
        }

        List<SnapshotExamQuestion> questions = readSnapshotQuestions(attempt.getQuestionsSnapshot());
        Map<String, SubmitExamRequest.ExamAnswerRequest> answers =
                req.answers() != null ? req.answers() : Map.of();
        double earned = 0.0;
        double total = questions.stream()
                .map(SnapshotExamQuestion::points)
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .sum();
        boolean hasEssay = questions.stream().anyMatch(this::isEssayQuestion);
        List<StudentExamResultResponse.QuestionResult> details = new ArrayList<>();

        for (SnapshotExamQuestion question : questions) {
            SubmitExamRequest.ExamAnswerRequest answer = answers.get(question.id());
            List<Integer> studentAnswers = normalizeAnswer(
                    answer != null ? answer.selectedIndices() : null);
            String textAnswer = answer != null ? trimToNull(answer.textAnswer()) : null;
            List<String> imageUrls = normalizeImageUrls(answer != null ? answer.imageUrls() : null);
            List<Integer> correctAnswers = normalizeAnswer(question.correctIndices());
            Boolean correct = isEssayQuestion(question) ? null : studentAnswers.equals(correctAnswers);
            if (Boolean.TRUE.equals(correct)) {
                earned += question.points() != null ? question.points() : 0.0;
            }
            boolean showAnswer = Boolean.TRUE.equals(attempt.getExamConfig().getShowAnswerAfterSubmit());
            details.add(new StudentExamResultResponse.QuestionResult(
                    question.id(),
                    question.text(),
                    question.type(),
                    studentAnswers,
                    textAnswer,
                    imageUrls,
                    showAnswer ? correctAnswers : List.of(),
                    correct,
                    showAnswer ? question.explanation() : null,
                    question.points()
            ));
        }

        double scorePercent = total > 0 ? Math.round((earned / total) * 1000.0) / 10.0 : 0.0;
        Boolean passed = hasEssay ? null : scorePercent >= attempt.getExamConfig().getPassScorePercent();
        attempt.submit(toJson(answers), scorePercent, passed);
        examAttemptRepository.save(attempt);

        return new StudentExamResultResponse(
                attempt.getId(),
                attempt.getExamConfig().getId(),
                attempt.getExamConfig().getSlotIndex(),
                scorePercent,
                passed,
                Math.round(earned * 10.0) / 10.0,
                Math.round(total * 10.0) / 10.0,
                attempt.getAttemptNumber(),
                details
        );
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
        log.info("Teacher {} graded exam attempt {} with score={}",
                me.userId(), attemptId, request.scorePercent());
        return toTeacherExamAttemptResponse(saved);
    }

    @Transactional(readOnly = true)
    public UploadResponse uploadExamAnswerImage(UUID attemptId, AuthenticatedUser me, MultipartFile file) {
        ExamAttempt attempt = examAttemptRepository.findByIdAndStudentId(attemptId, me.userId())
                .orElseThrow(() -> new ResourceNotFoundException("ExamAttempt", attemptId));
        if (attempt.getSubmittedAt() != null) {
            throw new BusinessException("ALREADY_SUBMITTED",
                    "BÃ i kiá»ƒm tra nÃ y Ä‘Ã£ Ä‘Æ°á»£c ná»™p rá»“i.");
        }
        validateExamImage(file);
        String ext = imageExtension(file.getContentType());
        String path = "exam-answers/" + me.userId() + "/" + attemptId + "/"
                + UUID.randomUUID() + "." + ext;
        String publicUrl = storageClient.upload(
                "course-docs", path, file.getContentType(), file.getResource(), file.getSize());
        return new UploadResponse(path, publicUrl, ext, file.getSize());
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
                attempt.getExamConfig().getPassScorePercent(),
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
            return objectMapper.readValue(
                    json,
                    new TypeReference<Map<String, SubmitExamRequest.ExamAnswerRequest>>() {});
        } catch (Exception e) {
            throw new BusinessException("INTERNAL_ERROR",
                    "Không thể đọc đáp án bài kiểm tra.");
        }
    }

    private StudentExamSummaryResponse buildStudentExamSummary(
            ExamConfig config, int slotIndex, List<Chapter> requiredChapters, UUID studentId) {
        Map<UUID, QuizConfig> quizByChapter = new HashMap<>();
        quizConfigRepository.findByChapterIdIn(
                requiredChapters.stream().map(Chapter::getId).toList())
                .forEach(quiz -> quizByChapter.put(quiz.getChapter().getId(), quiz));

        int passedQuizCount = 0;
        List<StudentExamSummaryResponse.RequiredChapter> chapterDtos = new ArrayList<>();
        for (Chapter chapter : requiredChapters) {
            QuizConfig quiz = quizByChapter.get(chapter.getId());
            boolean hasQuiz = quiz != null;
            boolean quizPassed = hasQuiz && quizAttemptRepository
                    .existsByStudentIdAndQuizConfigIdAndPassedTrue(studentId, quiz.getId());
            if (quizPassed) passedQuizCount++;
            chapterDtos.add(new StudentExamSummaryResponse.RequiredChapter(
                    chapter.getId(), chapter.getTitle(), hasQuiz, quizPassed));
        }

        boolean configured = config != null;
        int attemptsUsed = configured
                ? examAttemptRepository.countByStudentIdAndExamConfigId(studentId, config.getId())
                : 0;
        ExamAttempt latestAttempt = configured
                ? examAttemptRepository
                        .findFirstByStudentIdAndExamConfigIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(
                                studentId, config.getId())
                        .orElse(null)
                : null;
        boolean passed = latestAttempt != null && Boolean.TRUE.equals(latestAttempt.getPassed());
        boolean prerequisitesMet = passedQuizCount == requiredChapters.size()
                && chapterDtos.stream().allMatch(StudentExamSummaryResponse.RequiredChapter::hasQuiz);
        boolean attemptsAvailable = configured && attemptsUsed < config.getMaxAttempts();
        boolean unlocked = configured && prerequisitesMet && (attemptsAvailable || passed);
        String lockedReason = null;
        if (!configured) {
            lockedReason = "Giáo viên chưa cấu hình bài kiểm tra.";
        } else if (!prerequisitesMet) {
            lockedReason = "Cần pass đủ quiz của các chương trước vị trí bài kiểm tra.";
        } else if (!attemptsAvailable && !passed) {
            lockedReason = "Bạn đã hết lượt làm bài kiểm tra này.";
        }
        Chapter placementChapter = configured && config.getPlacementChapter() != null
                ? config.getPlacementChapter()
                : (!requiredChapters.isEmpty() ? requiredChapters.get(requiredChapters.size() - 1) : null);
        Chapter scopeStartChapter = configured && config.getScopeStartChapter() != null
                ? config.getScopeStartChapter()
                : (!requiredChapters.isEmpty() ? requiredChapters.get(0) : null);

        return new StudentExamSummaryResponse(
                configured ? config.getId() : null,
                slotIndex,
                scopeStartChapter != null ? scopeStartChapter.getId() : null,
                scopeStartChapter != null ? scopeStartChapter.getTitle() : null,
                placementChapter != null ? placementChapter.getId() : null,
                placementChapter != null ? placementChapter.getTitle() : null,
                configured ? config.getName() : fixedExamName(slotIndex),
                configured ? config.getDescription() : null,
                configured ? config.getDurationMinutes() : null,
                configured ? config.getPassScorePercent() : null,
                configured ? config.getMaxAttempts() : null,
                configured,
                unlocked,
                passed,
                latestAttempt != null && latestAttempt.getEffectiveScorePercent() != null
                        ? latestAttempt.getEffectiveScorePercent().doubleValue()
                        : null,
                attemptsUsed,
                requiredChapters.size(),
                passedQuizCount,
                lockedReason,
                chapterDtos
        );
    }

    private void assertStudentExamUnlocked(UUID courseId, int slotIndex, UUID studentId) {
        List<Chapter> chapters = chapterRepository.findByCourseIdOrderByPositionAsc(courseId);
        if (!isFixedExamSlot(slotIndex)) {
            throw new BusinessException("INVALID_SLOT",
                    "Vị trí bài kiểm tra không hợp lệ.", HttpStatus.BAD_REQUEST);
        }
        List<ExamConfig> exams = examRepository.findByCourseIdOrderBySlotIndexAsc(courseId)
                .stream()
                .filter(exam -> isFixedExamSlot(exam.getSlotIndex()))
                .toList();
        ExamConfig config = exams.stream()
                .filter(exam -> Objects.equals(exam.getSlotIndex(), slotIndex))
                .findFirst()
                .orElse(null);
        StudentExamSummaryResponse summary = buildStudentExamSummary(
                config,
                slotIndex,
                config != null ? requiredChaptersForExam(config, chapters, exams) : List.of(),
                studentId);
        if (!Boolean.TRUE.equals(summary.unlocked())) {
            throw new BusinessException("EXAM_LOCKED",
                    summary.lockedReason() != null ? summary.lockedReason() : "Bài kiểm tra đang bị khóa.",
                    HttpStatus.FORBIDDEN);
        }
    }

    private void verifyEnrollment(UUID courseId, UUID studentId) {
        if (!enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId)) {
            throw new BusinessException("NOT_ENROLLED",
                    "Bạn chưa mua khóa học này.", HttpStatus.FORBIDDEN);
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

    private List<Chapter> requiredChaptersForExam(
            ExamConfig config, List<Chapter> chapters, List<ExamConfig> courseExams) {
        if (config == null || chapters.isEmpty()) {
            return List.of();
        }

        int currentIndex = resolvePlacementIndex(config, chapters);
        if (currentIndex < 0) {
            return List.of();
        }

        int fromIndex = resolveScopeStartIndex(config, chapters, currentIndex);
        if (fromIndex < 0) {
            int previousIndex = courseExams.stream()
                    .filter(exam -> exam.getSlotIndex() != null
                            && exam.getSlotIndex() < config.getSlotIndex())
                    .mapToInt(exam -> resolvePlacementIndex(exam, chapters))
                    .filter(index -> index >= 0 && index < currentIndex)
                    .max()
                    .orElse(-1);
            fromIndex = Math.max(0, previousIndex + 1);
        }
        if (fromIndex > currentIndex) {
            return List.of();
        }
        return chapters.subList(fromIndex, currentIndex + 1);
    }

    private int resolveScopeStartIndex(ExamConfig config, List<Chapter> chapters, int currentIndex) {
        if (config.getScopeStartChapter() == null) {
            return -1;
        }
        UUID startId = config.getScopeStartChapter().getId();
        for (int i = 0; i < chapters.size(); i++) {
            if (chapters.get(i).getId().equals(startId)) {
                return i <= currentIndex ? i : -1;
            }
        }
        return -1;
    }

    private int resolvePlacementIndex(ExamConfig config, List<Chapter> chapters) {
        if (config.getPlacementChapter() != null) {
            UUID placementId = config.getPlacementChapter().getId();
            for (int i = 0; i < chapters.size(); i++) {
                if (chapters.get(i).getId().equals(placementId)) {
                    return i;
                }
            }
        }
        return defaultPlacementIndex(config.getSlotIndex(), chapters.size());
    }

    private int defaultPlacementIndex(Integer slotIndex, int chapterCount) {
        if (chapterCount <= 0 || !isFixedExamSlot(slotIndex)) {
            return -1;
        }
        int index = switch (slotIndex) {
            case 0 -> (int) Math.ceil(chapterCount * 0.25) - 1;
            case 1 -> (int) Math.ceil(chapterCount * 0.50) - 1;
            case 2 -> (int) Math.ceil(chapterCount * 0.75) - 1;
            default -> chapterCount - 1;
        };
        return Math.max(0, Math.min(chapterCount - 1, index));
    }

    private boolean isFixedExamSlot(Integer slotIndex) {
        return slotIndex != null && slotIndex >= 0 && slotIndex < FIXED_EXAM_SLOT_COUNT;
    }

    private String fixedExamName(Integer slotIndex) {
        return isFixedExamSlot(slotIndex)
                ? FIXED_EXAM_NAMES.get(slotIndex)
                : "Bài kiểm tra";
    }

    private List<ExamConfigResponse.ExamQuestionResponse> parseExamQuestions(ExamConfig config) {
        try {
            return new ArrayList<>(objectMapper.readValue(
                    config.getQuestionsJson(),
                    new TypeReference<List<ExamConfigResponse.ExamQuestionResponse>>() {}));
        } catch (Exception e) {
            throw new BusinessException("INVALID_EXAM",
                    "Không thể đọc danh sách câu hỏi bài kiểm tra.");
        }
    }

    private SnapshotExamQuestion toSnapshotQuestion(
            ExamConfigResponse.ExamQuestionResponse question, boolean shuffleOptions) {
        if ("essay".equals(question.type())) {
            return new SnapshotExamQuestion(
                    question.id(),
                    question.text(),
                    question.type(),
                    List.of(),
                    List.of(),
                    question.explanation(),
                    question.points() != null ? question.points() : 0.0
            );
        }
        List<String> sourceOptions = question.options() != null ? question.options() : List.of();
        List<Integer> sourceCorrect = question.correctIndices() != null ? question.correctIndices() : List.of();
        List<OptionWithOriginalIndex> options = IntStream.range(0, sourceOptions.size())
                .mapToObj(i -> new OptionWithOriginalIndex(sourceOptions.get(i), i))
                .collect(java.util.stream.Collectors.toCollection(ArrayList::new));
        if (shuffleOptions) {
            Collections.shuffle(options);
        }
        List<String> optionTexts = options.stream()
                .map(OptionWithOriginalIndex::text)
                .toList();
        List<Integer> correctIndices = IntStream.range(0, options.size())
                .filter(i -> sourceCorrect.contains(options.get(i).originalIndex()))
                .boxed()
                .toList();
        return new SnapshotExamQuestion(
                question.id(),
                question.text(),
                question.type(),
                optionTexts,
                correctIndices,
                question.explanation(),
                question.points() != null ? question.points() : 0.0
        );
    }

    private List<SnapshotExamQuestion> readSnapshotQuestions(String json) {
        try {
            return objectMapper.readValue(
                    json,
                    new TypeReference<List<SnapshotExamQuestion>>() {});
        } catch (Exception e) {
            throw new BusinessException("INTERNAL_ERROR",
                    "Không thể đọc bài kiểm tra.");
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

    private int nullToZero(Integer value) {
        return value != null ? value : 0;
    }

    private void validateExamImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("FILE_REQUIRED", "Vui long chon anh bai lam.");
        }
        if (file.getContentType() == null || !ALLOWED_IMAGE_MIME.contains(file.getContentType())) {
            throw new BusinessException("INVALID_FILE_TYPE",
                    "Chi chap nhan anh JPEG, PNG hoac WEBP.");
        }
        if (file.getSize() > MAX_EXAM_IMAGE_BYTES) {
            throw new BusinessException("FILE_TOO_LARGE",
                    "Anh bai lam khong duoc vuot qua 10MB.");
        }
    }

    private String imageExtension(String contentType) {
        return switch (contentType) {
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            default -> "jpg";
        };
    }

    private record OptionWithOriginalIndex(String text, Integer originalIndex) {}

    private record SnapshotExamQuestion(
            String id,
            String text,
            String type,
            List<String> options,
            List<Integer> correctIndices,
            String explanation,
            Double points
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

    private Profile loadProfile(UUID profileId) {
        return profileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile", profileId));
    }

    private void validateSlot(Integer slotIndex) {
        if (!isFixedExamSlot(slotIndex)) {
            throw new BusinessException("INVALID_SLOT", "Vị trí bài kiểm tra không hợp lệ.");
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
