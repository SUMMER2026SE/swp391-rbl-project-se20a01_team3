package com.beeacademy.backend.service.impl;

import com.beeacademy.backend.dto.response.CourseResponse;
import com.beeacademy.backend.exception.ResourceNotFoundException;
import com.beeacademy.backend.model.Category;
import com.beeacademy.backend.model.Course;
import com.beeacademy.backend.repository.CategoryRepository;
import com.beeacademy.backend.repository.CourseRepository;
import com.beeacademy.backend.repository.EnrollmentRepository;
import com.beeacademy.backend.repository.ReviewRepository;
import com.beeacademy.backend.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final CategoryRepository categoryRepository;
    private final ReviewRepository reviewRepository;
    private final EnrollmentRepository enrollmentRepository;

    @Override
    public Page<CourseResponse> getAllPublished(Pageable pageable) {
        return courseRepository.findByPublishedTrue(pageable)
                .map(this::toResponseWithStats);
    }

    @Override
    public Page<CourseResponse> getByCategory(String categorySlug, Pageable pageable) {
        Category category = categoryRepository.findBySlug(categorySlug)
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại: " + categorySlug));
        return courseRepository.findByPublishedTrueAndCategory(category, pageable)
                .map(this::toResponseWithStats);
    }

    @Override
    public Page<CourseResponse> search(String keyword, Pageable pageable) {
        return courseRepository.searchByKeyword(keyword, pageable)
                .map(this::toResponseWithStats);
    }

    @Override
    public CourseResponse getBySlug(String slug) {
        Course course = courseRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Khóa học không tồn tại: " + slug));
        return toResponseWithStats(course);
    }

    @Override
    public List<CourseResponse> getFeatured() {
        return courseRepository.findByPublishedTrueAndFeaturedTrue()
                .stream()
                .map(this::toResponseWithStats)
                .toList();
    }

    private CourseResponse toResponseWithStats(Course course) {
        Double avgRating = reviewRepository.findAvgRatingByCourseId(course.getId());
        long reviewCount = course.getReviews() != null ? course.getReviews().size() : 0;
        long enrollmentCount = enrollmentRepository.countByCourseId(course.getId());

        return CourseResponse.from(course).toBuilder()
                .avgRating(avgRating)
                .reviewCount(reviewCount)
                .enrollmentCount(enrollmentCount)
                .build();
    }
}
