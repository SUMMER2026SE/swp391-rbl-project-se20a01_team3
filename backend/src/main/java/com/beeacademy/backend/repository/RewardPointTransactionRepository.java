package com.beeacademy.backend.repository;

import com.beeacademy.backend.model.RewardPointTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RewardPointTransactionRepository extends JpaRepository<RewardPointTransaction, UUID> {

    List<RewardPointTransaction> findByStudentIdOrderByCreatedAtDesc(UUID studentId);
}
