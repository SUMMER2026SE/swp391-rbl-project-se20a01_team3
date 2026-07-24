package com.beeacademy.backend.repository;

import com.beeacademy.backend.model.RewardPointTransaction;
import com.beeacademy.backend.model.RewardPointTransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RewardPointTransactionRepository extends JpaRepository<RewardPointTransaction, UUID> {

    List<RewardPointTransaction> findByStudentIdOrderByCreatedAtDesc(UUID studentId);

    List<RewardPointTransaction> findByStudentIdAndTransactionTypeInOrderByCreatedAtDesc(
            UUID studentId,
            List<RewardPointTransactionType> transactionTypes);

    @Query("""
            SELECT COALESCE(SUM(-tx.pointsDelta), 0)
            FROM RewardPointTransaction tx
            WHERE tx.studentId = :studentId
              AND tx.transactionType = :transactionType
            """)
    long sumSpentPointsByStudentIdAndTransactionType(
            @Param("studentId") UUID studentId,
            @Param("transactionType") RewardPointTransactionType transactionType);
}
