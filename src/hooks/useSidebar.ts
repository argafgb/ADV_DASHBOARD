"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { produce } from "immer";

type SidebarSettings = { disabled: boolean; isHoverOpen: boolean };
type SidebarStore = {
  isOpen: boolean;
  isHover: boolean;
  settings: SidebarSettings;
  toggleOpen: () => void;
  setIsOpen: (isOpen: boolean) => void;
  setIsHover: (isHover: boolean) => void;
  getOpenState: () => boolean;
  setSettings: (settings: Partial<SidebarSettings>) => void;
};

export const useSidebar = create(
  persist<SidebarStore>(
    (set, get) => ({
      isOpen: true,
      isHover: false,
      settings: { disabled: false, isHoverOpen: false },
      toggleOpen: () => {
        set({ isOpen: !get().isOpen });
      },
      setIsOpen: (isOpen: boolean) => {
        set({ isOpen });
      },
      setIsHover: (isHover: boolean) => {
        set({ isHover });
      },
      getOpenState: () => {
        const state = get();
        return state.isOpen || (state.settings.isHoverOpen && state.isHover);
      },
      setSettings: (settings: Partial<SidebarSettings>) => {
        set(
          produce((state: SidebarStore) => {
            state.settings = { ...state.settings, ...settings };
          }),
        );
      },
    }),
    {
      name: "sidebar",
      storage: createJSONStorage(() => localStorage),
      // Render the first frame from the defaults above so server and client
      // markup match; the layout calls `persist.rehydrate()` after mount to
      // apply the saved width. Without this the whole sidebar has to wait for
      // localStorage, which is what made the nav visibly pop in on reload.
      skipHydration: true,
      // `isHover` is transient UI state — persisting it wrote to localStorage
      // on every mouseenter/mouseleave.
      partialize: (state) =>
        ({ isOpen: state.isOpen, settings: state.settings }) as SidebarStore,
    },
  ),
);

/**
 * Applies the persisted sidebar state after mount, since the store is created
 * with `skipHydration`. Returns false until the saved width has been applied so
 * callers can suppress the width transition for that first adjustment (a user
 * who saved the collapsed state should not watch it animate shut on every load).
 */
export function useSidebarHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsubscribe = useSidebar.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    void useSidebar.persist.rehydrate();
    return unsubscribe;
  }, []);

  return hydrated;
}
