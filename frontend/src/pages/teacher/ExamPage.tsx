import TeacherNotificationBell from '../../components/TeacherNotificationBell';
/**
 * TeacherExamPage — Trang "Bài kiểm tra" cho Giáo viên (UC30)
 *
 * Khác biệt cốt lõi so với Quiz chương (UC29):
 *   - Quiz:    gắn vào CUỐI MỖI CHƯƠNG       → mục đích củng cố
 *   - Exam:    giáo viên chọn vị trí sau chương bất kỳ → đánh giá giai đoạn
 *   - Học sinh: mở exam khi pass quiz các chương thuộc phạm vi trước vị trí đó
 *
 * Cấu trúc:
 *   - Mỗi khóa có 4 loại bài kiểm tra: giữa kỳ 1, cuối kỳ 1, giữa kỳ 2, cuối kỳ 2.
 *   - GV chọn loại bài + chương đặt sau → tạo/sửa exam cho vị trí đó.
 *
 * Luồng chính:
 *   1. GV chọn khóa học
 *   2. Bên trái: chọn một trong 4 loại bài kiểm tra
 *   3. Form mở ở panel phải:
 *      - Đã có exam → load vào form
 *      - Chưa có → khởi tạo form rỗng
 *   4. Form 3 phần:
 *      a) Cài đặt chung: tên, mô tả, thời gian, điểm đạt
 *      b) Cài đặt làm bài: lần làm lại, xáo trộn, hiện đáp án
 *      c) Danh sách câu hỏi (có thêm trường "Mức độ khó")
 *   5. "Lưu bài kiểm tra" → commit; "Hủy" → đóng form không lưu
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { notify } from '../../lib/toast';
import { getCourseDetail, listMyCourses } from '../../api/teacherCourseService';
import type { TeacherCourseDetailResponse } from '../../api/teacherCourseService';
import * as examService from '../../api/examService';
import * as questionService from '../../api/questionService';
import type {
  ExamConfigRequest,
  ExamConfigResponse,
  ExamQuestionPayload,
  ExamType,
} from '../../api/examService';
import {
  LayoutDashboard, BookOpen, FileText, HelpCircle,
  Bell, LogOut, Menu, X, Trash2,
  PenSquare, Landmark, BarChart2, ClipboardList,
  GraduationCap, Save, CheckCircle2, Circle,
  ChevronDown, ChevronRight, Shuffle, Eye, Repeat,
  Megaphone, Database, Loader2, AlertTriangle,
  UserCircle, Lock,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
//  PHẦN 1 — TYPES
// ═══════════════════════════════════════════════════════════════════

// Câu hỏi exam: khách quan (trắc nghiệm/đúng-sai) và tự luận
type QuestionType = 'single' | 'multiple' | 'essay';

// Mức độ khó của câu hỏi — đặc thù của Exam
// Lý do thêm: bài kiểm tra cần phân bố câu Dễ/TB/Khó hợp lý
// để đánh giá đúng năng lực HS, không phải tất cả cùng mức.
type Difficulty = 'easy' | 'medium' | 'hard';

interface ExamQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
  correctIndices: number[];
  explanation?: string;
  points: number;
  difficulty: Difficulty;  // ← thêm so với Quiz
}

// Cài đặt 1 bài kiểm tra
interface Exam {
  examType: ExamType;
  startChapterId: string;
  afterChapterId: string;
  name: string;
  description?: string;        // Hướng dẫn / mô tả cho HS đọc trước khi làm
  durationMinutes: number;
  passScorePercent: number;
  multipleChoiceScore: number;
  essayScore: number;

  // ── Cài đặt làm bài (đặc thù Exam) ──
  maxAttempts: number;         // Số lần làm tối đa (vd 1, 2)
  shuffleQuestions: boolean;   // Xáo trộn thứ tự câu hỏi cho mỗi HS
  shuffleOptions: boolean;     // Xáo trộn thứ tự lựa chọn A/B/C/D
  showAnswerAfterSubmit: boolean; // Có cho HS xem đáp án sau khi nộp không

  questions: ExamQuestion[];
}

// Ref nhẹ đến chương — chỉ cần id/title/order để hiển thị
interface ChapterRef {
  id: string;
  title: string;
  order: number;
}

// 1 khóa học chứa nhiều chương + map exam theo slot
interface CourseInfo {
  id: string;
  title: string;
  chapters: ChapterRef[];
  // Dùng Record<slotIndex, Exam> thay vì array để dễ tra theo slot
  // (slot 0 → exams[0], slot 1 → exams[1]...)
  // Slot nào chưa có exam thì key đó không tồn tại.
  exams: Record<number, Exam>;
}

// Slot đã được tính từ chapters — không lưu trong state, derive khi render
interface ExamSlot {
  slotIndex: number;
  examType: ExamType;
  label: string;
  defaultName: string;
  exam?: Exam;                 // undefined = chưa tạo
}

interface ChapterRandomConfig {
  multipleChoiceCount: number;
  essayCount: number;
}

interface ChapterQuestionCount {
  totalActive: number;
  multipleChoiceActive: number;
  essayActive: number;
}

function defaultChapterRandomConfig(
    multipleChoiceCount = 8,
    essayCount = 2,
): ChapterRandomConfig {
  return {
    multipleChoiceCount,
    essayCount,
  };
}

function formatPoints(points: number): string {
  if (Number.isInteger(points)) return String(points);
  return points.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}

function questionTypeLabel(type: QuestionType): string {
  if (type === 'essay') return 'Tự luận';
  if (type === 'multiple') return 'Nhiều đáp án';
  return '1 đáp án';
}

// ═══════════════════════════════════════════════════════════════════
//  PHẦN 2 — NAV_ITEMS (đồng bộ sidebar teacher)
// ═══════════════════════════════════════════════════════════════════
const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Tổng quan',         path: '/teacher',          },
  { icon: BookOpen,        label: 'Khóa học của tôi',  path: '/teacher/courses',  },
  { icon: FileText,        label: 'Bài giảng',          path: '/teacher/content',  },
  { icon: PenSquare,       label: 'Quiz chương',        path: '/teacher/quiz',     },
  { icon: Database,        label: 'Ngân hàng câu hỏi',  path: '/teacher/questions',},
  { icon: GraduationCap,   label: 'Bài kiểm tra',       path: '/teacher/exam',     },
  { icon: ClipboardList,   label: 'Chấm điểm',          path: '/teacher/grades',   },
  { icon: HelpCircle,      label: 'Hỏi & Đáp',          path: '/teacher/qa',       },
  { icon: Megaphone,       label: 'Khiếu nại',          path: '/teacher/complaints',},
  { icon: BarChart2,       label: 'Doanh thu',          path: '/teacher/revenue',  },
  { icon: Landmark,        label: 'TK ngân hàng',       path: '/teacher/bank',     },
  { icon: UserCircle,      label: 'Hồ sơ',              path: '/teacher/profile',  },
  { icon: Lock,            label: 'Tài khoản',           path: '/teacher/account',  },
];

// ═══════════════════════════════════════════════════════════════════
//  PHẦN 3 — HELPER: bốn loại bài kiểm tra cố định
// ═══════════════════════════════════════════════════════════════════
const EXAM_SLOT_DEFS: Array<Omit<ExamSlot, 'exam'>> = [
  {
    slotIndex: 0,
    examType: 'MIDTERM_1',
    label: 'Bài giữa kỳ 1',
    defaultName: 'Bài kiểm tra giữa kỳ 1',
  },
  {
    slotIndex: 1,
    examType: 'FINAL_1',
    label: 'Bài cuối kỳ 1',
    defaultName: 'Bài kiểm tra cuối kỳ 1',
  },
  {
    slotIndex: 2,
    examType: 'MIDTERM_2',
    label: 'Bài giữa kỳ 2',
    defaultName: 'Bài kiểm tra giữa kỳ 2',
  },
  {
    slotIndex: 3,
    examType: 'FINAL_2',
    label: 'Bài cuối kỳ 2',
    defaultName: 'Bài kiểm tra cuối kỳ 2',
  },
];

function examTypeFromSlotIndex(slotIndex: number): ExamType {
  return EXAM_SLOT_DEFS.find(slot => slot.slotIndex === slotIndex)?.examType ?? 'MIDTERM_1';
}

function slotIndexForExamType(examType: ExamType): number {
  return EXAM_SLOT_DEFS.find(slot => slot.examType === examType)?.slotIndex ?? 0;
}

function examTypeLabel(examType: ExamType): string {
  return EXAM_SLOT_DEFS.find(slot => slot.examType === examType)?.label ?? 'Bài kiểm tra';
}

function computeSlots(exams: Record<number, Exam>): ExamSlot[] {
  return EXAM_SLOT_DEFS.map(slot => ({
    ...slot,
    exam: exams[slot.slotIndex],
  }));
}

function examFromResponse(response: ExamConfigResponse): Exam {
  return {
    examType: response.examType ?? examTypeFromSlotIndex(response.slotIndex),
    startChapterId: response.startChapterId ?? '',
    afterChapterId: response.afterChapterId ?? '',
    name: response.name,
    description: response.description ?? '',
    durationMinutes: response.durationMinutes,
    passScorePercent: response.passScorePercent,
    multipleChoiceScore: response.multipleChoiceScore ?? 10,
    essayScore: response.essayScore ?? 0,
    maxAttempts: response.maxAttempts,
    shuffleQuestions: response.shuffleQuestions,
    shuffleOptions: response.shuffleOptions,
    showAnswerAfterSubmit: response.showAnswerAfterSubmit,
    questions: response.questions.map(questionFromPayload),
  };
}

function questionFromPayload(payload: ExamQuestionPayload): ExamQuestion {
  return {
    id: payload.id,
    text: payload.text,
    type: payload.type,
    options: [...payload.options],
    correctIndices: [...payload.correctIndices],
    explanation: payload.explanation ?? '',
    points: payload.points,
    difficulty: payload.difficulty,
  };
}

function examToRequest(exam: Exam): ExamConfigRequest {
  return {
    examType: exam.examType,
    startChapterId: exam.startChapterId,
    afterChapterId: exam.afterChapterId,
    name: exam.name.trim(),
    description: exam.description?.trim() || null,
    durationMinutes: exam.durationMinutes,
    passScorePercent: exam.passScorePercent,
    multipleChoiceScore: exam.multipleChoiceScore,
    essayScore: exam.essayScore,
    maxAttempts: exam.maxAttempts,
    shuffleQuestions: exam.shuffleQuestions,
    shuffleOptions: exam.shuffleOptions,
    showAnswerAfterSubmit: exam.showAnswerAfterSubmit,
    questions: exam.questions.map(q => ({
      id: q.id,
      text: q.text.trim(),
      type: q.type,
      options: q.options.map(opt => opt.trim()),
      correctIndices: q.correctIndices,
      explanation: q.explanation?.trim() || null,
      points: q.points,
      difficulty: q.difficulty,
    })),
  };
}

function courseInfoFromDetail(
    detail: TeacherCourseDetailResponse,
    exams: ExamConfigResponse[],
): CourseInfo {
  return {
    id: detail.id,
    title: detail.title,
    chapters: detail.chapters
      .map(chapter => ({
        id: chapter.id,
        title: chapter.title,
        order: chapter.position,
      }))
      .sort((a, b) => a.order - b.order),
    exams: exams.reduce<Record<number, Exam>>((acc, exam) => {
      if (!EXAM_SLOT_DEFS.some(slot => slot.slotIndex === exam.slotIndex)) {
        return acc;
      }
      acc[exam.slotIndex] = examFromResponse(exam);
      return acc;
    }, {}),
  };
}

function defaultAfterChapterId(course: CourseInfo, examType: ExamType): string {
  if (course.chapters.length === 0) return '';
  const slotIndex = slotIndexForExamType(examType);
  const targetIndex = Math.min(
    course.chapters.length - 1,
    Math.max(0, Math.ceil(((slotIndex + 1) * course.chapters.length) / 4) - 1),
  );
  return course.chapters[targetIndex].id;
}

function chapterIndex(course: CourseInfo, chapterId: string): number {
  return course.chapters.findIndex(chapter => chapter.id === chapterId);
}

function defaultStartChapterId(course: CourseInfo, examType: ExamType, afterChapterId: string): string {
  const anchorIndex = chapterIndex(course, afterChapterId);
  if (anchorIndex < 0) return course.chapters[0]?.id ?? '';

  let previousAnchorIndex = -1;
  const currentSlotIndex = slotIndexForExamType(examType);
  Object.entries(course.exams).forEach(([slotIndex, existingExam]) => {
    if (Number(slotIndex) >= currentSlotIndex || !existingExam.afterChapterId) return;
    const existingAnchorIndex = chapterIndex(course, existingExam.afterChapterId);
    if (existingAnchorIndex >= 0 && existingAnchorIndex < anchorIndex) {
      previousAnchorIndex = Math.max(previousAnchorIndex, existingAnchorIndex);
    }
  });

  return course.chapters[previousAnchorIndex + 1]?.id ?? afterChapterId;
}

function getRequiredChaptersForExam(
    course: CourseInfo,
    examType: ExamType,
    startChapterId: string,
    afterChapterId: string,
): ChapterRef[] {
  const anchorIndex = chapterIndex(course, afterChapterId);
  if (anchorIndex < 0) return [];

  const explicitStartIndex = chapterIndex(course, startChapterId);
  const startIndex = explicitStartIndex >= 0
    ? explicitStartIndex
    : chapterIndex(course, defaultStartChapterId(course, examType, afterChapterId));
  if (startIndex < 0 || startIndex > anchorIndex) return [];

  return course.chapters.slice(startIndex, anchorIndex + 1);
}

function getPlacementError(course: CourseInfo, exam: Exam): string | null {
  const startIndex = chapterIndex(course, exam.startChapterId);
  const currentIndex = chapterIndex(course, exam.afterChapterId);
  if (startIndex < 0) return 'Vui lòng chọn chương bắt đầu.';
  if (currentIndex < 0) return 'Vui lòng chọn chương kết thúc.';
  if (startIndex > currentIndex) {
    return 'Chương bắt đầu phải nằm trước hoặc bằng chương kết thúc.';
  }
  if (currentIndex < 0) return 'Vui lòng chọn chương đặt bài kiểm tra.';

  const currentSlotIndex = slotIndexForExamType(exam.examType);
  for (const [slotIndexText, existingExam] of Object.entries(course.exams)) {
    const slotIndex = Number(slotIndexText);
    if (slotIndex === currentSlotIndex || !existingExam.afterChapterId) continue;
    const existingIndex = chapterIndex(course, existingExam.afterChapterId);
    if (existingIndex < 0) continue;

    const currentLabel = examTypeLabel(exam.examType);
    const existingLabel = examTypeLabel(existingExam.examType);
    if (slotIndex < currentSlotIndex && existingIndex >= currentIndex) {
      return `${currentLabel} phải nằm sau ${existingLabel}.`;
    }
    if (slotIndex > currentSlotIndex && existingIndex <= currentIndex) {
      return `${currentLabel} phải nằm trước ${existingLabel}.`;
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════
//  PHẦN 4 — SUB-COMPONENT: ExamQuestionCard
// ═══════════════════════════════════════════════════════════════════
/**
 * ExamQuestionCard — Card chứa 1 câu hỏi của bài kiểm tra.
 * Khác QuestionCard của Quiz: có thêm trường "Mức độ khó".
 * Tách thành component vì lặp lại N lần và có state gập/mở riêng.
 *
 * Props:
 *   - question: dữ liệu câu hỏi exam
 *   - index: thứ tự câu trong list (để label "Câu 1", "Câu 2"...)
 *   - onDelete: callback khi xóa câu hỏi
 */
