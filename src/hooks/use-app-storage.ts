import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AppState {
  viewOnlyMyOrders: boolean;
  toggleViewOnlyMyOrders: () => void;
  setViewOnlyMyOrders: (value: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      viewOnlyMyOrders: false,

      toggleViewOnlyMyOrders: () =>
        set((state) => ({
          viewOnlyMyOrders: !state.viewOnlyMyOrders,
        })),

      setViewOnlyMyOrders: (value) =>
        set({
          viewOnlyMyOrders: value,
        }),
    }),
    {
      name: "app-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        viewOnlyMyOrders: state.viewOnlyMyOrders,
      }),
    },
  ),
);

export const useViewOnlyMyOrders = () =>
  useAppStore((state) => state.viewOnlyMyOrders);
export const useToggleViewOnlyMyOrders = () =>
  useAppStore((state) => state.toggleViewOnlyMyOrders);
