// ═══════════════════════════════════════════════════════════════════════════════
// TRANG DANH SÁCH KHÓA HỌC — CoursesPage.tsx
//
// VỊ TRÍ TRONG HỆ THỐNG:
//   URL: /courses
//   Người dùng đến từ: Landing page, Header search (→ /courses?q=...), CheckoutPage
//   Người dùng đi đến: CourseDetailPage (/courses/:id), CheckoutPage (/checkout)
//
// LUỒNG CHÍNH:
//   1. Trang tải → đọc ?q= từ URL để sync với kết quả tìm kiếm từ Header
//   2. Chia khóa học thành 2 mảng: đã tham gia (enrolledCourses) & chưa (availableCourses)
//   3. Section trên: hiển thị khóa học đã mua/tham gia kèm tiến độ học
//   4. Section dưới: hiển thị tất cả khóa học còn lại với bộ lọc Môn + Lớp + Tìm kiếm
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Users, PlayCircle, BookOpen, Filter, Search, Heart } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardHeader from '../../components/DashboardHeader';
import PageBanner from '../../components/PageBanner';
import { MOCK_COURSES, Subject, Grade } from '../../data/mockCourses';
import { useCourseStore } from '../../store/useCourseStore';

const SUBJECTS: Subject[] = ['Tất cả', 'Toán', 'Lý', 'Hóa', 'Văn', 'Sử', 'Địa'];
const GRADES: Grade[] = ['Tất cả', 'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9'];

