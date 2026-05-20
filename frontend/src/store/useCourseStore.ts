import { create } from 'zustand';

interface CourseState {
  purchasedIds: string[];
  enrollCourses: (courseIds: string[]) => void;

  // Danh sách ID khóa học được đánh dấu yêu thích
  favoritedIds: string[];
  // Toggle: nếu đã yêu thích → bỏ, chưa → thêm
  toggleFavorite: (courseId: string) => void;
}

export const useCourseStore = create<CourseState>((set) => ({
  purchasedIds: [],
  enrollCourses: (courseIds) => set((state) => {
    const newIds = courseIds.filter(id => !state.purchasedIds.includes(id));
    return { purchasedIds: [...state.purchasedIds, ...newIds] };
  }),

  favoritedIds: [],
  toggleFavorite: (courseId) => set((state) => {
    const isFav = state.favoritedIds.includes(courseId);
    return {
      favoritedIds: isFav
        ? state.favoritedIds.filter(id => id !== courseId) // bỏ yêu thích
        : [...state.favoritedIds, courseId],               // thêm yêu thích
    };
  }),
}));
