import { useEffect, useState } from 'react';

/**
 * Read-only "view as" session (POST /admin/users/:id/impersonate).
 * While active, API calls to that user's company use the view-as token, so
 * the workspace shows exactly what that user sees. Kept in sessionStorage:
 * closing the tab ends it.
 */
export interface ViewAs {
  token: string;
  expires_at: string;
  user: { id: string; name: string; email: string; role: string; company_id: string };
}

const KEY = 'admin-view-as';
const EVENT = 'admin-view-as';

export const getViewAs = (): ViewAs | null => {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) || 'null') as ViewAs | null;
    if (v && new Date(v.expires_at).getTime() > Date.now()) return v;
    if (v) sessionStorage.removeItem(KEY);
  } catch {
    // storage blocked or corrupt: no session
  }
  return null;
};

export const startViewAs = (v: ViewAs) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    // storage blocked: session can't persist
  }
  window.dispatchEvent(new Event(EVENT));
};

export const endViewAs = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(EVENT));
};

/** Token to use for a request URL, when a view-as session covers it. */
export const viewAsTokenFor = (url?: string) => {
  const v = getViewAs();
  if (!v || !url) return null;
  return url.startsWith(`/companies/${v.user.company_id}`) ? v.token : null;
};

export function useViewAs() {
  const [v, setV] = useState<ViewAs | null>(getViewAs);
  useEffect(() => {
    const on = () => setV(getViewAs());
    window.addEventListener(EVENT, on);
    // expire on time even without navigation
    const t = window.setInterval(on, 30_000);
    return () => {
      window.removeEventListener(EVENT, on);
      window.clearInterval(t);
    };
  }, []);
  return v;
}
