import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, User, KeyRound, CheckCircle } from 'lucide-react';
import { notify } from '../../lib/toast';

export default function Register() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      notify.error("Vui lòng nhập email hợp lệ!");
      return;
    }
    const toastId = notify.loading("Đang gửi mã OTP...");
    
    // Mock sending OTP
    setTimeout(() => {
      notify.dismiss(toastId);
      notify.success("Mã OTP đã được gửi đến email của bạn!");
      setStep(2);
    }, 1500);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = notify.loading("Đang xác thực mã OTP...");

    // Mock verifying OTP
    setTimeout(() => {
      notify.dismiss(toastId);
      notify.success("Xác thực thành công!");
      setStep(3);
      // Auto redirect after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      {step === 1 && (
        <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> Về trang chủ
        </Link>
      )}
      
      <div className="w-full max-w-md relative">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-surface-container-lowest p-8 md:p-12 rounded-[2rem] shadow-xl shadow-primary/5 border border-outline-variant/30 overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
              
              <div className="text-center mb-10 relative z-10">
                <div className="w-12 h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center font-bold text-2xl mx-auto mb-4 shadow-lg shadow-primary/20">
                  B
                </div>
                <h1 className="text-3xl font-extrabold mb-2">Đăng Ký</h1>
                <p className="text-on-surface-variant text-sm">Tạo tài khoản để bắt đầu học tập!</p>
              </div>

              <form className="space-y-5 relative z-10" onSubmit={handleRegister}>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface ml-1">Họ và tên</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant">
                      <User className="w-5 h-5" />
                    </div>
                    <input 
                      type="text" 
                      required
                      placeholder="Nhập họ tên của bạn" 
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface-container border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-on-surface-variant/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface ml-1">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Nhập email của bạn" 
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface-container border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-on-surface-variant/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface ml-1">Mật khẩu</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input 
                      type="password" 
                      required
                      placeholder="Tạo mật khẩu" 
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface-container border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-on-surface-variant/50"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all mt-4"
                >
                  Tạo Tài Khoản
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-on-surface-variant relative z-10">
                Đã có tài khoản? <Link to="/login" className="text-primary font-bold hover:underline">Đăng nhập</Link>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-surface-container-lowest p-8 md:p-12 rounded-[2rem] shadow-xl shadow-primary/5 border border-outline-variant/30 overflow-hidden relative"
            >
              <div className="text-center mb-8 relative z-10">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-extrabold mb-2">Xác Nhận Email</h2>
                <p className="text-on-surface-variant text-sm">
                  Chúng tôi đã gửi mã OTP 6 số đến email<br/>
                  <strong className="text-on-surface">{email || 'của bạn'}</strong>
                </p>
              </div>

              <form className="space-y-6 relative z-10" onSubmit={handleVerifyOTP}>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface ml-1">Mã OTP</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <input 
                      type="text" 
                      required
                      maxLength={6}
                      placeholder="Nhập mã 6 chữ số" 
                      className="w-full pl-12 pr-4 py-4 text-center tracking-[0.5em] font-bold text-lg rounded-xl bg-surface-container border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all"
                >
                  Xác Nhận
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-on-surface-variant relative z-10">
                Chưa nhận được mã? <button className="text-primary font-bold hover:underline">Gửi lại ngay</button>
              </div>
              
              <button 
                onClick={() => setStep(1)}
                className="mt-4 w-full text-center text-sm font-medium text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Quay lại
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-container-lowest p-8 md:p-12 rounded-[2rem] shadow-xl shadow-primary/5 border border-outline-variant/30 overflow-hidden text-center"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-10 h-10" />
              </motion.div>
              <h2 className="text-2xl font-extrabold mb-2">Đăng Ký Thành Công!</h2>
              <p className="text-on-surface-variant">Tài khoản của bạn đã được xác minh.</p>
              <p className="text-sm text-on-surface-variant mt-4 opacity-70">
                Đang chuyển hướng đến trang đăng nhập...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
