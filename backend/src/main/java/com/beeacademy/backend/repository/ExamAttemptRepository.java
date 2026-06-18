package com.beeacademy.backend.repository;

import com.beeacademy.backend.model.ExamAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, UUID> {

    int countByStudentIdAndExamConfigId(UUID studentId, UUID examConfigId);

    Optional<ExamAttempt> findByIdAndStudentId(UUID id, UUID studentId);

    Optional<ExamAttempt> findFirstByStudentIdAndExamConfigIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(
            UUID studentId, UUID examConfigId);
}
