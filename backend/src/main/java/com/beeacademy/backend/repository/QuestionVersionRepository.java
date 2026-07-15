package com.beeacademy.backend.repository;

import com.beeacademy.backend.model.QuestionVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface QuestionVersionRepository extends JpaRepository<QuestionVersion, UUID> {

    long countByQuestionId(UUID questionId);
}
