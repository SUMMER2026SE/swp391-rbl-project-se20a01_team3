package com.beeacademy.backend.repository;

import com.beeacademy.backend.model.TeacherBankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeacherBankAccountRepository extends JpaRepository<TeacherBankAccount, UUID> {

    Optional<TeacherBankAccount> findByTeacherId(UUID teacherId);
}