export default function CoursesPage() {
  // ── URL Params ──────────────────────────────────────────────────────────────
  // useSearchParams đọc query string từ URL hiện tại.
  // Khi user tìm kiếm trên Header → navigate('/courses?q=toán')
  // → searchQuery được khởi tạo ngay với giá trị 'toán' (không bị reset về '')
  const [searchParams] = useSearchParams();

  // ── State bộ lọc ─────────────────────────────────────────────────────────
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Tất cả');
  const [selectedGrade, setSelectedGrade] = useState<Grade>('Tất cả');

  // Khởi tạo từ URL param ?q= nếu có, giúp kết quả tìm kiếm từ Header hiển thị ngay
  const [searchQuery, setSearchQuery] = useState<string>(() => searchParams.get('q') ?? '');

  // ── Zustand Store ─────────────────────────────────────────────────────────
  // purchasedIds: mảng id khóa học user đã MUA QUA CHECKOUT
  // (khác với course.isEnrolled = khóa học được gán sẵn trong mock data)
  const purchasedIds    = useCourseStore(state => state.purchasedIds);
  const favoritedIds    = useCourseStore(state => state.favoritedIds);
  const toggleFavorite  = useCourseStore(state => state.toggleFavorite);

  // ── Derived Data: Khóa học đã tham gia ───────────────────────────────────
  // Điều kiện "đã tham gia" = isEnrolled (từ data gốc) HOẶC id có trong purchasedIds (từ store)
  // useMemo: chỉ tính lại khi purchasedIds thay đổi (sau khi thanh toán thành công)
  const enrolledCourses = useMemo(() => {
    return MOCK_COURSES.filter(c => (c.isEnrolled || purchasedIds.includes(c.id)));
  }, [purchasedIds]);

  // ── Derived Data: Khóa học chưa tham gia (có thể mua) ───────────────────
  // Lọc đồng thời 3 điều kiện:
  //   1. Loại trừ khóa học đã tham gia
  //   2. Khớp môn học (subject)
  //   3. Khớp lớp (grade)
  //   4. Khớp từ khóa tìm kiếm (title hoặc instructor)
  // useMemo: tính lại khi bất kỳ bộ lọc nào thay đổi
  const availableCourses = useMemo(() => {
    return MOCK_COURSES.filter(c => {
      if (c.isEnrolled || purchasedIds.includes(c.id)) return false;
      const matchSubject = selectedSubject === 'Tất cả' || c.subject === selectedSubject;
      const matchGrade = selectedGrade === 'Tất cả' || c.grade === selectedGrade;
      const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.instructor.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSubject && matchGrade && matchSearch;
    });
  }, [selectedSubject, selectedGrade, searchQuery, purchasedIds]);

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      {/* Header chứa logo, thanh tìm kiếm (kết nối với searchQuery qua URL), và giỏ hàng */}
      <DashboardHeader />
      <PageBanner title="Khóa học của tôi" subtitle="Tiếp tục hành trình học tập của bạn" />

      {/* ── Nội dung chính ───────────────────────────────────────────────────
          Sidebar điều hướng nằm trong header (click avatar → panel hiện ra)
          nên layout trang chỉ cần 1 cột full-width.
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="flex-grow max-w-[1600px] mx-auto w-full px-4 md:px-10 py-8">
        <main>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 1: KHÓA HỌC ĐÃ THAM GIA
            Hiển thị danh sách enrolledCourses dạng grid với thanh tiến độ.
            Section này luôn hiển thị phía trên (kể cả khi enrolledCourses rỗng).
        ════════════════════════════════════════════════════════════════════════ */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-fixed text-primary rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-on-surface">Khóa Học Của Tôi</h2>
          </div>

          {/* Grid khóa học đã tham gia — stagger animation: mỗi card delay thêm 0.1s */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {enrolledCourses.map((course, idx) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm border border-outline-variant/50 hover:shadow-lg hover:border-primary/30 transition-all group flex flex-col h-full"
              >
                <div className="relative h-40 overflow-hidden">
                  <Link to={`/courses/${course.id}`}>
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>
                  <div className="absolute top-3 left-3 bg-surface/90 backdrop-blur text-xs font-bold px-3 py-1 rounded-full text-on-surface pointer-events-none">
                    {course.grade}
                  </div>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors pointer-events-none" />
                  <Link to={`/courses/${course.id}`} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center text-primary shadow-lg hover:scale-110 transition-transform">
                      <PlayCircle className="w-8 h-8" />
                    </div>
                  </Link>
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <Link to={`/courses/${course.id}`}>
                    <h3 className="text-lg font-bold mb-1.5 line-clamp-2 text-on-surface hover:text-primary transition-colors">{course.title}</h3>
                  </Link>

                  {/* Nút yêu thích — bên dưới tên khóa học */}
                  <button
                    onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFavorite(course.id); }}
                    className="flex items-center gap-1 mb-2 group/fav"
                  >
                    <Heart className={`w-3.5 h-3.5 transition-all ${favoritedIds.includes(course.id) ? 'fill-red-500 text-red-500' : 'text-on-surface-variant/40 group-hover/fav:text-red-400'}`} />
                    <span className={`text-xs font-medium transition-colors ${favoritedIds.includes(course.id) ? 'text-red-500' : 'text-on-surface-variant/40 group-hover/fav:text-red-400'}`}>
                      {favoritedIds.includes(course.id) ? 'Đã yêu thích' : 'Yêu thích'}
                    </span>
                  </button>

                  <p className="text-sm text-on-surface-variant mb-4">{course.instructor}</p>

                  {/* Thanh tiến độ — animated từ 0 → course.progress% */}
                  <div className="mt-auto">
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-primary">Tiến độ</span>
                      <span className="text-on-surface">{course.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${course.progress}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <hr className="border-outline-variant/30 mb-12" />

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 2: KHÁM PHÁ KHÓA HỌC
            Layout 2 cột: sidebar bộ lọc (trái) + grid khóa học (phải).
            Bộ lọc: Môn học (button toggle) + Lớp học (radio) + Tìm kiếm (mobile only).
        ════════════════════════════════════════════════════════════════════════ */}
        <section>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary-container text-on-secondary-container rounded-xl flex items-center justify-center">
                <Filter className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-on-surface">Khám Phá Khóa Học</h2>
            </div>

            {/* Thanh tìm kiếm — chỉ hiển thị trên mobile (Header đã có search trên desktop) */}
            <div className="w-full lg:w-72 relative md:hidden">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Tìm khóa học..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface-container border border-outline-variant/50 focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* ── SIDEBAR BỘ LỌC ─────────────────────────────────────────────
                sticky top-24: sidebar dính theo khi scroll, không bị cuộn mất
                Hai bộ lọc độc lập: selectedSubject và selectedGrade
            ──────────────────────────────────────────────────────────────── */}
            <div className="w-full lg:w-64 flex-shrink-0 space-y-8 bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant/40 shadow-sm sticky top-24">
              {/* Bộ lọc Môn học — dạng button toggle, chỉ chọn 1 môn tại một thời điểm */}
              <div>
                <h3 className="font-bold text-lg mb-4 text-on-surface">Môn Học</h3>
                <div className="flex flex-wrap gap-2">
                  {SUBJECTS.map(subject => (
                    <button
                      key={subject}
                      onClick={() => setSelectedSubject(subject)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        selectedSubject === subject
                          ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bộ lọc Lớp học — dạng radio (custom UI, input hidden) */}
              <div>
                <h3 className="font-bold text-lg mb-4 text-on-surface">Lớp Học</h3>
                <div className="flex flex-col gap-2">
                  {GRADES.map(grade => (
                    <label key={grade} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        selectedGrade === grade
                          ? 'bg-primary border-primary'
                          : 'border-outline-variant group-hover:border-primary'
                      }`}>
                        {selectedGrade === grade && <div className="w-2.5 h-2.5 bg-on-primary rounded-sm" />}
                      </div>
                      <span className={`font-medium ${selectedGrade === grade ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'}`}>
                        {grade}
                      </span>
                      <input
                        type="radio"
                        name="grade"
                        className="hidden"
                        checked={selectedGrade === grade}
                        onChange={() => setSelectedGrade(grade)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* ── GRID KHÓA HỌC ──────────────────────────────────────────────
                motion.div layout: tự động animate vị trí các card khi lọc thay đổi
                AnimatePresence: card mới fade in, card bị xóa fade out mượt mà
                Trường hợp rỗng: hiển thị empty state kèm nút "Xóa bộ lọc"
            ──────────────────────────────────────────────────────────────── */}
            <div className="flex-1 w-full">
              {availableCourses.length > 0 ? (
                <motion.div layout className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {availableCourses.map((course) => (
                      <motion.div
                        layout
                        key={course.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm border border-outline-variant/40 hover:shadow-xl hover:border-primary/50 transition-all group flex flex-col h-full"
                      >
                        <div className="relative h-48 overflow-hidden">
                          <Link to={`/courses/${course.id}`}>
                            <img
                              src={course.image}
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          </Link>
                          <div className="absolute top-4 left-4 flex gap-2 pointer-events-none">
                            <span className="bg-surface/90 backdrop-blur text-xs font-bold px-3 py-1.5 rounded-full text-on-surface shadow-sm">
                              {course.grade}
                            </span>
                            <span className="bg-primary/90 backdrop-blur text-xs font-bold px-3 py-1.5 rounded-full text-on-primary shadow-sm">
                              {course.subject}
                            </span>
                          </div>
                        </div>
                        <div className="p-6 flex flex-col flex-grow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1 text-sm font-semibold text-amber-500">
                              <Star className="w-4 h-4 fill-amber-500" /> {course.rating}
                            </div>
                            <div className="flex items-center gap-1 text-sm font-medium text-on-surface-variant">
                              <Users className="w-4 h-4" /> {course.students.toLocaleString('vi-VN')}
                            </div>
                          </div>
                          <Link to={`/courses/${course.id}`}>
                            <h3 className="text-xl font-bold mb-1.5 line-clamp-2 text-on-surface leading-tight hover:text-primary transition-colors">{course.title}</h3>
                          </Link>

                          {/* Nút yêu thích — bên dưới tên khóa học */}
                          <button
                            onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFavorite(course.id); }}
                            className="flex items-center gap-1 mb-3 group/fav"
                          >
                            <Heart className={`w-3.5 h-3.5 transition-all ${favoritedIds.includes(course.id) ? 'fill-red-500 text-red-500' : 'text-on-surface-variant/40 group-hover/fav:text-red-400'}`} />
                            <span className={`text-xs font-medium transition-colors ${favoritedIds.includes(course.id) ? 'text-red-500' : 'text-on-surface-variant/40 group-hover/fav:text-red-400'}`}>
                              {favoritedIds.includes(course.id) ? 'Đã yêu thích' : 'Yêu thích'}
                            </span>
                          </button>

                          <p className="text-on-surface-variant text-sm mb-6 line-clamp-2 leading-relaxed">
                            {course.description}
                          </p>

                          {/* Footer card: tên giảng viên + nút CTA → CourseDetailPage */}
                          <div className="mt-auto flex items-center justify-between pt-4 border-t border-outline-variant/30">
                            <span className="text-sm font-semibold text-on-surface-variant">
                              {course.instructor}
                            </span>
                            <Link to={`/courses/${course.id}`} className="px-5 py-2 rounded-xl font-bold text-sm text-primary bg-primary/10 hover:bg-primary hover:text-on-primary transition-colors">
                              Mua Ngay
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                // Empty state — hiển thị khi không có khóa học nào khớp bộ lọc
                <div className="w-full py-20 flex flex-col items-center justify-center bg-surface-container-lowest rounded-[2rem] border border-outline-variant/30 border-dashed">
                  <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4 text-on-surface-variant">
                    <Search className="w-10 h-10 opacity-50" />
                  </div>
                  <h3 className="text-xl font-bold text-on-surface mb-2">Không tìm thấy khóa học nào</h3>
                  <p className="text-on-surface-variant text-center max-w-md">
                    Không có khóa học nào phù hợp với bộ lọc Môn: <strong className="text-primary">{selectedSubject}</strong> và Lớp: <strong className="text-primary">{selectedGrade}</strong>. Vui lòng thử lại!
                  </p>
                  {/* Reset cả 2 bộ lọc về 'Tất cả' */}
                  <button
                    onClick={() => { setSelectedSubject('Tất cả'); setSelectedGrade('Tất cả'); }}
                    className="mt-6 px-6 py-2.5 bg-surface-container text-on-surface font-semibold rounded-full hover:bg-surface-container-high transition-colors border border-outline-variant/50"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              )}
            </div>

          </div>
        </section>
        </main>
      </div>
    </div>
  );
}
