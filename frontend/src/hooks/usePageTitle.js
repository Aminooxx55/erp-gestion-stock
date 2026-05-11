import { useEffect } from 'react';

/**
 * Sets the document title dynamically.
 * Usage: usePageTitle('Dashboard')  →  "Dashboard — ERP Stock"
 */
export default function usePageTitle(title) {
  useEffect(() => {
    const suffix = 'ERP Stock';
    document.title = title ? `${title} — ${suffix}` : suffix;
    return () => { document.title = suffix; };
  }, [title]);
}
