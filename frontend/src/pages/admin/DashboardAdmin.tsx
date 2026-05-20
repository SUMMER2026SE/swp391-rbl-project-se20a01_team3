/**
 * TRANG TỔNG QUAN ADMIN — Bee Academy
 *
 * Cấu trúc trang:
 *  1. AdminHeader      — thanh điều hướng admin (logo + nav + avatar)
 *  2. WelcomeBar       — lời chào + ngày tháng hiện tại
 *  3. StatCards        — 4 thẻ số liệu chính (doanh thu, học viên, khóa học, đơn hàng)
 *  4. RecentOrders     — bảng 5 đơn hàng mới nhất
 *  5. TopCourses       — top 5 khóa học theo số học viên (dạng thanh ngang)
 *  6. QuickActions     — nút tắt điều hướng đến các trang quản lý
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
  LayoutDashboard, BookOpen, Users, ShoppingBag,
  FileText, TrendingUp, TrendingDown, DollarSign,
  Star, ChevronRight, Bell, LogOut, Menu, X,
  CheckCircle2, Clock, XCircle, PlusCircle, Calculator, Wallet, BarChart2, Settings,
} from 'lucide-react';
import { MOCK_COURSES } from '../../data/mockCourses';

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — KIỂU DỮ LIỆU (Types)
//
// Định nghĩa hình dạng dữ liệu mà component sẽ dùng.
// Dùng `interface` cho object shape, `type` cho union/alias.
// ─────────────────────────────────────────────────────────────────────────────

// Mỗi dòng trong bảng đơn hàng gần đây
interface Order {
  id: string;          // mã đơn hàng
  student: string;     // tên học sinh
  course: string;      // tên khóa học
  amount: number;      // số tiền (VND)
  date: string;        // ngày đặt hàng
  status: 'success' | 'pending' | 'failed'; // trạng thái thanh toán
}

// Mỗi thẻ số liệu ở đầu trang (doanh thu, học viên, v.v.)
interface StatCardData {
  title: string;
  value: string;
  change: number;      // % thay đổi so với tháng trước (dương = tăng, âm = giảm)
  icon: React.ReactNode;
  color: string;       // màu nền của vùng icon
  iconColor: string;   // màu icon
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — DỮ LIỆU GIẢ LẬP (Mock Data)
//
// Trong môi trường thực, phần này sẽ được thay bằng API calls (useEffect + axios).
// Hiện tại dùng mock data để giao diện có thể chạy ngay không cần backend.
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_ORDERS: Order[] = [
  { id: 'ORD-001', student: 'Nguyễn Văn An',   course: 'Toán Đại Số Nâng Cao',     amount: 499000, date: '18/05/2026', status: 'success' },
  { id: 'ORD-002', student: 'Trần Thị Bích',   course: 'Vật Lý Khám Phá Điện Từ',  amount: 550000, date: '18/05/2026', status: 'success' },
  { id: 'ORD-003', student: 'Lê Minh Cường',   course: 'Hóa Học Cơ Bản',           amount: 400000, date: '17/05/2026', status: 'pending' },
  { id: 'ORD-004', student: 'Phạm Thị Dung',   course: 'Văn Học Dân Gian',          amount: 350000, date: '17/05/2026', status: 'success' },
  { id: 'ORD-005', student: 'Hoàng Quốc Đạt',  course: 'Lịch Sử Kháng Chiến',      amount: 299000, date: '16/05/2026', status: 'failed'  },
  { id: 'ORD-006', student: 'Vũ Ngọc Hà',      course: 'Toán Hình Học Không Gian',  amount: 450000, date: '16/05/2026', status: 'success' },
  { id: 'ORD-007', student: 'Đỗ Thanh Hùng',   course: 'Địa Lý Khí Hậu Vùng Miền', amount: 250000, date: '15/05/2026', status: 'success' },
];

// Tính tổng doanh thu từ các đơn thành công
// Array.reduce() cộng dồn: bắt đầu từ 0, mỗi vòng cộng thêm amount
const totalRevenue = MOCK_ORDERS
  .filter(o => o.status === 'success')
  .reduce((sum, o) => sum + o.amount, 0);

// Tổng số học viên lấy từ mock courses
const totalStudents = MOCK_COURSES.reduce((sum, c) => sum + c.students, 0);

// Danh sách nav trong sidebar — dùng mảng để render bằng .map() thay vì viết lặp lại
const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Tổng quan',          path: '/admin',           active: true  },
  { icon: Users,           label: 'Quản lý người dùng', path: '/admin/users',     active: false },
  { icon: BookOpen,        label: 'Khóa học',            path: '/admin/courses',   active: false },
  { icon: ShoppingBag,     label: 'Đơn hàng',            path: '/admin/orders',    active: false },
  { icon: Calculator,      label: 'Kế toán',             path: '/admin/accounting', active: false },
  { icon: Wallet,          label: 'Lương',               path: '/admin/salary',      active: false },
  { icon: BarChart2,       label: 'Báo cáo & Thống kê', path: '/admin/reports',     active: false },
  { icon: Settings,        label: 'Cài đặt hệ thống',   path: '/admin/settings',    active: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — COMPONENT PHỤ: StatCard
//
// Hiển thị một thẻ số liệu (ví dụ: "Doanh thu: 2.048.000đ ↑ +12%").
// Tách thành component riêng để: (1) code rõ ràng hơn, (2) tái sử dụng dễ.
//
// Props:
//  - data  : dữ liệu để hiển thị (title, value, change, icon, màu sắc)
//  - delay : độ trễ animation — 4 thẻ xuất hiện lần lượt (stagger effect)
// ─────────────────────────────────────────────────────────────────────────────

interface StatCardProps {
  data: StatCardData;
  delay: number;
}

function StatCard({ data, delay }: StatCardProps) {
  // Xác định chiều thay đổi để chọn icon và màu phù hợp
  const isPositive = data.change >= 0;

  return (
    // motion.div từ thư viện Framer Motion: animate từ mờ + dịch xuống → hiện ra
    // initial: trạng thái ban đầu | animate: trạng thái cuối
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-semibold text-on-surface-variant">{data.title}</p>
        {/* Icon với màu nền tùy theo loại số liệu */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${data.color}`}>
          <span className={data.iconColor}>{data.icon}</span>
        </div>
      </div>

      {/* Giá trị chính — to nhất */}
      <p className="text-2xl font-extrabold text-on-surface mb-2">{data.value}</p>

      {/* % tăng/giảm — xanh nếu tăng, đỏ nếu giảm */}
      <div className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        <span>{isPositive ? '+' : ''}{data.change}% so với tháng trước</span>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — COMPONENT PHỤ: OrderStatusBadge
//
// Badge nhỏ cho trạng thái đơn hàng.
// Dùng object `config` thay vì if/else dài dòng — dễ thêm trạng thái mới sau này.
// ─────────────────────────────────────────────────────────────────────────────

function OrderStatusBadge({ status }: { status: Order['status'] }) {
  // Lookup table: map từng status → { icon, text, màu CSS }
  const config = {
    success: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'Thành công', className: 'bg-green-500/10 text-green-600' },
    pending:  { icon: <Clock       className="w-3.5 h-3.5" />, label: 'Đang chờ',   className: 'bg-amber-500/10 text-amber-600' },
    failed:   { icon: <XCircle     className="w-3.5 h-3.5" />, label: 'Thất bại',   className: 'bg-red-500/10   text-red-600'   },
  };

  const { icon, label, className } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${className}`}>
      {icon}
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — COMPONENT PHỤ: TopCoursesBar
//
// Top 5 khóa học theo số học viên, hiển thị dạng thanh ngang.
// Không dùng chart library — tự dựng bằng CSS width % để nhẹ và đơn giản.
//
// Cách tính chiều rộng thanh:
//   thanh_rộng_nhất = 100%  (khóa có nhiều học viên nhất)
//   các thanh khác  = (học_viên_khóa_đó / max) * 100%
// ─────────────────────────────────────────────────────────────────────────────

