package com.beeacademy.backend.dto.response;

import com.beeacademy.backend.model.Course;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CourseResponse {
    private Long id;
    private String slug;
    private String title;
    private String description;
    private String thumbnail;
    private Integer price;
    private Integer salePrice;
    private String categoryName;
    private String categorySlug;
    private String grades;
    private boolean published;
    private boolean featured;
    private Double avgRating;
    private Long reviewCount;
    private Long enrollmentCount;
    private LocalDateTime createdAt;

    public static CourseResponse from(Course course) {
        return CourseResponse.builder()
                .id(course.getId())
                .slug(course.getSlug())
                .title(course.getTitle())
                .description(course.getDescription())
                .thumbnail(course.getThumbnail())
                .price(course.getPrice())
                .salePrice(course.getSalePrice())
                .categoryName(course.getCategory() != null ? course.getCategory().getName() : null)
                .categorySlug(course.getCategory() != null ? course.getCategory().getSlug() : null)
                .grades(course.getGrades())
                .published(course.isPublished())
                .featured(course.isFeatured())
                .createdAt(course.getCreatedAt())
                .build();
    }
}
