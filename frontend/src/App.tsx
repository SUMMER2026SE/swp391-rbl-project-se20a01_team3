import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/common/LandingPage';
import QuizPage from './pages/QuizPage';
import Login from './pages/common/Login';
import Register from './pages/common/Register';
import CoursesPage from './pages/student/CoursesPage';
import CourseDetailPage from './pages/student/CourseDetailPage';
import CheckoutPage from './pages/student/CheckoutPage';
import PaymentResultPage from './pages/student/PaymentResultPage';
import OrdersPage from './pages/student/OrdersPage';
import ComingSoonPage from './pages/student/ComingSoonPage';
import MessagesPage from './pages/student/MessagesPage';
import ProfilePage from './pages/student/ProfilePage';
import FavoritesPage from './pages/student/FavoritesPage';
import AccountPage from './pages/student/AccountPage';
import DashboardAdmin from './pages/admin/DashboardAdmin';
import DashboardTeacher from './pages/teacher/DashboardTeacher';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        {/* ── Public ── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── Student ── */}
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/payment-result" element={<PaymentResultPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/favorites"     element={<FavoritesPage />} />
        <Route path="/messages"      element={<MessagesPage />} />
        <Route path="/profile"       element={<ProfilePage />} />
        <Route path="/account/type"  element={<ComingSoonPage title="Loại tài khoản"        subtitle="Quản lý gói đăng ký của bạn" />} />
        <Route path="/account/photo" element={<ComingSoonPage title="Ảnh đại diện"          subtitle="Cập nhật ảnh đại diện" />} />
        <Route path="/account"       element={<AccountPage />} />

        {/* ── Teacher ── */}
        <Route path="/teacher"          element={<DashboardTeacher />} />
        <Route path="/teacher/courses"  element={<ComingSoonPage title="Khóa học của tôi"   subtitle="Tạo và quản lý khóa học, submit duyệt" />} />
        <Route path="/teacher/content"  element={<ComingSoonPage title="Bài giảng"           subtitle="Cập nhật bài giảng và tài liệu" />} />
        <Route path="/teacher/quiz"     element={<ComingSoonPage title="Quiz & Kiểm tra"     subtitle="Tạo quiz chương và bài kiểm tra" />} />
        <Route path="/teacher/grades"   element={<ComingSoonPage title="Chấm điểm"            subtitle="Chấm điểm bài tập học sinh" />} />
        <Route path="/teacher/qa"       element={<ComingSoonPage title="Hỏi & Đáp"            subtitle="Trả lời câu hỏi học sinh" />} />
        <Route path="/teacher/stripe"   element={<ComingSoonPage title="Kết nối Stripe"       subtitle="Kết nối tài khoản Stripe để nhận hoa hồng" />} />
        <Route path="/teacher/revenue"  element={<ComingSoonPage title="Doanh thu"             subtitle="Báo cáo doanh thu và hoa hồng" />} />

        {/* ── Admin ── */}
        <Route path="/admin"          element={<DashboardAdmin />} />
        <Route path="/admin/teachers"   element={<ComingSoonPage title="Quản lý giáo viên" subtitle="Danh sách và thông tin giáo viên" />} />
        <Route path="/admin/accounting" element={<ComingSoonPage title="Kế toán"           subtitle="Quản lý thu chi và báo cáo tài chính" />} />
        <Route path="/admin/salary"     element={<ComingSoonPage title="Lương"             subtitle="Quản lý lương giáo viên và nhân sự" />} />
        <Route path="/admin/reports"    element={<ComingSoonPage title="Báo cáo & Thống kê" subtitle="Phân tích dữ liệu và báo cáo tổng hợp" />} />
        <Route path="/admin/settings"   element={<ComingSoonPage title="Cài đặt hệ thống"  subtitle="Cấu hình và tuỳ chỉnh hệ thống" />} />
      </Routes>
    </BrowserRouter>
  );
}
