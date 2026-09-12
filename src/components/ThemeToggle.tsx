import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useLang } from '../lib/i18n';
import { effectiveTheme, setTheme } from '../lib/theme';

/** Light/dark toggle. Starts from the OS preference until the user picks explicitly (src/lib/theme.ts). */
export function ThemeToggle() {
  const { T } = useLang();
  const [theme, setThemeState] = useState(effectiveTheme);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setThemeState(next);
  }

  return (
    <button
      className="icon-btn"
      title={T('Switch between light and dark theme')}
      aria-label={T('Switch between light and dark theme')}
      onClick={toggle}
    >
      {theme === 'dark' ? <Sun /> : <Moon />}
    </button>
  );
}
