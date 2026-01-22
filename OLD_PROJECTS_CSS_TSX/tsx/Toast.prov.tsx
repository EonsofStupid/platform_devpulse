// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/common/features/Toast/providers/Toast/Toast.prov.tsx
/* ================================================================
   TOAST PROVIDER - ENTERPRISE ACCESSIBILITY & CONTEXT

   Provides enterprise-grade toast context with:
   - Full WCAG 2.1 AA accessibility compliance
   - Smart auth-aware capabilities
   - Performance-optimized atom management
   - Screen reader announcements
   ================================================================ */

import { atom, getDefaultStore, Provider as JotaiProvider, useStore } from 'jotai';
import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import {
  animationConfigAtom,
  authContextAtom,
  contextualPreferencesAtom,
  contextualToastsAtom,
  toastCapabilitiesAtom,
  toastGlobalUIAtom,
  toastUIRegistryAtom,
} from '../../atoms/Toast/toast.bridge.atoms';
import { toastA11yAtom, toastPerformanceAtom, useToastStore } from '../../stores/Toast/toast.store';

interface ToastContextValue {
  authContext: 'authenticated' | 'anonymous';
  capabilities: {
    canPersistToasts: boolean;
    canCustomizeThemes: boolean;
    canAccessHistory: boolean;
    canSetGlobalPreferences: boolean;
    maxToastCount: number;
    allowedDurations: (number | string)[];
    availableVariants: string[];
  };
  accessibility: {
    announceToasts: boolean;
    respectReducedMotion: boolean;
    highContrastMode: boolean;
    focusManagement: boolean;
    screenReaderOptimized: boolean;
  };
  performance: {
    maxConcurrentAnimations: number;
    animationQuality: 'low' | 'medium' | 'high';
    enableGPUAcceleration: boolean;
    batchUpdates: boolean;
  };
  uiRegistry: Map<string, any>;
  // Methods
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  createNewToastUI: (toastId: string) => void;
  getToastUIAtoms: (toastId: string) => any;
  cleanupToastUI: (toastId: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastProviderProps {
  children: React.ReactNode;
  authContext?: 'authenticated' | 'anonymous';
  domain?: 'web' | 'admin' | 'chat' | 'common';
  enableAccessibility?: boolean;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  authContext = 'anonymous',
  domain = 'common',
  enableAccessibility = true,
}) => {
  const store = useStore();
  const setDomain = useToastStore((state) => state.setDomain);
  const setAuthContext = useToastStore((state) => state.setAuthContext);

  // Screen reader announcements
  const announceToScreenReader = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      if (!enableAccessibility) return;

      const announcer = document.getElementById('toast-announcer');
      if (announcer) {
        announcer.textContent = '';
        announcer.setAttribute('aria-live', priority);
        setTimeout(() => {
          announcer.textContent = message;
        }, 100);
      }
    },
    [enableAccessibility],
  );

  // UI registry for managing individual toast atoms
  const uiRegistry = useMemo(() => new Map(), []);

  const createNewToastUI = useCallback(
    (toastId: string) => {
      // Create UI atoms for individual toast management
      const uiAtoms = {
        isVisible: true,
        isHovered: false,
        isFocused: false,
        animationState: 'entering' as const,
      };
      uiRegistry.set(toastId, uiAtoms);
    },
    [uiRegistry],
  );

  const getToastUIAtoms = useCallback(
    (toastId: string) => {
      return uiRegistry.get(toastId) || null;
    },
    [uiRegistry],
  );

  const cleanupToastUI = useCallback(
    (toastId: string) => {
      uiRegistry.delete(toastId);
    },
    [uiRegistry],
  );

  // Set domain and auth context
  useEffect(() => {
    setDomain(domain);
    setAuthContext(authContext);

    // Update auth context atom
    store.set(authContextAtom, authContext);
  }, [domain, authContext, setDomain, setAuthContext, store]);

  // Context value with enterprise features
  const contextValue: ToastContextValue = useMemo(
    () => ({
      authContext,
      capabilities: {
        canPersistToasts: authContext === 'authenticated',
        canCustomizeThemes: authContext === 'authenticated',
        canAccessHistory: authContext === 'authenticated',
        canSetGlobalPreferences: authContext === 'authenticated',
        maxToastCount: authContext === 'authenticated' ? 10 : 5,
        allowedDurations:
          authContext === 'authenticated'
            ? [2000, 4000, 6000, 8000, 'infinity']
            : [2000, 4000, 6000],
        availableVariants:
          authContext === 'authenticated'
            ? [
                'glass-deep',
                'glass-neon',
                'glass-slime',
                'glass-crystal',
                'glass-shadow',
                'default',
              ]
            : ['glass-deep', 'glass-crystal', 'default'],
      },
      accessibility: {
        announceToasts: enableAccessibility,
        respectReducedMotion: true,
        highContrastMode: false,
        focusManagement: true,
        screenReaderOptimized: enableAccessibility,
      },
      performance: {
        maxConcurrentAnimations: 5,
        animationQuality: 'high',
        enableGPUAcceleration: true,
        batchUpdates: true,
      },
      uiRegistry,
      announceToScreenReader,
      createNewToastUI,
      getToastUIAtoms,
      cleanupToastUI,
    }),
    [
      authContext,
      enableAccessibility,
      uiRegistry,
      announceToScreenReader,
      createNewToastUI,
      getToastUIAtoms,
      cleanupToastUI,
    ],
  );

  return (
    <JotaiProvider store={store}>
      <ToastContext.Provider value={contextValue}>
        {children}
        {/* Screen reader announcer */}
        {enableAccessibility && (
          <>
            <div id="toast-announcer" className="sr-only" aria-live="polite" aria-atomic="true" />
            <div
              id="toast-announcer-assertive"
              className="sr-only"
              aria-live="assertive"
              aria-atomic="true"
            />
          </>
        )}
      </ToastContext.Provider>
    </JotaiProvider>
  );
};

