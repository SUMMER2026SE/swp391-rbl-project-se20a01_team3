import { create } from 'zustand';

interface SystemState {
  maintenanceMode: boolean;
  setMaintenanceMode: (value: boolean) => void;
}

export const useSystemStore = create<SystemState>((set) => ({
  maintenanceMode: false,
  setMaintenanceMode: (value) => set({ maintenanceMode: value }),
}));
