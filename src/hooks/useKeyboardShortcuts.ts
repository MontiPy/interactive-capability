import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  // Sliders are <input type="range">; undo should still work while one is focused
  if (tag === 'INPUT') return (target as HTMLInputElement).type !== 'range';
  return tag === 'TEXTAREA' || tag === 'SELECT';
}

/**
 * Global shortcuts: Ctrl/⌘+Z to undo, Ctrl/⌘+Shift+Z or Ctrl+Y to redo.
 * Text fields keep their native undo behaviour.
 */
export function useKeyboardShortcuts() {
  const { dispatch } = useApp();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || isEditableTarget(e.target)) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        dispatch({ type: 'UNDO' });
        e.preventDefault();
      } else if ((key === 'z' && e.shiftKey) || (key === 'y' && !e.shiftKey)) {
        dispatch({ type: 'REDO' });
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);
}
