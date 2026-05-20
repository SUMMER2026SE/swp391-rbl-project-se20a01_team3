package com.beeacademy.backend.service;

import com.beeacademy.backend.dto.response.CourseResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CourseService {
    Page<CourseResponse> getAllPublished(Pageable pageable);
    Page<CourseResponse> getByCategory(String categorySlug, Pageable pageable);
    Page<CourseResponse> search(String keyword, Pageable pageable);
    CourseResponse getBySlug(String slug);
    List<CourseResponse> getFeatured();
}
