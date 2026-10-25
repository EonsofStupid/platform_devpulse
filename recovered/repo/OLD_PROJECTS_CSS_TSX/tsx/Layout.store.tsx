// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/common/stores/Layout/Layout.store.tsx
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { LayoutState } from './Layout.types';

const SIDEBAR_WIDTH_COLLAPSED = 64; // Reduced from 80px (20% smaller)
const SIDEBAR_WIDTH_EXPANDED = 205; // Reduced from 256px (20% smaller)

export const useLayoutStore = create<LayoutState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        sidebarOpen: true,
        sidebarWidth: SIDEBAR_WIDTH_COLLAPSED,
        sidebarCollapsed: true,
        leftSidebarOpen: true,
        leftSidebarIconOnly: false,
        rightSidebarOpen: false,
        chatDockOpen: false,
        isScrolled: false,
        mousePosition: { x: 0, y: 0 },
        mobileMenuOpen: false,
        navigationHistory: [],
        currentBreadcrumb: [],

        // Actions
        toggleSidebar: () => {
          const { sidebarCollapsed } = get();
          set({
            sidebarCollapsed: !sidebarCollapsed,
            sidebarWidth: !sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
          });
        },

        toggleMobileMenu: () => {
          const { mobileMenuOpen } = get();
          set({ mobileMenuOpen: !mobileMenuOpen });
        },

        setSidebarWidth: (width: number) => set({ sidebarWidth: width }),

        toggleLeftSidebar: () =>
          set((state) => ({
            leftSidebarOpen: !state.leftSidebarOpen,
          })),
        toggleLeftSidebarIconOnly: () =>
          set((state) => ({
            leftSidebarIconOnly: !state.leftSidebarIconOnly,
          })),
        toggleRightSidebar: () =>
          set((state) => ({
            rightSidebarOpen: !state.rightSidebarOpen,
          })),

        toggleChatDock: () => {
          const { chatDockOpen } = get();
          set({ chatDockOpen: !chatDockOpen });
        },

        setIsScrolled: (scrolled: boolean) => set({ isScrolled: scrolled }),

        updateMousePosition: (x: number, y: number) => {
          set({ mousePosition: { x, y } });
        },

        addToNavigationHistory: (path: string, title: string) => {
          const { navigationHistory } = get();
          const newEntry = { path, title, timestamp: Date.now() };
          const updatedHistory = [...navigationHistory, newEntry].slice(-10); // Keep last 10
          set({ navigationHistory: updatedHistory });
        },

        goBack: () => {
          const { navigationHistory } = get();
          if (navigationHistory.length > 1) {
            const newHistory = navigationHistory.slice(0, -1);
            set({ navigationHistory: newHistory });
            return newHistory[newHistory.length - 1]?.path;
          }
          return null;
        },

        setBreadcrumb: (breadcrumb: Array<{ label: string; path?: string }>) => {
          set({ currentBreadcrumb: breadcrumb });
        },

        clearNavigationHistory: () => {
          set({ navigationHistory: [], currentBreadcrumb: [] });
        },
      }),
      {
        name: 'mi-layout-v1',
        // Only persist UI preferences, not transient state
        partialize: (state) => ({
          sidebarWidth: state.sidebarWidth,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      },
    ),
    { name: 'mi-layout-v1' },
  ),
);

// HMR safety
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    // @ts-ignore
    useLayoutStore?.destroy?.();
  });
}
