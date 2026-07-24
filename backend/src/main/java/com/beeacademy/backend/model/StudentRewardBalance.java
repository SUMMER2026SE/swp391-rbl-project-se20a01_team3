package com.beeacademy.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "student_reward_balances")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StudentRewardBalance {

    @Id
    @Column(name = "student_id", nullable = false, updatable = false)
    private UUID studentId;

    @Column(name = "available_points", nullable = false)
    private Integer availablePoints;

    @Column(name = "lifetime_points", nullable = false)
    private Integer lifetimePoints;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static StudentRewardBalance create(UUID studentId) {
        StudentRewardBalance balance = new StudentRewardBalance();
        balance.studentId = studentId;
        balance.availablePoints = 0;
        balance.lifetimePoints = 0;
        balance.updatedAt = Instant.now();
        return balance;
    }

    public void addPoints(int points) {
        if (points <= 0) return;
        this.availablePoints += points;
        this.lifetimePoints += points;
        this.updatedAt = Instant.now();
    }

    public void spendPoints(int points) {
        if (points <= 0) return;
        if (this.availablePoints < points) {
            throw new IllegalStateException("Not enough reward points");
        }
        this.availablePoints -= points;
        this.updatedAt = Instant.now();
    }

    public boolean reconcileFromExamPoints(int lifetimePoints, int spentPoints) {
        int normalizedLifetime = Math.max(0, lifetimePoints);
        int normalizedSpent = Math.max(0, spentPoints);
        int normalizedAvailable = Math.max(0, normalizedLifetime - normalizedSpent);
        if (this.lifetimePoints == normalizedLifetime
                && this.availablePoints == normalizedAvailable) {
            return false;
        }
        this.lifetimePoints = normalizedLifetime;
        this.availablePoints = normalizedAvailable;
        this.updatedAt = Instant.now();
        return true;
    }
}
