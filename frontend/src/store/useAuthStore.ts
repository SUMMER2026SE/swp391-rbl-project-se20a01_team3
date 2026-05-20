import { create } from 'zustand';

// Thông tin cơ bản của người dùng — dùng để hiển thị trên Header và Dropdown
export interface User {
  name: string;
  email: string;
  avatar?: string; // URL ảnh — nếu không có sẽ fallback sang ui-avatars
}

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  login: (user?: User) => void;
  logout: () => void;
  // Cập nhật một phần thông tin user (name, email, avatar)
  // Dùng sau khi user lưu form chỉnh sửa hồ sơ
  updateUser: (partial: Partial<User>) => void;
}

const DEFAULT_USER: User = {
  name: 'Học viên Bee',
  email: 'hocvien@beeacademy.vn',
};

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: true,
  user: DEFAULT_USER,
  // login nhận optional User — nếu không truyền dùng mock mặc định
  login: (user) => set({ isLoggedIn: true, user: user ?? DEFAULT_USER }),
  // logout xóa thông tin user
  logout: () => set({ isLoggedIn: false, user: null }),
  // updateUser merge partial vào user hiện tại — chỉ update các field được truyền
  updateUser: (partial) => set(state => ({
    user: state.user ? { ...state.user, ...partial } : null,
  })),
}));
