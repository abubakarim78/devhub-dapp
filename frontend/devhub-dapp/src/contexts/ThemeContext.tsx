import { createContext, useState, useContext, ReactNode, useEffect } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (value: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Default to system initially
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;

    const apply = (mode: 'dark' | 'light') => {
      root.classList.remove(mode === 'dark' ? 'light' : 'dark');
      root.classList.add(mode);
    };

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      apply(media.matches ? 'dark' : 'light');
      const handler = () => apply(media.matches ? 'dark' : 'light');
      media.addEventListener?.('change', handler);
      return () => media.removeEventListener?.('change', handler);
    } else {
      apply(theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      if (prevTheme === 'system') {
        if (typeof window !== 'undefined') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          return prefersDark ? 'light' : 'dark';
        }
        return 'dark';
      }
      return prevTheme === 'dark' ? 'light' : 'dark';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};