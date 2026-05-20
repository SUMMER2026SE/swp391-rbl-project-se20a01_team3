import { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Mail, Lock } from 'lucide-react';
import { notify } from '../../lib/toast';
import { useAuthStore } from '../../store/useAuthStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate  = useNavigate();
  const location  = useLocation();
  const loginStore = useAuthStore(state => state.login);

  // Đọc trang nguồn từ location.state — được truyền khi redirect sang login
  // Ví dụ: handleAddToCart() truyền { from: '/courses/abc' } khi chưa đăng nhập
  const redirectTo = (location.state as { from?: string })?.from ?? '/courses';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      notify.error("Vui lòng nhập đầy đủ email và mật khẩu!");
      return;
    }

    const toastId = notify.loading("Đang đăng nhập...");

    setTimeout(() => {
      notify.dismiss(toastId);
      // Cập nhật trạng thái đăng nhập trong store → isLoggedIn = true
      loginStore({ name: 'Học viên Bee', email });
      notify.success("Đăng nhập thành công!");
      // Redirect về trang nguồn (hoặc /courses nếu đến thẳng từ login)
      // replace: true để bấm Back không quay lại trang login
      navigate(redirectTo, { replace: true });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-medium">
        <ArrowLeft className="w-5 h-5" /> Về trang chủ
      </Link>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-container-lowest p-8 md:p-12 rounded-[2rem] shadow-xl shadow-primary/5 border border-outline-variant/30 w-full max-w-md relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="text-center mb-10 relative z-10">
          <div className="w-12 h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center font-bold text-2xl mx-auto mb-4 shadow-lg shadow-primary/20">
            B
          </div>
          <h1 className="text-3xl font-extrabold mb-2">Đăng Nhập</h1>
          <p className="text-on-surface-variant text-sm">Chào mừng bạn quay lại Bee Academy!</p>
        </div>

        <form className="space-y-6 relative z-10" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface ml-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant">
                <Mail className="w-5 h-5" />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn" 
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface-container border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-semibold text-on-surface">Mật khẩu</label>
              <a href="#" className="text-sm text-primary hover:underline font-medium">Quên mật khẩu?</a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant">
                <Lock className="w-5 h-5" />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu" 
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface-container border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all"
          >
            Đăng Nhập
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-on-surface-variant relative z-10">
          Chưa có tài khoản? <Link to="/register" className="text-primary font-bold hover:underline">Đăng ký ngay</Link>
        </div>
      </motion.div>
    </div>
  );
}
