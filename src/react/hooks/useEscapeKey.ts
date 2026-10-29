import { useEffect } from 'react';

export function useEscapeKey(active: boolean, onEscape: () => void): void {
  useEffect(() => {
    if (!active || typeof document === 'undefined') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, onEscape]);
}
