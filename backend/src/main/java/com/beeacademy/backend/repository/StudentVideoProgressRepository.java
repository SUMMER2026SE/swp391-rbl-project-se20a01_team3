package com.beeacademy.backend.repository;

import com.beeacademy.backend.model.StudentVideoProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentVideoProgressRepository extends JpaRepository<StudentVideoProgress, UUID> {

    Optional<StudentVideoProgress> findByStudent_IdAndLesson_Id(UUID studentId, UUID lessonId);

    Optional<StudentVideoProgress> findFirstByStudent_IdAndLesson_Chapter_Course_IdOrderByUpdatedAtDesc(
            UUID studentId,
            UUID courseId
    );
}
