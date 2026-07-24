package com.beeacademy.backend.service;

import com.beeacademy.backend.model.RewardAssessmentType;
import com.beeacademy.backend.model.RewardPointTransaction;
import com.beeacademy.backend.model.RewardPointTransactionType;
import com.beeacademy.backend.model.RewardVoucher;
import com.beeacademy.backend.model.StudentRewardBalance;
import com.beeacademy.backend.model.StudentRewardVoucher;
import com.beeacademy.backend.repository.ExamConfigRepository;
import com.beeacademy.backend.repository.RewardPointTransactionRepository;
import com.beeacademy.backend.repository.RewardVoucherRepository;
import com.beeacademy.backend.repository.StudentRewardBalanceRepository;
import com.beeacademy.backend.repository.StudentRewardSourceRepository;
import com.beeacademy.backend.repository.StudentRewardVoucherRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.mock;

@ExtendWith(MockitoExtension.class)
class RewardServiceTest {

    @Mock StudentRewardBalanceRepository balanceRepository;
    @Mock StudentRewardSourceRepository sourceRepository;
    @Mock RewardVoucherRepository voucherRepository;
    @Mock StudentRewardVoucherRepository studentVoucherRepository;
    @Mock RewardPointTransactionRepository transactionRepository;
    @Mock ExamConfigRepository examConfigRepository;

    @InjectMocks RewardService rewardService;

    @Test
    void recordExamScoreAwardsOnlyTheExamScore() {
        UUID studentId = UUID.randomUUID();
        UUID examConfigId = UUID.randomUUID();
        StudentRewardBalance balance = StudentRewardBalance.create(studentId);

        when(balanceRepository.findById(studentId)).thenReturn(Optional.of(balance));
        when(sourceRepository.findByStudentIdAndAssessmentTypeAndAssessmentId(
                studentId, RewardAssessmentType.EXAM, examConfigId))
                .thenReturn(Optional.empty());
        when(examConfigRepository.findById(examConfigId)).thenReturn(Optional.empty());

        int awarded = rewardService.recordExamScore(studentId, examConfigId, 82.6);

        assertThat(awarded).isEqualTo(83);
        assertThat(balance.getAvailablePoints()).isEqualTo(83);
        assertThat(balance.getLifetimePoints()).isEqualTo(83);
        verify(sourceRepository).findByStudentIdAndAssessmentTypeAndAssessmentId(
                studentId, RewardAssessmentType.EXAM, examConfigId);
        verify(balanceRepository).save(balance);
        verify(transactionRepository).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void redeemVoucherRecordsTheSpentPoints() {
        UUID studentId = UUID.randomUUID();
        UUID voucherId = UUID.randomUUID();
        StudentRewardBalance balance = StudentRewardBalance.create(studentId);
        balance.addPoints(150);
        RewardVoucher voucher = mock(RewardVoucher.class);

        when(voucherRepository.findById(voucherId)).thenReturn(Optional.of(voucher));
        when(voucher.getActive()).thenReturn(true);
        when(voucher.getRequiredPoints()).thenReturn(100);
        when(voucher.getDisplayName()).thenReturn("Voucher 30K");
        when(voucher.getCode()).thenReturn("BRONZE_30K");
        when(balanceRepository.findById(studentId)).thenReturn(Optional.of(balance));
        when(sourceRepository.sumAwardedPointsByStudentIdAndAssessmentType(
                studentId, RewardAssessmentType.EXAM)).thenReturn(150L);
        when(studentVoucherRepository.save(any(StudentRewardVoucher.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        rewardService.redeemVoucher(studentId, voucherId);

        assertThat(balance.getAvailablePoints()).isEqualTo(50);
        ArgumentCaptor<RewardPointTransaction> transactionCaptor =
                ArgumentCaptor.forClass(RewardPointTransaction.class);
        verify(transactionRepository).save(transactionCaptor.capture());
        assertThat(transactionCaptor.getValue().getTransactionType())
                .isEqualTo(RewardPointTransactionType.VOUCHER_REDEMPTION);
        assertThat(transactionCaptor.getValue().getPointsDelta()).isEqualTo(-100);
    }

    @Test
    void getWalletDerivesAvailablePointsFromExamScoresInsteadOfLegacyBalance() {
        UUID studentId = UUID.randomUUID();
        StudentRewardBalance balance = StudentRewardBalance.create(studentId);
        balance.addPoints(294);

        when(balanceRepository.findById(studentId)).thenReturn(Optional.of(balance));
        when(sourceRepository.sumAwardedPointsByStudentIdAndAssessmentType(
                studentId, RewardAssessmentType.EXAM)).thenReturn(154L);

        var wallet = rewardService.getWallet(studentId);

        assertThat(wallet.availablePoints()).isEqualTo(154);
        assertThat(wallet.lifetimePoints()).isEqualTo(154);
        verify(balanceRepository).save(balance);
    }
}
