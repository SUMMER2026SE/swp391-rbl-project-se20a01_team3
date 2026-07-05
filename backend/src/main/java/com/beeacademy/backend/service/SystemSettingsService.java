package com.beeacademy.backend.service;

import com.beeacademy.backend.dto.request.UpdateSystemSettingsRequest;
import com.beeacademy.backend.dto.response.SystemSettingsResponse;
import com.beeacademy.backend.model.SystemSettings;
import com.beeacademy.backend.repository.SystemSettingsRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Cấu hình hệ thống single-row (phí nền tảng, chế độ bảo trì).
 *
 * <p>{@code maintenanceModeCache} giữ giá trị maintenance mode trong bộ nhớ
 * để {@code MaintenanceModeFilter} kiểm tra ở MỌI request mà không cần query
 * DB mỗi lần — chỉ đọc/ghi DB khi Admin thực sự thay đổi cấu hình.
 */
@Service
@RequiredArgsConstructor
public class SystemSettingsService {

    private final SystemSettingsRepository settingsRepository;

    private final AtomicBoolean maintenanceModeCache = new AtomicBoolean(false);

    @PostConstruct
    void init() {
        maintenanceModeCache.set(getOrCreate().isMaintenanceMode());
    }

    public boolean isMaintenanceModeOn() {
        return maintenanceModeCache.get();
    }

    @Transactional(readOnly = true)
    public SystemSettingsResponse getSettings() {
        return toResponse(getOrCreate());
    }

    @Transactional
    public SystemSettingsResponse updateSettings(UpdateSystemSettingsRequest request) {
        SystemSettings settings = getOrCreate();
        settings.setMaintenanceMode(request.maintenanceMode());
        settings.setPlatformFeePercent(request.platformFeePercent());
        settings = settingsRepository.save(settings);
        maintenanceModeCache.set(settings.isMaintenanceMode());
        return toResponse(settings);
    }

    private SystemSettings getOrCreate() {
        return settingsRepository.findById(SystemSettings.SINGLETON_ID)
                .orElseGet(() -> settingsRepository.save(new SystemSettings()));
    }

    private SystemSettingsResponse toResponse(SystemSettings settings) {
        return new SystemSettingsResponse(
                settings.isMaintenanceMode(),
                settings.getPlatformFeePercent(),
                settings.getUpdatedAt()
        );
    }
}
