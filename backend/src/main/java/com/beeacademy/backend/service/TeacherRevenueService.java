package com.beeacademy.backend.service;

import com.beeacademy.backend.dto.response.PayoutPeriodResponse;
import com.beeacademy.backend.dto.response.RevenueSplitResponse;
import com.beeacademy.backend.model.Course;
import com.beeacademy.backend.model.PayoutPeriod;
import com.beeacademy.backend.model.Profile;
import com.beeacademy.backend.model.RevenueSplit;
import com.beeacademy.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeacherRevenueService {

    private final RevenueSplitRepository splitRepo;
    private final PayoutPeriodRepository periodRepo;
    private final ProfileRepository profileRepo;
    private final CourseRepository courseRepo;

    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

    @Transactional
    public void createRevenueSplit(UUID teacherId, UUID studentId, UUID courseId,
                                    UUID orderId, int grossAmount) {
        String monthYear = ZonedDateTime.now(ZoneOffset.UTC).format(MONTH_FMT);

        PayoutPeriod period = periodRepo.findByTeacherIdAndMonthYear(teacherId, monthYear)
                .orElseGet(() -> periodRepo.save(PayoutPeriod.create(teacherId, monthYear)));

        RevenueSplit split = RevenueSplit.create(teacherId, studentId, courseId,
                orderId, period.getId(), grossAmount);
        splitRepo.save(split);
        log.info("Revenue split created: teacher={} course={} amount={}", teacherId, courseId, grossAmount);
    }

    @Transactional(readOnly = true)
    public List<RevenueSplitResponse> getSplits(UUID teacherId) {
        List<RevenueSplit> splits = splitRepo.findByTeacherIdOrderByOccurredAtDesc(teacherId);

        Set<UUID> studentIds = splits.stream().map(RevenueSplit::getStudentId).collect(Collectors.toSet());
        Set<UUID> courseIds  = splits.stream().map(RevenueSplit::getCourseId).collect(Collectors.toSet());

        Map<UUID, String> studentNames = profileRepo.findAllById(studentIds).stream()
                .collect(Collectors.toMap(Profile::getId,
                        p -> p.getFullName() != null ? p.getFullName() : "Học viên"));
        Map<UUID, String> courseTitles = courseRepo.findAllById(courseIds).stream()
                .collect(Collectors.toMap(Course::getId, Course::getTitle));

        return splits.stream()
                .map(s -> RevenueSplitResponse.from(s,
                        studentNames.getOrDefault(s.getStudentId(), "Học viên"),
                        courseTitles.getOrDefault(s.getCourseId(), "Khóa học")))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PayoutPeriodResponse> getPeriods(UUID teacherId) {
        return periodRepo.findByTeacherIdOrderByMonthYearDesc(teacherId).stream()
                .map(p -> PayoutPeriodResponse.from(
                        p,
                        splitRepo.countByPayoutPeriodId(p.getId()),
                        splitRepo.sumGrossAmountByPeriodId(p.getId()),
                        splitRepo.sumTeacherAmountByPeriodId(p.getId())))
                .toList();
    }
}
