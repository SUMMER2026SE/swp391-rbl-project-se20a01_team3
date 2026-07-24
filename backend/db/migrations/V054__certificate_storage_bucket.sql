-- Chứng chỉ chứa thông tin cá nhân nên được lưu trong bucket private.
-- Backend chỉ cấp signed URL ngắn hạn cho đúng học sinh sở hữu chứng chỉ.
INSERT INTO storage.buckets (
    id, name, public, file_size_limit, allowed_mime_types
)
VALUES (
    'certificates',
    'certificates',
    false,
    10485760,
    ARRAY['application/pdf']::TEXT[]
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
