import useThemeStore from '../../store/themeStore';

/**
 * Theme Toggle Button
 */
export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className={`p-2 rounded-pill text-[var(--color-text-muted)] hover:text-[var(--color-navy-900)] hover:bg-[var(--color-surface-alt)] border border-transparent hover:border-[var(--color-border)] transition-all duration-200 focus-visible:outline-none ${className}`}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-400" />
      ) : (
        <Moon className="w-5 h-5 text-[var(--color-navy-800)]" />
      )}
    </button>
  );
}
