"use client";

import { create } from "zustand";

export interface GlobalLoadingState {
  isLoading: boolean;
  count: number;
  message: string | null;
  isRouteChanging: boolean;

  // Actions
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  setMessage: (message: string | null) => void;
  setRouteChanging: (isChanging: boolean) => void;
  resetLoading: () => void;
}

export const useGlobalLoadingStore = create<GlobalLoadingState>((set, get) => ({
  isLoading: false,
  count: 0,
  message: null,
  isRouteChanging: false,

  startLoading: (message?: string) => {
    const nextCount = get().count + 1;
    set({
      count: nextCount,
      isLoading: true,
      message: message !== undefined ? message : get().message || "កំពុងដំណើរការ...",
    });
  },

  stopLoading: () => {
    const nextCount = Math.max(0, get().count - 1);
    set({
      count: nextCount,
      isLoading: nextCount > 0,
      message: nextCount > 0 ? get().message : null,
    });
  },

  setMessage: (message: string | null) => {
    set({ message });
  },

  setRouteChanging: (isChanging: boolean) => {
    set({ isRouteChanging: isChanging });
  },

  resetLoading: () => {
    set({
      count: 0,
      isLoading: false,
      message: null,
      isRouteChanging: false,
    });
  },
}));

/**
 * Convenience helper to wrap any async operation with global loading
 */
export async function withGlobalLoading<T>(
  action: () => Promise<T>,
  message?: string
): Promise<T> {
  const store = useGlobalLoadingStore.getState();
  store.startLoading(message);
  try {
    return await action();
  } finally {
    store.stopLoading();
  }
}

/**
 * Direct controls accessible anywhere (including non-React code)
 */
export const globalLoading = {
  start: (msg?: string) => useGlobalLoadingStore.getState().startLoading(msg),
  stop: () => useGlobalLoadingStore.getState().stopLoading(),
  reset: () => useGlobalLoadingStore.getState().resetLoading(),
  setMessage: (msg: string | null) => useGlobalLoadingStore.getState().setMessage(msg),
  wrap: withGlobalLoading,
};
