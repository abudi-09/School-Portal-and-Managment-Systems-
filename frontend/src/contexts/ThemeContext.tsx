import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/useAuth";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  cycleMode: () => void;
  globalDefault: ThemeMode;
  setGlobalDefault: (mode: ThemeMode) => void;
  isGuest: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const SYSTEM_QUERY = "(prefers-color-scheme: dark)";
const GLOBAL_STORAGE_KEY = "theme-global-default";
const GUEST_STORAGE_KEY = "theme-guest-mode";

const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia(SYSTEM_QUERY).matches ? "dark" : "light";
};

const applyTheme = (theme: "light" | "dark") => {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  root.style.colorScheme = theme;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [globalDefault, setGlobalDefaultState] = useState<ThemeMode>("system");
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(
    getSystemTheme()
  );
  const [isInitialised, setIsInitialised] = useState(false);

  const isGuest = !user;
  const preferenceKey = user ? `theme-pref-${user.id}` : null;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedGlobal = window.localStorage.getItem(GLOBAL_STORAGE_KEY);
    if (
      storedGlobal === "light" ||
      storedGlobal === "dark" ||
      storedGlobal === "system"
    ) {
      setGlobalDefaultState(storedGlobal);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia(SYSTEM_QUERY);
    const updateSystemTheme = (event: MediaQueryList | MediaQueryListEvent) => {
      const matches = "matches" in event ? event.matches : media.matches;
      setSystemTheme(matches ? "dark" : "light");
    };

    updateSystemTheme(media);

    const listener = (event: MediaQueryListEvent) => updateSystemTheme(event);

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }

    media.addListener(listener);
    return () => media.removeListener(listener);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const loadPreference = () => {
      let stored: string | null = null;
      if (preferenceKey) {
        stored = window.localStorage.getItem(preferenceKey);
      }

      if (!stored) {
        stored = window.localStorage.getItem(GUEST_STORAGE_KEY);
      }

      if (stored === "light" || stored === "dark" || stored === "system") {
        setModeState(stored);
        setIsInitialised(true);
        return;
      }

      setModeState(globalDefault);
      setIsInitialised(true);
    };

    loadPreference();
  }, [preferenceKey, globalDefault]);

  const resolvedTheme: "light" | "dark" =
    mode === "system" ? systemTheme : mode;

  useEffect(() => {
    if (!isInitialised) {
      return;
    }
    applyTheme(resolvedTheme);
  }, [resolvedTheme, isInitialised]);

  const persistPreference = useCallback(
    (nextMode: ThemeMode) => {
      if (typeof window === "undefined") {
        return;
      }

      if (preferenceKey) {
        window.localStorage.setItem(preferenceKey, nextMode);
      } else {
        window.localStorage.setItem(GUEST_STORAGE_KEY, nextMode);
      }
    },
    [preferenceKey]
  );

  const handleSetMode = useCallback(
    (nextMode: ThemeMode) => {
      setModeState(nextMode);
      persistPreference(nextMode);
    },
    [persistPreference]
  );

  const handleCycleMode = useCallback(() => {
    const sequence: ThemeMode[] = ["light", "dark", "system"];
    const currentIndex = sequence.indexOf(mode);
    const nextMode = sequence[(currentIndex + 1) % sequence.length];
    handleSetMode(nextMode);
  }, [mode, handleSetMode]);

  const handleSetGlobalDefault = useCallback(
    (nextMode: ThemeMode) => {
      setGlobalDefaultState(nextMode);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(GLOBAL_STORAGE_KEY, nextMode);
      }
      if (isGuest) {
        setModeState(nextMode);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(GUEST_STORAGE_KEY, nextMode);
        }
      }
    },
    [isGuest]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolvedTheme,
      setMode: handleSetMode,
      cycleMode: handleCycleMode,
      globalDefault,
      setGlobalDefault: handleSetGlobalDefault,
      isGuest,
    }),
    [
      globalDefault,
      handleCycleMode,
      handleSetGlobalDefault,
      handleSetMode,
      isGuest,
      mode,
      resolvedTheme,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export { ThemeContext };
