import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface ThemeCtx {
  theme: 'light' | 'dark';
  sidebarDark: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: 'light', sidebarDark: false,
  toggleTheme: () => {}, toggleSidebar: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (localStorage.getItem('pg-theme') as 'light' | 'dark') || 'light'
  );
  const [sidebarDark, setSidebarDark] = useState(() =>
    localStorage.getItem('pg-sidebar-dark') === 'true'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('pg-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('pg-sidebar-dark', String(sidebarDark));
  }, [sidebarDark]);

  return (
    <ThemeContext.Provider value={{
      theme, sidebarDark,
      toggleTheme:  () => setTheme(t => t === 'light' ? 'dark' : 'light'),
      toggleSidebar: () => setSidebarDark(s => !s),
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
