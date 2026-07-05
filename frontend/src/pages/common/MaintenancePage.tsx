import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { RefreshCw, LogIn, Mail, Facebook } from 'lucide-react';

const PROGRESS_TARGET = 85;

export default function MaintenancePage() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setProgress(PROGRESS_TARGET), 300);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center font-sans px-4 py-12 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-16 right-10 w-56 h-56 bg-primary/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 max-w-lg w-full flex flex-col items-center text-center py-14 px-8 bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl border border-outline-variant/30 shadow-xl"
      >
        <p className="font-bold text-lg text-primary mb-6">Bee Academy</p>

        <motion.div
          animate={{ y: [0, -14, 0], rotate: [0, 2, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-5xl"
        >
          🐝
        </motion.div>

        <h1 className="text-2xl font-extrabold text-on-surface mb-3">
          Hệ thống đang bảo trì
        </h1>

        <p className="text-on-surface-variant text-sm leading-relaxed mb-8 max-w-sm">
          Chúng tôi đang nâng cấp tổ ong để mang lại trải nghiệm tốt hơn cho
          các bạn nhỏ. Vui lòng quay lại sau nhé!
        </p>

        <div className="w-full space-y-2 mb-8">
          <div className="flex justify-between items-end">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">
              Tiến độ bảo trì
            </span>
            <span className="text-sm font-bold text-primary">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-primary rounded-full shadow-[0_0_12px_rgba(0,101,101,0.5)]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-full font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </button>

          {/* Lối thoát cho Admin: đăng nhập vẫn hoạt động khi đang bảo trì
              để tắt lại chế độ này. */}
          <Link
            to="/login"
            className="flex items-center gap-2 px-6 py-3 bg-surface-container border border-outline-variant/40 text-on-surface rounded-full font-bold text-sm hover:bg-surface-container-high transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Đăng nhập
          </Link>

          <a
            href="mailto:thanhdatvv05@gmail.com"
            className="flex items-center gap-2 px-6 py-3 bg-surface-container border border-outline-variant/40 text-on-surface rounded-full font-bold text-sm hover:bg-surface-container-high transition-colors"
          >
            <Mail className="w-4 h-4" />
            Liên hệ hỗ trợ
          </a>
        </div>

        <div className="flex gap-3">
          <a
            href="https://www.facebook.com/thanh.at.980298/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container text-primary hover:bg-primary/10 transition-colors"
          >
            <Facebook className="w-5 h-5" />
          </a>
        </div>
      </motion.div>
    </div>
  );
}
