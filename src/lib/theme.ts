import { useEffect, useState } from 'react';

/** Admin theme: CRED dark (default) or light. Applied pre-paint by index.html. */
export type AdminTheme = 'dark' | 'light';
const KEY = 'admin-theme';

export const getTheme = (): AdminTheme =>
  document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';

export const setTheme = (t: AdminTheme) => {
  document.documentElement.setAttribute('data-theme', t);
  try {
    localStorage.setItem(KEY, t);
  } catch {
    // storage blocked: the choice lasts for this tab only
  }
  window.dispatchEvent(new Event('admin-theme'));
};

export function useAdminTheme() {
  const [theme, set] = useState<AdminTheme>(getTheme);
  useEffect(() => {
    const on = () => set(getTheme());
    window.addEventListener('admin-theme', on);
    return () => window.removeEventListener('admin-theme', on);
  }, []);
  return { theme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') };
}

