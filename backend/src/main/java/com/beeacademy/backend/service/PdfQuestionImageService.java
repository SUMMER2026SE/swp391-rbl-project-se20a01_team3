package com.beeacademy.backend.service;

import com.beeacademy.backend.dto.response.ScannedQuestion;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.contentstream.operator.Operator;
import org.apache.pdfbox.cos.COSBase;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.graphics.PDXObject;
import org.apache.pdfbox.pdmodel.graphics.form.PDFormXObject;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.TextPosition;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Tự động ghép ảnh nhúng trong PDF (đề thi scan) vào đúng câu hỏi Gemini đã trích ra (AI Scan).
 *
 * <p><b>Cách ghép — theo TRANG, không theo tọa độ hình học</b>: PDFBox có 2 callback tách rời —
 * {@code writeString()} (text, được PDFTextStripper gộp dòng/buffer trước khi gọi) và
 * {@code processOperator()} (mọi operator kể cả vẽ ảnh "Do", gọi ngay lập tức theo đúng thứ tự
 * trong content stream). Hai callback này KHÔNG đồng bộ thời điểm với nhau — ảnh có thể được xử lý
 * trước khi đoạn text đứng trước nó trong tài liệu kịp "flush" ra writeString — nên không thể tin
 * tưởng thứ tự gọi callback để suy ra thứ tự đọc thực tế.
 *
 * <p>Thay vào đó, ghép ở mức TRANG (ranh giới trang là mốc chắc chắn, không bị buffer trễ):
 * mỗi trang, gom toàn bộ câu hỏi mới khớp được (theo đúng thứ tự xuất hiện trong text của trang)
 * và toàn bộ ảnh tìm được (theo đúng thứ tự trong content stream của trang), rồi chia đều ảnh cho
 * các câu theo thứ tự. Trang không có câu hỏi mới nào (VD trang tiếp theo của cùng 1 câu) thì toàn
 * bộ ảnh trên trang đó thuộc về câu hỏi đang xét gần nhất từ trang trước.
 *
 * <p>Đây là suy đoán tốt nhất (best-effort — giáo viên đã chọn phương án tự động hoàn toàn khi
 * duyệt tính năng) — không đảm bảo đúng 100%, đặc biệt khi nhiều câu hỏi + nhiều ảnh cùng nằm
 * trên 1 trang. Giáo viên vẫn cần xem lại bảng preview trước khi nhập.
 *
 * <p>Hai lớp lọc nhiễu, cả hai đều chạy TRƯỚC khi chia ảnh cho câu:
 * <ul>
 *   <li>Ảnh quá nhỏ (&lt; 30px mỗi chiều) — thường là icon/bullet, không phải hình minh họa.</li>
 *   <li>Ảnh trùng nội dung (hash giống nhau) xuất hiện ≥ 2 lần trong file — thường là logo/watermark
 *       lặp lại mỗi trang, không phải hình riêng cho từng câu.</li>
 * </ul>
 * Thứ tự này là bắt buộc: phép chia dựa trên SỐ ảnh của trang, nên nếu logo còn nằm trong danh sách
 * lúc chia thì nó chiếm mất một suất rồi mới bị loại — ảnh thật bị đẩy sang câu bên cạnh, câu cuối
 * trang mất ảnh. Đề thi thật gần như luôn có logo trường lặp ở mọi trang nên đây không phải ca hiếm.
 *
 * <p>Toàn bộ lỗi trong quá trình ghép ảnh đều bị nuốt và trả lại danh sách câu hỏi dạng chữ như cũ —
 * đây là phần cộng thêm, không được phép làm hỏng luồng AI Scan chính.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PdfQuestionImageService {

    private static final int MIN_IMAGE_DIMENSION = 30;
    private static final int MAX_IMAGES_TOTAL = 200;
    private static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;
    private static final int ANCHOR_PREFIX_LENGTH = 40;

    private final ContentUploadService contentUploadService;

    public List<ScannedQuestion> attachImages(byte[] pdfBytes, List<ScannedQuestion> questions, UUID teacherId) {
        if (questions == null || questions.isEmpty()) {
            return questions;
        }
        try {
            List<String> anchors = questions.stream()
                    .map(q -> truncate(normalize(q.content()), ANCHOR_PREFIX_LENGTH))
                    .toList();

            List<PageCapture> pages = extractPages(pdfBytes, anchors);
            Map<Integer, List<byte[]>> byQuestion = assignImagesToQuestions(pages);
            if (byQuestion.isEmpty()) {
                return questions;
            }

            List<ScannedQuestion> result = new ArrayList<>(questions);
            for (Map.Entry<Integer, List<byte[]>> entry : byQuestion.entrySet()) {
                applyImages(result, entry.getKey(), entry.getValue(), teacherId);
            }
            return result;
        } catch (Exception e) {
            log.warn("Khong the tu dong ghep anh tu PDF vao cau hoi - giu nguyen cau hoi dang chu: {}", e.getMessage());
            return questions;
        }
    }

    private void applyImages(List<ScannedQuestion> result, int idx, List<byte[]> images, UUID teacherId) {
        ScannedQuestion q = result.get(idx);
        if (!"multiple_choice".equals(q.type()) && !"true_false".equals(q.type())) {
            return;
        }

        List<String> urls = new ArrayList<>();
        for (byte[] png : images) {
            try {
                urls.add(contentUploadService.uploadGeneratedQuestionImage(teacherId, png).publicUrl());
            } catch (Exception ex) {
                log.warn("Khong upload duoc anh trich tu PDF cho cau {}: {}", idx + 1, ex.getMessage());
            }
        }
        if (urls.isEmpty()) {
            return;
        }

        if (urls.size() == 1) {
            result.set(idx, q.withPromptAssetUrl(urls.get(0)));
            return;
        }

        List<ScannedQuestion.ScannedChoice> choices = new ArrayList<>(q.choices());
        for (int i = 0; i < Math.min(urls.size(), choices.size()); i++) {
            choices.set(i, choices.get(i).withImageUrl(urls.get(i)));
        }
        result.set(idx, q.withChoices(choices));
    }

    /**
     * Chia đều ảnh của từng trang cho các câu hỏi mới khớp trên trang đó, theo đúng thứ tự.
     * Trang không có câu mới nào → toàn bộ ảnh thuộc về câu đang xét gần nhất từ trang trước.
     *
     * <p>Logo/watermark bị loại NGAY TRƯỚC phép chia của từng trang, không phải sau — xem javadoc
     * đầu lớp.
     */
    private Map<Integer, List<byte[]>> assignImagesToQuestions(List<PageCapture> pages) {
        Set<String> repeated = repeatedHashes(pages);

        Map<Integer, List<byte[]>> result = new LinkedHashMap<>();
        int total = 0;
        int carryOverQuestion = -1;

        for (PageCapture page : pages) {
            List<RawImage> images = page.images().stream()
                    .filter(image -> !repeated.contains(image.hash()))
                    .toList();
            List<Integer> anchors = page.anchorIndices();

            for (int i = 0; i < images.size(); i++) {
                if (total >= MAX_IMAGES_TOTAL) return result;
                int questionIndex = anchors.isEmpty()
                        ? carryOverQuestion
                        : anchors.get(Math.min(anchors.size() - 1, i * anchors.size() / images.size()));
                if (questionIndex < 0) continue;
                result.computeIfAbsent(questionIndex, k -> new ArrayList<>()).add(images.get(i).bytes());
                total++;
            }

            if (!anchors.isEmpty()) {
                carryOverQuestion = anchors.get(anchors.size() - 1);
            }
        }
        return result;
    }

    /** Hash của những ảnh xuất hiện ≥ 2 lần trong cả file — logo/watermark lặp mỗi trang. */
    private Set<String> repeatedHashes(List<PageCapture> pages) {
        Map<String, Long> hashCounts = new HashMap<>();
        pages.forEach(page -> page.images().forEach(image -> hashCounts.merge(image.hash(), 1L, Long::sum)));
        Set<String> repeated = new HashSet<>();
        hashCounts.forEach((hash, count) -> {
            if (count > 1) repeated.add(hash);
        });
        return repeated;
    }

    private List<PageCapture> extractPages(byte[] pdfBytes, List<String> anchors) throws IOException {
        try (PDDocument doc = Loader.loadPDF(pdfBytes)) {
            ImageEventStripper stripper = new ImageEventStripper(anchors);
            stripper.getText(doc);
            return stripper.pages;
        }
    }

    private static String normalize(String text) {
        return text == null ? "" : text.toLowerCase().replaceAll("\\s+", " ").trim();
    }

    private static String truncate(String text, int maxLen) {
        return text.length() > maxLen ? text.substring(0, maxLen) : text;
    }

    private static String sha256(byte[] data) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(data);
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return String.valueOf(data.length);
        }
    }

    private record RawImage(byte[] bytes, String hash) {}

    /** Ảnh + câu hỏi mới của một trang, mỗi thứ theo đúng thứ tự xuất hiện trên trang đó. */
    private record PageCapture(List<RawImage> images, List<Integer> anchorIndices) {}

    /**
     * Đọc PDF theo từng trang: trong 1 trang, câu hỏi mới khớp được (writeString) và ảnh tìm được
     * (processOperator, operator "Do") đều được ghi nhận theo đúng thứ tự xuất hiện RIÊNG trong
     * từng luồng của chúng. Stripper chỉ GOM theo trang, không tự ghép ảnh vào câu — việc chia để
     * {@link #assignImagesToQuestions} làm sau, khi đã biết ảnh nào là logo lặp cần loại.
     */
    private static class ImageEventStripper extends PDFTextStripper {
        private final List<String> anchors;
        private final boolean[] matched;
        private final List<PageCapture> pages = new ArrayList<>();
        // PDFBox gọi writeString() theo từng đoạn nhỏ (có thể chỉ vài từ mỗi lần), không phải
        // nguyên câu — nên phải gộp dần vào buffer rồi so khớp trên phần đã gộp.
        private final StringBuilder textBuffer = new StringBuilder();
        private final List<Integer> anchorsMatchedThisPage = new ArrayList<>();
        private final List<RawImage> imagesThisPage = new ArrayList<>();

        ImageEventStripper(List<String> anchors) throws IOException {
            super();
            this.anchors = anchors;
            this.matched = new boolean[anchors.size()];
        }

        @Override
        protected void writeString(String text, List<TextPosition> textPositions) throws IOException {
            String norm = normalize(text);
            if (!norm.isBlank()) {
                textBuffer.append(' ').append(norm);
                String accumulated = textBuffer.toString();
                for (int i = 0; i < anchors.size(); i++) {
                    if (!matched[i] && !anchors.get(i).isBlank() && accumulated.contains(anchors.get(i))) {
                        matched[i] = true;
                        anchorsMatchedThisPage.add(i);
                    }
                }
            }
            super.writeString(text, textPositions);
        }

        @Override
        protected void processOperator(Operator operator, List<COSBase> operands) throws IOException {
            if ("Do".equals(operator.getName()) && !operands.isEmpty() && operands.get(0) instanceof COSName name) {
                PDXObject xobject = getResources().getXObject(name);
                if (xobject instanceof PDImageXObject imageXObject) {
                    capturePendingImage(imageXObject);
                    return;
                }
                if (xobject instanceof PDFormXObject formXObject) {
                    showForm(formXObject);
                    return;
                }
            }
            super.processOperator(operator, operands);
        }

        @Override
        protected void endPage(PDPage page) throws IOException {
            finalizePage();
            super.endPage(page);
        }

        private void capturePendingImage(PDImageXObject imageXObject) {
            try {
                if (imageXObject.getWidth() < MIN_IMAGE_DIMENSION || imageXObject.getHeight() < MIN_IMAGE_DIMENSION) {
                    return;
                }
                BufferedImage image = imageXObject.getImage();
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                ImageIO.write(image, "png", out);
                byte[] bytes = out.toByteArray();
                if (bytes.length == 0 || bytes.length > MAX_IMAGE_BYTES) return;
                imagesThisPage.add(new RawImage(bytes, sha256(bytes)));
            } catch (Exception e) {
                // Ảnh lỗi (encoding lạ, hỏng...) — bỏ qua ảnh này, không chặn cả file.
            }
        }

        /** Chốt sổ một trang: cất ảnh + câu hỏi mới của trang, chưa ghép gì cả. */
        private void finalizePage() {
            pages.add(new PageCapture(List.copyOf(imagesThisPage), List.copyOf(anchorsMatchedThisPage)));
            imagesThisPage.clear();
            anchorsMatchedThisPage.clear();
        }
    }
}