interface ExamQuestionCardProps {
  question: ExamQuestion;
  index: number;
  onDelete: () => void;
}
function ExamQuestionCard({ question, index, onDelete }: ExamQuestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Config màu sắc cho difficulty — gói lại để dễ tra trong JSX
  const difficultyConfig: Record<Difficulty, { label: string; className: string }> = {
    easy:   { label: 'Dễ',         className: 'bg-green-500/10 text-green-600'   },
    medium: { label: 'Trung bình', className: 'bg-amber-500/10 text-amber-600'   },
    hard:   { label: 'Khó',        className: 'bg-red-500/10 text-red-600'       },
  };

  return (
    <div className="border border-outline-variant/40 rounded-xl bg-surface-container/30 overflow-hidden">

      {/* Header card */}
      <div className="flex items-center gap-2 px-4 py-3 bg-surface-container/50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 flex-1 text-left min-w-0"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
          <span className="font-bold text-on-surface text-sm flex-shrink-0">Câu {index + 1}</span>
          {!isExpanded && question.text && (
            <span className="text-sm text-on-surface-variant line-clamp-1">
              — {question.text}
            </span>
          )}
        </button>

        {/* Badge mức độ khó */}
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${difficultyConfig[question.difficulty].className}`}>
          {difficultyConfig[question.difficulty].label}
        </span>

        {/* Badge loại */}
        <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">
          {questionTypeLabel(question.type)}
        </span>

        <span className="text-xs font-bold text-on-surface-variant">{formatPoints(question.points)}đ</span>

        <button
          onClick={onDelete}
          title="Xóa câu hỏi"
          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Body — chỉ render khi mở */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">

              {/* Nội dung câu hỏi */}
              <div>
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                  Nội dung câu hỏi
                </span>
                <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface whitespace-pre-wrap">
                  {question.text}
                </div>
              </div>

              {/* Loại + Mức độ + Điểm (3 cột) */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                    Loại câu hỏi
                  </span>
                  <div className="w-full px-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface">
                    {questionTypeLabel(question.type)}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                    Mức độ
                  </span>
                  <div className="w-full px-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface">
                    {difficultyConfig[question.difficulty].label}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                    Điểm
                  </span>
                  <div className="w-full px-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface">
                    {formatPoints(question.points)} điểm
                  </div>
                </div>
              </div>

              {question.type === 'essay' ? (
                <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface-variant">
                  Câu tự luận không có đáp án đúng tự động. Học sinh sẽ nộp văn bản hoặc ảnh để giáo viên chấm.
                </div>
              ) : (
                <div>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                    Lựa chọn & đáp án đúng
                  </span>
                  <div className="space-y-2">
                    {question.options.map((opt, optIdx) => {
                      const isCorrect = question.correctIndices.includes(optIdx);
                      return (
                        <div key={optIdx} className="flex items-center gap-2">
                          <span className={`flex-shrink-0 w-7 h-7 rounded-${question.type === 'single' ? 'full' : 'md'} flex items-center justify-center ${
                            isCorrect
                              ? 'bg-green-500 text-white'
                              : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant'
                          }`}>
                            {isCorrect
                              ? <CheckCircle2 className="w-4 h-4" />
                              : <Circle className="w-4 h-4 opacity-30" />}
                          </span>

                          <span className="text-sm font-bold text-on-surface-variant w-5 flex-shrink-0">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>

                          <div className="flex-1 px-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface">
                            {opt}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Giải thích (tùy chọn) */}
              <label className="block">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                  Lời giải thích <span className="text-on-surface-variant/70 font-normal normal-case">(tùy chọn)</span>
                </span>
                <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface min-h-[40px] whitespace-pre-wrap">
                  {question.explanation?.trim() || <span className="text-on-surface-variant">Không có giải thích</span>}
                </div>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  PHẦN 5 — MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function TeacherExamPage() {
  // ── State chính ─────────────────────────────────────────────────
  // data: nguồn sự thật về khóa/chương/exam đã commit
  const [data, setData] = useState<CourseInfo[]>([]);
  // Khóa đang chọn
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  // Slot đang chọn để chỉnh sửa (null = chưa chọn)
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  // form: bản copy của exam đang sửa.
  // Tách ra khỏi data để "Hủy" không ảnh hưởng — chỉ commit khi "Lưu".
  const [form, setForm] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [randomizing, setRandomizing] = useState(false);
  const [chapterRandomConfigs, setChapterRandomConfigs] =
    useState<Record<string, ChapterRandomConfig>>({});
  const [chapterStats, setChapterStats] =
    useState<Record<string, ChapterQuestionCount>>({});
  const [loadingChapterStats, setLoadingChapterStats] = useState(false);

  // Sidebar mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    let cancelled = false;

    async function loadCoursesAndExams() {
      setLoading(true);
      try {
        const page = await listMyCourses(0, 100);
        const courses = await Promise.all(
          page.items.map(async course => {
            const [detail, exams] = await Promise.all([
              getCourseDetail(course.id),
              examService.listCourseExams(course.id),
            ]);
            return courseInfoFromDetail(detail, exams);
          }),
        );

        if (cancelled) return;

        setData(courses);
        setSelectedCourseId(prev => {
          if (prev && courses.some(course => course.id === prev)) return prev;
          return courses[0]?.id ?? '';
        });
        setSelectedSlotIndex(null);
        setForm(null);
      } catch (error) {
        if (!cancelled) {
          setData([]);
          setSelectedCourseId('');
          notify.error(error instanceof Error
            ? error.message
            : 'Không tải được danh sách bài kiểm tra');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCoursesAndExams();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Derived ─────────────────────────────────────────────────────
  const currentCourse = data.find(c => c.id === selectedCourseId);
  // Tính lại 4 slot kiểm tra mỗi lần render — rẻ vì chỉ có 4 item
  const slots = currentCourse ? computeSlots(currentCourse.exams) : [];
  const currentSlot = slots.find(s => s.slotIndex === selectedSlotIndex);
  const currentRequiredChapters = currentCourse && currentSlot && form?.afterChapterId
    ? getRequiredChaptersForExam(
      currentCourse,
      currentSlot.examType,
      form.startChapterId,
      form.afterChapterId,
    )
    : [];

  // Tổng điểm — hiển thị để GV biết bài kiểm tra đáng bao nhiêu
  const totalPoints = form?.questions.reduce((sum, q) => sum + q.points, 0) ?? 0;
  const multipleChoicePointTotal = form?.questions
    .filter(q => q.type !== 'essay')
    .reduce((sum, q) => sum + q.points, 0) ?? 0;
  const essayPointTotal = form?.questions
    .filter(q => q.type === 'essay')
    .reduce((sum, q) => sum + q.points, 0) ?? 0;
  const configuredScoreTotal = (form?.multipleChoiceScore ?? 0) + (form?.essayScore ?? 0);
  const activeChapterConfigs = currentRequiredChapters.map(chapter => ({
    chapter,
    config: chapterRandomConfigs[chapter.id] ?? defaultChapterRandomConfig(),
    stats: chapterStats[chapter.id],
  }));
  const objectiveRandomTotal = activeChapterConfigs.reduce((sum, item) =>
    sum + item.config.multipleChoiceCount, 0);
  const essayRandomTotal = activeChapterConfigs.reduce((sum, item) =>
    sum + item.config.essayCount, 0);
  const chapterRandomTotal = objectiveRandomTotal + essayRandomTotal;
  const objectivePointPerQuestion = objectiveRandomTotal > 0 && form
    ? form.multipleChoiceScore / objectiveRandomTotal
    : 0;
  const essayPointPerQuestion = essayRandomTotal > 0 && form
    ? form.essayScore / essayRandomTotal
    : 0;
  const chapterRandomWarnings = activeChapterConfigs
    .flatMap(item => {
      if (!item.stats) return [];
      const warnings: Array<{
        key: string;
        chapterTitle: string;
        typeLabel: string;
        need: number;
        have: number;
      }> = [];
      if (item.config.multipleChoiceCount > item.stats.multipleChoiceActive) {
        warnings.push({
          key: `${item.chapter.id}-objective`,
          chapterTitle: item.chapter.title,
          typeLabel: 'trắc nghiệm',
          need: item.config.multipleChoiceCount,
          have: item.stats.multipleChoiceActive,
        });
      }
      if (item.config.essayCount > item.stats.essayActive) {
        warnings.push({
          key: `${item.chapter.id}-essay`,
          chapterTitle: item.chapter.title,
          typeLabel: 'tự luận',
          need: item.config.essayCount,
          have: item.stats.essayActive,
        });
      }
      return warnings;
    });

  useEffect(() => {
    if (!currentSlot || currentRequiredChapters.length === 0) {
      setChapterStats({});
      return;
    }

    let cancelled = false;
    setLoadingChapterStats(true);
    Promise.all(
      currentRequiredChapters.map(async chapter => {
        const [multipleChoiceActive, trueFalseActive, essayActive] = await Promise.all([
          questionService.countActiveQuestionsByChapter(chapter.id, 'multiple_choice'),
          questionService.countActiveQuestionsByChapter(chapter.id, 'true_false'),
          questionService.countActiveQuestionsByChapter(chapter.id, 'essay'),
        ]);
        return [chapter.id, {
          totalActive: multipleChoiceActive + trueFalseActive + essayActive,
          multipleChoiceActive: multipleChoiceActive + trueFalseActive,
          essayActive,
        }] as const;
      }),
    )
      .then(entries => {
        if (!cancelled) {
          setChapterStats(Object.fromEntries(entries));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setChapterStats({});
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingChapterStats(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCourseId, selectedSlotIndex, form?.startChapterId, form?.afterChapterId]);

  // ── Handler: chọn slot để bắt đầu edit exam ──────────────────────
  function selectSlot(slot: ExamSlot) {
    if (!currentCourse) return;
    setSelectedSlotIndex(slot.slotIndex);
    const afterChapterId = slot.exam?.afterChapterId
      || defaultAfterChapterId(currentCourse, slot.examType);
    const startChapterId = slot.exam?.startChapterId
      || defaultStartChapterId(currentCourse, slot.examType, afterChapterId);
    const requiredChapters = getRequiredChaptersForExam(
      currentCourse,
      slot.examType,
      startChapterId,
      afterChapterId,
    );
    setChapterRandomConfigs(prev => {
      const next = { ...prev };
      requiredChapters.forEach(chapter => {
        if (!next[chapter.id]) {
          next[chapter.id] = defaultChapterRandomConfig();
        }
      });
      return next;
    });
    // Slot đã có exam → copy vào form để edit
    // Chưa có → khởi tạo exam rỗng với default hợp lý cho bài kiểm tra
    if (slot.exam) {
      setForm({
        ...slot.exam,
        startChapterId,
        afterChapterId,
        questions: slot.exam.questions.map(q => ({ ...q })), // deep copy questions
      });
    } else {
      setForm({
        examType: slot.examType,
        startChapterId,
        afterChapterId,
        name: slot.defaultName,
        description: '',
        durationMinutes: 45,    // Exam thường dài hơn quiz (45 vs 15)
        passScorePercent: 60,   // Exam thường khó hơn → ngưỡng pass thấp hơn
        multipleChoiceScore: 7,
        essayScore: 3,
        maxAttempts: 1,         // Default 1 lần — exam chỉ làm 1 lần
        shuffleQuestions: true, // Default ON — chống gian lận
        shuffleOptions: true,   // Default ON — chống gian lận
        showAnswerAfterSubmit: false, // Default OFF — không lộ đề cho khóa sau
        questions: [],
      });
    }
  }

  // ── Handler: đổi khóa học ────────────────────────────────────────
  function changeCourse(courseId: string) {
    setSelectedCourseId(courseId);
    setSelectedSlotIndex(null);
    setForm(null);
  }

  function changeAfterChapter(afterChapterId: string) {
    if (!form || !currentCourse) return;
    const afterIndex = chapterIndex(currentCourse, afterChapterId);
    const currentStartIndex = chapterIndex(currentCourse, form.startChapterId);
    const startChapterId = currentStartIndex >= 0 && currentStartIndex <= afterIndex
      ? form.startChapterId
      : afterChapterId;
    const nextForm = { ...form, startChapterId, afterChapterId };
    const requiredChapters = getRequiredChaptersForExam(
      currentCourse,
      form.examType,
      startChapterId,
      afterChapterId,
    );
    setChapterRandomConfigs(prev => {
      const next = { ...prev };
      requiredChapters.forEach(chapter => {
        if (!next[chapter.id]) {
          next[chapter.id] = defaultChapterRandomConfig();
        }
      });
      return next;
    });
    setForm(nextForm);
  }

  function changeStartChapter(startChapterId: string) {
    if (!form || !currentCourse) return;
    const startIndex = chapterIndex(currentCourse, startChapterId);
    const currentAfterIndex = chapterIndex(currentCourse, form.afterChapterId);
    const afterChapterId = currentAfterIndex >= startIndex
      ? form.afterChapterId
      : startChapterId;
    const nextForm = { ...form, startChapterId, afterChapterId };
    const requiredChapters = getRequiredChaptersForExam(
      currentCourse,
      form.examType,
      startChapterId,
      afterChapterId,
    );
    setChapterRandomConfigs(prev => {
      const next = { ...prev };
      requiredChapters.forEach(chapter => {
        if (!next[chapter.id]) {
          next[chapter.id] = defaultChapterRandomConfig();
        }
      });
      return next;
    });
    setForm(nextForm);
  }

  // ── Handler: xóa 1 câu hỏi ──────────────────────────────────────
  function deleteQuestion(idx: number) {
    if (!form) return;
    setForm({ ...form, questions: form.questions.filter((_, i) => i !== idx) });
  }

  function updateChapterRandomConfig(
      chapterId: string,
      key: keyof ChapterRandomConfig,
      value: number,
  ) {
    setChapterRandomConfigs(prev => {
      const current = prev[chapterId] ?? defaultChapterRandomConfig();
      const safeValue = Math.max(0, value);
      return {
        ...prev,
        [chapterId]: {
          ...current,
          [key]: safeValue,
        },
      };
    });
  }

  async function randomizeQuestionsFromBank() {
    if (!form || !selectedCourseId || !currentSlot || randomizing) return;
    if (Math.abs(configuredScoreTotal - 10) > 0.001) {
      notify.error('Tổng điểm trắc nghiệm và tự luận phải bằng 10');
      return;
    }
    if (chapterRandomTotal <= 0) {
      notify.error('Cần chọn ít nhất 1 câu hỏi để random');
      return;
    }
    if (form.multipleChoiceScore > 0 && objectiveRandomTotal <= 0) {
      notify.error('Phần trắc nghiệm có điểm nên cần chọn ít nhất 1 câu trắc nghiệm');
      return;
    }
    if (form.essayScore > 0 && essayRandomTotal <= 0) {
      notify.error('Phần tự luận có điểm nên cần chọn ít nhất 1 câu tự luận');
      return;
    }
    if (form.multipleChoiceScore === 0 && objectiveRandomTotal > 0) {
      notify.error('Phần trắc nghiệm đang 0 điểm, hãy đặt số câu trắc nghiệm về 0 hoặc tăng điểm phần này');
      return;
    }
    if (form.essayScore === 0 && essayRandomTotal > 0) {
      notify.error('Phần tự luận đang 0 điểm, hãy đặt số câu tự luận về 0 hoặc tăng điểm phần này');
      return;
    }
    if (chapterRandomWarnings.length > 0) {
      notify.error('Ngân hàng câu hỏi chưa đủ theo phân bổ đã chọn');
      return;
    }

    setRandomizing(true);
    try {
      const questions = await examService.randomizeCourseExamQuestions(
        selectedCourseId,
        {
          easyCount: 0,
          mediumCount: 0,
          hardCount: 0,
          pointsPerQuestion: objectivePointPerQuestion || essayPointPerQuestion || 1,
          multipleChoicePointsPerQuestion: objectivePointPerQuestion,
          essayPointsPerQuestion: essayPointPerQuestion,
          chapterConfigs: activeChapterConfigs.map(item => ({
            chapterId: item.chapter.id,
            totalCount: item.config.multipleChoiceCount + item.config.essayCount,
            multipleChoiceCount: item.config.multipleChoiceCount,
            essayCount: item.config.essayCount,
          })),
        },
      );
      setForm({
        ...form,
        questions: questions.map(questionFromPayload),
      });
      notify.success(`Đã random ${questions.length} câu từ ngân hàng câu hỏi`);
    } catch (error) {
      notify.error(error instanceof Error
        ? error.message
        : 'Không random được câu hỏi từ ngân hàng');
    } finally {
      setRandomizing(false);
    }
  }

  // ── Handler: lưu bài kiểm tra ───────────────────────────────────
  // Validate: tương tự quiz nhưng có thêm check maxAttempts
  async function saveExam() {
    if (!form || selectedSlotIndex === null || !selectedCourseId || saving) return;

    if (!form.name.trim()) {
      notify.error('Vui lòng nhập tên bài kiểm tra');
      return;
    }
    const currentCourseForSave = data.find(course => course.id === selectedCourseId);
    if (!form.startChapterId || !form.afterChapterId || !currentCourseForSave) {
      notify.error('Vui lòng chọn vị trí đặt bài kiểm tra');
      return;
    }
    const placementError = getPlacementError(currentCourseForSave, form);
    if (placementError) {
      notify.error(placementError);
      return;
    }
    if (form.durationMinutes < 1) {
      notify.error('Thời gian làm bài phải >= 1 phút');
      return;
    }
    if (form.passScorePercent < 0 || form.passScorePercent > 100) {
      notify.error('Điểm đạt phải từ 0% đến 100%');
      return;
    }
    if (form.multipleChoiceScore < 0 || form.multipleChoiceScore > 10
        || form.essayScore < 0 || form.essayScore > 10) {
      notify.error('Điểm từng phần phải nằm trong khoảng 0 đến 10');
      return;
    }
    if (Math.abs(configuredScoreTotal - 10) > 0.001) {
      notify.error('Tổng điểm trắc nghiệm và tự luận phải bằng 10');
      return;
    }
    if (form.maxAttempts < 1) {
      notify.error('Số lần làm lại phải >= 1');
      return;
    }
    if (form.questions.length === 0) {
      notify.error('Bài kiểm tra phải có ít nhất 1 câu hỏi');
      return;
    }
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.text.trim()) {
        notify.error(`Câu ${i + 1}: chưa nhập nội dung`);
        return;
      }
      if (q.type === 'essay') {
        continue;
      }
      if (q.options.some(opt => !opt.trim())) {
        notify.error(`Câu ${i + 1}: có lựa chọn còn rỗng`);
        return;
      }
      if (q.correctIndices.length === 0) {
        notify.error(`Câu ${i + 1}: chưa chọn đáp án đúng`);
        return;
      }
    }
    if (Math.abs(multipleChoicePointTotal - form.multipleChoiceScore) > 0.05) {
      notify.error('Tổng điểm câu trắc nghiệm chưa khớp với điểm phần trắc nghiệm');
      return;
    }
    if (Math.abs(essayPointTotal - form.essayScore) > 0.05) {
      notify.error('Tổng điểm câu tự luận chưa khớp với điểm phần tự luận');
      return;
    }

    setSaving(true);
    try {
      const saved = await examService.saveCourseExam(
        selectedCourseId,
        selectedSlotIndex,
        examToRequest(form),
      );
      const savedExam = examFromResponse(saved);

      setData(prev => prev.map(course => {
        if (course.id !== selectedCourseId) return course;
        return {
          ...course,
          exams: { ...course.exams, [selectedSlotIndex]: savedExam },
        };
      }));
      setForm({
        ...savedExam,
        questions: savedExam.questions.map(q => ({ ...q })),
      });
      notify.success('Đã lưu bài kiểm tra');
    } catch (error) {
      notify.error(error instanceof Error
        ? error.message
        : 'Không lưu được bài kiểm tra');
    } finally {
      setSaving(false);
    }
  }

  // ── Handler: hủy chỉnh sửa ──────────────────────────────────────
  function cancelEdit() {
    setSelectedSlotIndex(null);
    setForm(null);
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  // ═════════════════════════════════════════════════════════════════
  //  RENDER
  // ═════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-surface flex font-sans">

      {/* Overlay sidebar mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64
        bg-surface-container-lowest border-r border-outline-variant/30
        flex flex-col transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex
      `}>
        <div className="p-6 flex items-center justify-between border-b border-outline-variant/20">
          <Link to="/teacher" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary text-on-primary rounded-xl flex items-center justify-center font-extrabold text-lg shadow-md shadow-primary/20">B</div>
            <div>
              <p className="font-extrabold text-on-surface text-sm">Bee Academy</p>
              <p className="text-xs text-on-surface-variant font-medium">Cổng Giáo Viên</p>
            </div>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-on-surface-variant">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
                {isActive && <div className="ml-auto w-2 h-2 bg-primary rounded-full" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-outline-variant/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors text-left"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        <header className="sticky top-0 z-20 h-16 bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 flex items-center justify-between px-4 md:px-6 shadow-sm">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-extrabold text-on-surface text-lg hidden lg:block">Bài kiểm tra</h1>
          <div className="flex items-center gap-4 ml-auto">
            <TeacherNotificationBell />
            <img
              src={user?.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'Giao Vien')}&background=7c3aed&color=fff&bold=true&size=64`}
              alt="Teacher avatar"
              className="w-9 h-9 rounded-full object-cover border-2 border-primary/30"
            />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">

          {/* Tiêu đề + dropdown chọn khóa */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h2 className="text-2xl font-extrabold text-on-surface mb-1">Bài kiểm tra giai đoạn</h2>
            <p className="text-on-surface-variant text-sm mb-4">
              Giáo viên chọn vị trí hiển thị cho bài giữa kỳ 1, cuối kỳ 1, giữa kỳ 2 và cuối kỳ 2.
            </p>

            <label className="block">
              <span className="text-sm font-bold text-on-surface mb-2 block">Chọn khóa học</span>
              <select
                value={selectedCourseId}
                onChange={e => changeCourse(e.target.value)}
                disabled={loading || data.length === 0}
                className="w-full max-w-md px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary text-on-surface font-semibold"
              >
                {data.length === 0 && (
                  <option value="">
                    {loading ? 'Đang tải khóa học...' : 'Chưa có khóa học'}
                  </option>
                )}
                {data.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </label>
          </motion.div>

          {/* Grid 2 cột: trái danh sách loại bài, phải form exam */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* PANEL TRÁI — Danh sách loại bài kiểm tra */}
            <motion.div
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-4 shadow-sm h-fit"
            >
              <h3 className="font-extrabold text-on-surface mb-3 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                Vị trí bài kiểm tra
              </h3>

              {!currentCourse || currentCourse.chapters.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center py-8">
                  {loading
                    ? 'Đang tải dữ liệu bài kiểm tra...'
                    : data.length === 0
                      ? 'Bạn chưa có khóa học nào để tạo bài kiểm tra.'
                      : 'Khóa học cần có ít nhất 1 chương để đặt bài kiểm tra.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {slots.map(slot => {
                    const hasExam = !!slot.exam;
                    const isSelected = slot.slotIndex === selectedSlotIndex;
                    const afterChapter = slot.exam?.afterChapterId
                      ? currentCourse.chapters.find(chapter => chapter.id === slot.exam!.afterChapterId)
                      : null;
                    const startChapter = slot.exam?.startChapterId
                      ? currentCourse.chapters.find(chapter => chapter.id === slot.exam!.startChapterId)
                      : slot.exam && afterChapter
                        ? currentCourse.chapters.find(chapter =>
                          chapter.id === defaultStartChapterId(currentCourse, slot.exam!.examType, slot.exam!.afterChapterId),
                        )
                        : null;

                    return (
                      <button
                        key={slot.slotIndex}
                        onClick={() => selectSlot(slot)}
                        className={`w-full text-left p-3 rounded-xl border transition-colors ${
                          isSelected
                            ? 'bg-primary/10 border-primary/30'
                            : 'bg-surface-container/30 border-outline-variant/30 hover:bg-surface-container/60'
                        }`}
                      >
                        <p className={`font-bold text-sm mb-1 ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                          {slot.label}
                        </p>
                        <p className="text-xs text-on-surface-variant mb-1.5 line-clamp-1">
                          {afterChapter
                            ? `Đặt sau chương ${afterChapter.order}: ${afterChapter.title}`
                            : 'Chưa chọn vị trí hiển thị'}
                        </p>
                        {startChapter && afterChapter && (
                          <p className="text-xs text-on-surface-variant mb-1.5 line-clamp-1">
                            Phạm vi: chương {startChapter.order} - {afterChapter.order}
                          </p>
                        )}
                        {hasExam ? (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Đã tạo · {slot.exam!.questions.length} câu · {slot.exam!.durationMinutes} phút
                          </p>
                        ) : (
                          <p className="text-xs text-on-surface-variant flex items-center gap-1">
                            <Circle className="w-3 h-3" />
                            Chưa tạo — click để tạo
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* PANEL PHẢI — Form exam */}
            <motion.div
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-3 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-5 shadow-sm"
            >
              {!form || !currentSlot || !currentCourse ? (
                <div className="text-center py-16">
                  <GraduationCap className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
                  <p className="text-on-surface-variant">
                    {loading
                      ? 'Đang tải dữ liệu bài kiểm tra...'
                      : data.length === 0
                        ? 'Bạn chưa có khóa học nào để tạo bài kiểm tra.'
                        : 'Chọn một loại bài kiểm tra ở bên trái để bắt đầu tạo/sửa'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Tiêu đề + vị trí đặt bài kiểm tra */}
                  <div className="mb-5 pb-4 border-b border-outline-variant/30">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1">
                      Đang chỉnh sửa bài kiểm tra cho
                    </p>
                    <h3 className="font-extrabold text-on-surface text-lg mb-3">
                      {currentSlot.label}
                    </h3>
                    <label className="block mb-3">
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                        Từ chương
                      </span>
                      <select
                        value={form.startChapterId}
                        onChange={e => changeStartChapter(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-on-surface"
                      >
                        {currentCourse.chapters.map(chapter => (
                          <option key={chapter.id} value={chapter.id}>
                            Chương {chapter.order}: {chapter.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block mb-3">
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                        Đặt bài kiểm tra sau chương
                      </span>
                      <select
                        value={form.afterChapterId}
                        onChange={e => changeAfterChapter(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-on-surface"
                      >
                        {currentCourse.chapters.map(chapter => (
                          <option key={chapter.id} value={chapter.id}>
                            Chương {chapter.order}: {chapter.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {/* ── PHẦN 1: Cài đặt chung ─────────────────────── */}
                  <div className="space-y-4 mb-6">
                    <p className="text-sm font-bold text-on-surface">Cài đặt chung</p>

                    <label className="block">
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                        Tên bài kiểm tra <span className="text-red-500">*</span>
                      </span>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="VD: Bài kiểm tra giữa kỳ I"
                        className="w-full px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-on-surface placeholder:text-on-surface-variant"
                      />
                    </label>

                    {/* Mô tả/Hướng dẫn — đặc thù Exam */}
                    <label className="block">
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                        Mô tả / Hướng dẫn làm bài <span className="text-on-surface-variant/70 font-normal normal-case">(hiển thị trước khi HS bắt đầu)</span>
                      </span>
                      <textarea
                        value={form.description ?? ''}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        placeholder="VD: Đọc kỹ đề trước khi làm. Không sử dụng tài liệu."
                        rows={2}
                        className="w-full px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-on-surface placeholder:text-on-surface-variant resize-none"
                      />
                    </label>

                    {/* Thời gian + Pass score + Tổng điểm */}
                    <div className="grid grid-cols-3 gap-3">
                      <label className="block">
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                          Thời gian (phút)
                        </span>
                        <input
                          type="number"
                          min={1}
                          value={form.durationMinutes}
                          onChange={e => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-on-surface"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                          Điểm đạt (%)
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={form.passScorePercent}
                          onChange={e => setForm({ ...form, passScorePercent: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-on-surface"
                        />
                      </label>
                      <div>
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                          Tổng điểm
                        </span>
                        <div className="w-full px-3 py-2 text-sm bg-surface-container/50 border border-outline-variant/50 rounded-lg text-on-surface font-bold">
                          {formatPoints(totalPoints)} điểm
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <label className="block">
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                          Điểm trắc nghiệm
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={0.25}
                          value={form.multipleChoiceScore}
                          onChange={e => setForm({ ...form, multipleChoiceScore: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-on-surface"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                          Điểm tự luận
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={0.25}
                          value={form.essayScore}
                          onChange={e => setForm({ ...form, essayScore: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-on-surface"
                        />
                      </label>
                      <div>
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                          Tổng cấu hình
                        </span>
                        <div className={`w-full px-3 py-2 text-sm border rounded-lg font-bold ${
                          Math.abs(configuredScoreTotal - 10) <= 0.001
                            ? 'bg-green-500/10 border-green-500/20 text-green-700'
                            : 'bg-red-500/10 border-red-500/20 text-red-600'
                        }`}>
                          {formatPoints(configuredScoreTotal)} / 10 điểm
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── PHẦN 2: Cài đặt làm bài (đặc thù Exam) ───── */}
                  <div className="space-y-3 mb-6 pt-4 border-t border-outline-variant/30">
                    <p className="text-sm font-bold text-on-surface">Cài đặt làm bài</p>

                    {/* Số lần làm lại */}
                    <label className="flex items-center gap-3">
                      <Repeat className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                      <span className="text-sm text-on-surface flex-1">Số lần làm tối đa</span>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={form.maxAttempts}
                        onChange={e => setForm({ ...form, maxAttempts: parseInt(e.target.value) || 1 })}
                        className="w-20 px-3 py-1.5 text-sm bg-surface-container border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-on-surface text-center"
                      />
                    </label>

                    {/* Toggle: xáo trộn câu hỏi */}
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Shuffle className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                      <span className="text-sm text-on-surface flex-1">
                        Xáo trộn thứ tự câu hỏi
                        <span className="text-xs text-on-surface-variant/70 ml-2">(mỗi HS thấy thứ tự khác nhau)</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={form.shuffleQuestions}
                        onChange={e => setForm({ ...form, shuffleQuestions: e.target.checked })}
                        className="w-5 h-5 accent-primary"
                      />
                    </label>

                    {/* Toggle: xáo trộn lựa chọn */}
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Shuffle className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                      <span className="text-sm text-on-surface flex-1">
                        Xáo trộn thứ tự lựa chọn A/B/C/D
                      </span>
                      <input
                        type="checkbox"
                        checked={form.shuffleOptions}
                        onChange={e => setForm({ ...form, shuffleOptions: e.target.checked })}
                        className="w-5 h-5 accent-primary"
                      />
                    </label>

                    {/* Toggle: hiện đáp án sau khi nộp */}
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Eye className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                      <span className="text-sm text-on-surface flex-1">
                        Hiển thị đáp án đúng sau khi nộp bài
                        <span className="text-xs text-on-surface-variant/70 ml-2">(tắt nếu không muốn lộ đề)</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={form.showAnswerAfterSubmit}
                        onChange={e => setForm({ ...form, showAnswerAfterSubmit: e.target.checked })}
                        className="w-5 h-5 accent-primary"
                      />
                    </label>
                  </div>

                  {/* ── PHẦN 3: Câu hỏi ─────────────────────────── */}
                  <div className="space-y-3 mb-6 pt-4 border-t border-outline-variant/30">
                    <p className="text-sm font-bold text-on-surface">
                      Câu hỏi <span className="text-on-surface-variant font-normal">({form.questions.length})</span>
                    </p>

                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-bold text-on-surface flex items-center gap-2">
                            <Shuffle className="w-4 h-4 text-primary" />
                            Random từ ngân hàng câu hỏi
                          </p>
                          <p className="text-xs text-on-surface-variant mt-1">
                            Mỗi chương sẽ được bốc ngẫu nhiên tự nhiên trong ngân hàng câu hỏi của chính chương đó, không lọc độ khó.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {activeChapterConfigs.map(({ chapter, config, stats }) => (
                          <div
                            key={chapter.id}
                            className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-3"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_120px] gap-3 md:items-center">
                              <div>
                                <p className="text-sm font-bold text-on-surface">
                                  Ch.{chapter.order}: {chapter.title}
                                </p>
                                <p className="text-xs text-on-surface-variant mt-1">
                                  {loadingChapterStats ? (
                                    <span className="inline-flex items-center gap-1">
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      Đang tải
                                    </span>
                                  ) : stats ? (
                                    <>
                                      Có {stats.totalActive} câu: {stats.multipleChoiceActive} trắc nghiệm, {stats.essayActive} tự luận
                                    </>
                                  ) : (
                                    <>Chưa đọc được thống kê</>
                                  )}
                                </p>
                              </div>

                              <label className="block">
                                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                                  Trắc nghiệm
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  value={config.multipleChoiceCount}
                                  onChange={e => updateChapterRandomConfig(
                                    chapter.id,
                                    'multipleChoiceCount',
                                    parseInt(e.target.value) || 0,
                                  )}
                                  className="w-full px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-on-surface"
                                />
                              </label>

                              <label className="block">
                                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                                  Tự luận
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  value={config.essayCount}
                                  onChange={e => updateChapterRandomConfig(
                                    chapter.id,
                                    'essayCount',
                                    parseInt(e.target.value) || 0,
                                  )}
                                  className="w-full px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-on-surface"
                                />
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1 text-xs">
                          {chapterRandomWarnings.length > 0 ? (
                            <div
                              role="alert"
                              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-red-700 shadow-sm"
                            >
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                <div className="min-w-0 space-y-1.5">
                                  <p className="text-sm font-bold leading-5">
                                    Ngân hàng câu hỏi chưa đủ theo phân bổ đã chọn
                                  </p>
                                  <ul className="space-y-1 text-xs font-medium leading-5">
                                    {chapterRandomWarnings.map(item => (
                                      <li key={item.key} className="break-words">
                                        <span className="font-semibold">{item.chapterTitle}</span>
                                        <span>
                                          {' '}({item.typeLabel}): cần {item.need}, có {item.have}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-on-surface-variant">
                              Sẽ random {chapterRandomTotal} câu từ {activeChapterConfigs.length} chương · trắc nghiệm {objectiveRandomTotal} câu x {formatPoints(objectivePointPerQuestion)}đ · tự luận {essayRandomTotal} câu x {formatPoints(essayPointPerQuestion)}đ.
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={randomizeQuestionsFromBank}
                          disabled={randomizing || loadingChapterStats || chapterRandomTotal <= 0 || chapterRandomWarnings.length > 0}
                          className="inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2 bg-primary text-on-primary text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {randomizing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Shuffle className="w-4 h-4" />
                          )}
                          {randomizing ? 'Đang random...' : 'Random câu hỏi'}
                        </button>
                      </div>
                    </div>

                    {form.questions.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-outline-variant/40 rounded-xl">
                        <p className="text-sm text-on-surface-variant">
                          Chưa có câu hỏi nào. Hãy random từ ngân hàng câu hỏi ở phía trên.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {form.questions.map((q, idx) => (
                          <ExamQuestionCard
                            key={q.id}
                            question={q}
                            index={idx}
                            onDelete={() => deleteQuestion(idx)}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Nút hành động */}
                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-outline-variant/30">
                    <button
                      onClick={cancelEdit}
                      className="px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={saveExam}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Đang lưu...' : 'Lưu bài kiểm tra'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>

        </main>
      </div>
    </div>
  );
}
