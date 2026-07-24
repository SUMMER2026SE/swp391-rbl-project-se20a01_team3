package com.beeacademy.backend.dto.response;

import com.beeacademy.backend.model.RewardVoucher;
import com.beeacademy.backend.model.RewardPointTransaction;
import com.beeacademy.backend.model.RewardPointTransactionType;
import com.beeacademy.backend.model.StudentRewardVoucher;
import com.beeacademy.backend.model.StudentRewardVoucherStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record RewardWalletResponse(
        Integer availablePoints,
        Integer lifetimePoints,
        List<RewardVoucherResponse> catalog,
        List<StudentRewardVoucherResponse> vouchers,
        List<RewardPointTransactionResponse> transactions
) {
    public record RewardVoucherResponse(
            UUID id,
            String code,
            String displayName,
            Integer requiredPoints,
            Integer discountAmount,
            Boolean active
    ) {
        public static RewardVoucherResponse from(RewardVoucher voucher) {
            return new RewardVoucherResponse(
                    voucher.getId(),
                    voucher.getCode(),
                    voucher.getDisplayName(),
                    voucher.getRequiredPoints(),
                    voucher.getDiscountAmount(),
                    voucher.getActive());
        }
    }

    public record StudentRewardVoucherResponse(
            UUID id,
            UUID voucherId,
            String code,
            String displayName,
            Integer discountAmount,
            StudentRewardVoucherStatus status,
            Instant redeemedAt,
            Instant usedAt
    ) {
        public static StudentRewardVoucherResponse from(StudentRewardVoucher studentVoucher) {
            return new StudentRewardVoucherResponse(
                    studentVoucher.getId(),
                    studentVoucher.getVoucher().getId(),
                    studentVoucher.getVoucher().getCode(),
                    studentVoucher.getVoucher().getDisplayName(),
                    studentVoucher.getVoucher().getDiscountAmount(),
                    studentVoucher.getStatus(),
                    studentVoucher.getRedeemedAt(),
                    studentVoucher.getUsedAt());
        }
    }

    public record RewardPointTransactionResponse(
            UUID id,
            RewardPointTransactionType type,
            Integer pointsDelta,
            UUID referenceId,
            String title,
            String description,
            BigDecimal scorePercent,
            Instant createdAt
    ) {
        public static RewardPointTransactionResponse from(RewardPointTransaction transaction) {
            return new RewardPointTransactionResponse(
                    transaction.getId(),
                    transaction.getTransactionType(),
                    transaction.getPointsDelta(),
                    transaction.getReferenceId(),
                    transaction.getTitle(),
                    transaction.getDescription(),
                    transaction.getScorePercent(),
                    transaction.getCreatedAt());
        }
    }
}