function TopCoursesBar() {
  // Sắp xếp giảm dần theo students, lấy 5 khóa đầu
  const top5 = [...MOCK_COURSES]
    .sort((a, b) => b.students - a.students)
    .slice(0, 5);

  const maxStudents = top5[0].students; // giá trị lớn nhất = cơ sở 100%

  return (
    <div className="space-y-5">
      {top5.map((course, idx) => (
        <div key={course.id}>
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-sm font-semibold text-on-surface line-clamp-1 flex-1 pr-4">
              {course.title}
            </p>
            <span className="text-sm font-bold text-on-surface-variant flex-shrink-0">
              {course.students.toLocaleString('vi-VN')}
            </span>
          </div>

          {/* Thanh ngang animate — width từ 0% → tỉ lệ thực */}
          <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(course.students / maxStudents) * 100}%` }}
              // Stagger: thanh thứ idx xuất hiện muộn hơn 100ms × idx
              transition={{ delay: 0.3 + idx * 0.1, duration: 0.8, ease: 'easeOut' }}
            />
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs text-on-surface-variant">{course.rating}</span>
            <span className="text-xs text-on-surface-variant">·</span>
            <span className="text-xs text-primary font-medium">{course.subject} · {course.grade}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — COMPONENT CHÍNH: DashboardAdmin (export default)
//
// React Router render component này khi truy cập /admin.
//
// State:
//  - isSidebarOpen: boolean — sidebar trên mobile mở hay đóng
//    (Trên desktop lg: sidebar luôn hiện, không cần state này)
//
// Bố cục (flex ngang):
//  ┌──────────┬──────────────────────────────────┐
//  │ Sidebar  │ Header                           │
//  │  (w-64)  ├──────────────────────────────────┤
//  │          │ Main content                     │
//  │          │  - Welcome bar                   │
//  │          │  - 4 StatCards                   │
//  │          │  - Orders table + Top courses    │
//  │          │  - Quick actions                 │
//  └──────────┴──────────────────────────────────┘
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardAdmin() {
  // Sidebar mobile: false = đóng (mặc định), true = mở
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigate = useNavigate();
  const logout   = useAuthStore(state => state.logout);

  // Đăng xuất: xóa user khỏi store → redirect về trang login
  function handleLogout() {
    logout();
    navigate('/login');
  }

  // Cấu hình 4 thẻ số liệu — tách riêng khỏi JSX để code gọn hơn
  const statCards: StatCardData[] = [
    {
      title: 'Doanh thu tháng này',
      value: `${totalRevenue.toLocaleString('vi-VN')}đ`,
      change: 12.5,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'bg-green-500/10',
      iconColor: 'text-green-500',
    },
    {
      title: 'Tổng học viên',
      value: totalStudents.toLocaleString('vi-VN'),
      change: 8.2,
      icon: <Users className="w-5 h-5" />,
      color: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
    },
    {
      title: 'Khóa học đang bán',
      value: MOCK_COURSES.length.toString(),
      change: 0,
      icon: <BookOpen className="w-5 h-5" />,
      color: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Đơn hàng tháng này',
      value: MOCK_ORDERS.length.toString(),
      change: -3.1,
      icon: <ShoppingBag className="w-5 h-5" />,
      color: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
    },
  ];

  return (
    // Bố cục tổng: flex ngang, sidebar trái + nội dung phải
    <div className="min-h-screen bg-surface flex font-sans">

      {/* ─────────────────────────────────────────────────────────────────────
          SIDEBAR
          Trên mobile: fixed overlay (z-40), ẩn/hiện qua isSidebarOpen
          Trên desktop (lg:): relative, luôn hiển thị (translate-x-0)
          ───────────────────────────────────────────────────────────────── */}

      {/* Lớp backdrop đen phía sau sidebar — chỉ hiện trên mobile khi sidebar mở */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64
        bg-surface-container-lowest border-r border-outline-variant/30
        flex flex-col transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex
      `}>
        {/* Logo */}
        <div className="p-6 flex items-center justify-between border-b border-outline-variant/20">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary text-on-primary rounded-xl flex items-center justify-center font-extrabold text-lg shadow-md shadow-primary/20">
              B
            </div>
            <div>
              <p className="font-extrabold text-on-surface text-sm">Bee Academy</p>
              <p className="text-xs text-on-surface-variant font-medium">Admin Panel</p>
            </div>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-on-surface-variant">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links — render bằng .map() từ mảng NAV_ITEMS */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                item.active
                  ? 'bg-primary/10 text-primary'                                             // trang hiện tại
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface' // trang khác
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
              {/* Chấm tròn nhỏ đánh dấu trang active */}
              {item.active && <div className="ml-auto w-2 h-2 bg-primary rounded-full" />}
            </Link>
          ))}
        </nav>

        {/* Footer sidebar */}
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

      {/* ─────────────────────────────────────────────────────────────────────
          VÙNG NỘI DUNG CHÍNH
          flex-1: chiếm hết không gian còn lại sau sidebar
          min-w-0: ngăn content tràn khi text dài
          ───────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── HEADER ───────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 h-16 bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 flex items-center justify-between px-4 md:px-6 shadow-sm">
          {/* Nút hamburger mở sidebar — chỉ trên mobile */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="font-extrabold text-on-surface text-lg hidden lg:block">
            Tổng quan
          </h1>

          {/* Actions phải: chuông thông báo + avatar admin */}
          <div className="flex items-center gap-4 ml-auto">
            <button className="relative text-on-surface-variant hover:text-primary transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">3</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-on-surface leading-none">Admin Bee</p>
                <p className="text-xs text-on-surface-variant mt-0.5">Quản trị viên</p>
              </div>
              <img
                src="https://ui-avatars.com/api/?name=Admin+Bee&background=ad2c00&color=fff&bold=true&size=64"
                alt="Admin"
                className="w-9 h-9 rounded-full border-2 border-primary/30"
              />
            </div>
          </div>
        </header>

        {/* ── NỘI DUNG TRANG ────────────────────────────────────────────────── */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">

          {/* Lời chào + ngày tháng */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-extrabold text-on-surface">Xin chào, Admin! 👋</h2>
            <p className="text-on-surface-variant mt-1">
              {/* toLocaleDateString với locale 'vi-VN' → format ngày tiếng Việt */}
              {new Date().toLocaleDateString('vi-VN', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </motion.div>

          {/* ── 4 thẻ số liệu ─────────────────────────────────────────────────
              Grid: 1 cột mobile → 2 cột tablet → 4 cột desktop
              Mỗi thẻ delay 0ms, 100ms, 200ms, 300ms (stagger effect)
              ────────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            {statCards.map((card, idx) => (
              <StatCard key={card.title} data={card} delay={idx * 0.1} />
            ))}
          </div>

          {/* ── Bảng đơn hàng (3/5) + Top khóa học (2/5) ────────────────────
              lg:grid-cols-5 chia không đều: orders chiếm 3/5, top courses 2/5
              ────────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">

            {/* Bảng đơn hàng gần đây */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-3 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
                <h3 className="font-extrabold text-on-surface">Đơn hàng gần đây</h3>
                <Link to="/admin/orders" className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
                  Xem tất cả <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* overflow-x-auto: bảng cuộn ngang trên màn hình nhỏ thay vì bị vỡ layout */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/20 bg-surface-container/50">
                      {/* hidden md:table-cell: ẩn cột này trên mobile để bảng không quá chật */}
                      <th className="text-left px-6 py-3 font-bold text-on-surface-variant text-xs uppercase tracking-wide">Học sinh</th>
                      <th className="text-left px-4 py-3 font-bold text-on-surface-variant text-xs uppercase tracking-wide hidden md:table-cell">Khóa học</th>
                      <th className="text-left px-4 py-3 font-bold text-on-surface-variant text-xs uppercase tracking-wide">Số tiền</th>
                      <th className="text-left px-4 py-3 font-bold text-on-surface-variant text-xs uppercase tracking-wide hidden sm:table-cell">Ngày</th>
                      <th className="text-left px-4 py-3 font-bold text-on-surface-variant text-xs uppercase tracking-wide">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_ORDERS.map((order, idx) => (
                      <tr
                        key={order.id}
                        // Màu nền xen kẽ chẵn/lẻ → dễ đọc hơn (zebra striping)
                        className={`border-b border-outline-variant/10 hover:bg-surface-container/30 transition-colors ${
                          idx % 2 !== 0 ? 'bg-surface-container/20' : ''
                        }`}
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            {/* Avatar tự sinh từ tên — dùng dịch vụ ui-avatars.com */}
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(order.student)}&size=32&background=random&bold=true`}
                              alt={order.student}
                              className="w-8 h-8 rounded-full flex-shrink-0"
                            />
                            <div>
                              <p className="font-semibold text-on-surface">{order.student}</p>
                              <p className="text-xs text-on-surface-variant font-mono">{order.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-on-surface-variant hidden md:table-cell">
                          <span className="line-clamp-1 max-w-[180px] block">{order.course}</span>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-on-surface">
                          {order.amount.toLocaleString('vi-VN')}đ
                        </td>
                        <td className="px-4 py-3.5 text-on-surface-variant hidden sm:table-cell">
                          {order.date}
                        </td>
                        <td className="px-4 py-3.5">
                          <OrderStatusBadge status={order.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Top khóa học */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-extrabold text-on-surface">Top khóa học</h3>
                <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-1 rounded-full font-medium">
                  Theo học viên
                </span>
              </div>
              <TopCoursesBar />
            </motion.div>
          </div>

          {/* ── Quick Actions ──────────────────────────────────────────────────
              4 nút tắt dẫn đến các trang quản lý.
              Dùng array.map() để render thay vì viết 4 Link riêng lẻ.
              ────────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="font-extrabold text-on-surface mb-4">Thao tác nhanh</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: <PlusCircle className="w-6 h-6" />, label: 'Thêm khóa học',     desc: 'Tạo khóa học mới',           path: '/admin/courses', color: 'bg-primary/10 text-primary hover:bg-primary/20'        },
                { icon: <Users      className="w-6 h-6" />, label: 'Quản lý học viên',  desc: 'Xem & chỉnh sửa tài khoản',  path: '/admin/users',   color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'     },
                { icon: <ShoppingBag className="w-6 h-6" />,label: 'Xem đơn hàng',      desc: 'Theo dõi thanh toán',         path: '/admin/orders',  color: 'bg-green-500/10 text-green-600 hover:bg-green-500/20'  },
                { icon: <FileText   className="w-6 h-6" />, label: 'Quản lý blog',       desc: 'Đăng bài viết mới',           path: '/admin/blog',    color: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'  },
              ].map(action => (
                <Link
                  key={action.path}
                  to={action.path}
                  className={`flex items-center gap-4 p-4 rounded-2xl border border-outline-variant/30 transition-all hover:shadow-sm group ${action.color}`}
                >
                  <div className="flex-shrink-0">{action.icon}</div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{action.label}</p>
                    <p className="text-xs opacity-70 mt-0.5 truncate">{action.desc}</p>
                  </div>
                  {/* Mũi tên chỉ hiện khi hover — opacity transition */}
                  <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </motion.div>

        </main>
      </div>
    </div>
  );
}
