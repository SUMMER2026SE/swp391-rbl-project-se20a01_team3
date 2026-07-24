package com.beeacademy.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Đồng bộ danh mục voucher trong các môi trường chưa chạy Flyway SQL thủ công.
 */
@Component
@RequiredArgsConstructor
public class BeeRewardVoucherCatalogMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        jdbcTemplate.update("""
                UPDATE public.reward_vouchers
                SET display_name = 'Ong Mật - Giảm 30K',
                    required_points = 300,
                    discount_amount = 30000,
                    sort_order = 1,
                    active = TRUE
                WHERE code = 'ONG_MAT_30K'
                """);
        jdbcTemplate.update("""
                UPDATE public.reward_vouchers
                SET display_name = 'Ong Vàng - Giảm 60K',
                    required_points = 700,
                    discount_amount = 60000,
                    sort_order = 2,
                    active = TRUE
                WHERE code = 'ONG_VANG_60K'
                """);
        jdbcTemplate.update("""
                UPDATE public.reward_vouchers
                SET display_name = 'Ong Chúa - Giảm 100K',
                    required_points = 1200,
                    discount_amount = 100000,
                    sort_order = 3,
                    active = TRUE
                WHERE code = 'ONG_CHUA_100K'
                """);
        jdbcTemplate.update("""
                UPDATE public.reward_vouchers
                SET code = 'ONG_MAT_30K',
                    display_name = 'Ong Mật - Giảm 30K',
                    required_points = 300,
                    discount_amount = 30000,
                    sort_order = 1,
                    active = TRUE
                WHERE code = 'BRONZE_30K'
                  AND NOT EXISTS (
                      SELECT 1 FROM public.reward_vouchers WHERE code = 'ONG_MAT_30K'
                  )
                """);
        jdbcTemplate.update("""
                UPDATE public.reward_vouchers
                SET code = 'ONG_VANG_60K',
                    display_name = 'Ong Vàng - Giảm 60K',
                    required_points = 700,
                    discount_amount = 60000,
                    sort_order = 2,
                    active = TRUE
                WHERE code = 'SILVER_70K'
                  AND NOT EXISTS (
                      SELECT 1 FROM public.reward_vouchers WHERE code = 'ONG_VANG_60K'
                  )
                """);
        jdbcTemplate.update("""
                UPDATE public.reward_vouchers
                SET code = 'ONG_CHUA_100K',
                    display_name = 'Ong Chúa - Giảm 100K',
                    required_points = 1200,
                    discount_amount = 100000,
                    sort_order = 3,
                    active = TRUE
                WHERE code = 'GOLD_150K'
                  AND NOT EXISTS (
                      SELECT 1 FROM public.reward_vouchers WHERE code = 'ONG_CHUA_100K'
                  )
                """);
        jdbcTemplate.update("""
                UPDATE public.reward_vouchers
                SET active = FALSE
                WHERE code IN ('BRONZE_30K', 'SILVER_70K', 'GOLD_150K')
                """);

        jdbcTemplate.update("""
                INSERT INTO public.reward_vouchers
                    (id, code, display_name, required_points, discount_amount, sort_order, active)
                VALUES
                    (gen_random_uuid(), 'ONG_MAT_30K', 'Ong Mật - Giảm 30K', 300, 30000, 1, TRUE),
                    (gen_random_uuid(), 'ONG_VANG_60K', 'Ong Vàng - Giảm 60K', 700, 60000, 2, TRUE),
                    (gen_random_uuid(), 'ONG_CHUA_100K', 'Ong Chúa - Giảm 100K', 1200, 100000, 3, TRUE)
                ON CONFLICT (code) DO UPDATE
                SET display_name = EXCLUDED.display_name,
                    required_points = EXCLUDED.required_points,
                    discount_amount = EXCLUDED.discount_amount,
                    sort_order = EXCLUDED.sort_order,
                    active = EXCLUDED.active
                """);
    }
}
