package com.beeacademy.backend.repository;

import com.beeacademy.backend.model.PayoutPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayoutPeriodRepository extends JpaRepository<PayoutPeriod, UUID> {

    Optional<PayoutPeriod> findByTeacherIdAndMonthYear(UUID teacherId, String monthYear);

    List<PayoutPeriod> findByTeacherIdOrderByMonthYearDesc(UUID teacherId);
}
