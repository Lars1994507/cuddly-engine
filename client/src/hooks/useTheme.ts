import { useState, useEffect } from 'react';

export type Theme = 'dark' | 'midnight' | 'slate' | 'light';

export const THEMES: { id: Theme; label: string }[] = [
  { id: 'dark',     label: 'Dark'     },
  { id: 'midnight', label: 'Midnight' },
  { id: 'slate',    label: 'Slate'    },
  { id: 'light',    label: 'Light'    },
];

const KEY = 'castle-theme';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() =>
    (localStorage.getItem(KEY) as Theme) ?? 'dark'
  );

  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') {
      delete html.dataset.theme;
    } else {
      html.dataset.theme = theme;
    }
    localStorage.setItem(KEY, theme);
  }, [theme]);

  return { theme, themes: THEMES, setTheme: setThemeState };
}
