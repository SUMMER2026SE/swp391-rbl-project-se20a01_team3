package com.beeacademy.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "lessons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false)
    private String title;

    private String videoUrl;

    private Integer duration;

    @Column(name = "`order`", nullable = false)
    private Integer order;

    @Column(nullable = false)
    @Builder.Default
    private boolean free = false;
}
