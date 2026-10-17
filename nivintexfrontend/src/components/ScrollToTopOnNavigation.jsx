import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Ensures that on any page navigation (route / query change),
 * the window starts from the top (0, 0) instead of retaining the previous page's scroll position.
 */
export default function ScrollToTopOnNavigation() {
  const { pathname, search, hash } = useLocation();
  const prevPathRef = useRef(`${pathname}${search}`);

  useEffect(() => {
    // Prevent the browser from automatically trying to restore old scroll positions
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    const isNewPage = prevPathRef.current !== `${pathname}${search}`;
    prevPathRef.current = `${pathname}${search}`;

    const scrollToTop = () => {
      const originalScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';

      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch {
        window.scrollTo(0, 0);
      }
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      document.documentElement.style.scrollBehavior = originalScrollBehavior;
    };

    // If navigating to an in-page anchor ID on the same page, scroll to that element
    if (hash && !isNewPage) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // Scroll to top immediately
    scrollToTop();

    // Additional raf and short timeout to guarantee top position even after DOM reflows
    const rafId = requestAnimationFrame(scrollToTop);
    const timer = setTimeout(scrollToTop, 50);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, [pathname, search, hash]);

  return null;
}