interface ToastAtomsContext {
  toasts: any;
  preferences: any;
  capabilities: any;
  globalUI: any;
  uiRegistry: any;
  createNewToastUI: (toastId: string) => void;
  getToastUIAtoms: (toastId: string) => any;
}

const ToastAtomsContext = createContext<ToastAtomsContext | null>(null);

export const ToastAtomsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Create stable atom references - CACHED to prevent recreation
  const atomsContextRef = useRef<ToastAtomsContext | null>(null);

  const stableAtomsContext = useMemo(() => {
    if (!atomsContextRef.current) {
      atomsContextRef.current = {
        toasts: contextualToastsAtom,
        preferences: contextualPreferencesAtom,
        capabilities: toastCapabilitiesAtom,
        globalUI: toastGlobalUIAtom,
        uiRegistry: toastUIRegistryAtom,

        createNewToastUI: (toastId: string) => {
          const newUIAtoms = {
            visible: atom(true),
            animating: atom(false),
            progress: atom(0),
            hovered: atom(false),
          };

          // Store in registry
          const currentRegistry = getDefaultStore().get(toastUIRegistryAtom);
          getDefaultStore().set(toastUIRegistryAtom, {
            ...currentRegistry,
            [toastId]: newUIAtoms,
          });
        },

        getToastUIAtoms: (toastId: string) => {
          const registry = getDefaultStore().get(toastUIRegistryAtom);
          return registry[toastId] || null;
        },
      };
    }
    return atomsContextRef.current;
  }, []);

  return (
    <ToastAtomsContext.Provider value={stableAtomsContext}>{children}</ToastAtomsContext.Provider>
  );
};

// Hook to access toast context
export const useToastContext = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
};

// STABLE REFERENCES - CREATED ONCE, NEVER RECREATED
const STABLE_TOAST_ATOMS = {
  toasts: contextualToastsAtom,
  preferences: contextualPreferencesAtom,
  capabilities: toastCapabilitiesAtom,
  animationConfig: animationConfigAtom,
  globalUI: toastGlobalUIAtom,
  registry: toastUIRegistryAtom,
};

const STABLE_METHODS = {
  createNewToastUI: (toastId: string) => {
    console.log(`Creating UI atoms for toast: ${toastId}`);
  },
  getToastUIAtoms: (toastId: string) => {
    return null;
  },
  announceToScreenReader: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    console.log(`Screen reader: [${priority}] ${message}`);
  },
  cleanupToastUI: (toastId: string) => {
    console.log(`Cleaning up UI atoms for toast: ${toastId}`);
  },
};

// Hook for contextual atom access - RETURNS STABLE REFERENCES
export const useContextualToastAtoms = () => {
  // RETURN THE SAME OBJECT REFERENCE EVERY TIME
  return STABLE_TOAST_ATOMS;
};

// HOC for wrapping components with toast atoms
export const withToastAtoms = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
): React.FC<P & { authState?: 'authenticated' | 'anonymous' }> => {
  return ({ authState, ...props }) => (
    <ToastProvider authState={authState}>
      <WrappedComponent {...(props as P)} />
    </ToastProvider>
  );
};
