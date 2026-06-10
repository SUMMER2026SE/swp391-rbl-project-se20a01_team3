package com.beeacademy.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "revenue_splits")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RevenueSplit {

    public static final int DEFAULT_TEACHER_PERCENT = 70;

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "teacher_id", nullable = false, updatable = false)
    private UUID teacherId;

    @Column(name = "student_id", nullable = false, updatable = false)
    private UUID studentId;

    @Column(name = "course_id", nullable = false, updatable = false)
    private UUID courseId;

    @Column(name = "order_id", nullable = false, updatable = false)
    private UUID orderId;

    @Column(name = "payout_period_id")
    private UUID payoutPeriodId;

    @Column(name = "gross_amount", nullable = false)
    private int grossAmount;

    @Column(name = "platform_fee", nullable = false)
    private int platformFee;

    @Column(name = "teacher_amount", nullable = false)
    private int teacherAmount;

    @Column(name = "teacher_percent", nullable = false)
    private int teacherPercent;

    @Column(name = "occurred_at", nullable = false, updatable = false)
    private Instant occurredAt;

    public static RevenueSplit create(UUID teacherId, UUID studentId, UUID courseId,
                                      UUID orderId, UUID payoutPeriodId, int grossAmount) {
        RevenueSplit s = new RevenueSplit();
        s.id = UUID.randomUUID();
        s.teacherId = teacherId;
        s.studentId = studentId;
        s.courseId = courseId;
        s.orderId = orderId;
        s.payoutPeriodId = payoutPeriodId;
        s.grossAmount = grossAmount;
        s.teacherPercent = DEFAULT_TEACHER_PERCENT;
        s.teacherAmount = (int) Math.round(grossAmount * DEFAULT_TEACHER_PERCENT / 100.0);
        s.platformFee = grossAmount - s.teacherAmount;
        s.occurredAt = Instant.now();
        return s;
    }
}
