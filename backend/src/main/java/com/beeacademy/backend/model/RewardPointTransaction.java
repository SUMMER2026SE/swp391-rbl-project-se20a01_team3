package com.beeacademy.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reward_point_transactions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RewardPointTransaction {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "student_id", nullable = false, updatable = false)
    private UUID studentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, updatable = false)
    private RewardPointTransactionType transactionType;

    @Column(name = "points_delta", nullable = false, updatable = false)
    private Integer pointsDelta;

    @Column(name = "reference_id", updatable = false)
    private UUID referenceId;

    @Column(name = "title", nullable = false, updatable = false)
    private String title;

    @Column(name = "description", updatable = false)
    private String description;

    @Column(name = "score_percent", precision = 5, scale = 1, updatable = false)
    private BigDecimal scorePercent;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public static RewardPointTransaction examReward(
            UUID studentId,
            UUID examConfigId,
            String examName,
            String courseTitle,
            double scorePercent,
            int awardedPoints) {
        if (awardedPoints <= 0) {
            throw new IllegalArgumentException("Exam reward points must be positive");
        }
        RewardPointTransaction transaction = base(
                studentId,
                RewardPointTransactionType.EXAM_REWARD,
                awardedPoints,
                examConfigId,
                fallback(examName, "Bài kiểm tra"),
                blankToNull(courseTitle));
        transaction.scorePercent = BigDecimal
                .valueOf(Math.max(0.0, Math.min(100.0, scorePercent)))
                .setScale(1, RoundingMode.HALF_UP);
        return transaction;
    }

    public static RewardPointTransaction voucherRedemption(
            UUID studentId,
            UUID studentVoucherId,
            String voucherName,
            String voucherCode,
            int spentPoints) {
        if (spentPoints <= 0) {
            throw new IllegalArgumentException("Spent reward points must be positive");
        }
        return base(
                studentId,
                RewardPointTransactionType.VOUCHER_REDEMPTION,
                -spentPoints,
                studentVoucherId,
                fallback(voucherName, "Voucher"),
                blankToNull(voucherCode));
    }

    private static RewardPointTransaction base(
            UUID studentId,
            RewardPointTransactionType type,
            int pointsDelta,
            UUID referenceId,
            String title,
            String description) {
        RewardPointTransaction transaction = new RewardPointTransaction();
        transaction.id = UUID.randomUUID();
        transaction.studentId = studentId;
        transaction.transactionType = type;
        transaction.pointsDelta = pointsDelta;
        transaction.referenceId = referenceId;
        transaction.title = title;
        transaction.description = description;
        transaction.createdAt = Instant.now();
        return transaction;
    }

    private static String fallback(String value, String fallback) {
        String normalized = blankToNull(value);
        return normalized != null ? normalized : fallback;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
